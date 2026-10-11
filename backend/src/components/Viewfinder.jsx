import React, { useRef, useEffect, useState } from 'react';
import { Camera, Image as ImageIcon, Sparkles, RefreshCw, AlertTriangle, Zap, Grid } from 'lucide-react';

export default function Viewfinder({
  onCapture,
  isInferencing,
  inferenceMs,
  darkWarning,
  onDismissDarkWarning,
  flashOn,
  onToggleFlash,
  onOpenSamples,
  selectedSampleImage
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [stream, setStream] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize camera stream via HTML5 getUserMedia
  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      if (selectedSampleImage) {
        // Sample image selected, stop real camera
        stopCamera();
        return;
      }

      try {
        setCameraError(null);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });

        if (isMounted) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play();
          }
          setCameraActive(true);
        }
      } catch (err) {
        console.warn('Camera access error or restricted environment', err);
        if (isMounted) {
          setCameraActive(false);
          setCameraError('Camera unavailable or permission denied. Standard file upload enabled.');
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [selectedSampleImage]);

  // Handle flashlight constraint toggle on media track
  useEffect(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.applyConstraints === 'function') {
        videoTrack.applyConstraints({
          advanced: [{ torch: flashOn }]
        }).catch(e => console.log('Torch constraint not supported natively on track'));
      }
    }
  }, [flashOn, stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const handleShutterClick = () => {
    if (isInferencing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (selectedSampleImage) {
      // Draw pre-loaded SVG/image onto canvas
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width || 600;
        canvas.height = img.height || 600;
        ctx.drawImage(img, 0, 0);
        onCapture(canvas);
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(selectedSampleImage.imageSvg);
      return;
    }

    if (videoRef.current && cameraActive) {
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      onCapture(canvas);
    } else {
      // Fallback placeholder canvas draw if camera disabled
      canvas.width = 800;
      canvas.height = 600;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '24px sans-serif';
      ctx.fillText('EcoScan Visual Input', 260, 300);
      onCapture(canvas);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        onCapture(canvas, null); // Pass captured canvas
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative flex-1 w-full h-full bg-slate-950 flex flex-col justify-between overflow-hidden select-none">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden File Input Fallback */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Dark Scene Luminance Alert Toast (FR-02 Quality Gatekeeper) */}
      {darkWarning && (
        <div className="absolute top-4 left-4 right-4 z-30 animate-bounce">
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl shadow-xl flex items-center justify-between gap-3 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Environment too dark. Turn on lights or flash.</span>
            </div>
            <button
              onClick={onToggleFlash}
              className="bg-slate-950 text-amber-400 px-2.5 py-1 rounded-lg hover:bg-slate-900 text-[11px] font-bold flex items-center gap-1 shrink-0"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>Flash On</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Camera Viewport or Sample View */}
      <div className={`relative flex-1 w-full h-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
        isInferencing ? 'blur-sm scale-95 opacity-90' : ''
      }`}>
        {selectedSampleImage ? (
          /* Preloaded Sample Image Renderer */
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-6 relative">
            <div
              className="w-64 h-64 rounded-2xl shadow-2xl overflow-hidden border-2 border-emerald-500/40 p-4 bg-slate-950 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: selectedSampleImage.imageSvg }}
            />
            <div className="mt-4 text-center">
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-mono font-bold">
                Sample Test Mode
              </span>
              <h3 className="text-white font-bold text-base mt-1">{selectedSampleImage.name}</h3>
              <p className="text-slate-400 text-xs mt-0.5">{selectedSampleImage.notes}</p>
            </div>
          </div>
        ) : cameraActive ? (
          /* HTML5 Live Video Stream */
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          /* Camera Fallback State */
          <div className="flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-400">
              <Camera className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-slate-300 font-semibold text-sm max-w-xs">{cameraError || 'Camera Initializing...'}</p>
            <p className="text-slate-400 text-xs mt-1 max-w-xs">
              Upload a packaging photo or pick a sample edge-case item below.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Choose Photo File</span>
            </button>
          </div>
        )}

        {/* Viewfinder Target Reticle Overlay (Centered rectangular bracket) */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8 z-20">
          <div className="relative w-64 h-64 border-2 border-white/30 rounded-2xl transition-all duration-300">
            {/* Top-Left Corner Bracket */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
            {/* Top-Right Corner Bracket */}
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
            {/* Bottom-Left Corner Bracket */}
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
            {/* Bottom-Right Corner Bracket */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

            {/* Scanning Laser Line Sweeping Animation when Inferencing */}
            {isInferencing && (
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-500 shadow-[0_0_15px_#10b981] animate-laser-scan top-0" />
            )}

            {/* Target Crosshair Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/40 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
            </div>
          </div>

          {/* Real-time Exposure Prompt */}
          <div className="mt-4 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 text-[12px] text-slate-200 font-medium">
            {isInferencing ? (
              <span className="text-emerald-400 font-mono font-semibold animate-pulse flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Analyzing packaging materials... ({inferenceMs}ms)
              </span>
            ) : (
              <span>Center item inside the frame</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar (Thumb-Zone Centricity) */}
      <div className="z-30 w-full bg-slate-950/90 backdrop-blur-md border-t border-slate-900 px-6 py-4 flex items-center justify-between gap-4">
        {/* Left: Gallery Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isInferencing}
          className="p-3 rounded-2xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all active:scale-95 disabled:opacity-50"
          title="Upload Photo from Device Gallery"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        {/* Center: Dual-Ring Shutter Button (76px diameter) */}
        <button
          onClick={handleShutterClick}
          disabled={isInferencing}
          className={`relative w-19 h-19 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
            isInferencing ? 'opacity-75 cursor-wait' : 'cursor-pointer hover:scale-105'
          }`}
          title="Take Instant Snapshot to Classify Packaging"
        >
          {/* Outer ring */}
          <span className="absolute inset-0 rounded-full border-4 border-white opacity-90"></span>
          {/* Inner solid emerald circle with pulse effect */}
          <span className={`w-15 h-15 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-600/40 ${
            isInferencing ? 'animate-ping' : ''
          }`}>
            <Camera className="w-7 h-7 text-slate-950" />
          </span>
        </button>

        {/* Right: Quick Samples Trigger */}
        <button
          onClick={onOpenSamples}
          disabled={isInferencing}
          className="p-3 rounded-2xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
          title="Open Edge-Case Waste Sample Library"
        >
          <Grid className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
