'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  KeyIcon,
  CopyIcon,
  CheckIcon,
  RefreshCwIcon,
  Trash2Icon,
  PlayIcon,
  TerminalIcon,
  AlertTriangleIcon,
  EyeIcon,
  EyeOffIcon,
  UploadCloudIcon,
  SparklesIcon,
  CpuIcon,
  ZapIcon,
  CheckCircleIcon,
} from './Icons';

interface ApiKeyItem {
  id: string;
  key: string;
  label: string;
  createdAt: string;
  requestCount: number;
  status: 'active' | 'revoked';
  lastUsedAt?: string;
}

interface DetectionBox {
  id?: string;
  name?: string;
  category?: string;
  confidence?: number;
  box?: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  bounding_box?: { ymin: number; xmin: number; ymax: number; xmax: number };
  disposal_bin?: string;
  recyclable?: boolean;
  weight_est?: string;
  advice?: string;
}

interface PlaygroundResult {
  status: string;
  status_code: number;
  latency_ms: number;
  timestamp: string;
  audit_hash: string;
  key_id?: string;
  client_label?: string;
  engine?: string;
  detections_count: number;
  detections: DetectionBox[];
  compositions?: Array<{
    category: string;
    displayName?: string;
    percentage: number;
    weightEst?: string;
    isRecyclable?: boolean;
    color?: string;
    disposalBin?: string;
  }>;
  operational_report?: {
    recyclability_score?: number;
    total_estimated_weight?: string;
    carbon_offset_kg?: string;
    robot_pick_recommendations?: string[];
  };
  error?: string;
  message?: string;
}

const PRESET_WASTE_SAMPLES = [
  {
    id: 'sample-mixed',
    name: 'Sample 01: Mixed Municipal Waste',
    desc: 'Clear PET bottle, corrugated flap & aluminum can',
    url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1000&q=80',
    type: 'Household Mixed',
  },
  {
    id: 'sample-corrugate',
    name: 'Sample 02: Industrial Corrugate & Film',
    desc: 'Heavy Spec-11 kraft corrugate, air bubble film & tape',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1000&q=80',
    type: 'E-Commerce Packaging',
  },
  {
    id: 'sample-beverage',
    name: 'Sample 03: High-Grade Rigid Beverage',
    desc: 'Crushed aluminum UBC cans, HDPE jugs & glass cullet',
    url: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=1000&q=80',
    type: 'Beverage & Can UBC',
  },
];

