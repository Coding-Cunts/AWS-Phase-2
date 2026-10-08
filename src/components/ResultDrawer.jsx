import React, { useState } from 'react';
import {
  Recycle, Leaf, Trash2, AlertTriangle, RotateCcw,
  Sparkles, MapPin, ShieldAlert, PackageOpen,
  Eye, Layers, FileText, Zap, Table, Filter, MessageSquare
} from 'lucide-react';

// ── Category config ──────────────────────────────────────────────────────────
const CATEGORY_STYLES = {
  Recyclable: {
    color: '#10B981',
    bg: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.55)',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: <Recycle className="w-3.5 h-3.5" />,
    label: 'Blue Bin · Recycling',
    dot: 'bg-emerald-400',
  },
  Organic: {
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.55)',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: <Leaf className="w-3.5 h-3.5" />,
    label: 'Green Bin · Compost',
    dot: 'bg-amber-400',
  },
  Hazardous: {
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.15)',
    border: 'rgba(239,68,68,0.55)',
    badge: 'bg-red-500/20 text-red-300 border-red-500/40',
    icon: <ShieldAlert className="w-3.5 h-3.5" />,
    label: 'Hazmat Drop-Off',
    dot: 'bg-red-400',
  },
  'Non-Recyclable': {
    color: '#6B7280',
    bg: 'rgba(107,114,128,0.15)',
    border: 'rgba(107,114,128,0.55)',
    badge: 'bg-slate-600/30 text-slate-300 border-slate-500/40',
    icon: <Trash2 className="w-3.5 h-3.5" />,
    label: 'Gray Bin · Landfill',
    dot: 'bg-slate-400',
  },
};

const getCategoryStyle = (cat) =>
  CATEGORY_STYLES[cat] || CATEGORY_STYLES['Non-Recyclable'];

