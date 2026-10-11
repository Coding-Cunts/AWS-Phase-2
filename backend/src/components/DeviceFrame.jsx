import React from 'react';

export default function DeviceFrame({ deviceMode, children }) {
  if (deviceMode === 'desktop') {
    return (
      <div className="w-full min-h-[calc(100vh-57px)] bg-slate-950 text-slate-100 flex flex-col justify-start">
        {children}
      </div>
    );
  }

  // Mobile Device Frame Wrapper (Android 20:9 or iOS 19.5:9)
  // Aspect Ratios:
  // Android: 20:9 -> Width: 390px, Height: 866.6px (approx 2.22:1 ratio)
  // iOS: 19.5:9 -> Width: 390px, Height: 845px (approx 2.16:1 ratio)
  const isAndroid = deviceMode === 'android';

  return (
    <div className="w-full min-h-[calc(100vh-57px)] bg-slate-950 py-4 px-2 flex flex-col items-center justify-center overflow-x-hidden">
      {/* Device Information Pill */}
      <div className="mb-2.5 flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="font-medium">
          {isAndroid ? 'Android Simulator (20:9 Aspect Ratio ~ 2.22:1)' : 'iOS Simulator (19.5:9 Aspect Ratio ~ 2.16:1)'}
        </span>
      </div>

      {/* Modern Bezel Frame */}
      <div
        className={`relative w-full max-w-[400px] transition-all duration-500 ease-out shadow-2xl rounded-[44px] border-[10px] ${
          isAndroid
            ? 'border-slate-800 bg-slate-900 ring-1 ring-slate-700/50 aspect-[9/20]'
            : 'border-slate-800/90 bg-slate-900 ring-1 ring-slate-700/50 aspect-[9/19.5]'
        } overflow-hidden flex flex-col`}
        style={{
          maxHeight: 'calc(100vh - 120px)'
        }}
      >
        {/* Notch / Punch hole header element */}
        {isAndroid ? (
          /* Android Centered Punch Hole Camera */
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-40 w-3.5 h-3.5 rounded-full bg-slate-950 ring-2 ring-slate-800 flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-slate-900"></span>
          </div>
        ) : (
          /* iOS Dynamic Island */
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-40 w-28 h-6 bg-slate-950 rounded-full flex items-center justify-between px-3 ring-1 ring-slate-800/80">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-950 ring-1 ring-emerald-500/40"></div>
          </div>
        )}

        {/* Device Screen Viewport */}
        <div className="relative w-full h-full bg-slate-950 flex flex-col overflow-hidden text-slate-100">
          {children}
        </div>

        {/* Mobile Bottom Home Navigation Bar */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-40">
          {isAndroid ? (
            <div className="w-24 h-1 bg-slate-600/60 rounded-full"></div>
          ) : (
            <div className="w-32 h-1 bg-slate-200/80 rounded-full"></div>
          )}
        </div>
      </div>
    </div>
  );
}
