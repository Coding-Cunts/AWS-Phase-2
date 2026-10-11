'use client';

import React, { useState, useEffect } from 'react';
import {
  SparklesIcon,
  ShieldIcon,
  GlobeIcon,
  CpuIcon,
  UsersIcon,
  InfoIcon,
  TerminalIcon,
} from './Icons';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'website' | 'creators' | 'mission';
}

export default function AboutModal({
  isOpen,
  onClose,
  initialTab = 'website',
}: AboutModalProps) {
  const [activeTab, setActiveTab] = useState<'website' | 'creators' | 'mission'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl bg-[#05080e] border border-white/[0.18] shadow-2xl overflow-hidden font-mono flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-black/60">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-pulse" />
            <div>
              <span id="about-modal-title" className="font-semibold text-white tracking-wider uppercase text-xs">
                TERRA INTELLIGENCE DOSSIER
              </span>
              <span className="text-white/40 text-[10px] ml-2 hidden sm:inline">
                // SYSTEM RELEASE v2.4.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-white/40 hidden md:inline">ESC to close</span>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center border border-white/20 hover:border-white text-white/60 hover:text-white transition-colors text-xs"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-2.5 border-b border-white/[0.08] bg-[#03060a] flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('website')}
            className={`px-3.5 py-1.5 text-xs transition-all flex items-center gap-2 ${
              activeTab === 'website'
                ? 'bg-white text-black font-semibold shadow'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <InfoIcon size={13} />
            <span>01 // About the Website</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('creators')}
            className={`px-3.5 py-1.5 text-xs transition-all flex items-center gap-2 ${
              activeTab === 'creators'
                ? 'bg-white text-black font-semibold shadow'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <UsersIcon size={13} />
            <span>02 // About the Creators</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mission')}
            className={`px-3.5 py-1.5 text-xs transition-all flex items-center gap-2 ${
              activeTab === 'mission'
                ? 'bg-white text-black font-semibold shadow'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <GlobeIcon size={13} />
            <span>03 // Mission & Philosophy</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-white/70 leading-relaxed font-sans">
          
          {/* TAB 1: ABOUT THE WEBSITE */}
          {activeTab === 'website' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Hero Banner */}
              <div className="border border-white/[0.08] bg-[#080d15] p-5 sm:p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <TerminalIcon size={120} />
                </div>
                <div className="text-[10px] font-mono text-[#d4af37] tracking-widest uppercase mb-2">
                  AUTONOMOUS INDUSTRIAL WASTE COMPUTER VISION
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-light text-white leading-snug">
                  Transforming invisible physical discard into structured, auditable commodity intelligence.
                </h3>
                <p className="mt-3 text-white/60 text-sm max-w-2xl font-light">
                  TERRA is an enterprise material audit platform built to bridge the gap between municipal recycling streams, 
                  industrial sorters, and everyday consumers. By deploying multimodal neural vision models, TERRA deconstructs 
                  any image or video frame of trash into precise recyclable fractions, estimated mass, contamination alerts, and carbon offsets.
                </p>
              </div>

              {/* Core Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-white/[0.08] bg-[#04070c] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs">
                    <SparklesIcon size={14} />
                    <span className="font-semibold uppercase">Multimodal AI Vision</span>
                  </div>
                  <p className="text-white/60 text-xs font-light">
                    Powered by Google Gemini 2.5 Flash with real-time zero-downtime failover to a high-fidelity Neural Edge Simulator.
                    Recognizes 10 discrete material taxonomy fractions including PET, HDPE, foil, and fiber.
                  </p>
                </div>

                <div className="border border-white/[0.08] bg-[#04070c] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[#d4af37] font-mono text-xs">
                    <ShieldIcon size={14} />
                    <span className="font-semibold uppercase">Cryptographic Audit</span>
                  </div>
                  <p className="text-white/60 text-xs font-light">
                    Every optical scan generates a verifiable SHA-256 material audit certificate, tracking recyclability scores, 
                    estimated weight, and dockage penalty avoidance for regulatory compliance.
                  </p>
                </div>

                <div className="border border-white/[0.08] bg-[#04070c] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sky-400 font-mono text-xs">
                    <GlobeIcon size={14} />
                    <span className="font-semibold uppercase">Planetary Telemetry</span>
                  </div>
                  <p className="text-white/60 text-xs font-light">
                    Interactive 3D WebGL orbit synchronizing continental recovery metrics, regional sorting hubs, 
                    and operational diversion tallies across major industrial corridors.
                  </p>
                </div>
              </div>

              {/* Architecture & Tech Stack */}
              <div className="border border-white/[0.08] bg-[#060a10] p-5 font-mono text-xs space-y-3">
                <div className="text-white font-semibold uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <CpuIcon size={14} className="text-[#d4af37]" />
                  <span>Platform Technical Architecture</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[11px]">
                  <div className="border border-white/[0.06] p-2.5 bg-black/40">
                    <div className="text-white/40 text-[9px] uppercase">Core Engine</div>
                    <div className="text-white font-semibold mt-0.5">Next.js 15 App Router</div>
                  </div>
                  <div className="border border-white/[0.06] p-2.5 bg-black/40">
                    <div className="text-white/40 text-[9px] uppercase">AI Orchestration</div>
                    <div className="text-white font-semibold mt-0.5">Gemini Multi-Key Pool</div>
                  </div>
                  <div className="border border-white/[0.06] p-2.5 bg-black/40">
                    <div className="text-white/40 text-[9px] uppercase">Styling & Motion</div>
                    <div className="text-white font-semibold mt-0.5">Obsidian Tailwind CSS</div>
                  </div>
                  <div className="border border-white/[0.06] p-2.5 bg-black/40">
                    <div className="text-white/40 text-[9px] uppercase">Optical Sensor</div>
                    <div className="text-white font-semibold mt-0.5">MediaDevices WebRTC</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ABOUT THE CREATORS */}
          {activeTab === 'creators' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border border-white/[0.08] bg-[#080d15] p-5 sm:p-6">
                <div className="text-[10px] font-mono text-[#d4af37] tracking-widest uppercase mb-2">
                  THE ARCHITECTS & DESIGNERS
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-light text-white leading-snug">
                  Built by engineering minds dedicated to deep-tech, industrial clarity, and environmental regeneration.
                </h3>
                <p className="mt-3 text-white/60 text-sm max-w-2xl font-light">
                  We built TERRA out of frustration with existing climate tech: too much rhetoric, zero verifiable telemetry. 
                  We believe that visual intelligence should be deployed directly to the frontlines of circular manufacturing, 
                  turning complex physical waste streams into elegant, actionable data.
                </p>
              </div>

              {/* Creators Team Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                {/* Creator 1 */}
                <div className="border border-white/[0.08] bg-[#060a10] p-5 space-y-3 relative group hover:border-[#d4af37]/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">Engineering & Systems Architecture</div>
                      <div className="text-xs text-[#d4af37] mt-0.5">AI Perception & Full-Stack Systems</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                      LEAD
                    </span>
                  </div>
                  <p className="text-white/60 text-xs font-sans font-light leading-relaxed">
                    Spearheaded the autonomous Gemini 2.5 multimodal integration, server-side multi-key quota failover pooling, 
                    WebRTC optical viewfinder hardware hooks, and cryptographic audit hashing ledger.
                  </p>
                  <div className="pt-2 border-t border-white/[0.06] flex items-center gap-3 text-[11px] text-white/50">
                    <span>Focus: Next.js · GenAI · High-Availability Architecture</span>
                  </div>
                </div>

                {/* Creator 2 */}
                <div className="border border-white/[0.08] bg-[#060a10] p-5 space-y-3 relative group hover:border-[#d4af37]/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">Spatial Design & Creative Direction</div>
                      <div className="text-xs text-[#d4af37] mt-0.5">Industrial UI & Planetary Cartography</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 border border-[#d4af37]/30 text-[#d4af37] bg-[#d4af37]/10">
                      DESIGN
                    </span>
                  </div>
                  <p className="text-white/60 text-xs font-sans font-light leading-relaxed">
                    Designed the dark obsidian palette, hairline industrial aesthetics, high-contrast typography, 
                    interactive canvas planet visualization, and real-time SVG material pie chart breakdowns.
                  </p>
                  <div className="pt-2 border-t border-white/[0.06] flex items-center gap-3 text-[11px] text-white/50">
                    <span>Focus: Design Systems · WebGL Canvas · Micro-Interactions</span>
                  </div>
                </div>
              </div>

              {/* Creator Principles */}
              <div className="border border-white/[0.08] bg-[#04070c] p-5 space-y-3">
                <div className="text-white font-semibold text-xs tracking-wider uppercase flex items-center gap-2">
                  <TerminalIcon size={14} className="text-[#d4af37]" />
                  <span>Our Core Engineering Principles</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="border-l-2 border-[#d4af37] pl-3 py-1">
                    <div className="text-white font-semibold">1. Physical Reality First</div>
                    <div className="text-white/50 text-[11px] mt-1 font-sans">
                      Software must solve physical sorting bottlenecks and material contamination, not create artificial complexity.
                    </div>
                  </div>
                  <div className="border-l-2 border-emerald-400 pl-3 py-1">
                    <div className="text-white font-semibold">2. Zero-Downtime Resilience</div>
                    <div className="text-white/50 text-[11px] mt-1 font-sans">
                      Never leave an operator stranded. If third-party APIs fail or rate limit, instant edge models take over.
                    </div>
                  </div>
                  <div className="border-l-2 border-sky-400 pl-3 py-1">
                    <div className="text-white font-semibold">3. Radical Transparency</div>
                    <div className="text-white/50 text-[11px] mt-1 font-sans">
                      Verifiable math and cryptographically stamped reports. Zero vague greenwashing claims.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MISSION & PHILOSOPHY */}
          {activeTab === 'mission' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border border-white/[0.08] bg-[#080d15] p-5 sm:p-6">
                <div className="text-[10px] font-mono text-[#d4af37] tracking-widest uppercase mb-2">
                  OUR DRIVING MISSION
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-light text-white leading-snug">
                  Waste is not an inevitable byproduct. It is an unindexed material resource.
                </h3>
                <p className="mt-3 text-white/60 text-sm max-w-2xl font-light">
                  Today, over 80% of recyclable materials globally end up in landfills or incinerators simply because they cannot be 
                  identified, separated, and certified quickly enough at the sorting dock. TERRA exists to make material circularity 
                  as seamless and accountable as enterprise cloud logging.
                </p>
              </div>

              {/* Projected Planetary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
                <div className="border border-white/[0.08] bg-[#060a10] p-4">
                  <div className="text-2xl font-bold text-white">2.1B+</div>
                  <div className="text-[10px] text-white/50 uppercase mt-1">Tons Waste / Year Global</div>
                </div>
                <div className="border border-white/[0.08] bg-[#060a10] p-4">
                  <div className="text-2xl font-bold text-emerald-400">&lt; 19%</div>
                  <div className="text-[10px] text-white/50 uppercase mt-1">Current Real Recycling</div>
                </div>
                <div className="border border-white/[0.08] bg-[#060a10] p-4">
                  <div className="text-2xl font-bold text-[#d4af37]">Sub-2s</div>
                  <div className="text-[10px] text-white/50 uppercase mt-1">Vision Inference Time</div>
                </div>
                <div className="border border-white/[0.08] bg-[#060a10] p-4">
                  <div className="text-2xl font-bold text-sky-400">100%</div>
                  <div className="text-[10px] text-white/50 uppercase mt-1">Auditable SHA-256 Chain</div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="border border-white/[0.08] bg-[#04070c] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
                <div>
                  <div className="text-white font-semibold">Join the TERRA Circularity Network</div>
                  <div className="text-white/50 text-[11px] font-sans">
                    Connect your sorting facility, municipality, or testing laboratory to our real-time audit ledger.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white text-black font-semibold hover:bg-[#d4af37] transition-colors whitespace-nowrap"
                >
                  Return to Platform
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/[0.08] bg-black/60 flex items-center justify-between text-[11px] text-white/40">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>TERRA Platform Systems · All Services Operational</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-[#d4af37] transition-colors underline underline-offset-4"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
