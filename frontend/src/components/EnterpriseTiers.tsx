'use client';

import React, { useState } from 'react';
import {
  CheckCircleIcon,
  SparklesIcon,
  SlidersIcon,
} from './Icons';

export default function EnterpriseTiers() {
  const [annualBilling, setAnnualBilling] = useState<boolean>(true);
  const [monthlyTonnage, setMonthlyTonnage] = useState<number>(5000);

  // Economic yield estimation grounded in PRD recovery data
  const estimatedYield = Math.round(monthlyTonnage * 8.5);
  const estimatedPenaltySaved = Math.round(monthlyTonnage * 1.45);

  return (
    <section
      id="enterprise-tiers"
      className="relative min-h-screen py-28 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08]"
    >
      {/* Editorial Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-white/[0.08]">
        <div className="lg:col-span-8">
          <div className="flex items-center gap-3 text-xs font-mono text-[#d4af37] tracking-[0.22em] uppercase mb-4">
            <SparklesIcon size={14} className="text-[#d4af37]" />
            <span>Scene 07 // Enterprise Deployment</span>
            <span className="text-white/30">/</span>
            <span className="text-white/50">PRD §7 & §14 · Tiered Infrastructure Integration</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.08]">
            Deployment tiers <br />
            <span className="italic font-normal text-white/90">engineered for physical sorting scale.</span>
          </h2>

          <p className="mt-5 text-base text-white/60 max-w-2xl font-light leading-relaxed">
            From municipal diversion compliance and EPA audit logs to continuous multi-facility
            sorting lines integrated with high-frequency Delta robotics and AWS SageMaker pipelines.
          </p>
        </div>

        {/* Minimal Billing Commitment Switch */}
        <div className="lg:col-span-4 flex flex-col justify-end">
          <div className="border border-white/[0.08] bg-[#060a10] p-1.5 flex items-center font-mono text-xs">
            <button
              type="button"
              onClick={() => setAnnualBilling(false)}
              className={`flex-1 py-2 px-3 text-center transition-colors ${
                !annualBilling
                  ? 'bg-white text-black font-semibold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Monthly Invoicing
            </button>
            <button
              type="button"
              onClick={() => setAnnualBilling(true)}
              className={`flex-1 py-2 px-3 text-center transition-colors flex items-center justify-center gap-1.5 ${
                annualBilling
                  ? 'bg-white text-black font-semibold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] text-[#d4af37] uppercase">[-20%]</span>
            </button>
          </div>
        </div>
      </div>

      {/* Architectural Tier Columns: Hairline Column Grid */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 border border-white/[0.08] divide-y md:divide-y-0 md:divide-x divide-white/[0.08] bg-[#060a10]">
        
        {/* Tier 1: Municipal */}
        <div className="p-8 flex flex-col justify-between font-mono text-xs">
          <div>
            <div className="text-white/40 uppercase tracking-widest text-[10px] mb-2 font-semibold">
              Tier I · Municipal
            </div>
            <h3 className="font-serif text-2xl font-normal text-white mb-2">
              Audit & Reporting
            </h3>
            <p className="text-white/60 text-xs font-sans font-light leading-relaxed mb-6">
              Engineered for municipalities and regional environmental contractors requiring verifiable material composition ledgers and EPA compliance records.
            </p>

            <div className="font-serif text-3xl font-light text-white mb-6">
              {annualBilling ? '$1,160' : '$1,450'}{' '}
              <span className="text-xs font-mono text-white/40 font-normal">/ site / mo</span>
            </div>

            <div className="space-y-3 text-white/70 border-t border-white/[0.06] pt-6">
              <div className="flex items-start gap-2.5">
                <CheckCircleIcon size={14} className="text-[#d4af37] shrink-0 mt-0.5" />
                <span>Batch Image & Video Audit Scans</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircleIcon size={14} className="text-[#d4af37] shrink-0 mt-0.5" />
                <span>6 Standard Polymer Taxonomies</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircleIcon size={14} className="text-[#d4af37] shrink-0 mt-0.5" />
                <span>Cryptographic SHA-256 Certificates</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircleIcon size={14} className="text-[#d4af37] shrink-0 mt-0.5" />
                <span>CSV / JSON Export & EPA Reporting</span>
              </div>
            </div>
          </div>

          <a
            href="#audit-workspace"
            className="mt-10 block w-full py-3 text-center border border-white/20 text-white hover:bg-white hover:text-black transition-colors uppercase tracking-wider text-[11px] font-semibold"
          >
            Deploy Audit Tier
          </a>
        </div>

        {/* Tier 2: Facility Operations (Featured) */}
        <div className="p-8 flex flex-col justify-between font-mono text-xs bg-[#090e16] relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#d4af37]" />

          <div>
            <div className="flex items-center justify-between text-[10px] tracking-widest uppercase mb-2">
              <span className="text-[#d4af37] font-semibold">Tier II · Production MRF</span>
              <span className="text-[#d4af37] border border-[#d4af37]/40 px-1.5 py-0.5">Recommended</span>
            </div>
            <h3 className="font-serif text-2xl font-normal text-white mb-2">
              Operations & Bale Sentinel
            </h3>
            <p className="text-white/60 text-xs font-sans font-light leading-relaxed mb-6">
              Continuous 60 FPS conveyor line cameras, real-time contamination QA gating, lithium battery runaway alarms, and operator HUD station.
            </p>

            <div className="font-serif text-3xl font-light text-[#d4af37] mb-6">
              {annualBilling ? '$3,080' : '$3,850'}{' '}
              <span className="text-xs font-mono text-white/40 font-normal">/ line / mo</span>
            </div>

            <div className="space-y-3 text-white/80 border-t border-white/[0.06] pt-6">
              <div className="flex items-start gap-2.5">
                <CheckCircleIcon size={14} className="text-[#d4af37] shrink-0 mt-0.5" />
                <span>Continuous 60 FPS Camera Ingest</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircleIcon size={14} className="text-[#d4af37] shrink-0 mt-0.5" />
                <span>Real-Time Contamination Sentinel</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircleIcon size={14} className="text-[#d4af37] shrink-0 mt-0.5" />
                <span>Thermal Battery Alarm & Solenoid Trigger</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircleIcon size={14} className="text-[#d4af37] shrink-0 mt-0.5" />
                <span>Tablet HUD for Conveyor Operators</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircleIcon size={14} className="text-[#d4af37] shrink-0 mt-0.5" />
                <span>Human Review Override Station</span>
              </div>
            </div>
          </div>

          <a
            href="#audit-workspace"
            className="mt-10 block w-full py-3 text-center bg-[#d4af37] text-black hover:bg-[#eecf6d] transition-colors uppercase tracking-wider text-[11px] font-bold"
          >
            Deploy MRF Operations
          </a>
        </div>

        {/* Tier 3: Robotic Ecosystem */}
        <div className="p-8 flex flex-col justify-between font-mono text-xs">
          <div>
            <div className="text-white/40 uppercase tracking-widest text-[10px] mb-2 font-semibold">
              Tier III · Autonomous Sort
            </div>
            <h3 className="font-serif text-2xl font-normal text-white mb-2">
              Robotics & Cloud SLA
            </h3>
            <p className="text-white/60 text-xs font-sans font-light leading-relaxed mb-6">
              Sub-12ms SageMaker inference, real-time 3D delta robot grasp coordinate streaming, AWS Bedrock generative auditor, and custom multi-facility SLA.
            </p>

            <div className="font-serif text-3xl font-light text-white mb-6">
              Custom <span className="text-xs font-mono text-white/40 font-normal">Enterprise SLA</span>
            </div>

            <div className="space-y-3 text-white/70 border-t border-white/[0.06] pt-6">
              <div className="flex items-start gap-2.5">
                <CheckCircleIcon size={14} className="text-[#d4af37] shrink-0 mt-0.5" />
                <span>Sub-12ms Dedicated SageMaker Endpoints</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircleIcon size={14} className="text-[#d4af37] shrink-0 mt-0.5" />
                <span>Direct Delta Robot PLC Grasp Streaming</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircleIcon size={14} className="text-[#d4af37] shrink-0 mt-0.5" />
                <span>Cross-Facility Central Cockpit</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircleIcon size={14} className="text-[#d4af37] shrink-0 mt-0.5" />
                <span>24/7 Dedicated Computer Vision Engineers</span>
              </div>
            </div>
          </div>

          <a
            href="#robot-api"
            className="mt-10 block w-full py-3 text-center border border-white/20 text-white hover:bg-white hover:text-black transition-colors uppercase tracking-wider text-[11px] font-semibold"
          >
            Request Enterprise SLA
          </a>
        </div>

      </div>

      {/* Interactive Facility ROI Yield Estimator */}
      <div className="mt-12 border border-white/[0.08] bg-[#060a10] p-8 sm:p-10 font-mono text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-[#d4af37] uppercase tracking-wider mb-1">
              <SlidersIcon size={12} />
              <span>Simulation Tool // Recovery Yield</span>
            </div>
            <h3 className="font-serif text-2xl font-light text-white">
              Simulate Plant Recovery & Dockage Economics
            </h3>
          </div>

          <div className="text-white/60">
            Monthly Sorting Volume:{' '}
            <span className="text-white font-semibold text-sm">
              {monthlyTonnage.toLocaleString()} Tons / mo
            </span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="py-6 border-b border-white/[0.08] space-y-2">
          <input
            type="range"
            min="1000"
            max="25000"
            step="500"
            value={monthlyTonnage}
            onChange={(e) => setMonthlyTonnage(Number(e.target.value))}
            className="w-full accent-white bg-white/10 h-1.5 appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-white/40">
            <span>1,000 T / mo (Transfer Station)</span>
            <span>10,000 T / mo (Standard Regional MRF)</span>
            <span>25,000 T / mo (Mega-Facility Hub)</span>
          </div>
        </div>

        {/* Calculation Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
          <div>
            <span className="text-white/40 uppercase text-[10px] block">
              Est. Recyclable Commodity Fractions Recovered
            </span>
            <div className="font-serif text-3xl sm:text-4xl font-light text-emerald-400 mt-2">
              ${estimatedYield.toLocaleString()} / mo
            </div>
            <span className="text-white/40 text-[10px] mt-1 block">
              Derived from optical conveyor micro-segmentation pick accuracy
            </span>
          </div>

          <div>
            <span className="text-white/40 uppercase text-[10px] block">
              Est. Mill Contamination Deductions Avoided
            </span>
            <div className="font-serif text-3xl sm:text-4xl font-light text-[#d4af37] mt-2">
              ${estimatedPenaltySaved.toLocaleString()} / mo
            </div>
            <span className="text-white/40 text-[10px] mt-1 block">
              Enforced through pre-bale Sentinel tolerance gating
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
