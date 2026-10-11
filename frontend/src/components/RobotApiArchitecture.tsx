'use client';

import React, { useState } from 'react';
import {
  CpuIcon,
  DatabaseIcon,
  CopyIcon,
  CheckIcon,
  ZapIcon,
  ActivityIcon,
} from './Icons';

const API_SAMPLE_PAYLOAD = {
  api_version: 'v1.4',
  scan_id: 'scan_wa_9042_s3',
  facility_id: 'site_alpha_seattle',
  stream_id: 'conveyor_infeed_02',
  timestamp: '2026-10-09T10:48:12.418Z',
  inference_latency_ms: 11.8,
  detections_count: 6,
  detections: [
    {
      detection_id: 'det_pet_001',
      material: 'PET_POLYMER',
      subtype: 'beverage_bottle_clear',
      confidence: 0.984,
      bounding_box: { x_min: 184, y_min: 280, x_max: 324, y_max: 500 },
      grasp_point_3d: {
        x_mm: 254.2,
        y_mm: 390.1,
        z_mm: 42.0,
        approach_vector: [0.0, 0.0, -1.0],
      },
      estimated_mass_grams: 42.0,
      commodity_value_usd: 0.024,
      hazard: false,
      robot_pick_priority: 1,
    },
    {
      detection_id: 'det_hz_003',
      material: 'HAZARDOUS_GOODS',
      subtype: 'lithium_ion_18650_pack',
      confidence: 0.942,
      bounding_box: { x_min: 350, y_min: 620, x_max: 500, y_max: 800 },
      grasp_point_3d: {
        x_mm: 425.0,
        y_mm: 710.0,
        z_mm: 35.5,
        approach_vector: [0.0, 0.0, -1.0],
      },
      estimated_mass_grams: 95.0,
      commodity_value_usd: 0.0,
      hazard: true,
      hazard_classification: 'CLASS_9_THERMAL_RUNAWAY',
      action_required: 'PNEUMATIC_E_STOP_DIVERTER_02',
    },
  ],
  composition_summary: {
    PET: 0.314,
    OCC: 0.241,
    HDPE: 0.168,
    METALS: 0.112,
    GLASS: 0.083,
    HAZARD: 0.082,
  },
  cryptographic_hash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
};

const PYTHON_SAMPLE = `import terra_vision

client = terra_vision.Client(api_key="terra_live_sk_8f921")

# Stream sub-12ms 3D grasp coordinates directly to Delta Robot PLC
stream = client.streams.listen("site_alpha_seattle", conveyor_id="infeed_02")

for frame in stream:
    for item in frame.detections:
        if item.hazard:
            client.actuators.trigger_diverter(item.id, bin="HZ-9")
        elif item.robot_pick_priority == 1:
            robot_arm.dispatch_pick(item.grasp_point_3d)
`;

const GRPC_SAMPLE = `syntax = "proto3";
package terra.vision.v1;

service WasteInferenceService {
  rpc StreamDetections (StreamRequest) returns (stream DetectionBatch);
  rpc DispatchGraspVector (GraspCommand) returns (GraspAck);
}

message GraspPoint3D {
  double x_mm = 1;
  double y_mm = 2;
  double z_mm = 3;
  repeated double approach_vector = 4;
}`;

