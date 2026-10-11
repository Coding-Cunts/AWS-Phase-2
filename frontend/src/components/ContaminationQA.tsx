'use client';

import React, { useState } from 'react';
import { ShieldIcon, ZapIcon } from './Icons';

interface StreamQA {
  id: string;
  name: string;
  code: string;
  tolerance: number; // percentage max allowed
  currentContam: number; // percentage
  status: 'OPTIMAL' | 'ACCEPTABLE' | 'OUT_OF_SPEC';
  targetPurity: number;
  breakdown: { label: string; pct: number; isContam?: boolean }[];
  penaltyMitigated: string;
  airJetRejectionsPerMin: number;
}

const STREAM_DATA: Record<string, StreamQA> = {
  PET: {
    id: 'stream-pet-01',
    name: 'PET Polymer Flake & Bottle Stream',
    code: 'PET-Grade-A · Line 01',
    tolerance: 5.0,
    currentContam: 3.8,
    status: 'OPTIMAL',
    targetPurity: 96.2,
    breakdown: [
      { label: 'Clear PET Polymer Flake', pct: 96.2 },
      { label: 'HDPE Bottle Closures', pct: 2.1, isContam: true },
      { label: 'PVC Barrier Inclusions (Prohibited)', pct: 0.9, isContam: true },
      { label: 'Label Adhesive & Residue', pct: 0.8, isContam: true },
    ],
    penaltyMitigated: '$1,420 / Shift',
    airJetRejectionsPerMin: 28,
  },
  OCC: {
    id: 'stream-occ-02',
    name: 'OCC Cardboard & Kraft Fiber',
    code: 'OCC-11-Spec · Line 02',
    tolerance: 8.0,
    currentContam: 6.4,
    status: 'OPTIMAL',
    targetPurity: 93.6,
    breakdown: [
      { label: 'Corrugated Kraft Fluting', pct: 93.6 },
      { label: 'Wax-Coated Box Liners', pct: 3.2, isContam: true },
      { label: 'Plastic Strapping Bands', pct: 1.8, isContam: true },
      { label: 'Inorganic Dust & Non-Fiber', pct: 1.4, isContam: true },
    ],
    penaltyMitigated: '$980 / Shift',
    airJetRejectionsPerMin: 14,
  },
  HDPE: {
    id: 'stream-hdpe-03',
    name: 'HDPE Natural Bottle Stream',
    code: 'HDPE-Nat-Bale · Line 03',
    tolerance: 3.0,
    currentContam: 4.6,
    status: 'OUT_OF_SPEC',
    targetPurity: 95.4,
    breakdown: [
      { label: 'Natural Unpigmented HDPE', pct: 95.4 },
      { label: 'Pigmented Colored HDPE Jugs', pct: 2.9, isContam: true },
      { label: 'PET Thermoform Inclusions', pct: 1.1, isContam: true },
      { label: 'Silicone Valve Seals', pct: 0.6, isContam: true },
    ],
    penaltyMitigated: '$2,100 / Shift',
    airJetRejectionsPerMin: 42,
  },
  ALU: {
    id: 'stream-alu-04',
    name: 'Aluminum UBC Beverage Bales',
    code: 'UBC-Alloy-3004 · Line 04',
    tolerance: 4.0,
    currentContam: 2.1,
    status: 'OPTIMAL',
    targetPurity: 97.9,
    breakdown: [
      { label: 'Clean Drawn Aluminum Cans', pct: 97.9 },
      { label: 'Ferrous Steel / Tin Slivers', pct: 1.2, isContam: true },
      { label: 'Plastic Can Shrink Sleeves', pct: 0.7, isContam: true },
      { label: 'Organic Liquids Residual', pct: 0.2, isContam: true },
    ],
    penaltyMitigated: '$3,400 / Shift',
    airJetRejectionsPerMin: 19,
  },
};