function deriveHazardLevel(items) {
  if (!items?.length) return { level: 'Low', cls: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
  const hasHazard = items.some(i => i.category === 'Hazardous');
  if (hasHazard) return { level: 'High', cls: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };
  const hasNonRecyclable = items.some(i => i.category === 'Non-Recyclable');
  if (hasNonRecyclable) return { level: 'Medium', cls: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
  return { level: 'Low', cls: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
}

function dominantCategory(items) {
  if (!items?.length) return null;
  const counts = {};
  items.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// ── Scene Image Panel with bbox overlays ─────────────────────────────────────
function SceneImagePanel({ imageUrl, detectedItems, hoveredIdx, onHoverItem }) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800"
      style={{ aspectRatio: '16/9' }}
    >
      <img
        src={imageUrl}
        alt="Captured scene"
        className="w-full h-full object-cover select-none"
        draggable={false}
      />

      {detectedItems.map((item, idx) => {
        const { ymin, xmin, ymax, xmax } = item.bbox;
        const style = getCategoryStyle(item.category);
        const isHovered = hoveredIdx === idx;

        return (
          <div
            key={idx}
            className="absolute animate-bbox-pop"
            style={{
              left: `${(xmin / 1000) * 100}%`,
              top: `${(ymin / 1000) * 100}%`,
              width: `${((xmax - xmin) / 1000) * 100}%`,
              height: `${((ymax - ymin) / 1000) * 100}%`,
              animationDelay: `${idx * 60}ms`,
              border: `2px solid ${style.color}`,
              borderRadius: 6,
              background: isHovered ? style.bg : 'transparent',
              boxShadow: isHovered
                ? `0 0 16px 2px ${style.color}55`
                : `0 0 6px 0 ${style.color}33`,
              transition: 'background 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              zIndex: isHovered ? 20 : 10,
            }}
            onMouseEnter={() => onHoverItem(idx)}
            onMouseLeave={() => onHoverItem(null)}
          >
            {/* Floating label */}
            <div
              className="absolute left-0 flex items-center gap-1 px-1.5 py-0.5 rounded-b-md text-[10px] font-bold whitespace-nowrap animate-badge-in"
              style={{
                top: '100%',
                background: style.color,
                color: '#0f172a',
                maxWidth: 160,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <span className="truncate">{item.item_name}</span>
            </div>

            {/* Corner index */}
            <div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
              style={{ background: style.color, color: '#0f172a' }}
            >
              {idx + 1}
            </div>
          </div>
        );
      })}

      {/* Count pill */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[11px] font-semibold text-slate-200">
        <Layers className="w-3 h-3 text-emerald-400" />
        {detectedItems.length} object{detectedItems.length !== 1 ? 's' : ''} detected
      </div>
    </div>
  );
}

// ── Stat Badge ───────────────────────────────────────────────────────────────
function StatBadge({ icon, label, value, valueCls = 'text-white' }) {
  return (
    <div className="flex-1 min-w-[80px] p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1">
      <div className="flex items-center gap-1 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`text-sm font-bold leading-tight ${valueCls}`}>{value}</span>
    </div>
  );
}

// ── Detection Card ───────────────────────────────────────────────────────────
function DetectionCard({ item, index, isHovered, onHover }) {
  const style = getCategoryStyle(item.category);

  return (
    <div
      className="relative p-3.5 rounded-2xl border cursor-pointer select-none"
      style={{
        background: isHovered ? style.bg : 'rgba(15,23,42,0.6)',
        borderColor: isHovered ? style.border : 'rgba(51,65,85,0.6)',
        boxShadow: isHovered ? `0 0 18px 0 ${style.color}30` : 'none',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        className="absolute -top-2 -left-2 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center"
        style={{ background: style.color, color: '#0f172a' }}
      >
        {index + 1}
      </div>

      <div className="flex items-start justify-between gap-2 mb-2.5">
        <p className="text-sm font-semibold text-slate-100 leading-tight flex-1">
          {item.item_name}
        </p>
        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.badge}`}>
          {style.icon}
          {item.category}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[11px] font-medium">
        <MapPin className="w-3 h-3 shrink-0" style={{ color: style.color }} />
        <span style={{ color: style.color }}>{style.label}</span>
      </div>

      <div className="mt-2 text-[9px] font-mono text-slate-600">
        bbox [{item.bbox.ymin}, {item.bbox.xmin}, {item.bbox.ymax}, {item.bbox.xmax}]
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ResultDrawer({
  scanResult,
  capturedImageUrl,
  onScanNext,
  onDispute,
  onOpenChat,
  isOpen,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [activeTab, setActiveTab] = useState('scene');
  const [tableFilter, setTableFilter] = useState('ALL');
  const [tableSort, setTableSort] = useState('default');

  if (!scanResult || !isOpen) return null;

  const { result, inference_latency_ms, source } = scanResult;
  const detectedItems = result?.detectedItems || [];
  const frontendReport = result?.frontendReport || 'Scene analyzed.';

  const hazard = deriveHazardLevel(detectedItems);
  const dominant = dominantCategory(detectedItems);
  const dominantStyle = dominant ? getCategoryStyle(dominant) : null;

  const TABS = [
    { id: 'scene',  label: 'Scene',  icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'table',  label: 'Table',  icon: <Table className="w-3.5 h-3.5" /> },
    { id: 'items',  label: 'Cards',  icon: <PackageOpen className="w-3.5 h-3.5" /> },
    { id: 'report', label: 'Report', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/65 backdrop-blur-sm animate-fade-in">
      <div className="flex-1" onClick={onScanNext} />

      <div
        className="w-full max-w-2xl mx-auto bg-slate-900 border-t border-slate-800 rounded-t-[28px] shadow-2xl flex flex-col max-h-[90vh] animate-slide-up overflow-hidden"
        style={{ boxShadow: '0 -12px 50px rgba(16,185,129,0.1), 0 0 0 1px rgba(255,255,255,0.04)' }}
      >
        {/* Drag handle */}
        <div className="w-full pt-2.5 pb-1 flex items-center justify-center cursor-pointer shrink-0" onClick={onScanNext}>
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-4 shrink-0">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight leading-none">Scene Analysis</h2>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {source === 'gemini_vision_ai' ? 'Gemini Vision AI' : 'Local Classifier'} · {inference_latency_ms}ms
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onOpenChat && (
                <button
                  onClick={onOpenChat}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title="Ask AI Assistant about this scene"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-purple-300" />
                  <span>Ask AI</span>
                </button>
              )}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${hazard.bg}`}>
                <ShieldAlert className={`w-3.5 h-3.5 ${hazard.cls}`} />
                <span className={hazard.cls}>Risk: {hazard.level}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <StatBadge icon={<Layers className="w-3 h-3" />} label="Detected" value={`${detectedItems.length} item${detectedItems.length !== 1 ? 's' : ''}`} />
            <StatBadge icon={<Zap className="w-3 h-3" />} label="Dominant" value={dominant || '—'} />
            <StatBadge icon={<ShieldAlert className="w-3 h-3" />} label="Hazard" value={hazard.level} valueCls={hazard.cls} />
          </div>
        </div>

        {/* Dual-View Mode Switcher Banner */}
        <div className="px-5 mb-2 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">View Mode</span>
          <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('scene')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'scene'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visual Scene</span>
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="px-5 shrink-0">
          <div className="flex gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'table' && detectedItems.length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {detectedItems.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">

          {/* SCENE TAB */}
          {activeTab === 'scene' && (
            <div className="space-y-3">
              {capturedImageUrl ? (
                <SceneImagePanel
                  imageUrl={capturedImageUrl}
                  detectedItems={detectedItems}
                  hoveredIdx={hoveredIdx}
                  onHoverItem={setHoveredIdx}
                />
              ) : (
                <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center py-16 text-slate-600 text-sm">
                  No image preview available
                </div>
              )}

              {detectedItems.some(i => i.category === 'Hazardous') && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-start gap-3">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-red-300 uppercase tracking-wide">Hazardous Material Detected</p>
                    <p className="text-xs text-red-200/80 mt-0.5 leading-relaxed">
                      Do not place in curbside bins. Deliver to a certified hazmat or e-waste drop-off facility.
                    </p>
                  </div>
                </div>
              )}

              {detectedItems.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(CATEGORY_STYLES).map(([cat, style]) => {
                    const count = detectedItems.filter(i => i.category === cat).length;
                    if (!count) return null;
                    return (
                      <div key={cat} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                        <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                        <span>{cat} ({count})</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TABLE TAB (DASHBOARD) */}
          {activeTab === 'table' && (() => {
            let filtered = detectedItems.filter(item => {
              if (tableFilter === 'ALL') return true;
              return item.category?.toLowerCase() === tableFilter.toLowerCase();
            });

            if (tableSort === 'name') {
              filtered = [...filtered].sort((a, b) => (a.item_name || '').localeCompare(b.item_name || ''));
            } else if (tableSort === 'hazard') {
              const priority = { Hazardous: 3, 'Non-Recyclable': 2, Organic: 1, Recyclable: 0 };
              filtered = [...filtered].sort((a, b) => (priority[b.category] || 0) - (priority[a.category] || 0));
            } else if (tableSort === 'confidence') {
              filtered = [...filtered].sort((a, b) => {
                const confA = a.confidence_score || 0.95;
                const confB = b.confidence_score || 0.95;
                return confB - confA;
              });
            }

            const categoryPills = [
              { id: 'ALL', label: 'All', count: detectedItems.length },
              { id: 'Recyclable', label: 'Recyclable', count: detectedItems.filter(i => i.category === 'Recyclable').length },
              { id: 'Organic', label: 'Organic', count: detectedItems.filter(i => i.category === 'Organic').length },
              { id: 'Hazardous', label: 'Hazardous', count: detectedItems.filter(i => i.category === 'Hazardous').length },
              { id: 'Non-Recyclable', label: 'Landfill', count: detectedItems.filter(i => i.category === 'Non-Recyclable').length },
            ];

            return (
              <div className="space-y-3 animate-fade-in">
                {/* Filter and Sort Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="flex flex-wrap items-center gap-1">
                    {categoryPills.map(pill => (
                      <button
                        key={pill.id}
                        onClick={() => setTableFilter(pill.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          tableFilter === pill.id
                            ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                        }`}
                      >
                        <span>{pill.label}</span>
                        <span className="font-mono text-[9px] opacity-75">({pill.count})</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <Filter className="w-3 h-3 text-slate-400" />
                    <select
                      value={tableSort}
                      onChange={(e) => setTableSort(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded-lg px-2 py-1 font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="default">Default Order</option>
                      <option value="name">Name (A-Z)</option>
                      <option value="hazard">Risk Priority</option>
                      <option value="confidence">Confidence Score</option>
                    </select>
                  </div>
                </div>

                {/* Professional Data Grid */}
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 shadow-xl max-h-[360px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                    <thead className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 text-[9px] font-mono uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-2.5 px-3 font-bold w-10">#</th>
                        <th className="py-2.5 px-3 font-bold">Item Name</th>
                        <th className="py-2.5 px-3 font-bold">Category</th>
                        <th className="py-2.5 px-3 font-bold">Bin Routing</th>
                        <th className="py-2.5 px-3 font-bold">Confidence / BBox</th>
                        <th className="py-2.5 px-3 font-bold">Action Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-500 text-xs">
                            No items match the selected category filter.
                          </td>
                        </tr>
                      ) : (
                        filtered.map((item, idx) => {
                          const origIdx = detectedItems.indexOf(item);
                          const activeIndex = origIdx !== -1 ? origIdx : idx;
                          const style = getCategoryStyle(item.category);
                          const isHovered = hoveredIdx === activeIndex;

                          let actionText = 'Sort into designated bin';
                          if (item.category === 'Hazardous' || item.is_hazard) {
                            actionText = 'Tape terminals & drop at hazmat depot';
                          } else if (item.prep_instructions && item.prep_instructions[0]) {
                            actionText = item.prep_instructions[0];
                          } else if (item.category === 'Recyclable') {
                            actionText = 'Rinse clean & empty all liquids';
                          } else if (item.category === 'Organic') {
                            actionText = 'Compost with food/organic stream';
                          } else if (item.category === 'Non-Recyclable') {
                            actionText = 'Direct to landfill stream';
                          }

                          const confPct = Math.round((item.confidence_score || 0.95) * 100);

                          return (
                            <tr
                              key={idx}
                              onMouseEnter={() => setHoveredIdx(activeIndex)}
                              onMouseLeave={() => setHoveredIdx(null)}
                              className={`transition-all duration-150 cursor-pointer ${
                                isHovered
                                  ? 'bg-slate-800/80 text-white'
                                  : 'hover:bg-slate-900/60 text-slate-200'
                              }`}
                            >
                              <td className="py-2.5 px-3 font-mono font-bold">
                                <span
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
                                  style={{ background: style.color, color: '#0f172a' }}
                                >
                                  {activeIndex + 1}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-white text-xs leading-tight">
                                  {item.item_name}
                                </div>
                                {item.material_subtype && (
                                  <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                                    {item.material_subtype} {item.resin_code ? `· ${item.resin_code}` : ''}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${style.badge}`}>
                                  <span className={`w-1 h-1 rounded-full ${style.dot}`}></span>
                                  {item.category}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: style.color }}>
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span>{style.label}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[9px] whitespace-nowrap">
                                <div className="text-emerald-400 font-bold">{confPct}% Confidence</div>
                                {item.bbox && (
                                  <div className="text-slate-500 text-[8px] mt-0.5">
                                    [{item.bbox.ymin}, {item.bbox.xmin}, {item.bbox.ymax}, {item.bbox.xmax}]
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-xs">
                                <span
                                  className="inline-block px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-medium max-w-[170px] truncate"
                                  title={actionText}
                                >
                                  {actionText}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* ITEMS TAB */}
          {activeTab === 'items' && (
            detectedItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">No waste items detected in this scene.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {detectedItems.map((item, idx) => (
                  <DetectionCard
                    key={idx}
                    item={item}
                    index={idx}
                    isHovered={hoveredIdx === idx}
                    onHover={setHoveredIdx}
                  />
                ))}
              </div>
            )
          )}

          {/* REPORT TAB */}
          {activeTab === 'report' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  Operational Summary
                </div>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{frontendReport}</p>
              </div>

              {detectedItems.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Composition Breakdown</p>
                  <div className="space-y-2.5">
                    {Object.entries(CATEGORY_STYLES).map(([cat, style]) => {
                      const count = detectedItems.filter(i => i.category === cat).length;
                      const pct = Math.round((count / detectedItems.length) * 100);
                      if (!count) return null;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                              <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                              {cat}
                            </span>
                            <span className="text-slate-500 font-mono">{count} · {pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: style.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-950/60 border-t border-slate-800 space-y-2 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={onScanNext}
              className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm transition-all shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Scan Another Scene
            </button>
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="px-4 py-3.5 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                title="Ask AI Assistant about this scene"
              >
                <MessageSquare className="w-4 h-4 text-purple-300" />
                <span>Ask AI</span>
              </button>
            )}
          </div>
          <div className="text-center">
            <button
              onClick={() => onDispute(scanResult)}
              className="text-xs text-slate-500 hover:text-slate-300 underline decoration-slate-700 transition-colors py-1 cursor-pointer"
            >
              Incorrect detection? Report feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
