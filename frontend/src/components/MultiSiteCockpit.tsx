'use client';

import React, { useState } from 'react';
import {
  GlobeIcon,
  ArrowUpRightIcon,
  FilterIcon,
} from './Icons';

interface SiteMetrics {
  id: string;
  name: string;
  city: string;
  totalTons: string;
  contamRate: string;
  hazardCount: number;
  economicYield: string;
  accuracy: string;
  trend: number[];
}

const SITES_DATA: Record<string, SiteMetrics> = {
  ALL: {
    id: 'all-sites',
    name: 'Consolidated Enterprise Network',
    city: 'North American MRF Operations',
    totalTons: '42,850 T',
    contamRate: '5.2%',
    hazardCount: 184,
    economicYield: '$2,142,600',
    accuracy: '98.4%',
    trend: [65, 72, 68, 85, 91, 88, 96],
  },
  SEATTLE: {
    id: 'site-alpha',
    name: 'Site Alpha · West Coast Hub',
    city: 'Seattle, WA',
    totalTons: '18,400 T',
    contamRate: '4.8%',
    hazardCount: 82,
    economicYield: '$940,200',
    accuracy: '98.8%',
    trend: [70, 78, 82, 86, 92, 95, 98],
  },
  AUSTIN: {
    id: 'metro-central',
    name: 'Metro Central MRF',
    city: 'Austin, TX',
    totalTons: '14,250 T',
    contamRate: '5.4%',
    hazardCount: 61,
    economicYield: '$712,400',
    accuracy: '98.2%',
    trend: [60, 64, 71, 75, 80, 84, 88],
  },
  CHICAGO: {
    id: 'greenfield-hub',
    name: 'Greenfield Advanced Recovery',
    city: 'Chicago, IL',
    totalTons: '10,200 T',
    contamRate: '5.7%',
    hazardCount: 41,
    economicYield: '$490,000',
    accuracy: '98.1%',
    trend: [55, 60, 68, 72, 79, 82, 86],
  },
};

const RECENT_AUDITS = [
  {
    scanId: '#WA-9042-S3',
    site: 'Site Alpha (Seattle)',
    timestamp: 'Today, 10:48 UTC',
    stream: 'PET Infeed #2',
    contam: '3.8%',
    hazards: '1 Lithium Pk',
    status: 'Flagged / Diverted',
    statusCategory: 'FLAGGED',
  },
  {
    scanId: '#WA-9041-A1',
    site: 'Metro Central (Austin)',
    timestamp: 'Today, 10:31 UTC',
    stream: 'OCC Fiber Line',
    contam: '6.4%',
    hazards: '0 Hazards',
    status: 'Certified Passed',
    statusCategory: 'CERTIFIED',
  },
  {
    scanId: '#WA-9040-C4',
    site: 'Greenfield (Chicago)',
    timestamp: 'Today, 10:15 UTC',
    stream: 'HDPE Natural',
    contam: '4.6%',
    hazards: '0 Hazards',
    status: 'Certified Passed',
    statusCategory: 'CERTIFIED',
  },
  {
    scanId: '#WA-9039-S2',
    site: 'Site Alpha (Seattle)',
    timestamp: 'Today, 09:54 UTC',
    stream: 'Aluminum UBC',
    contam: '2.1%',
    hazards: '0 Hazards',
    status: 'Certified Passed',
    statusCategory: 'CERTIFIED',
  },
  {
    scanId: '#WA-9038-A2',
    site: 'Metro Central (Austin)',
    timestamp: 'Today, 09:20 UTC',
    stream: 'Mixed Polymers',
    contam: '9.2%',
    hazards: '2 Propane Cyl.',
    status: 'E-Stop Diverted',
    statusCategory: 'DIVERTER',
  },
];