const CATEGORY_COLORS: Record<string, { stroke: string; bg: string; text: string }> = {
  'pet-polymers': { stroke: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8' },
  'cardboard': { stroke: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24' },
  'metal': { stroke: '#e2e8f0', bg: 'rgba(226, 232, 240, 0.15)', text: '#e2e8f0' },
  'fiber': { stroke: '#fde047', bg: 'rgba(253, 224, 71, 0.15)', text: '#fde047' },
  'glass': { stroke: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', text: '#c084fc' },
  'biodegradable': { stroke: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' },
  'polythene': { stroke: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.15)', text: '#2dd4bf' },
  'hazard': { stroke: '#f43f5e', bg: 'rgba(244, 63, 94, 0.2)', text: '#f43f5e' },
  'non-metal': { stroke: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)', text: '#a78bfa' },
  'non-biodegradable': { stroke: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8' },
};

function getCategoryColor(category: string = '') {
  const norm = category.toLowerCase();
  return (
    CATEGORY_COLORS[norm] || {
      stroke: '#d4af37',
      bg: 'rgba(212, 175, 55, 0.15)',
      text: '#d4af37',
    }
  );
}

export default function DeveloperApiHub() {
  // Navigation tabs within Developer Hub
  const [activeHubView, setActiveHubView] = useState<'both' | 'keys' | 'playground'>('both');

  // API Key Management state
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [justCreatedKey, setJustCreatedKey] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [activeSnippetTab, setActiveSnippetTab] = useState<'curl' | 'python' | 'node'>('curl');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Playground state
  const [playgroundKey, setPlaygroundKey] = useState('');
  const [imageMode, setImageMode] = useState<'preset' | 'upload' | 'camera'>('preset');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<PlaygroundResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [responseStats, setResponseStats] = useState<{ status: number; latency: number } | null>(null);
  const [playgroundViewMode, setPlaygroundViewMode] = useState<'split' | 'visual' | 'json'>('split');
  const [hoveredDetId, setHoveredDetId] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Optical camera and file upload refs inside Playground
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Fetch registered API keys
  const fetchKeys = useCallback(async () => {
    setIsLoadingKeys(true);
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      if (data.success && Array.isArray(data.keys)) {
        setKeys(data.keys);
        // Pre-populate playground with the first active key if empty
        if (!playgroundKey) {
          const activeFirst = data.keys.find((k: ApiKeyItem) => k.status === 'active');
          if (activeFirst) {
            setPlaygroundKey(activeFirst.key);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch keys:', err);
    } finally {
      setIsLoadingKeys(false);
    }
  }, [playgroundKey]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  // Key creation handler
  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch('/api/keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newKeyLabel.trim() || 'Custom Robotics Key' }),
      });
      const data = await res.json();
      if (data.success && (data.apiKey || data.key)) {
        const created = data.apiKey || data.key;
        const keyString = typeof created === 'string' ? created : created.key;
        setJustCreatedKey(keyString);
        setNewKeyLabel('');
        // Automatically put this new key in the playground
        setPlaygroundKey(keyString);
        await fetchKeys();
      }
    } catch (err) {
      console.error('Failed to generate key:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Revoke key handler
  const handleRevokeKey = async (keyItem: ApiKeyItem) => {
    if (!confirm(`Are you sure you want to revoke key "${keyItem.label}"? External requests will be denied with 401 Unauthorized.`)) {
      return;
    }
    try {
      const res = await fetch('/api/keys/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId: keyItem.id, action: 'revoke' }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchKeys();
      }
    } catch (err) {
      console.error('Failed to revoke key:', err);
    }
  };

  // Toggle key masking
  const toggleKeyMask = (id: string) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy key to clipboard
  const handleCopyKey = (keyString: string, id: string) => {
    navigator.clipboard.writeText(keyString);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCustomImagePreview(result);
      setCustomImageBase64(result.includes(',') ? result.split(',')[1] : result);
      setImageMode('upload');
    };
    reader.readAsDataURL(file);
  };

  // Start webcam for playground
  const handleStartCamera = async () => {
    setImageMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Unable to access camera. Please check permissions or upload a photo.');
      setImageMode('preset');
    }
  };

  // Capture frame from webcam
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCustomImagePreview(dataUrl);
      setCustomImageBase64(dataUrl.split(',')[1]);
      stopCamera();
      setImageMode('upload');
    }
  };

  // Execute API Request to /api/v1/classify-external
  const handleExecuteApiRequest = async () => {
    setIsExecuting(true);
    setExecutionError(null);
    setExecutionResult(null);
    setResponseStats(null);

    const startTime = performance.now();

    try {
      let imagePayload = '';
      if (imageMode === 'preset') {
        imagePayload = PRESET_WASTE_SAMPLES[selectedPresetIndex].url;
      } else if (customImageBase64) {
        imagePayload = customImageBase64;
      } else if (customImagePreview) {
        imagePayload = customImagePreview;
      }

      if (!imagePayload) {
        throw new Error('Please select a sample waste image or upload a file first.');
      }

      const res = await fetch('/api/v1/classify-external', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': playgroundKey.trim(),
        },
        body: JSON.stringify({
          image: imagePayload,
          stream_id: 'playground_verifier',
          facility_id: 'eval_bench_01',
        }),
      });

      const elapsed = Math.round(performance.now() - startTime);
      const data = await res.json().catch(() => ({ error: 'Invalid JSON response from server' }));

      setResponseStats({
        status: res.status,
        latency: data.latency_ms || elapsed,
      });

      if (!res.ok) {
        setExecutionError(data.error || data.message || `HTTP ${res.status} Unauthorized`);
        setExecutionResult(data);
      } else {
        setExecutionResult(data);
        // Refresh key list so request counter updates!
        fetchKeys();
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - startTime);
      setResponseStats({
        status: 500,
        latency: elapsed,
      });
      setExecutionError(err.message || 'Network error communicating with classification proxy');
    } finally {
      setIsExecuting(false);
    }
  };

  // Active image url for display in results
  const currentDisplayedImageUrl =
    imageMode === 'preset'
      ? PRESET_WASTE_SAMPLES[selectedPresetIndex].url
      : customImagePreview || PRESET_WASTE_SAMPLES[0].url;

  // Mask string helper
  const maskKey = (k: string) => {
    if (!k || k.length < 12) return '••••••••••••';
    const prefix = k.slice(0, 6);
    const suffix = k.slice(-4);
    return `${prefix}••••••••••••${suffix}`;
  };

  // Dynamic code snippet generator
  const activeKeyForSnippet = playgroundKey || keys.find((k) => k.status === 'active')?.key || 'terra_YOUR_API_KEY_HERE';

  const snippets = {
    curl: `curl -X POST http://localhost:3001/api/v1/classify-external \\
  -H "x-api-key: ${activeKeyForSnippet}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "image": "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1000&q=80",
    "stream_id": "conveyor_belt_04"
  }'`,
    python: `import requests

url = "http://localhost:3001/api/v1/classify-external"
headers = {
    "x-api-key": "${activeKeyForSnippet}",
    "Content-Type": "application/json"
}
payload = {
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "stream_id": "delta_robot_infeed"
}

response = requests.post(url, json=payload, headers=headers)
print("Classification Status:", response.status_code)
print("Detections:", response.json().get("detections"))`,
    node: `const axios = require('axios');

async function classifyWaste(base64Image) {
  const response = await axios.post(
    'http://localhost:3001/api/v1/classify-external',
    {
      image: base64Image,
      stream_id: 'optical_sorting_cell_01'
    },
    {
      headers: {
        'x-api-key': '${activeKeyForSnippet}',
        'Content-Type': 'application/json'
      }
    }
  );

  console.log('Detected items:', response.data.detections);
  return response.data;
}`,
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(snippets[activeSnippetTab]);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const copyRawJson = () => {
    if (!executionResult) return;
    navigator.clipboard.writeText(JSON.stringify(executionResult, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <section
      id="developer-hub"
      className="relative min-h-screen py-24 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08]"
    >
      {/* Background glow effects */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Editorial Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-white/[0.08]">
        <div className="lg:col-span-8">
          <div className="flex items-center gap-3 text-xs font-mono text-[#d4af37] tracking-[0.22em] uppercase mb-4">
            <CpuIcon size={14} className="text-[#d4af37]" />
            <span>Scene 04 // External Proxy Architecture</span>
            <span className="text-white/30">/</span>
            <span className="text-white/50">Developer & Robotics API Hub</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.08]">
            Automated vision proxy <br />
            <span className="italic font-normal text-white/90">for third-party robotics & PLCs.</span>
          </h2>

          <p className="mt-5 text-base text-white/60 max-w-2xl font-light leading-relaxed">
            Issue cryptographically hashed <code className="text-[#d4af37] font-mono font-semibold">terra_...</code> client keys to third-party Delta robot sorting cells, edge cameras, and municipal partners.
            Our protected proxy endpoint validates access, isolates your backend Google Gemini key, and injects zero-shot waste taxonomy prompts.
          </p>
        </div>

        {/* Status Callout Pill & View Mode Switcher */}
        <div className="lg:col-span-4 flex flex-col justify-between items-start lg:items-end gap-6 font-mono">
          <div className="border border-white/10 bg-[#070b12] p-4 w-full sm:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-white/50 uppercase text-[10px] tracking-wider">Gateway Status:</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE · PROXY v1
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-white/50 uppercase text-[10px] tracking-wider">Auth Middleware:</span>
              <span className="text-white/80 text-[11px]">x-api-key Verified</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-white/50 uppercase text-[10px] tracking-wider">Underlying Vision:</span>
              <span className="text-[#d4af37] text-[11px]">Gemini 3.8 Flash (Protected)</span>
            </div>
          </div>

          {/* Hub View Switcher */}
          <div className="flex items-center border border-white/15 bg-[#060a12] p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveHubView('both')}
              className={`px-3 py-1.5 transition-all ${
                activeHubView === 'both'
                  ? 'bg-white/10 text-white font-semibold shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => setActiveHubView('keys')}
              className={`px-3 py-1.5 transition-all ${
                activeHubView === 'keys'
                  ? 'bg-white/10 text-[#d4af37] font-semibold shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Key Manager
            </button>
            <button
              type="button"
              onClick={() => setActiveHubView('playground')}
              className={`px-3 py-1.5 transition-all ${
                activeHubView === 'playground'
                  ? 'bg-white/10 text-emerald-400 font-semibold shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Testing Playground
            </button>
          </div>
        </div>
      </div>

      {/* Just Generated Key Banner */}
      {justCreatedKey && (
        <div className="mt-8 border border-[#d4af37]/60 bg-[#d4af37]/10 p-5 font-mono text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#d4af37] font-semibold text-sm">
              <SparklesIcon size={16} />
              <span>NEW API KEY GENERATED SUCCESSFULLY</span>
            </div>
            <p className="text-white/70 text-xs font-sans">
              Copy this key now. It has been saved to your local storage and automatically loaded into the Interactive Playground below.
            </p>
            <div className="flex items-center gap-2 pt-1 font-mono text-[#d4af37] bg-black/50 px-3 py-1.5 border border-[#d4af37]/30 select-all break-all">
              <span>{justCreatedKey}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopyKey(justCreatedKey, 'just_created')}
              className="px-3.5 py-2 border border-[#d4af37] bg-[#d4af37] text-black hover:bg-white hover:border-white font-semibold transition-colors flex items-center gap-1.5 text-xs"
            >
              {copiedKeyId === 'just_created' ? (
                <>
                  <CheckIcon size={14} />
                  <span>COPIED!</span>
                </>
              ) : (
                <>
                  <CopyIcon size={14} />
                  <span>COPY KEY</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setPlaygroundKey(justCreatedKey);
                setActiveHubView('playground');
                const playgroundEl = document.getElementById('api-playground-section');
                if (playgroundEl) playgroundEl.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-2 border border-white/20 hover:border-white text-white/80 hover:text-white transition-colors flex items-center gap-1.5 text-xs"
            >
              <span>TEST IN PLAYGROUND →</span>
            </button>
          </div>
        </div>
      )}

      {/* TWO-PANEL INTERACTION WORKSPACE */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* =========================================================================
            PANEL A: API KEY MANAGEMENT
           ========================================================================= */}
        {(activeHubView === 'both' || activeHubView === 'keys') && (
          <div className={`${activeHubView === 'both' ? 'lg:col-span-6' : 'lg:col-span-12'} flex flex-col gap-6`}>
            
            {/* Panel A Container */}
            <div className="border border-white/[0.08] bg-[#05080e] p-6 sm:p-8 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-none border border-[#d4af37]/40 bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                      <KeyIcon size={16} />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl text-white font-light">API Key Manager</h3>
                      <p className="text-[11px] font-mono text-white/50">Local File-backed Store · <code>data/api_keys.json</code></p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={fetchKeys}
                    disabled={isLoadingKeys}
                    className="p-2 border border-white/10 hover:border-white/30 text-white/60 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-mono"
                    title="Reload keys"
                  >
                    <RefreshCwIcon size={13} className={isLoadingKeys ? 'animate-spin' : ''} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>

                {/* Key Generation Form */}
                <form onSubmit={handleGenerateKey} className="mb-6 space-y-3 font-mono">
                  <label htmlFor="key-label-input" className="block text-[11px] uppercase tracking-wider text-white/60">
                    Create New Developer / Robotics Key
                  </label>

                  <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                    <input
                      id="key-label-input"
                      type="text"
                      value={newKeyLabel}
                      onChange={(e) => setNewKeyLabel(e.target.value)}
                      placeholder="e.g. FANUC Delta Sorter #02 or Jetson Orin Edge"
                      className="flex-1 bg-[#090e17] border border-white/15 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] transition-colors"
                    />

                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="px-5 py-2.5 bg-[#d4af37] text-black hover:bg-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCwIcon size={14} className="animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <SparklesIcon size={14} />
                          <span>Generate Key</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-white/40 font-sans">
                    Keys are generated via cryptographically secure 192-bit hex bytes with a <code className="text-[#d4af37]">terra_</code> prefix.
                  </p>
                </form>

                {/* Active Keys Table */}
                <div className="space-y-3 font-mono">
                  <div className="flex items-center justify-between text-[11px] text-white/50 uppercase tracking-wider">
                    <span>Active Key Registry ({keys.length})</span>
                    <span className="text-[10px]">Usage Count</span>
                  </div>

                  {isLoadingKeys && keys.length === 0 ? (
                    <div className="py-12 border border-white/[0.06] text-center text-white/40 text-xs">
                      Loading key store...
                    </div>
                  ) : keys.length === 0 ? (
                    <div className="py-12 border border-dashed border-white/15 text-center text-white/40 text-xs">
                      No active API keys found. Generate your first key above.
                    </div>
                  ) : (
                    <div className="border border-white/[0.08] divide-y divide-white/[0.06] bg-[#070b13] overflow-x-auto">
                      {keys.map((k) => {
                        const isRevealed = !!revealedKeys[k.id];
                        const isSelectedInPlayground = playgroundKey === k.key;

                        return (
                          <div
                            key={k.id}
                            className={`p-3.5 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                              isSelectedInPlayground ? 'bg-[#d4af37]/5 border-l-2 border-[#d4af37]' : 'hover:bg-white/[0.02]'
                            }`}
                          >
                            {/* Key info */}
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white truncate max-w-[200px]">
                                  {k.label}
                                </span>

                                <span
                                  className={`text-[9px] px-1.5 py-0.5 uppercase tracking-wider ${
                                    k.status === 'active'
                                      ? 'border border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                                      : 'border border-rose-500/40 text-rose-400 bg-rose-500/10'
                                  }`}
                                >
                                  {k.status}
                                </span>

                                {isSelectedInPlayground && (
                                  <span className="text-[9px] px-1.5 py-0.5 border border-[#d4af37]/40 text-[#d4af37] bg-[#d4af37]/10 uppercase tracking-wider">
                                    LOADED IN PLAYGROUND
                                  </span>
                                )}
                              </div>

                              {/* Key String (Masked/Unmasked) */}
                              <div className="flex items-center gap-2 text-white/70 font-mono text-[11px]">
                                <span className="truncate max-w-[240px] sm:max-w-[320px]">
                                  {isRevealed ? k.key : maskKey(k.key)}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => toggleKeyMask(k.id)}
                                  className="text-white/40 hover:text-white transition-colors"
                                  title={isRevealed ? 'Mask key' : 'Reveal key'}
                                >
                                  {isRevealed ? <EyeOffIcon size={13} /> : <EyeIcon size={13} />}
                                </button>
                              </div>

                              <div className="text-[10px] text-white/40 flex items-center gap-3 pt-0.5">
                                <span>Created: {new Date(k.createdAt).toLocaleDateString()}</span>
                                {k.lastUsedAt && (
                                  <span>· Last used: {new Date(k.lastUsedAt).toLocaleTimeString()}</span>
                                )}
                              </div>
                            </div>

                            {/* Actions & Metrics */}
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {/* Request badge */}
                              <div
                                className="px-2 py-1 bg-white/[0.04] border border-white/10 text-[10px] text-white/70 flex items-center gap-1.5"
                                title="Total successful requests with this key"
                              >
                                <ZapIcon size={11} className="text-[#d4af37]" />
                                <span>{k.requestCount} reqs</span>
                              </div>

                              {/* Copy button */}
                              <button
                                type="button"
                                onClick={() => handleCopyKey(k.key, k.id)}
                                className="p-1.5 border border-white/10 hover:border-white text-white/70 hover:text-white transition-colors"
                                title="Copy API Key"
                              >
                                {copiedKeyId === k.id ? (
                                  <CheckIcon size={13} className="text-emerald-400" />
                                ) : (
                                  <CopyIcon size={13} />
                                )}
                              </button>

                              {/* Use in Playground */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPlaygroundKey(k.key);
                                  const playgroundEl = document.getElementById('api-playground-section');
                                  if (playgroundEl) playgroundEl.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-2 py-1 border border-white/10 hover:border-[#d4af37] text-white/60 hover:text-[#d4af37] transition-colors text-[10px]"
                                title="Set as active key in Testing Playground"
                              >
                                Test
                              </button>

                              {/* Revoke button */}
                              {k.status === 'active' && (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeKey(k)}
                                  className="p-1.5 border border-white/10 hover:border-rose-500/50 hover:bg-rose-500/10 text-white/40 hover:text-rose-400 transition-colors"
                                  title="Revoke API key"
                                >
                                  <Trash2Icon size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* cURL & Code Snippet Box */}
              <div className="mt-8 pt-6 border-t border-white/[0.08] font-mono">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TerminalIcon size={14} className="text-[#d4af37]" />
                    <span className="text-xs uppercase tracking-wider text-white/80 font-semibold">
                      Client Integration Snippets
                    </span>
                  </div>

                  {/* Snippet tab selector */}
                  <div className="flex items-center gap-1 border border-white/10 bg-[#080c14] p-0.5 text-[10px]">
                    {(['curl', 'python', 'node'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveSnippetTab(tab)}
                        className={`px-2 py-0.5 uppercase ${
                          activeSnippetTab === tab
                            ? 'bg-[#d4af37] text-black font-semibold'
                            : 'text-white/50 hover:text-white'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Code block */}
                <div className="relative border border-white/10 bg-[#04060a] p-4 text-[11px] text-white/80 overflow-x-auto leading-relaxed group">
                  <pre className="font-mono text-emerald-400/90 whitespace-pre">
                    {snippets[activeSnippetTab]}
                  </pre>

                  <button
                    type="button"
                    onClick={copySnippet}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-[#090f1a] border border-white/20 hover:border-white text-white/80 hover:text-white text-[10px] transition-colors flex items-center gap-1.5 shadow-md"
                  >
                    {copiedSnippet ? (
                      <>
                        <CheckIcon size={12} className="text-emerald-400" />
                        <span>COPIED</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon size={12} />
                        <span>COPY {activeSnippetTab.toUpperCase()}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PANEL B: INTERACTIVE API KEY TESTING PLAYGROUND
           ========================================================================= */}
        {(activeHubView === 'both' || activeHubView === 'playground') && (
          <div
            id="api-playground-section"
            className={`${activeHubView === 'both' ? 'lg:col-span-6' : 'lg:col-span-12'} flex flex-col gap-6`}
          >
            {/* Panel B Container */}
            <div className="border border-white/[0.08] bg-[#05080e] p-6 sm:p-8 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-none border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <PlayIcon size={16} />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl text-white font-light">Interactive API Playground</h3>
                      <p className="text-[11px] font-mono text-white/50">For Judges & Developers · Live End-to-End Verification</p>
                    </div>
                  </div>

                  {responseStats && (
                    <div
                      className={`px-2.5 py-1 border text-xs font-mono font-semibold flex items-center gap-2 ${
                        responseStats.status === 200
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                          : 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          responseStats.status === 200 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                        }`}
                      />
                      <span>
                        {responseStats.status} {responseStats.status === 200 ? 'OK' : 'DENIED'} · {responseStats.latency}ms
                      </span>
                    </div>
                  )}
                </div>

                {/* API Key Input */}
                <div className="mb-6 font-mono space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="playground-key-input" className="text-[11px] uppercase tracking-wider text-white/60">
                      x-api-key Header
                    </label>

                    {keys.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const active = keys.find((k) => k.status === 'active');
                          if (active) setPlaygroundKey(active.key);
                        }}
                        className="text-[10px] text-[#d4af37] hover:underline"
                      >
                        Auto-Fill Active Key
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      id="playground-key-input"
                      type="text"
                      value={playgroundKey}
                      onChange={(e) => setPlaygroundKey(e.target.value)}
                      placeholder="Enter terra_... or leave empty to test 401 Unauthorized handling"
                      className="w-full bg-[#090e17] border border-white/15 px-3.5 py-2.5 text-xs text-white placeholder-white/30 font-mono focus:outline-none focus:border-emerald-400 transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/40 pointer-events-none">
                      {playgroundKey.startsWith('terra_') ? (
                        <span className="text-emerald-400">FORMAT VALID</span>
                      ) : (
                        <span>PRE-AUTH</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Waste Image Payload Selector */}
                <div className="mb-6 space-y-3 font-mono">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-white/60">
                    <span>Target Waste Feed Source</span>

                    {/* Mode buttons */}
                    <div className="flex items-center gap-1 border border-white/10 bg-[#080d16] p-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setImageMode('preset');
                          stopCamera();
                        }}
                        className={`px-2 py-0.5 ${
                          imageMode === 'preset' ? 'bg-white/15 text-white font-semibold' : 'text-white/50'
                        }`}
                      >
                        Presets
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageMode('upload');
                          stopCamera();
                          fileInputRef.current?.click();
                        }}
                        className={`px-2 py-0.5 ${
                          imageMode === 'upload' ? 'bg-white/15 text-white font-semibold' : 'text-white/50'
                        }`}
                      >
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={handleStartCamera}
                        className={`px-2 py-0.5 ${
                          imageMode === 'camera' ? 'bg-white/15 text-white font-semibold' : 'text-white/50'
                        }`}
                      >
                        Camera
                      </button>
                    </div>
                  </div>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Preset Selector Grid */}
                  {imageMode === 'preset' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {PRESET_WASTE_SAMPLES.map((sample, idx) => (
                        <button
                          key={sample.id}
                          type="button"
                          onClick={() => setSelectedPresetIndex(idx)}
                          className={`p-2.5 border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                            selectedPresetIndex === idx
                              ? 'border-[#d4af37] bg-[#d4af37]/10'
                              : 'border-white/10 hover:border-white/30 bg-[#080d15]'
                          }`}
                        >
                          <div className="aspect-video w-full mb-2 overflow-hidden bg-black/40 border border-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={sample.url}
                              alt={sample.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold text-white truncate">
                              {sample.name}
                            </div>
                            <div className="text-[10px] text-white/50 truncate font-sans">
                              {sample.type}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Upload State */}
                  {imageMode === 'upload' && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-white/20 hover:border-white/40 p-6 text-center cursor-pointer bg-[#080d15] transition-colors"
                    >
                      {customImagePreview ? (
                        <div className="space-y-2">
                          <div className="max-h-48 mx-auto overflow-hidden border border-white/15 inline-block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={customImagePreview}
                              alt="Custom waste"
                              className="max-h-48 object-contain"
                            />
                          </div>
                          <div className="text-[11px] text-emerald-400">
                            ✓ Custom waste image loaded. Click to replace.
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 text-white/50">
                          <UploadCloudIcon size={24} className="mx-auto text-white/40" />
                          <div className="text-xs">Click to browse or drop sample image</div>
                          <div className="text-[10px] text-white/30 font-sans">PNG, JPG, WEBP up to 10MB</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Live Camera Viewfinder in Playground */}
                  {imageMode === 'camera' && (
                    <div className="relative border border-emerald-500/30 bg-black aspect-video overflow-hidden flex flex-col items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-48 border border-emerald-400/50 rounded-none relative">
                          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
                          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
                        </div>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between font-mono text-[10px]">
                        <span className="bg-black/70 px-2 py-1 text-emerald-400 border border-emerald-500/30">
                          OPTICAL FEED ACTIVE
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCaptureSnapshot}
                            className="px-3 py-1.5 bg-emerald-500 text-black font-semibold hover:bg-white transition-colors"
                          >
                            SNAP FRAME
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-2.5 py-1.5 bg-black/80 border border-white/20 text-white hover:text-rose-400 transition-colors"
                          >
                            CANCEL
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Execute Button */}
                <button
                  type="button"
                  onClick={handleExecuteApiRequest}
                  disabled={isExecuting}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                >
                  {isExecuting ? (
                    <>
                      <RefreshCwIcon size={14} className="animate-spin" />
                      <span>Transmitting Payload to Vision Proxy...</span>
                    </>
                  ) : (
                    <>
                      <PlayIcon size={14} />
                      <span>Execute API Request (POST /api/v1/classify-external)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Execution Error Banner */}
              {executionError && (
                <div className="mt-6 border border-rose-500/50 bg-rose-500/10 p-4 font-mono text-xs text-rose-300 space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangleIcon size={14} className="text-rose-400" />
                    <span>API PROXY REJECTION ({responseStats?.status || 401})</span>
                  </div>
                  <p className="text-[11px] text-white/70 font-sans">
                    {executionError}
                  </p>
                </div>
              )}

              {/* =========================================================================
                  PLAYGROUND RESULTS DISPLAY: Bounding Box Reticles & Raw JSON Viewer
                 ========================================================================= */}
              {executionResult && (
                <div className="mt-8 pt-6 border-t border-white/[0.08] font-mono space-y-4">
                  {/* Results Subheader */}
                  {(() => {
                    const detectionsList =
                      executionResult.detections || (executionResult as any).detected_items || [];
                    const detectionsCount =
                      executionResult.detections_count ??
                      (executionResult as any).detected_items_count ??
                      detectionsList.length;

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white font-semibold">
                            <CheckCircleIcon size={14} className="text-emerald-400" />
                            <span>Telemetry Response</span>
                            <span className="text-white/40 text-[10px]">
                              ({detectionsCount} Detections)
                            </span>
                          </div>

                          {/* View mode toggle */}
                          <div className="flex items-center gap-1 border border-white/10 bg-[#080d16] p-0.5 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setPlaygroundViewMode('split')}
                              className={`px-2 py-0.5 ${
                                playgroundViewMode === 'split' ? 'bg-white/15 text-white font-semibold' : 'text-white/50'
                              }`}
                            >
                              Visual + JSON
                            </button>
                            <button
                              type="button"
                              onClick={() => setPlaygroundViewMode('visual')}
                              className={`px-2 py-0.5 ${
                                playgroundViewMode === 'visual' ? 'bg-white/15 text-white font-semibold' : 'text-white/50'
                              }`}
                            >
                              Visual Only
                            </button>
                            <button
                              type="button"
                              onClick={() => setPlaygroundViewMode('json')}
                              className={`px-2 py-0.5 ${
                                playgroundViewMode === 'json' ? 'bg-white/15 text-white font-semibold' : 'text-white/50'
                              }`}
                            >
                              Raw JSON
                            </button>
                          </div>
                        </div>

                        {/* Visual Reticle Preview Canvas */}
                        {(playgroundViewMode === 'split' || playgroundViewMode === 'visual') && (
                          <div className="space-y-3">
                            <div className="relative border border-white/15 bg-black overflow-hidden group select-none">
                              {/* Base Image */}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={currentDisplayedImageUrl}
                                alt="Analyzed waste pile"
                                className="w-full object-cover aspect-[16/10] block"
                              />

                              {/* Bounding Box Overlays */}
                              {detectionsList.map((det: any, i: number) => {
                            // Extract coordinates: [ymin, xmin, ymax, xmax] in percentages (0-100)
                            const box =
                              det.box ||
                              (det.bounding_box
                                ? [
                                    det.bounding_box.ymin,
                                    det.bounding_box.xmin,
                                    det.bounding_box.ymax,
                                    det.bounding_box.xmax,
                                  ]
                                : [20 + i * 15, 20 + i * 15, 50 + i * 15, 60 + i * 15]);

                            const [ymin, xmin, ymax, xmax] = box;
                            const top = Math.max(0, Math.min(100, ymin));
                            const left = Math.max(0, Math.min(100, xmin));
                            const height = Math.max(5, Math.min(100 - top, ymax - ymin));
                            const width = Math.max(5, Math.min(100 - left, xmax - xmin));

                            const colorMeta = getCategoryColor(det.category);
                            const isHovered = hoveredDetId === (det.id || `det-${i}`);

                            return (
                              <div
                                key={det.id || i}
                                onMouseEnter={() => setHoveredDetId(det.id || `det-${i}`)}
                                onMouseLeave={() => setHoveredDetId(null)}
                                style={{
                                  top: `${top}%`,
                                  left: `${left}%`,
                                  width: `${width}%`,
                                  height: `${height}%`,
                                  borderColor: colorMeta.stroke,
                                  backgroundColor: isHovered ? colorMeta.bg : 'transparent',
                                }}
                                className={`absolute border-2 transition-all cursor-pointer ${
                                  isHovered ? 'shadow-lg z-20 scale-[1.01]' : 'z-10 opacity-90'
                                }`}
                              >
                                {/* Corner crosshairs */}
                                <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white" />
                                <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white" />
                                <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white" />
                                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white" />

                                {/* Reticle Pill */}
                                <div
                                  style={{ backgroundColor: colorMeta.stroke }}
                                  className="absolute -top-6 left-0 text-black text-[9px] font-bold px-1.5 py-0.5 whitespace-nowrap shadow-md flex items-center gap-1"
                                >
                                  <span>{det.name || det.category}</span>
                                  {det.confidence && (
                                    <span className="bg-black/20 px-1 py-0.2 rounded-sm text-[8px]">
                                      {Math.round(det.confidence * 100)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                        {/* Watermark overlay */}
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 border border-white/20 text-[9px] text-white/70">
                          ENGINE: {executionResult.engine || 'GEMINI-3.8-FLASH'} · LATENCY: {executionResult.latency_ms}ms
                        </div>
                      </div>

                      {/* Detected Items Pill List */}
                      {detectionsList.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          {detectionsList.map((det: any, i: number) => {
                            const isHovered = hoveredDetId === (det.id || `det-${i}`);
                            const colorMeta = getCategoryColor(det.category);

                            return (
                              <div
                                key={det.id || i}
                                onMouseEnter={() => setHoveredDetId(det.id || `det-${i}`)}
                                onMouseLeave={() => setHoveredDetId(null)}
                                className={`border p-2.5 transition-colors flex items-start justify-between gap-2 ${
                                  isHovered
                                    ? 'border-white bg-white/[0.05]'
                                    : 'border-white/10 bg-[#070b13]'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 font-semibold text-white">
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: colorMeta.stroke }}
                                    />
                                    <span>{det.name}</span>
                                  </div>
                                  <div className="text-[10px] text-white/50">
                                    {det.disposal_bin || 'Disposal line routing'}
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-[10px] font-semibold text-emerald-400">
                                    {Math.round((det.confidence || 0.95) * 100)}% Match
                                  </div>
                                  <div className="text-[9px] text-white/40 uppercase">
                                    {det.category}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}

                  {/* Raw JSON Response Viewer */}
                  {(playgroundViewMode === 'split' || playgroundViewMode === 'json') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-white/60">
                        <span>Standardized JSON Payload</span>
                        <button
                          type="button"
                          onClick={copyRawJson}
                          className="px-2 py-0.5 border border-white/20 hover:border-white text-white/80 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
                        >
                          {copiedJson ? (
                            <>
                              <CheckIcon size={11} className="text-emerald-400" />
                              <span>COPIED</span>
                            </>
                          ) : (
                            <>
                              <CopyIcon size={11} />
                              <span>COPY JSON</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="border border-white/10 bg-[#030508] p-4 text-[11px] text-emerald-400 max-h-72 overflow-y-auto font-mono leading-relaxed select-all">
                        <pre className="whitespace-pre">
                          {JSON.stringify(executionResult, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
