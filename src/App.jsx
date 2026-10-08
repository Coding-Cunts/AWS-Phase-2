import React, { useState } from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';
import HeaderNav from './components/HeaderNav.jsx';
import DeviceFrame from './components/DeviceFrame.jsx';
import Viewfinder from './components/Viewfinder.jsx';
import ResultDrawer from './components/ResultDrawer.jsx';
import AiChatDrawer from './components/AiChatDrawer.jsx';
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
  const [capturedImageUrl, setCapturedImageUrl] = useState(null);
  const [isInferencing, setIsInferencing] = useState(false);
  const [inferenceMs, setInferenceMs] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [darkWarning, setDarkWarning] = useState(false);

  // Modals & Drawers State
  const [helpOpen, setHelpOpen] = useState(false);
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const [sampleGalleryOpen, setSampleGalleryOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Handle Shutter / Capture Trigger
  const handleCapture = async (canvas) => {
    if (isInferencing) return;

    soundEffects.playShutter();
    setIsInferencing(true);
    setDarkWarning(false);
    setScanResult(null);
    setCapturedImageUrl(null);

    // Snapshot the canvas as a data URL for the bounding box overlay display
    const snapshotUrl = canvas.toDataURL('image/jpeg', 0.92);

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
      setCapturedImageUrl(snapshotUrl);
      setScanResult(response);

      // Sound trigger: hazard if any detected item is Hazardous
      const hasHazard = response.result?.detectedItems?.some(
        d => d.category?.toLowerCase() === 'hazardous'
      );
      if (hasHazard) {
        soundEffects.playWarning();
      } else {
        soundEffects.playSuccess();
      }

      // Log PRD ScanEvent Telemetry record
      telemetryStore.logScanEvent({
        detectedItems: response.result?.detectedItems || [],
        frontendReport: response.result?.frontendReport || '',
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
    setCapturedImageUrl(null);
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
        onOpenChat={() => setChatOpen(true)}
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
        capturedImageUrl={capturedImageUrl}
        isOpen={!!scanResult && !isInferencing}
        onScanNext={handleScanNext}
        onDispute={() => setDisputeOpen(true)}
        onOpenChat={() => setChatOpen(true)}
      />

      {/* Interactive AI Chat Assistant Drawer */}
      <AiChatDrawer
        isOpen={chatOpen}
        scanResult={scanResult}
        onClose={() => setChatOpen(false)}
      />

      {/* Floating AI Assistant Action Trigger */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-2xl shadow-purple-950/80 border border-purple-400/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        title="Ask EcoScan AI Assistant"
      >
        <div className="relative">
          <Sparkles className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <span>AI Assistant</span>
      </button>

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
