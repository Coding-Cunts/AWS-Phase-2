import React, { useState } from 'react';
import { X, Flag, Check, AlertCircle } from 'lucide-react';
import { PRIMARY_BINS } from '../data/wasteDatabase.js';

export default function FeedbackDisputeModal({ scanResult, isOpen, onClose, onSubmitDispute }) {
  if (!isOpen || !scanResult) return null;

  const [selectedBin, setSelectedBin] = useState('RECYCLABLE');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitDispute(scanResult.scan_id || scanResult.result?.id, selectedBin);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Flag className="w-4 h-4 text-amber-400" />
            <span>Dispute Category Prediction</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-white font-bold text-base">Feedback Recorded!</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              Thank you for capturing this anonymous edge-case model sample.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-slate-300">
            <div className="space-y-1">
              <p className="text-slate-400">Scanned Item:</p>
              <h4 className="text-white font-bold text-base">{scanResult.result?.name}</h4>
              <p className="text-slate-400 text-[11px]">
                Predicted as: <span className="font-semibold text-amber-400">{scanResult.result?.primary_bin}</span>
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-slate-300 font-semibold">
                Which bin should this item belong to in your area?
              </label>
              
              <div className="grid grid-cols-1 gap-2">
                {Object.values(PRIMARY_BINS).map((bin) => (
                  <button
                    type="button"
                    key={bin.id}
                    onClick={() => setSelectedBin(bin.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      selectedBin === bin.id
                        ? 'bg-slate-800 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: bin.color }} />
                      <span className="font-semibold">{bin.name}</span>
                    </div>
                    {selectedBin === bin.id && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-lg shadow-amber-500/20"
              >
                Submit Feedback
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