export default function RobotApiArchitecture() {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'JSON' | 'PYTHON' | 'GRPC'>('JSON');
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);

  const handleCopy = () => {
    const textToCopy =
      activeTab === 'JSON'
        ? JSON.stringify(API_SAMPLE_PAYLOAD, null, 2)
        : activeTab === 'PYTHON'
        ? PYTHON_SAMPLE
        : GRPC_SAMPLE;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestPing = () => {
    setIsPinging(true);
    setTimeout(() => {
      setPingLatency(Math.round(112 + Math.random() * 8) / 10);
      setIsPinging(false);
    }, 400);
  };

  return (
    <section
      id="robot-api"
      className="relative min-h-screen py-28 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08]"
    >
      {/* Editorial Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-white/[0.08]">
        <div className="lg:col-span-8">
          <div className="flex items-center gap-3 text-xs font-mono text-[#d4af37] tracking-[0.22em] uppercase mb-4">
            <CpuIcon size={14} className="text-[#d4af37]" />
            <span>Scene 06 // Robotic API & Cloud</span>
            <span className="text-white/30">/</span>
            <span className="text-white/50">PRD §19 & §22 · Delta Robot Grasp & AWS Infrastructure</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.08]">
            Sub-12ms robot telemetry <br />
            <span className="italic font-normal text-white/90">and AWS cloud orchestration.</span>
          </h2>

          <p className="mt-5 text-base text-white/60 max-w-2xl font-light leading-relaxed">
            Engineered for high-frequency optical Delta robot picking arms and pneumatic air-jet arrays.
            Synchronized with low-latency AWS SageMaker inference endpoints and Bedrock compliance auditors.
          </p>
        </div>

        {/* Live Endpoint Status Indicator */}
        <div className="lg:col-span-4 flex flex-col justify-end">
          <div className="border border-white/[0.08] bg-[#060a10] p-4 font-mono text-xs flex items-center justify-between gap-4">
            <div>
              <span className="text-white/40 uppercase text-[10px] tracking-wider block">Endpoint Latency</span>
              <span className="text-emerald-400 font-semibold text-sm">
                {pingLatency ? `${pingLatency}ms RTT` : '11.8ms Target'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleTestPing}
              className="px-3.5 py-1.5 border border-white/20 text-white hover:bg-white hover:text-black transition-colors flex items-center gap-1.5 text-[11px]"
            >
              <ZapIcon size={11} />
              <span>{isPinging ? 'Pinging...' : 'Ping Endpoint'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Code Schema on Left, Architectural Pipeline on Right */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Code Payload Viewer (6 Cols) */}
        <div className="lg:col-span-6 border border-white/[0.08] bg-[#020408] overflow-hidden flex flex-col font-mono text-xs">
          {/* Code Window Header */}
          <div className="p-3 bg-[#060a10] border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-1">
              {(['JSON', 'PYTHON', 'GRPC'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 text-[11px] transition-colors ${
                    activeTab === tab
                      ? 'bg-white text-black font-semibold'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-white/60 hover:text-white border border-white/[0.08] hover:border-white/20 transition-colors"
            >
              {copied ? <CheckIcon size={12} className="text-emerald-400" /> : <CopyIcon size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Code Body */}
          <div className="p-6 overflow-x-auto max-h-[500px] text-white/70 leading-relaxed bg-[#020408] select-text">
            <pre className="whitespace-pre">
              <code>
                {activeTab === 'JSON' && JSON.stringify(API_SAMPLE_PAYLOAD, null, 2)}
                {activeTab === 'PYTHON' && PYTHON_SAMPLE}
                {activeTab === 'GRPC' && GRPC_SAMPLE}
              </code>
            </pre>
          </div>
        </div>

        {/* Right Column: Architectural Pipeline Sequence (6 Cols) */}
        <div className="lg:col-span-6 border border-white/[0.08] bg-[#060a10] p-8 font-mono text-xs space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <span className="text-white font-semibold tracking-wider uppercase text-[11px]">
              End-to-End Pipeline: Sensor ➔ Robot ➔ Cloud
            </span>
            <span className="text-emerald-400 text-[10px]">
              100% OPERATIONAL
            </span>
          </div>

          {/* Pipeline Stage 1: Optical Sensors */}
          <div className="border-b border-white/[0.04] pb-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 border border-white/20 flex items-center justify-center text-white/80 shrink-0">
                <ActivityIcon size={15} />
              </div>
              <div>
                <div className="text-white font-semibold text-[11px]">01. Multi-Spectral Optical Arrays</div>
                <p className="text-white/50 text-[11px] font-sans font-light mt-0.5">
                  4K 60 FPS RGB line-scan cameras coupled with near-infrared reflectance spectroscopy.
                </p>
              </div>
            </div>
            <span className="text-white/40 text-[10px]">0.0ms</span>
          </div>

          {/* Pipeline Stage 2: Edge Micro-Segmentation */}
          <div className="border-b border-white/[0.04] pb-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 border border-[#d4af37]/60 bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] shrink-0">
                <CpuIcon size={15} />
              </div>
              <div>
                <div className="text-white font-semibold text-[11px]">02. Edge Micro-Segmentation</div>
                <p className="text-white/50 text-[11px] font-sans font-light mt-0.5">
                  NVIDIA TensorRT acceleration outputting 6 polymer resin classes and centroid grasp coordinates.
                </p>
              </div>
            </div>
            <span className="text-[#d4af37] font-semibold text-[10px]">+11.8ms</span>
          </div>

          {/* Pipeline Stage 3: Delta Robot Pick Dispatch */}
          <div className="border-b border-white/[0.04] pb-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                <ZapIcon size={15} />
              </div>
              <div>
                <div className="text-white font-semibold text-[11px]">03. Delta Robot PLC Dispatch</div>
                <p className="text-white/50 text-[11px] font-sans font-light mt-0.5">
                  Direct industrial EtherCAT / gRPC coordinate streaming to high-speed delta pick-and-place arms.
                </p>
              </div>
            </div>
            <span className="text-emerald-400 font-semibold text-[10px]">+2.2ms</span>
          </div>

          {/* Pipeline Stage 4: AWS Ledger & Bedrock Reasoning */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 border border-purple-500/40 bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                <DatabaseIcon size={15} />
              </div>
              <div>
                <div className="text-white font-semibold text-[11px]">04. AWS DynamoDB & Bedrock</div>
                <p className="text-white/50 text-[11px] font-sans font-light mt-0.5">
                  Immutable cryptographic audit hash generation and autonomous LLM generative QA reporting.
                </p>
              </div>
            </div>
            <span className="text-purple-400 font-semibold text-[10px]">Cloud Sync</span>
          </div>
        </div>

      </div>
    </section>
  );
}
