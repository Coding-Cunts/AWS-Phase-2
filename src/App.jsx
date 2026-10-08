import React, { useState } from 'react';
import HeaderNav from './components/HeaderNav.jsx';
import DeviceFrame from './components/DeviceFrame.jsx';
import Viewfinder from './components/Viewfinder.jsx';
import ResultDrawer from './components/ResultDrawer.jsx';
import HelpModal from './components/HelpModal.jsx';
import FeedbackDisputeModal from './components/FeedbackDisputeModal.jsx';
import TelemetryDrawer from './components/TelemetryDrawer.jsx';
import SampleGalleryModal from './components/SampleGalleryModal.jsx';

import { VisionClassifier } from './services/visionClassifier.js';
import { soundEffects } from './services/audioService.js';
import { telemetryStore } from './services/telemetryStore.js';

export default function App() {
  // Simulator State Controls
  const [deviceMode, setDeviceMode] = useState('android'); // 'android' | 'ios' | 'desktop'
  const [networkTier, setNetworkTier] = useState('4g'); // '4g' | '5g' | 'wifi'
  const [flashOn, setFlashOn] = useState(false);

  // Vision Scan & Classification State
  const [selectedSampleImage, setSelectedSampleImage] = useState(null);
  const [isInferencing, setIsInferencing] = useState(false);
  const [inferenceMs, setInferenceMs] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [darkWarning, setDarkWarning] = useState(false);

  // Modals & Drawers State
  const [helpOpen, setHelpOpen] = useState(false);
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const [sampleGalleryOpen, setSampleGalleryOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);

  // Handle Shutter / Capture Trigger
  const handleCapture = async (canvas) => {
    if (isInferencing) return;

    soundEffects.playShutter();
    setIsInferencing(true);
    setDarkWarning(false);
    setScanResult(null);

    // Live Latency Counter animation tick
    let currentTimer = 0;
    const interval = setInterval(() => {
      currentTimer += 40;
      setInferenceMs(currentTimer);
    }, 40);

    try {
      const response = await VisionClassifier.classifyImage({
        canvas,
        overrideItem: selectedSampleImage,
        networkTier
      });

      clearInterval(interval);
      setIsInferencing(false);

      if (!response.success && response.tooDark) {
        setDarkWarning(true);
        soundEffects.playWarning();
        return;
      }

      setInferenceMs(response.inference_latency_ms);
      setScanResult(response);

      // Sound audio trigger based on result
      if (response.result?.is_hazard) {
        soundEffects.playWarning();
      } else {
        soundEffects.playSuccess();
      }

      // Log PRD ScanEvent Telemetry record
      telemetryStore.logScanEvent({
        ...response.result,
        inference_latency_ms: response.inference_latency_ms
      });

    } catch (err) {
      clearInterval(interval);
      setIsInferencing(false);
      console.error('Classification error', err);
    }
  };

  const handleScanNext = () => {
    soundEffects.playShutter();
    setScanResult(null);
    setSelectedSampleImage(null);
    setDarkWarning(false);
  };

  const handleDisputeSubmit = (scanId, suggestedBin) => {
    telemetryStore.flagDispute(scanId, suggestedBin);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header Navigation */}
      <HeaderNav
        flashOn={flashOn}
        onToggleFlash={() => setFlashOn(!flashOn)}
        deviceMode={deviceMode}
        onChangeDeviceMode={setDeviceMode}
        networkTier={networkTier}
        onChangeNetworkTier={(t) => {
          setNetworkTier(t);
          telemetryStore.setNetworkTier(t);
        }}
        onOpenHelp={() => setHelpOpen(true)}
        onOpenTelemetry={() => setTelemetryOpen(true)}
        onOpenSampleGallery={() => setSampleGalleryOpen(true)}
      />

      {/* Main Viewport wrapped inside Device Frame Simulator */}
      <DeviceFrame deviceMode={deviceMode}>
        <Viewfinder
          onCapture={handleCapture}
          isInferencing={isInferencing}
          inferenceMs={inferenceMs}
          darkWarning={darkWarning}
          onDismissDarkWarning={() => setDarkWarning(false)}
          flashOn={flashOn}
          onToggleFlash={() => setFlashOn(!flashOn)}
          onOpenSamples={() => setSampleGalleryOpen(true)}
          selectedSampleImage={selectedSampleImage}
        />
      </DeviceFrame>

      {/* Result Drawer Sheet (Bottom sheet on mobile / popup on desktop) */}
      <ResultDrawer
        scanResult={scanResult}
        isOpen={!!scanResult && !isInferencing}
        onScanNext={handleScanNext}
        onDispute={() => setDisputeOpen(true)}
      />

      {/* Modals */}
      <HelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />

      <FeedbackDisputeModal
        isOpen={disputeOpen}
        scanResult={scanResult}
        onClose={() => setDisputeOpen(false)}
        onSubmitDispute={handleDisputeSubmit}
      />

      <TelemetryDrawer
        isOpen={telemetryOpen}
        onClose={() => setTelemetryOpen(false)}
      />

      <SampleGalleryModal
        isOpen={sampleGalleryOpen}
        onClose={() => setSampleGalleryOpen(false)}
        onSelectSample={(sample) => {
          setSelectedSampleImage(sample);
          setScanResult(null);
        }}
      />
    </div>
  );
}
