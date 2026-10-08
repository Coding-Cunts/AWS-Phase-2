import React, { useState } from 'react';
import { PRIMARY_BINS } from '../data/wasteDatabase.js';
import { soundEffects } from '../services/audioService.js';
import {
  Recycle,
  Leaf,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Scissors,
  Flame,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export default function ResultDrawer({
  scanResult,
  onScanNext,
  onDispute,
  isOpen
}) {
  if (!scanResult || !isOpen) return null;

  const { result, inference_latency_ms } = scanResult;
  const binKey = result?.primary_bin || 'NON_RECYCLABLE';
  const binInfo = PRIMARY_BINS[binKey] || PRIMARY_BINS.NON_RECYCLABLE;

  // Local state for prep checklist checkmarks
  const [checkedItems, setCheckedItems] = useState({});

  const toggleCheck = (idx) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
    soundEffects.playShutter();
  };

  const getBinIcon = (iconName) => {
    switch (iconName) {
      case 'Recycle': return <Recycle className="w-8 h-8 text-white" />;
      case 'Leaf': return <Leaf className="w-8 h-8 text-white" />;
      case 'AlertTriangle': return <AlertTriangle className="w-8 h-8 text-white" />;
      case 'Trash2': default: return <Trash2 className="w-8 h-8 text-white" />;
    }
  };

  const isLowConfidence = result.confidence_score < 0.60;
  const isMultipleObjects = result.multiple_objects_detected;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      {/* Tap backdrop to dismiss or tap top handle */}
      <div className="flex-1" onClick={onScanNext} />

      {/* Main Drawer Surface */}
      <div
        className="w-full max-w-xl mx-auto bg-slate-900 border-t border-slate-800 rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up"
        style={{
          boxShadow: `0 -10px 40px ${binInfo.color}33`
        }}
      >
        {/* Top Drag Handle */}
        <div className="w-full py-2 flex items-center justify-center bg-slate-900 cursor-pointer" onClick={onScanNext}>
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* 1. Color-Coded Header Banner */}
        <div
          className={`px-6 py-5 ${binInfo.bgClass} text-white flex items-center justify-between shadow-lg relative overflow-hidden`}
        >
          {/* Subtle background glow pattern */}
          <div className="absolute -right-10 -bottom-10 opacity-20 pointer-events-none">
            {getBinIcon(binInfo.icon)}
          </div>

          <div className="flex items-center gap-3.5 z-10">
            <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
              {getBinIcon(binInfo.icon)}
            </div>
            <div>
              <span className="text-[11px] font-mono tracking-wider uppercase font-semibold text-white/80">
                Primary Waste Stream
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase leading-tight">
                {binInfo.label}
              </h2>
            </div>
          </div>

          {/* Latency & Confidence Badge */}
          <div className="text-right z-10">
            <div className="text-xs font-mono font-bold text-white/90 bg-black/25 px-2.5 py-1 rounded-lg border border-white/20">
              {Math.round(result.confidence_score * 100)}% Match
            </div>
            <p className="text-[10px] text-white/70 font-mono mt-1">{inference_latency_ms}ms latency</p>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">

          {/* 2. Low Confidence Warning Alert (< 0.60 score) */}
          {isLowConfidence && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Uncertain Classification (&lt; 60% Confidence)</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                Never guess on ambiguous items. When in doubt, place in General Landfill Trash to avoid contaminating municipal recycling batches.
              </p>
            </div>
          )}

          {/* 3. Multiple Items in Frame Alert */}
          {isMultipleObjects && (
            <div className="p-4 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-300 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0" />
                <span>Multiple Items Found in Frame</span>
              </div>
              <p className="text-xs text-blue-200/90 leading-relaxed">
                Detected &gt; 2 prominent objects. Please move closer and isolate a single waste item for maximum accuracy.
              </p>
            </div>
          )}

          {/* 4. Lithium Battery / Hazardous Alert Banner */}
          {result.is_hazard && (
            <div className="p-4 rounded-2xl bg-orange-600/20 border-2 border-orange-500 text-orange-200 space-y-2 animate-pulse">
              <div className="flex items-center gap-2 text-orange-400 font-black text-sm uppercase tracking-wide">
                <Flame className="w-5 h-5 shrink-0" />
                <span>CRITICAL HAZARDS ALERT</span>
              </div>
              <p className="text-xs text-orange-100 leading-relaxed font-medium">
                {result.hazard_alert}
              </p>
            </div>
          )}

          {/* 5. Food-Soiled Paper Contamination Warning */}
          {result.food_soiled && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/50 text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Grease & Food Residue Detected</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-100/90">
                {result.soiled_warning}
              </p>
            </div>
          )}

          {/* 6. Item Identification & Badges */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">{result.name}</h3>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${binInfo.badgeBg}`}>
                Subtype: {result.material_subtype}
              </span>
              {result.resin_code && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                  Resin {result.resin_code}
                </span>
              )}
              {result.is_composite && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-900/40 text-purple-300 border border-purple-500/40">
                  Composite Material
                </span>
              )}
            </div>
          </div>

          {/* 7. Composite Multi-Material Split Result Card (PRD Edge Case) */}
          {result.is_composite && result.composite_split && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Scissors className="w-4 h-4 text-emerald-400" />
                <span>Multi-Material Separation Required</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Part 1 */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-slate-200">{result.composite_split.part1.name}</span>
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-blue-400">
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>{result.composite_split.part1.bin}</span>
                  </div>
                </div>

                {/* Part 2 */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-slate-200">{result.composite_split.part2.name}</span>
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>{result.composite_split.part2.bin}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. Actionable Hygiene & Prep Checklist */}
          {result.prep_instructions && result.prep_instructions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Actionable Hygiene & Prep Checklist
              </h4>

              <div className="space-y-2">
                {result.prep_instructions.map((step, idx) => {
                  const isDone = checkedItems[idx];
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleCheck(idx)}
                      className={`w-full p-3 rounded-xl border transition-all text-left flex items-start gap-3 text-xs font-medium ${
                        isDone
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 line-through opacity-80'
                          : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-950" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-500" />
                        )}
                      </div>
                      <span className="leading-snug">{step}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes / Context */}
          {result.notes && (
            <p className="text-xs text-slate-400 italic bg-slate-950 p-3 rounded-xl border border-slate-800">
              💡 Municipal context: {result.notes}
            </p>
          )}
        </div>

        {/* Bottom Sticky CTA Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
          {/* Primary Action Button */}
          <button
            onClick={onScanNext}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm transition-all shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Scan Another Item</span>
          </button>

          {/* One-Tap Dispute Feedback Loop Link */}
          <div className="text-center">
            <button
              onClick={() => onDispute(scanResult)}
              className="text-xs text-slate-400 hover:text-slate-200 underline decoration-slate-600 transition-colors py-1 cursor-pointer"
            >
              Wrong category or material prediction? Let us know
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
