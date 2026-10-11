'use client';

import React, { useEffect } from 'react';
import { DownloadIcon } from './Icons';

interface AuditCertModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanId?: string;
  facility?: string;
}

export default function AuditCertModal({
  isOpen,
  onClose,
  scanId = '#WA-9042-S3',
  facility = 'Site Alpha · West Coast Hub (Seattle)',
}: AuditCertModalProps) {
  // Close on Escape key
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
      aria-labelledby="cert-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-[#060a10] border border-white/[0.15] p-8 sm:p-10 shadow-2xl overflow-hidden font-mono text-xs">
        {/* Certificate Header */}
        <div className="text-center border-b border-white/[0.08] pb-6 mb-6">
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#d4af37] font-semibold block">
            ISO 14001 / EPA COMPLIANT DIGITAL AUDIT RECORD
          </span>
          <h3 id="cert-modal-title" className="font-serif text-2xl sm:text-3xl font-light text-white mt-2">
            Certificate of Material Composition
          </h3>
          <p className="text-white/40 text-xs mt-1">
            Scan Record: {scanId} · Generated via AWS Computer Vision Engine v3.8
          </p>
        </div>

        {/* Certificate Details */}
        <div className="space-y-4 text-white/70 mb-6">
          <div className="grid grid-cols-2 gap-4 p-4 border border-white/[0.06] bg-[#020408]">
            <div>
              <span className="text-[9px] text-white/40 uppercase block">Operating Facility</span>
              <div className="text-white font-semibold mt-0.5">{facility}</div>
            </div>
            <div>
              <span className="text-[9px] text-white/40 uppercase block">Stream Location</span>
              <div className="text-white font-semibold mt-0.5">Primary Infeed Belt 02 · 2.4 m/s</div>
            </div>
            <div>
              <span className="text-[9px] text-white/40 uppercase block">Measurement Timestamp</span>
              <div className="text-white/70 mt-0.5">09-Oct-2026 10:48:12 UTC</div>
            </div>
            <div>
              <span className="text-[9px] text-white/40 uppercase block">Gross Volume Sample</span>
              <div className="text-emerald-400 font-semibold mt-0.5">10.00 Metric Tons Audited</div>
            </div>
          </div>

          {/* Composition Breakdown Grid */}
          <div className="p-4 border border-white/[0.06] bg-[#020408]">
            <span className="text-[9px] text-white/40 uppercase block mb-3">
              Verified Material Fractions
            </span>
            <div className="grid grid-cols-3 gap-3 text-[11px]">
              <div className="p-2 border border-white/[0.04] bg-[#060a10]">
                <span className="text-white/40 block text-[9px]">PET Polymers</span>
                <span className="text-white font-semibold text-sm">31.4%</span>
              </div>
              <div className="p-2 border border-white/[0.04] bg-[#060a10]">
                <span className="text-white/40 block text-[9px]">OCC Cardboard</span>
                <span className="text-white font-semibold text-sm">24.1%</span>
              </div>
              <div className="p-2 border border-white/[0.04] bg-[#060a10]">
                <span className="text-white/40 block text-[9px]">HDPE Rigid</span>
                <span className="text-white font-semibold text-sm">16.8%</span>
              </div>
              <div className="p-2 border border-white/[0.04] bg-[#060a10]">
                <span className="text-white/40 block text-[9px]">Non-Ferrous Metals</span>
                <span className="text-white font-semibold text-sm">11.2%</span>
              </div>
              <div className="p-2 border border-white/[0.04] bg-[#060a10]">
                <span className="text-white/40 block text-[9px]">Container Glass</span>
                <span className="text-white font-semibold text-sm">8.3%</span>
              </div>
              <div className="p-2 border border-white/[0.04] bg-[#060a10]">
                <span className="text-rose-400 block text-[9px]">Residual Diverted</span>
                <span className="text-rose-400 font-semibold text-sm">8.2%</span>
              </div>
            </div>
          </div>

          {/* Cryptographic SHA-256 Fingerprint */}
          <div className="p-3.5 border border-white/[0.06] bg-[#020408] flex items-center justify-between">
            <div className="overflow-hidden">
              <span className="text-[9px] text-white/40 uppercase block">
                Immutable Cryptographic Ledger Fingerprint
              </span>
              <div className="text-[10px] text-[#d4af37] truncate mt-0.5">
                sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
              </div>
            </div>
            <span className="px-2 py-0.5 text-[9px] border border-emerald-500/40 text-emerald-400 whitespace-nowrap ml-3 font-semibold">
              VERIFIED
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-white/20 text-white/70 hover:text-white transition-colors"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2 bg-white text-black font-semibold hover:bg-[#d4af37] transition-colors flex items-center gap-2"
          >
            <DownloadIcon size={13} />
            <span>Print Official Certificate</span>
          </button>
        </div>
      </div>
    </div>
  );
}