export default function MultiSiteCockpit() {
  const [selectedSiteKey, setSelectedSiteKey] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedRow, setSelectedRow] = useState<string>('#WA-9042-S3');

  const metrics = SITES_DATA[selectedSiteKey];

  const filteredAudits = RECENT_AUDITS.filter((audit) => {
    if (filterStatus === 'ALL') return true;
    return audit.statusCategory === filterStatus;
  });

  return (
    <section
      id="multi-site"
      className="relative min-h-screen py-28 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08]"
    >
      {/* Editorial Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-white/[0.08]">
        <div className="lg:col-span-8">
          <div className="flex items-center gap-3 text-xs font-mono text-[#d4af37] tracking-[0.22em] uppercase mb-4">
            <GlobeIcon size={14} className="text-[#d4af37]" />
            <span>Scene 05 // Traceability & Audit</span>
            <span className="text-white/30">/</span>
            <span className="text-white/50">PRD §9 & §12 · Cross-Facility Ledger</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.08]">
            Verifiable audit ledger <br />
            <span className="italic font-normal text-white/90">across distributed sorting hubs.</span>
          </h2>

          <p className="mt-5 text-base text-white/60 max-w-2xl font-light leading-relaxed">
            Consolidated operational overview synchronizing material diversion tallies,
            conveyor camera telemetry, and automated hazard logs across distributed sorting facilities.
            Every scan record carries an immutable cryptographic timestamp for EPA and ISO 14001 compliance.
          </p>
        </div>

        {/* Clean Facility Filter Tabs */}
        <div className="lg:col-span-4 flex flex-col justify-end">
          <div className="border border-white/[0.08] bg-[#060a10] p-1.5 flex flex-wrap gap-1 font-mono text-xs">
            {Object.keys(SITES_DATA).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedSiteKey(key)}
                className={`flex-1 min-w-[70px] py-2 px-3 text-center transition-colors ${
                  selectedSiteKey === key
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

      {/* Open High-Craft Architectural Metric Strip (No enclosed cards) */}
      <div className="py-12 border-b border-white/[0.08] grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-0 md:divide-x md:divide-white/[0.08]">
        <div className="md:px-6 first:pl-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
            Audited Volume
          </span>
          <div className="font-serif text-3xl lg:text-4xl font-light text-[#d4af37] mt-2">
            {metrics.totalTons}
          </div>
          <span className="text-[10px] font-mono text-white/40 mt-1 block">Live Belt Weight</span>
        </div>

        <div className="md:px-6">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
            Avg Contamination
          </span>
          <div className="font-serif text-3xl lg:text-4xl font-light text-white mt-2">
            {metrics.contamRate}
          </div>
          <span className="text-[10px] font-mono text-emerald-400 mt-1 block">Target &lt; 6.0%</span>
        </div>

        <div className="md:px-6">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
            Intercepted Hazards
          </span>
          <div className="font-serif text-3xl lg:text-4xl font-light text-rose-400 mt-2">
            {metrics.hazardCount}
          </div>
          <span className="text-[10px] font-mono text-white/40 mt-1 block">Batteries & Sharps</span>
        </div>

        <div className="md:px-6">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
            Recovered Commodity
          </span>
          <div className="font-serif text-3xl lg:text-4xl font-light text-emerald-400 mt-2">
            {metrics.economicYield}
          </div>
          <span className="text-[10px] font-mono text-white/40 mt-1 block">Net Recycled Value</span>
        </div>

        <div className="col-span-2 md:col-span-1 md:px-6 last:pr-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
            Model Precision
          </span>
          <div className="font-serif text-3xl lg:text-4xl font-light text-white mt-2">
            {metrics.accuracy}
          </div>
          <span className="text-[10px] font-mono text-white/40 mt-1 block">TensorRT F1 Score</span>
        </div>
      </div>

      {/* Audit Log Ledger Table */}
      <div className="mt-12 font-mono text-xs">
        {/* Table Toolbar */}
        <div className="pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <span className="text-white font-semibold uppercase tracking-wider text-[11px]">
              Material Audit Records
            </span>
            <span className="text-white/40 text-[10px]">
              {filteredAudits.length} Verified Entries
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-white/40 text-[10px] mr-1 flex items-center gap-1 uppercase">
              <FilterIcon size={11} /> Filter:
            </span>
            {(['ALL', 'CERTIFIED', 'FLAGGED', 'DIVERTER'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterStatus(cat)}
                className={`px-2.5 py-1 text-[10px] transition-colors ${
                  filterStatus === cat
                    ? 'bg-white text-black font-semibold'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Refined Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.08] text-white/40 uppercase text-[10px] tracking-wider">
                <th className="py-4 pr-6 font-normal">Scan ID</th>
                <th className="py-4 px-6 font-normal">Facility & Line</th>
                <th className="py-4 px-6 font-normal">Timestamp</th>
                <th className="py-4 px-6 font-normal">Contam Rate</th>
                <th className="py-4 px-6 font-normal">Hazard Alert</th>
                <th className="py-4 px-6 font-normal">Ledger Status</th>
                <th className="py-4 pl-6 text-right font-normal">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredAudits.map((audit) => {
                const isSelected = selectedRow === audit.scanId;
                let statusBadge = 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
                if (audit.statusCategory === 'FLAGGED') {
                  statusBadge = 'text-amber-400 border-amber-500/40 bg-amber-500/10';
                } else if (audit.statusCategory === 'DIVERTER') {
                  statusBadge = 'text-rose-400 border-rose-500/40 bg-rose-500/10';
                }

                return (
                  <tr
                    key={audit.scanId}
                    onClick={() => setSelectedRow(audit.scanId)}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-4 pr-6 font-semibold text-white">{audit.scanId}</td>
                    <td className="py-4 px-6">
                      <div className="text-white/90">{audit.site}</div>
                      <div className="text-[10px] text-white/40">{audit.stream}</div>
                    </td>
                    <td className="py-4 px-6 text-white/50">{audit.timestamp}</td>
                    <td className="py-4 px-6 font-medium text-white/80">{audit.contam}</td>
                    <td className="py-4 px-6">
                      <span className={audit.hazards !== '0 Hazards' ? 'text-rose-400 font-semibold' : 'text-white/40'}>
                        {audit.hazards}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 text-[10px] border ${statusBadge}`}>
                        {audit.status}
                      </span>
                    </td>
                    <td className="py-4 pl-6 text-right">
                      <a
                        href="#audit-workspace"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] text-white/60 hover:text-white border border-white/[0.08] hover:border-white/30 transition-colors"
                      >
                        <span>Inspect</span>
                        <ArrowUpRightIcon size={10} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
