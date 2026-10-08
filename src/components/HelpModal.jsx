import React from 'react';
import { X, BookOpen, Recycle, Flame, Info, CheckCircle, ShieldAlert } from 'lucide-react';
import { PRIMARY_BINS } from '../data/wasteDatabase.js';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>EcoScan Waste Segregation Guide</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-xs leading-relaxed">
          {/* Master Bins Summary */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              The 4 Master Waste Streams
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.values(PRIMARY_BINS).map(bin => (
                <div key={bin.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs" style={{ color: bin.color }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bin.color }}></div>
                    <span>{bin.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{bin.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Resin Codes Legend */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-white">
              <Recycle className="w-4 h-4 text-blue-400" />
              <span>Plastics Resin Identification Codes (#1–#7)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 font-mono">
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800">#1 PET (Bottles - Recyclable)</div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800">#2 HDPE (Milk - Recyclable)</div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800">#3 PVC (Trash)</div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800">#4 LDPE (Store Drop-Off)</div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800">#5 PP (Tubs - Recyclable)</div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800">#6 PS / #7 Other (Landfill)</div>
            </div>
          </div>

          {/* Critical Hazard Alert Reminder */}
          <div className="p-4 rounded-2xl bg-orange-950/30 border border-orange-600/40 text-orange-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-orange-400">
              <Flame className="w-4 h-4 shrink-0" />
              <span>Lithium & E-Waste Hazard Warning</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Lithium batteries cause over 2,000 waste facility fires each year. NEVER toss batteries, electronics, or vape devices into curbside paper or plastic bins.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