export default function ContaminationQA() {
  const [selectedStreamKey, setSelectedStreamKey] = useState<string>('PET');
  const [rejectionCount, setRejectionCount] = useState<number>(0);
  const [isSimulatingBurst, setIsSimulatingBurst] = useState<boolean>(false);

  const stream = STREAM_DATA[selectedStreamKey];
  const isOutOfSpec = stream.status === 'OUT_OF_SPEC';

  const triggerAirJetBurst = () => {
    setIsSimulatingBurst(true);
    setRejectionCount((prev) => prev + 1);
    setTimeout(() => setIsSimulatingBurst(false), 500);
  };

  return (
    <section
      id="contamination-qa"
      className="relative min-h-screen py-28 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08]"
    >
      {/* Editorial Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-white/[0.08]">
        <div className="lg:col-span-8">
          <div className="flex items-center gap-3 text-xs font-mono text-[#d4af37] tracking-[0.22em] uppercase mb-4">
            <ShieldIcon size={14} className="text-[#d4af37]" />
            <span>Scene 04 // Operational Sentinel</span>
            <span className="text-white/30">/</span>
            <span className="text-white/50">PRD §11.5 · Bale Sentinel & Contamination QA</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.08]">
            Pre-bale tolerance gating <br />
            <span className="italic font-normal text-white/90">and mill dockage prevention.</span>
          </h2>

          <p className="mt-5 text-base text-white/60 max-w-2xl font-light leading-relaxed">
            Automated optical tolerance enforcement guarding commodity purity specifications
            before hydraulic baler compression. Intercepts prohibited cross-contaminants
            in real time to prevent mill penalty deductions and load rejections.
          </p>
        </div>

        {/* Clean Stream Selector Tabs */}
        <div className="lg:col-span-4 flex flex-col justify-end">
          <div className="border border-white/[0.08] bg-[#060a10] p-1.5 flex flex-wrap gap-1 font-mono text-xs">
            {Object.entries(STREAM_DATA).map(([key]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedStreamKey(key)}
                className={`flex-1 min-w-[70px] py-2 px-3 text-center transition-colors ${
                  selectedStreamKey === key
                    ? 'bg-white text-black font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Operational Instrument: Two-Column Precision Split */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Purity & Tolerance Telemetry Instrument (6 Cols) */}
        <div className="lg:col-span-6 border border-white/[0.08] bg-[#060a10] p-8 font-mono text-xs space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div>
              <span className="text-white/40 uppercase text-[10px] tracking-wider">Monitored Line</span>
              <div className="font-serif text-2xl font-normal text-white mt-0.5">{stream.name}</div>
              <div className="text-white/40 text-[11px]">{stream.code}</div>
            </div>

            <span
              className={`px-2.5 py-1 text-[11px] font-semibold border ${
                isOutOfSpec
                  ? 'border-rose-500/50 text-rose-400 bg-rose-500/10 animate-pulse'
                  : 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
              }`}
            >
              {isOutOfSpec ? 'OUT-OF-SPECIFICATION' : 'SPECIFICATION OPTIMAL'}
            </span>
          </div>

          {/* Scientific Dial / Circular Arc Gauge */}
          <div className="py-6 flex flex-col items-center justify-center border-b border-white/[0.08] relative">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="6"
                />
                {/* Purity Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="transparent"
                  stroke={isOutOfSpec ? '#f43f5e' : '#10b981'}
                  strokeWidth="6"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * stream.targetPurity) / 100}
                  strokeLinecap="butt"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Digital Readout at Centroid */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="font-serif text-4xl sm:text-5xl font-light text-white">
                  {stream.targetPurity}%
                </span>
                <span className="text-[10px] uppercase tracking-widest text-white/40 mt-1">
                  Measured Purity
                </span>
              </div>
            </div>

            {/* Tolerance & Contamination Threshold Rules */}
            <div className="w-full grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/[0.06] text-center">
              <div className="border-r border-white/[0.06] pr-4">
                <span className="text-white/40 text-[10px] uppercase block">Contamination Rate</span>
                <span className={`text-xl font-light font-serif mt-1 block ${isOutOfSpec ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {stream.currentContam}%
                </span>
              </div>
              <div className="pl-4">
                <span className="text-white/40 text-[10px] uppercase block">Tolerance Threshold</span>
                <span className="text-xl font-light font-serif text-white/90 mt-1 block">
                  &lt; {stream.tolerance}% Max
                </span>
              </div>
            </div>
          </div>

          {/* Air-Jet Ejection Array Actuator */}
          <div className="border border-white/[0.08] bg-black/40 p-4 flex items-center justify-between gap-4">
            <div>
              <span className="text-white font-semibold text-[11px] block">
                Optical Air-Jet Sorter Array
              </span>
              <span className="text-white/40 text-[10px]">
                {stream.airJetRejectionsPerMin} Ejections / Min · Continuous Solenoid
              </span>
            </div>

            <button
              type="button"
              onClick={triggerAirJetBurst}
              className={`px-4 py-2 font-mono text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isSimulatingBurst
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/10 hover:bg-white text-white hover:text-black'
              }`}
            >
              <ZapIcon size={13} />
              <span>
                {isSimulatingBurst ? 'AIR-JET FIRED' : rejectionCount > 0 ? `Pulse #${rejectionCount}` : 'Test Air-Jet'}
              </span>
            </button>
          </div>

          {/* Bale Gate Status Bar */}
          <div className="flex items-center justify-between text-[11px] pt-2 text-white/50">
            <span>HYDRAULIC BALE GATE:</span>
            <span className={`font-semibold ${isOutOfSpec ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isOutOfSpec ? 'LOCKED · RECIRCULATING STREAM' : 'CLEAR · BUNDLING PERMITTED'}
            </span>
          </div>
        </div>

        {/* Right Column: Contaminants Micro-Breakdown & Financial Protection (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Active Component Spectrum */}
          <div className="border border-white/[0.08] bg-[#060a10] p-8 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
              <span className="text-white font-semibold tracking-wider uppercase text-[11px]">
                Active Component Fractions & Inclusions
              </span>
              <span className="text-[#d4af37] text-[10px]">4K Multi-Spectral</span>
            </div>

            <div className="space-y-4">
              {stream.breakdown.map((item) => (
                <div key={item.label} className="border-b border-white/[0.04] pb-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 ${
                          item.isContam ? 'bg-rose-500' : 'bg-emerald-400'
                        }`}
                      />
                      <span className={item.isContam ? 'text-rose-300' : 'text-white/80'}>
                        {item.label}
                      </span>
                    </span>
                    <span className={`font-semibold ${item.isContam ? 'text-rose-400' : 'text-white'}`}>
                      {item.pct}%
                    </span>
                  </div>

                  {/* Razor Proportion Bar */}
                  <div className="w-full h-1 bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${
                        item.isContam ? 'bg-rose-500' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Economic Dockage Mitigation Ledger Panel */}
          <div className="border border-white/[0.08] bg-[#060a10] p-8 font-mono text-xs">
            <div className="flex items-start justify-between gap-6">
              <div>
                <span className="text-[#d4af37] text-[10px] uppercase tracking-wider block">
                  Mill Dockage Mitigation Yield
                </span>
                <div className="font-serif text-3xl sm:text-4xl font-light text-white mt-1">
                  {stream.penaltyMitigated}
                </div>
                <p className="mt-2 text-xs text-white/50 font-sans font-light leading-relaxed">
                  Avoided mill claim deductions and rejected freight transit costs achieved through
                  automated pre-compression QA gate verification.
                </p>
              </div>

              <div className="w-12 h-12 border border-[#d4af37]/40 bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] shrink-0">
                <ShieldIcon size={22} />
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
