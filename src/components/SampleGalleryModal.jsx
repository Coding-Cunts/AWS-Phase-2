import React from 'react';
import { X, Grid, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { SAMPLE_ITEMS, PRIMARY_BINS } from '../data/wasteDatabase.js';

export default function SampleGalleryModal({ isOpen, onClose, onSelectSample }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Grid className="w-5 h-5 text-emerald-400" />
            <span>Pre-Loaded Waste Edge Case Gallery</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-400">
            Select any item below to test instant AI visual classification, edge case directives, and PRD persona user stories:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SAMPLE_ITEMS.map((item) => {
              const binInfo = PRIMARY_BINS[item.primary_bin] || PRIMARY_BINS.NON_RECYCLABLE;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectSample(item);
                    onClose();
                  }}
                  className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all text-left flex items-start gap-3.5 group cursor-pointer"
                >
                  {/* Item SVG Thumbnail */}
                  <div
                    className="w-14 h-14 rounded-xl bg-slate-900 shrink-0 p-1 border border-slate-800 group-hover:border-emerald-500/50 transition-colors flex items-center justify-center overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: item.imageSvg }}
                  />

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">
                        {item.name}
                      </h4>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${binInfo.badgeBg}`}>
                        {binInfo.name}
                      </span>
                      {item.is_hazard && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-900/50 text-orange-300 border border-orange-500/40 flex items-center gap-0.5">
                          <ShieldAlert className="w-3 h-3" />
                          HAZARD
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 leading-snug line-clamp-1">{item.notes}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
