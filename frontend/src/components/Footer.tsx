'use client';

import React from 'react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-white/[0.08] bg-[#020408] text-white/50 font-mono text-xs py-20 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-start justify-between gap-12">
        
        {/* Brand & Mission Col */}
        <div className="flex flex-col gap-3.5 max-w-sm">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl font-light tracking-[0.25em] text-white">
              TERRA
            </span>
            <span className="text-[10px] px-2 py-0.5 border border-emerald-500/30 text-emerald-400 font-semibold">
              OPERATIONAL
            </span>
          </div>

          <p className="text-white/60 font-sans text-xs font-light leading-relaxed">
            The enterprise computer-vision intelligence layer converting physical municipal and industrial waste streams into structured, measurable commodity data.
          </p>

          <div className="flex items-center gap-2 text-[11px] text-white/40 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>AWS US-WEST-2 (SEATTLE) · LATENCY &lt;12MS</span>
          </div>
        </div>

        {/* Navigation Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 text-[11px]">
          <div>
            <div className="text-white font-medium mb-3 uppercase text-[10px] tracking-[0.18em]">
              Platform Screens
            </div>
            <ul className="space-y-2 text-white/60">
              <li>
                <a href="#hero" className="hover:text-white transition-colors">
                  01 // Planetary Orbit
                </a>
              </li>
              <li>
                <a href="#audit-workspace" className="hover:text-white transition-colors">
                  02 // Material Audit Scanner
                </a>
              </li>
              <li>
                <a href="#developer-hub" className="hover:text-white transition-colors">
                  03 // Developer & API Proxy Hub
                </a>
              </li>
              <li>
                <a href="#multi-site" className="hover:text-white transition-colors">
                  04 // Operations Cockpit
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-white font-medium mb-3 uppercase text-[10px] tracking-[0.18em]">
              Intelligence Layer
            </div>
            <ul className="space-y-2 text-white/60">
              <li>Gemini 3.8 Multimodal Vision</li>
              <li>Neural Edge Composition Sorter</li>
              <li>Optical Sensor Viewfinder</li>
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <div className="text-white font-medium mb-3 uppercase text-[10px] tracking-[0.18em]">
              Compliance
            </div>
            <ul className="space-y-2 text-white/60">
              <li>ISO 14001 Auditable Ledger</li>
              <li>EPA Diverted Volume Stds</li>
              <li>Cryptographic SHA-256 Seal</li>
            </ul>
          </div>
        </div>

        {/* Back to Top */}
        <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-0 border-white/[0.08]">
          <button
            type="button"
            onClick={scrollToTop}
            className="px-3.5 py-1.5 border border-white/20 text-white hover:bg-white hover:text-black font-mono text-[11px] transition-colors flex items-center gap-1.5"
          >
            <span>Top of Page</span>
            <span>↑</span>
          </button>
        </div>

      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto mt-16 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/40">
        <div>© 2026 TERRA Waste Intelligence Systems Inc. All rights reserved.</div>
        <div className="flex items-center gap-3">
          <span>Production Release v3.8</span>
          <span>·</span>
          <span>Continuous Frame Interpolation</span>
        </div>
      </div>
    </footer>
  );
}
