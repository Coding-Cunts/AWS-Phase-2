import React, { useState, useEffect } from 'react';
import { X, Database, Activity, Clock, ShieldCheck, Flag, Server, RefreshCw } from 'lucide-react';
import { telemetryStore } from '../services/telemetryStore.js';

export default function TelemetryDrawer({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [metrics, setMetrics] = useState(telemetryStore.getMetrics());

  useEffect(() => {
    setMetrics(telemetryStore.getMetrics());
  }, [isOpen]);

  const refreshData = () => {
    setMetrics(telemetryStore.getMetrics());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Database className="w-5 h-5 text-emerald-400" />
            <span>Production Data Model & Telemetry Inspector</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh telemetry metrics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">

          {/* Quantitative Success Metrics Bar (PRD Section 9) */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Quantitative Success Metrics (PRD Section 9 Target Baseline)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Metric 1: SCR */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Scan Completion (SCR)</span>
                  <span className="text-emerald-400 font-mono font-bold">Target ≥ 85%</span>
                </div>
                <div className="text-2xl font-black text-white font-mono">{metrics.scrRate}%</div>
                <p className="text-[10px] text-slate-500">Camera opened → result accepted</p>
              </div>

              {/* Metric 2: p95 Latency */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>End-to-End p95 Latency</span>
                  <span className="text-emerald-400 font-mono font-bold">Target ≤ 1,800ms</span>
                </div>
                <div className="text-2xl font-black text-white font-mono">{metrics.p95LatencyMs} ms</div>
                <p className="text-[10px] text-slate-500">Shutter click to rendered result card</p>
              </div>

              {/* Metric 3: Dispute Rate */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Dispute Rate</span>
                  <span className="text-emerald-400 font-mono font-bold">Target ≤ 5.0%</span>
                </div>
                <div className="text-2xl font-black text-white font-mono">{metrics.disputeRate}%</div>
                <p className="text-[10px] text-slate-500">User flagged "Incorrect?" dispute link</p>
              </div>
            </div>
          </div>

          {/* PostgreSQL Event Schema View */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-emerald-400 font-bold text-xs">
                PostgreSQL Table ScanEvent Schema
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Zero Persistent Image Storage</span>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`Table ScanEvent {
  scan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  client_network_tier VARCHAR(12), -- '4g' | '5g' | 'wifi'
  primary_bin VARCHAR(24) NOT NULL, -- RECYCLABLE | NON_RECYCLABLE | COMPOST | HAZARDOUS
  material_subtype VARCHAR(32) NOT NULL, -- PLASTIC_RIGID | PLASTIC_FILM | E_WASTE
  confidence_score DECIMAL(4,3) NOT NULL, -- 0.000 to 1.000
  prep_instructions TEXT[],
  is_composite BOOLEAN DEFAULT FALSE,
  inference_latency_ms INTEGER NOT NULL,
  user_flagged_error BOOLEAN DEFAULT FALSE,
  user_suggested_bin VARCHAR(24) NULL
}`}
            </pre>
          </div>

          {/* Live Events Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Live Session Telemetry Log ({metrics.events?.length || 0} events recorded)
            </h4>

            {metrics.events && metrics.events.length > 0 ? (
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[11px] font-mono">
                    <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Time</th>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5">Bin</th>
                        <th className="p-2.5">Latency</th>
                        <th className="p-2.5">Score</th>
                        <th className="p-2.5">Disputed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300">
                      {metrics.events.map((evt) => (
                        <tr key={evt.scan_id} className="hover:bg-slate-900/60">
                          <td className="p-2.5 text-slate-400">{new Date(evt.created_at).toLocaleTimeString()}</td>
                          <td className="p-2.5 font-sans font-semibold text-white">{evt.raw_item_name}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              evt.primary_bin === 'RECYCLABLE' ? 'bg-blue-900/40 text-blue-300' :
                              evt.primary_bin === 'COMPOST' ? 'bg-emerald-900/40 text-emerald-300' :
                              evt.primary_bin === 'HAZARDOUS' ? 'bg-orange-900/40 text-orange-300' :
                              'bg-slate-800 text-slate-300'
                            }`}>
                              {evt.primary_bin}
                            </span>
                          </td>
                          <td className="p-2.5 text-emerald-400">{evt.inference_latency_ms}ms</td>
                          <td className="p-2.5">{evt.confidence_score}</td>
                          <td className="p-2.5">
                            {evt.user_flagged_error ? (
                              <span className="text-amber-400 font-bold">YES ({evt.user_suggested_bin})</span>
                            ) : (
                              <span className="text-slate-600">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic text-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
                No scan events recorded yet. Click the shutter button or select a sample item to generate telemetry data.
              </p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
