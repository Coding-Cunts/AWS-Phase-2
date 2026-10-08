import React from 'react';
import { Camera, Zap, ZapOff, HelpCircle, Activity, Smartphone, Monitor, Wifi, Radio } from 'lucide-react';

export default function HeaderNav({
  flashOn,
  onToggleFlash,
  deviceMode,
  onChangeDeviceMode,
  networkTier,
  onChangeNetworkTier,
  onOpenHelp,
  onOpenTelemetry,
  onOpenSampleGallery
}) {
  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 px-4 py-2.5 transition-all duration-300 select-none">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo & Ready Pulse Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Camera className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">EcoScan</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Vision Waste Sorter</p>
          </div>
        </div>

        {/* Center: Device Frame Aspect Ratio Switcher */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl gap-1">
          <button
            onClick={() => onChangeDeviceMode('android')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
              deviceMode === 'android'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Android 20:9 Aspect Ratio (~2.22:1)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Android (20:9)</span>
            <span className="md:hidden text-[10px] font-mono">20:9</span>
          </button>

          <button
            onClick={() => onChangeDeviceMode('ios')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
              deviceMode === 'ios'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="iOS 19.5:9 Aspect Ratio (~2.16:1)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">iOS (19.5:9)</span>
            <span className="md:hidden text-[10px] font-mono">19.5:9</span>
          </button>

          <button
            onClick={() => onChangeDeviceMode('desktop')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
              deviceMode === 'desktop'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Responsive Fullscreen Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Desktop</span>
          </button>
        </div>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-1.5">
          {/* Network Tier Simulator Switcher */}
          <div className="hidden lg:flex items-center bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg gap-1.5 text-xs text-slate-300">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <select
              value={networkTier}
              onChange={(e) => onChangeNetworkTier(e.target.value)}
              className="bg-transparent text-slate-300 font-mono text-xs focus:outline-none cursor-pointer"
            >
              <option value="4g" className="bg-slate-900 text-slate-200">4G LTE (&lt;1.8s)</option>
              <option value="5g" className="bg-slate-900 text-slate-200">5G Ultra (&lt;0.5s)</option>
              <option value="wifi" className="bg-slate-900 text-slate-200">WiFi Fast</option>
            </select>
          </div>

          {/* Sample Items Quick Menu */}
          <button
            onClick={onOpenSampleGallery}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-all flex items-center gap-1"
            title="Open Pre-loaded Waste Edge Case Gallery"
          >
            <span className="font-semibold">Samples</span>
          </button>

          {/* Torch / Flash Toggle */}
          <button
            onClick={onToggleFlash}
            className={`p-2 rounded-lg transition-all ${
              flashOn
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
            title={flashOn ? 'Turn Flashlight Off' : 'Turn Flashlight On (Low Light Support)'}
          >
            {flashOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
          </button>

          {/* Telemetry Data Model Modal Toggle */}
          <button
            onClick={onOpenTelemetry}
            className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-all relative"
            title="View PostgreSQL ScanEvent Telemetry Inspector"
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* Help Modal Toggle */}
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-all"
            title="Waste Sorting Help & Guidelines"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
