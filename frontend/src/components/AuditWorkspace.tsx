'use client';

import React, { useState, useRef, useId, useEffect, useCallback } from 'react';
import {
  UploadCloudIcon,
  CameraIcon,
  PieChartIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ShieldIcon,
  SparklesIcon,
  RefreshCwIcon,
  FileTextIcon,
  CrosshairIcon,
  SwitchCameraIcon,
  LayersIcon,
  ZapIcon,
} from './Icons';
import AuditCertModal from './AuditCertModal';

interface DetectedItem {
  id: string;
  name: string;
  category: string;
  confidence: number;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-100%
  weightEst: string;
  isRecyclable: boolean;
  advice: string;
}

interface CompositionItem {
  category: string;
  displayName: string;
  percentage: number;
  weightEst: string;
  isRecyclable: boolean;
  color: string;
  disposalBin: string;
}

export interface MaterialExtractMeta {
  extractName: string;
  grade: string;
  yieldEfficiency: number; // 0.0 to 1.0
  circularLoop: string;
  applications: string;
  ecoBenefit: string;
}

export const MATERIAL_EXTRACT_REGISTRY: Record<string, MaterialExtractMeta> = {
  'pet-polymers': {
    extractName: 'R-PET Resin Pellets / Clean Flakes',
    grade: 'Bottle-to-Bottle FDA Food Grade / Grade-A Flake',
    yieldEfficiency: 0.88,
    circularLoop: 'High-Grade Pelletizing',
    applications: 'New clear beverage bottles, thermoform sheet packaging & recycled polyester (rPET yarn)',
    ecoBenefit: 'Saves 1.8 kg crude oil & 79% emissions per kg resin',
  },
  'cardboard': {
    extractName: 'Unbleached Secondary Kraft Pulp',
    grade: 'Spec-11 OCC (Old Corrugated Containers) Secondary Pulp',
    yieldEfficiency: 0.82,
    circularLoop: 'Secondary Fiber Pulping',
    applications: 'Medium containerboard liners, corrugated shipping cartons & molded pulp egg trays',
    ecoBenefit: 'Preserves 17 mature trees & 7,000 gal water per ton',
  },
  'fiber': {
    extractName: 'De-Inked Post-Consumer Cellulosic Fiber',
    grade: 'High-Yield Recovered Paper Pulp',
    yieldEfficiency: 0.78,
    circularLoop: 'Secondary Fiber Pulping',
    applications: 'Recycled copy paper, molded fiber protective packaging & acoustic insulation panels',
    ecoBenefit: 'Requires 60% less processing energy than virgin wood pulp',
  },
  'metal': {
    extractName: 'Secondary Aluminum Ingot (Alloy 3004)',
    grade: 'High-Purity UBC Closed-Loop Remelt Ingot',
    yieldEfficiency: 0.96,
    circularLoop: 'Closed-Loop Remelt',
    applications: 'Infinite-cycle UBC beverage cans, automotive engine castings & structural extrusions',
    ecoBenefit: 'Consumes 95% less energy than virgin bauxite smelting',
  },
  'glass': {
    extractName: 'Sorted Vitreous Cullet (Glass Aggregate)',
    grade: 'Furnace-Ready Float & Container Feedstock',
    yieldEfficiency: 0.98,
    circularLoop: 'Infinite-Cycle Remelt',
    applications: 'New beverage bottles & jars (infinite melting cycles), fiberglass insulation & eco-concrete',
    ecoBenefit: 'Offsets 1.2 tons raw limestone/sand/soda ash per ton cullet',
  },
  'biodegradable': {
    extractName: 'Aerobic Bio-Humus Compost & Bio-Energy',
    grade: 'OMRI-Listed Class A Certified Soil Amendment',
    yieldEfficiency: 0.70,
    circularLoop: 'Biological Soil Regeneration',
    applications: 'Regenerative urban agriculture soil enrichment, microbial fertility & organic farming',
    ecoBenefit: 'Eliminates landfill methane (CH4) greenhouse gas emissions',
  },
  'polythene': {
    extractName: 'PCR Low-Density Polyethylene (LDPE) Pellets',
    grade: 'Reprocessed Blown-Film Grade Extrusion Resin',
    yieldEfficiency: 0.84,
    circularLoop: 'Thermoplastic Regrind',
    applications: 'Composite outdoor decking lumber, heavy-duty refuse liners & agricultural barrier film',
    ecoBenefit: 'Displaces virgin fossil naphtha petroleum cracking',
  },
  'non-metal': {
    extractName: 'PCR Polyolefin Pellets (HDPE / PP)',
    grade: 'Injection-Molding Rigids Grade Resin',
    yieldEfficiency: 0.85,
    circularLoop: 'High-Grade Pelletizing',
    applications: 'Heavy-duty transport crates, automotive battery casings, utility piping & recycling bins',
    ecoBenefit: 'Cuts 2.1 kg CO2e emissions per kg of virgin polymer avoided',
  },
  'hazard': {
    extractName: 'Hydrometallurgical Cobalt, Lithium & Nickel Salts',
    grade: 'Battery-Grade Precursor Chemical Salt',
    yieldEfficiency: 0.90,
    circularLoop: 'Hydrometallurgical Refining',
    applications: 'Next-gen EV lithium battery cathode precursors & critical mineral circularity',
    ecoBenefit: 'Prevents toxic heavy metal soil and groundwater leaching',
  },
  'non-biodegradable': {
    extractName: 'Solid Recovered Fuel (SRF / RDF) Engineered Pellets',
    grade: 'High-Calorific Secondary Industrial Feedstock',
    yieldEfficiency: 0.65,
    circularLoop: 'Industrial Co-Processing',
    applications: 'Cement kiln thermal co-processing, replacing mined bituminous coal and pet-coke',
    ecoBenefit: 'Substitutes fossil coal with non-recyclable solid residues',
  },
};


interface AnalysisState {
  scanId: string;
  timestamp: string;
  inferenceEngine: 'GEMINI-3.8-FLASH' | 'NEURAL-EDGE-SIMULATOR';
  summary: string;
  totalEstimatedWeight: string;
  recyclabilityScore: number;
  biodegradableRatio: {
    biodegradable: number;
    nonBiodegradable: number;
  };
  carbonOffsetKg: string;
  compositions: CompositionItem[];
  detectedItems: DetectedItem[];
  actionableSteps: string[];
  keyPoolTelemetry?: {
    activeKeyIndex: number;
    totalKeysInPool: number;
    failoverCount: number;
  };
}

const PRESET_SAMPLES = [
  {
    id: 'sample-household',
    name: 'Household Mixed Waste',
    desc: 'Clear PET, cardboard packaging, aluminum cans, and film wrap',
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1000&q=80',
    data: {
      summary: 'Mixed post-consumer municipal waste with a high percentage of recoverable rigid polymers and fiber packaging.',
      totalWeight: '680g',
      score: 84,
      bioRatio: { biodegradable: 22, nonBiodegradable: 78 },
      carbon: '1.35 kg CO2e',
      compositions: [
        { category: 'pet-polymers', displayName: 'PET Polymers', percentage: 34.0, weightEst: '231g', isRecyclable: true, color: '#38bdf8', disposalBin: 'Blue Bin · Clean Rigid Plastics' },
        { category: 'cardboard', displayName: 'Corrugated Cardboard', percentage: 26.5, weightEst: '180g', isRecyclable: true, color: '#fbbf24', disposalBin: 'Yellow Bin · Dry Fiber' },
        { category: 'polythene', displayName: 'Polythene Film (LDPE)', percentage: 15.0, weightEst: '102g', isRecyclable: false, color: '#2dd4bf', disposalBin: 'Store Film Return Drop' },
        { category: 'metal', displayName: 'Aluminum UBC Can', percentage: 11.5, weightEst: '78g', isRecyclable: true, color: '#e2e8f0', disposalBin: 'Blue Bin · Metals' },
        { category: 'glass', displayName: 'Container Glass', percentage: 8.0, weightEst: '54g', isRecyclable: true, color: '#c084fc', disposalBin: 'Glass Drop Cell' },
        { category: 'biodegradable', displayName: 'Food Organic Scrap', percentage: 5.0, weightEst: '35g', isRecyclable: true, color: '#10b981', disposalBin: 'Green Organics Bin' },
      ],
      items: [
        { id: 'DET-1', name: 'Clear PET Water Bottle', category: 'pet-polymers', confidence: 0.98, box: [20, 16, 56, 44] as [number, number, number, number], weightEst: '42g', isRecyclable: true, advice: 'Rinse cap & bottle' },
        { id: 'DET-2', name: 'Corrugated Box Flap', category: 'cardboard', confidence: 0.96, box: [24, 52, 70, 86] as [number, number, number, number], weightEst: '180g', isRecyclable: true, advice: 'Flatten flat' },
        { id: 'DET-3', name: 'Aluminum Soda Can', category: 'metal', confidence: 0.99, box: [60, 22, 88, 46] as [number, number, number, number], weightEst: '15g', isRecyclable: true, advice: 'Empty liquids' },
      ],
      steps: [
        'Separate LDPE thin film bags from rigid PET containers to prevent conveyor jams.',
        'Flatten cardboard packaging to reduce collection storage volume by 70%.',
        'Rinse residue from food containers to eliminate mill dockage contamination penalties.',
      ],
    },
  },
  {
    id: 'sample-packaging',
    name: 'E-Commerce Packaging',
    desc: 'Heavy Kraft fiber, LDPE air cushions, and packing tape',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1000&q=80',
    data: {
      summary: 'High-density commercial packaging stream dominated by recyclable Spec-11 kraft corrugate and protective bubble film.',
      totalWeight: '920g',
      score: 79,
      bioRatio: { biodegradable: 10, nonBiodegradable: 90 },
      carbon: '2.10 kg CO2e',
      compositions: [
        { category: 'cardboard', displayName: 'Kraft Corrugate', percentage: 56.0, weightEst: '515g', isRecyclable: true, color: '#fbbf24', disposalBin: 'Paper & Fiber Line' },
        { category: 'fiber', displayName: 'Paper Packing Filler', percentage: 18.0, weightEst: '165g', isRecyclable: true, color: '#fde047', disposalBin: 'Clean Fiber Bales' },
        { category: 'polythene', displayName: 'Air-Pillow Film', percentage: 16.0, weightEst: '147g', isRecyclable: false, color: '#2dd4bf', disposalBin: 'Plastic Film Reclaim' },
        { category: 'non-biodegradable', displayName: 'Synthetic Tape & Glue', percentage: 10.0, weightEst: '93g', isRecyclable: false, color: '#94a3b8', disposalBin: 'Refuse Fraction' },
      ],
      items: [
        { id: 'DET-P1', name: 'Corrugated Shipping Box', category: 'cardboard', confidence: 0.97, box: [15, 18, 75, 78] as [number, number, number, number], weightEst: '480g', isRecyclable: true, advice: 'Remove large tape strips' },
        { id: 'DET-P2', name: 'Inflatable Bubble Packaging', category: 'polythene', confidence: 0.94, box: [30, 60, 65, 92] as [number, number, number, number], weightEst: '35g', isRecyclable: false, advice: 'Puncture air pockets' },
      ],
      steps: [
        'Strip thick plastic tape bands before baling fiber.',
        'Puncture and compact polythene air pillows for dedicated film drop-off.',
        'Keep cardboard moisture-free to retain high fiber market value.',
      ],
    },
  },
  {
    id: 'sample-beverage',
    name: 'Beverage & Can Containers',
    desc: 'High-grade UBC aluminum cans and colored PET bottles',
    image: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=1000&q=80',
    data: {
      summary: 'Premium commodity recovery stream with near-total recyclability and top salvage commodity valuation.',
      totalWeight: '460g',
      score: 96,
      bioRatio: { biodegradable: 4, nonBiodegradable: 96 },
      carbon: '2.84 kg CO2e',
      compositions: [
        { category: 'metal', displayName: 'Aluminum UBC (Alloy 3004)', percentage: 48.0, weightEst: '220g', isRecyclable: true, color: '#e2e8f0', disposalBin: 'Non-Ferrous Eddy Sorter' },
        { category: 'pet-polymers', displayName: 'Clear Bottle Flake', percentage: 38.0, weightEst: '175g', isRecyclable: true, color: '#38bdf8', disposalBin: 'Optical NIR PET Sorter' },
        { category: 'polythene', displayName: 'Bottle Shrink Wrap', percentage: 8.0, weightEst: '37g', isRecyclable: false, color: '#2dd4bf', disposalBin: 'Quarantine Film Cell' },
        { category: 'non-metal', displayName: 'Rigid PP Closures', percentage: 6.0, weightEst: '28g', isRecyclable: true, color: '#f472b6', disposalBin: 'Polypropylene Line' },
      ],
      items: [
        { id: 'DET-B1', name: 'Aluminum Beverage Cans', category: 'metal', confidence: 0.99, box: [20, 20, 80, 55] as [number, number, number, number], weightEst: '220g', isRecyclable: true, advice: 'Infinitely recyclable' },
        { id: 'DET-B2', name: 'PET Beverage Bottles', category: 'pet-polymers', confidence: 0.98, box: [25, 58, 85, 88] as [number, number, number, number], weightEst: '175g', isRecyclable: true, advice: 'Ready for optical resin sorting' },
      ],
      steps: [
        'Prioritize non-ferrous eddy current separator for 99.8% aluminum recovery.',
        'Compress aluminum cans into Grade-A UBC export bales.',
        'Route bottle closures to secondary float-sink tank.',
      ],
    },
  },
  {
    id: 'sample-hazard',
    name: 'Hazard & Electronics Residual',
    desc: 'Battery cells, circuit boards, and prohibited chemicals',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1000&q=80',
    data: {
      summary: 'High-risk hazardous stream requiring automated diverter gate trip and immediate quarantine from balers.',
      totalWeight: '540g',
      score: 42,
      bioRatio: { biodegradable: 5, nonBiodegradable: 95 },
      carbon: '0.45 kg CO2e',
      compositions: [
        { category: 'hazard', displayName: 'Class 9 Lithium Goods', percentage: 38.0, weightEst: '205g', isRecyclable: false, color: '#f43f5e', disposalBin: 'Flammable Quarantine Bin' },
        { category: 'metal', displayName: 'Electronic Shielding & Solder', percentage: 26.0, weightEst: '140g', isRecyclable: true, color: '#e2e8f0', disposalBin: 'E-Scrap Smelter Stream' },
        { category: 'non-biodegradable', displayName: 'PCB FR-4 Flame Retardant', percentage: 24.0, weightEst: '130g', isRecyclable: false, color: '#94a3b8', disposalBin: 'Hazardous Waste Landfill' },
        { category: 'pet-polymers', displayName: 'Casing Plastics', percentage: 12.0, weightEst: '65g', isRecyclable: true, color: '#38bdf8', disposalBin: 'Specialty Recycler' },
      ],
      items: [
        { id: 'DET-H1', name: 'Lithium-Ion 18650 Battery Pack', category: 'hazard', confidence: 0.96, box: [22, 25, 68, 65] as [number, number, number, number], weightEst: '95g', isRecyclable: false, advice: 'Do not compress! High fire risk' },
        { id: 'DET-H2', name: 'Printed Circuit Board', category: 'metal', confidence: 0.92, box: [40, 55, 80, 85] as [number, number, number, number], weightEst: '140g', isRecyclable: true, advice: 'Specialty e-scrap salvage' },
      ],
      steps: [
        'TRIGGER DIVERTER: Isolate batteries from hydraulic balers to prevent thermal runaway fires.',
        'Store lithium cells in vermiculite-insulated containers.',
        'Route electronics to R2v3 certified e-waste processors.',
      ],
    },
  },
];

export default function AuditWorkspace() {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Active state
  const [currentImage, setCurrentImage] = useState<string>(PRESET_SAMPLES[0].image);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<DetectedItem | null>(PRESET_SAMPLES[0].data.items[0]);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Optical Camera Viewfinder State
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isFlashActive, setIsFlashActive] = useState<boolean>(false);

  // Analysis Result State (initialized with household preset)
  const [analysis, setAnalysis] = useState<AnalysisState>({
    scanId: 'WA-9042-LIVE',
    timestamp: 'Just now',
    inferenceEngine: 'NEURAL-EDGE-SIMULATOR',
    summary: PRESET_SAMPLES[0].data.summary,
    totalEstimatedWeight: PRESET_SAMPLES[0].data.totalWeight,
    recyclabilityScore: PRESET_SAMPLES[0].data.score,
    biodegradableRatio: PRESET_SAMPLES[0].data.bioRatio,
    carbonOffsetKg: PRESET_SAMPLES[0].data.carbon,
    compositions: PRESET_SAMPLES[0].data.compositions,
    detectedItems: PRESET_SAMPLES[0].data.items,
    actionableSteps: PRESET_SAMPLES[0].data.steps,
  });

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Stop camera stream cleanly to power down device optical sensors
  const stopLiveCameraStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Close camera modal
  const closeCameraModal = useCallback(() => {
    stopLiveCameraStream();
    setIsCameraOpen(false);
    setCameraError(null);
    setIsStartingCamera(false);
  }, [stopLiveCameraStream]);

  // Callback ref to bind live stream immediately when video node mounts
  const setVideoNode = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && mediaStreamRef.current) {
      node.srcObject = mediaStreamRef.current;
      node.play().catch(() => {});
    }
  }, []);

  // Launch live camera feed
  const startLiveCamera = useCallback(
    async (preferredFacing: 'environment' | 'user' = facingMode) => {
      setIsCameraOpen(true);
      setIsStartingCamera(true);
      setCameraError(null);

      stopLiveCameraStream();

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          'Live camera capture is not supported by your browser or network context. Please upload a file instead.'
        );
        setIsStartingCamera(false);
        return;
      }

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: preferredFacing,
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          });
        } catch (firstErr: any) {
          // If the user or browser rejected permission, do not re-prompt with fallback
          if (firstErr.name === 'NotAllowedError' || firstErr.name === 'PermissionDeniedError') {
            throw firstErr;
          }
          // Fallback for desktop webcams that reject resolution or facingMode constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        mediaStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        // Use console.warn instead of console.error so Next.js doesn't trigger a red development error overlay
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          console.warn('Camera permission was blocked or dismissed by user/browser.');
          setCameraError(
            'Camera permission is blocked. Click the lock or camera icon in your browser address bar to allow camera access, or upload a file directly.'
          );
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          console.warn('No camera device detected.');
          setCameraError('No optical camera sensor was detected on this device. Please upload an image or video instead.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          console.warn('Camera sensor in use by another application.');
          setCameraError('Camera sensor is in use by another application (Zoom, Teams, etc.). Please close other camera apps and retry.');
        } else {
          console.warn('Camera stream notice:', err.message || err);
          setCameraError('Unable to start optical camera sensor. You can upload an image or video file instead.');
        }
      } finally {
        setIsStartingCamera(false);
      }
    },
    [facingMode, stopLiveCameraStream]
  );

  // Switch between front & rear camera sensors
  const toggleFacingMode = useCallback(() => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startLiveCamera(nextMode);
  }, [facingMode, startLiveCamera]);

  // Downscale and compress image on an off-screen HTML canvas to ensure fast, reliable AI inference (< 1.5MB)
  const compressImageForAnalysis = (dataUrl: string, maxDimension = 1280, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !dataUrl || dataUrl.startsWith('data:image/svg') || dataUrl.length < 50000) {
        return resolve(dataUrl);
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Perform AI analysis on image data
  const analyzeImage = async (base64OrUrl: string, isPresetData?: typeof PRESET_SAMPLES[0]['data']) => {
    setIsAnalyzing(true);
    setSelectedItem(null);

    // If it's a pre-baked sample, simulate ultra-fast inference with rich preset metrics
    if (isPresetData) {
      setTimeout(() => {
        setAnalysis({
          scanId: `WA-${Math.floor(1000 + Math.random() * 9000)}-AI`,
          timestamp: 'Just now',
          inferenceEngine: 'NEURAL-EDGE-SIMULATOR',
          summary: isPresetData.summary,
          totalEstimatedWeight: isPresetData.totalWeight,
          recyclabilityScore: isPresetData.score,
          biodegradableRatio: isPresetData.bioRatio,
          carbonOffsetKg: isPresetData.carbon,
          compositions: isPresetData.compositions,
          detectedItems: isPresetData.items,
          actionableSteps: isPresetData.steps,
        });
        setSelectedItem(isPresetData.items[0] || null);
        setIsAnalyzing(false);
        triggerToast('Analysis complete. Material composition characterized.');
      }, 750);
      return;
    }

    try {
      // Compress and optimize image payload before sending to backend to prevent network timeouts
      const optimizedPayload = await compressImageForAnalysis(base64OrUrl);

      const res = await fetch('/api/analyze-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: optimizedPayload,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const detail = errorData.error || errorData.message || `Analysis service error (${res.status})`;
        throw new Error(detail);
      }

      const data = await res.json();
      const bio = data.biodegradableRatio || { biodegradable: 25, nonBiodegradable: 75 };
      const safeBio = {
        biodegradable: Number(bio.biodegradable ?? 25),
        nonBiodegradable: Number(bio.nonBiodegradable ?? 75),
      };

      const safeItems: DetectedItem[] = (data.detectedItems || []).map((it: any, idx: number) => ({
        id: it.id || `ITEM-${idx + 1}`,
        name: it.name || 'Waste Item',
        category: it.category || 'pet-polymers',
        confidence: typeof it.confidence === 'number' ? it.confidence : 0.95,
        box: Array.isArray(it.box) && it.box.length === 4 ? it.box : [20, 20, 50, 50],
        weightEst: it.weightEst || '45g',
        isRecyclable: it.isRecyclable ?? true,
        advice: it.advice || 'Segregate at sorting dock',
      }));

      const engineName = data.inferenceEngine || 'GEMINI-LIVE-VISION';

      setAnalysis({
        scanId: data.scanId || `WA-${Math.floor(1000 + Math.random() * 9000)}-AI`,
        timestamp: 'Just now',
        inferenceEngine: engineName,
        summary: data.summary || 'AI multimodal scan complete.',
        totalEstimatedWeight: data.totalEstimatedWeight || '640g',
        recyclabilityScore: Number(data.recyclabilityScore ?? 75),
        biodegradableRatio: safeBio,
        carbonOffsetKg: data.carbonOffsetKg || '1.2 kg CO2e',
        compositions: data.compositions || [],
        detectedItems: safeItems,
        actionableSteps: data.actionableSteps || [],
        keyPoolTelemetry: data.keyPoolTelemetry,
      });

      setSelectedItem(safeItems[0] || null);

      if (engineName !== 'NEURAL-EDGE-SIMULATOR') {
        const poolNotice = data.keyPoolTelemetry?.totalKeysInPool && data.keyPoolTelemetry.totalKeysInPool > 1
          ? ` (Pool Key #${data.keyPoolTelemetry.activeKeyIndex}/${data.keyPoolTelemetry.totalKeysInPool})`
          : '';
        triggerToast(`Live Vision AI (${engineName}) complete: ${safeItems.length} items cataloged${poolNotice}.`);
      } else {
        triggerToast(`⚠️ Cloud AI service was busy. Offline edge estimate displayed — click Re-Scan to retry.`);
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(err?.message ? `⚠️ ${err.message}` : '⚠️ Network connection issue. Offline fallback estimate displayed.');
      setAnalysis((prev) => ({
        ...prev,
        scanId: `WA-${Math.floor(1000 + Math.random() * 9000)}-OFFLINE`,
        timestamp: 'Just now',
        inferenceEngine: 'NEURAL-EDGE-SIMULATOR',
      }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Capture current optical video frame
  const captureCameraFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 220);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    closeCameraModal();

    setCurrentImage(dataUrl);
    analyzeImage(dataUrl);
    triggerToast('Camera snapshot captured. Analyzing waste composition...');
  }, [closeCameraModal, triggerToast]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopLiveCameraStream();
    };
  }, [stopLiveCameraStream]);

  // Close camera modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCameraOpen) {
        closeCameraModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCameraOpen, closeCameraModal]);

  // Handle local file upload (photo or video frame)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // If user uploads a video file, extract a representative frame
    if (file.type.startsWith('video/')) {
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      videoEl.src = URL.createObjectURL(file);
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.onloadeddata = () => {
        videoEl.currentTime = Math.min(1.0, (videoEl.duration || 1) / 2);
      };
      videoEl.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth || 1280;
        canvas.height = videoEl.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.92);
          setCurrentImage(base64);
          analyzeImage(base64);
          triggerToast('Video frame extracted. Analyzing waste composition...');
        }
        URL.revokeObjectURL(videoEl.src);
      };
      videoEl.onerror = () => {
        triggerToast('Could not extract frame from video. Please try an image file.');
      };
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCurrentImage(base64);
      analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

  // Helper to calculate SVG Pie / Donut Chart paths
  const calculatePieSlices = () => {
    let accumulatedAngle = 0;
    const radius = 72;
    const innerRadius = 46; // Donut hole
    const cx = 90;
    const cy = 90;

    return analysis.compositions.map((comp) => {
      const sliceAngle = (comp.percentage / 100) * 360;
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + sliceAngle;
      accumulatedAngle = endAngle;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const ix1 = cx + innerRadius * Math.cos(endRad);
      const iy1 = cy + innerRadius * Math.sin(endRad);
      const ix2 = cx + innerRadius * Math.cos(startRad);
      const iy2 = cy + innerRadius * Math.sin(startRad);

      const largeArc = sliceAngle > 180 ? 1 : 0;
      const pathData = `
        M ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
        L ${ix1} ${iy1}
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}
        Z
      `;

      return {
        ...comp,
        pathData,
      };
    });
  };

  const pieSlices = calculatePieSlices();

  // Calculate Projected Material Extracts & Circular Output Yield
  const calculateMaterialExtracts = () => {
    // Total raw grams estimate
    let totalRawGrams = 600;
    const weightMatch = analysis.totalEstimatedWeight.match(/([\d.]+)\s*(g|kg)/i);
    if (weightMatch) {
      const val = parseFloat(weightMatch[1]);
      totalRawGrams = weightMatch[2].toLowerCase() === 'kg' ? Math.round(val * 1000) : Math.round(val);
    }

    const extracts = analysis.compositions.map((comp) => {
      const meta = MATERIAL_EXTRACT_REGISTRY[comp.category] || {
        extractName: `Secondary ${comp.displayName} Reclaim`,
        grade: 'Industrial Secondary Reclaim',
        yieldEfficiency: 0.80,
        circularLoop: 'High-Grade Pelletizing',
        applications: 'Industrial remanufacturing & secondary commodity feedstocks',
        ecoBenefit: 'Reduces landfill footprint and virgin feedstock extraction',
      };

      // Determine raw grams for this specific fraction
      let fractionRawGrams = 0;
      const compWeightMatch = comp.weightEst.match(/([\d.]+)\s*(g|kg)/i);
      if (compWeightMatch) {
        const val = parseFloat(compWeightMatch[1]);
        fractionRawGrams = compWeightMatch[2].toLowerCase() === 'kg' ? Math.round(val * 1000) : Math.round(val);
      } else {
        fractionRawGrams = Math.round((comp.percentage / 100) * totalRawGrams);
      }

      const outputGrams = Math.max(1, Math.round(fractionRawGrams * meta.yieldEfficiency));
      const outputFormatted = outputGrams >= 1000 ? `${(outputGrams / 1000).toFixed(2)} kg` : `${outputGrams}g`;

      return {
        ...comp,
        extractName: meta.extractName,
        grade: meta.grade,
        yieldEfficiency: Math.round(meta.yieldEfficiency * 100),
        circularLoop: meta.circularLoop,
        applications: meta.applications,
        ecoBenefit: meta.ecoBenefit,
        rawGrams: fractionRawGrams,
        outputGrams,
        outputFormatted,
      };
    });

    const totalExtractedGrams = extracts.reduce((sum, item) => sum + item.outputGrams, 0);
    const overallEfficiency = totalRawGrams > 0 ? Math.round((totalExtractedGrams / totalRawGrams) * 100) : 84;

    return {
      extracts,
      totalExtractedGrams,
      totalRawGrams,
      overallEfficiency,
    };
  };

  const {
    extracts: materialExtracts,
    totalExtractedGrams,
    overallEfficiency: extractEfficiency,
  } = calculateMaterialExtracts();

  return (
    <section
      id="audit-workspace"
      className="relative min-h-screen py-24 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08]"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-[#080d14] border border-[#d4af37]/70 text-white font-mono text-xs shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <CheckCircleIcon size={16} className="text-[#d4af37]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Live Optical Camera Viewfinder Modal */}
      {isCameraOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCameraModal();
          }}
        >
          <div className="w-full max-w-3xl bg-[#060a10] border border-white/[0.18] shadow-2xl overflow-hidden font-mono text-xs flex flex-col max-h-[92vh]">
            {/* Header bar */}
            <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between bg-black/60">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${cameraError ? 'bg-amber-400' : 'bg-red-500 animate-pulse'}`} />
                <span className="font-semibold text-white tracking-wider uppercase text-[11px]">
                  {cameraError ? 'CAMERA SENSOR NOTICE' : 'LIVE OPTICAL SENSOR FEED'}
                </span>
                <span className="text-white/30 hidden sm:inline">|</span>
                <span className="text-[#d4af37] text-[10px] uppercase hidden sm:inline">
                  {facingMode === 'environment' ? 'Rear Sensor' : 'User Sensor'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-white/40 hidden md:inline">ESC to exit</span>
                <button
                  type="button"
                  onClick={closeCameraModal}
                  className="w-7 h-7 flex items-center justify-center border border-white/20 hover:border-white text-white/60 hover:text-white transition-colors"
                  aria-label="Close live camera"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Viewfinder Main Stage */}
            <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full bg-black overflow-hidden flex items-center justify-center">
              {/* Live Video Feed */}
              <video
                ref={setVideoNode}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover select-none ${cameraError ? 'hidden' : 'block'}`}
              />

              {/* Shutter White Flash effect */}
              {isFlashActive && (
                <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200 pointer-events-none" />
              )}

              {/* Reticle Overlay (Only when stream is running without error) */}
              {!cameraError && !isStartingCamera && (
                <div className="absolute inset-0 pointer-events-none p-6 sm:p-8 flex flex-col justify-between">
                  {/* Top corners */}
                  <div className="flex justify-between items-start">
                    <div className="w-8 h-8 border-t-2 border-l-2 border-[#d4af37]" />
                    <div className="w-8 h-8 border-t-2 border-r-2 border-[#d4af37]" />
                  </div>

                  {/* Center HUD Targeting Crosshair */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                    <div className="w-32 h-32 sm:w-48 sm:h-48 border border-white/20 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-16 h-16 border border-[#d4af37]/40 rounded-full flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                      </div>
                    </div>
                    {/* Tick lines */}
                    <div className="absolute w-24 h-[1px] bg-white/40" />
                    <div className="absolute h-24 w-[1px] bg-white/40" />
                  </div>

                  {/* Bottom corners */}
                  <div className="flex justify-between items-end">
                    <div className="w-8 h-8 border-b-2 border-l-2 border-[#d4af37]" />
                    <div className="w-8 h-8 border-b-2 border-r-2 border-[#d4af37]" />
                  </div>
                </div>
              )}

              {/* Camera Starting / Initializing State */}
              {isStartingCamera && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 z-20">
                  <div className="w-10 h-10 border-2 border-white/20 border-t-[#d4af37] rounded-full animate-spin" />
                  <span className="text-white text-xs font-semibold tracking-wider animate-pulse">
                    REQUESTING CAMERA SENSOR...
                  </span>
                  <span className="text-white/40 text-[10px]">Please allow browser access if prompted</span>
                </div>
              )}

              {/* Camera Error / Permission Denied State */}
              {cameraError && (
                <div className="absolute inset-0 p-6 sm:p-8 flex flex-col items-center justify-center text-center bg-[#060a11] z-20 space-y-4 overflow-y-auto">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <AlertTriangleIcon size={24} />
                  </div>
                  
                  <div className="max-w-md space-y-1.5">
                    <div className="text-white font-semibold text-base">Camera Access Blocked</div>
                    <p className="text-white/70 font-sans text-xs leading-relaxed">
                      {cameraError}
                    </p>
                  </div>

                  {/* Browser Permission Instructions Box */}
                  <div className="max-w-sm w-full bg-white/[0.03] border border-white/10 p-3.5 text-left font-mono text-[11px] space-y-2 text-white/70">
                    <div className="text-[#d4af37] font-semibold uppercase tracking-wider text-[10px]">
                      Quick Fix in Browser Address Bar:
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-white/60 font-sans text-xs">
                      <li>Click the <span className="font-mono text-white bg-white/10 px-1 py-0.5 rounded">🔒 Lock</span> or <span className="font-mono text-white bg-white/10 px-1 py-0.5 rounded">📷 Camera</span> icon in your URL bar.</li>
                      <li>Change <strong>Camera</strong> from &quot;Block&quot; to <strong>&quot;Allow&quot;</strong>.</li>
                      <li>Click <strong>Retry Camera</strong> below.</li>
                    </ol>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        closeCameraModal();
                        fileInputRef.current?.click();
                      }}
                      className="px-4 py-2 bg-white text-black font-semibold hover:bg-[#d4af37] transition-colors flex items-center gap-2"
                    >
                      <UploadCloudIcon size={14} />
                      <span>Upload Photo/Video Instead</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startLiveCamera(facingMode)}
                      className="px-4 py-2 border border-white/20 hover:border-white text-white transition-colors"
                    >
                      Retry Camera Access
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="px-6 py-4 bg-[#04070c] border-t border-white/[0.08] flex items-center justify-between">
              {/* Left action: Switch camera or File upload */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  disabled={isStartingCamera || !!cameraError}
                  className="px-3 py-2 border border-white/15 hover:border-white text-white/70 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
                  title="Switch camera sensor (Front/Rear)"
                >
                  <SwitchCameraIcon size={14} />
                  <span className="text-[11px] hidden sm:inline">Flip Camera</span>
                </button>
              </div>

              {/* Center Shutter Button */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={captureCameraFrame}
                  disabled={isStartingCamera || !!cameraError}
                  className="group relative flex items-center justify-center w-16 h-16 rounded-full border-2 border-white/60 hover:border-[#d4af37] p-1 transition-all active:scale-95 disabled:opacity-25 disabled:pointer-events-none focus:outline-none"
                  title="Snap Current Frame"
                >
                  <div className="w-full h-full rounded-full bg-white group-hover:bg-[#d4af37] transition-colors flex items-center justify-center shadow-lg">
                    <CameraIcon size={20} className="text-black" />
                  </div>
                </button>
                <span className="text-[9px] uppercase tracking-widest text-white/40">Snap Photo</span>
              </div>

              {/* Right action: Upload file shortcut */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    closeCameraModal();
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-2 border border-white/15 hover:border-white text-white/70 hover:text-white transition-colors flex items-center gap-2 text-[11px]"
                >
                  <UploadCloudIcon size={14} />
                  <span className="hidden sm:inline">Upload File</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Audit Certificate Modal */}
      <AuditCertModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        scanId={analysis.scanId}
        facility="TERRA AI Edge Scanner · Consumer Portal"
      />

      {/* Editorial Section Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 border-b border-white/[0.08]">
        <div className="lg:col-span-8">
          <div className="flex items-center gap-3 text-xs font-mono text-[#d4af37] tracking-[0.22em] uppercase mb-4">
            <SparklesIcon size={13} className="text-[#d4af37]" />
            <span>AI Waste Vision // Multimodal Intelligence</span>
            <span className="text-white/30">/</span>
            <span className="text-white/50">Continuous Autonomous Ingestion</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.08]">
            Snap, upload, and identify <br />
            <span className="italic font-normal text-white/90">what your waste is made of.</span>
          </h2>

          <p className="mt-4 text-base text-white/60 max-w-2xl font-light leading-relaxed">
            Upload any photo or video of mixed trash, packaging, or recycling.
            Our computer-vision model instantly identifies polymers, metals, cardboard, glass, and biodegradables
            with precision breakdown and actionable disposal guidance.
          </p>
        </div>

        {/* Engine Telemetry & High-Availability Pool Status */}
        <div className="lg:col-span-4 flex flex-col justify-end">
          <div className="border border-white/[0.08] bg-[#060a10]/80 p-5 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between text-white/50 border-b border-white/[0.06] pb-2">
              <span className="tracking-wider uppercase text-[10px]">Inference Engine</span>
              <span className="text-white font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {analysis.inferenceEngine}
              </span>
            </div>

            <div className="flex items-center justify-between text-white/50">
              <span className="text-[10px] uppercase">Multimodal Latency</span>
              <span className="text-emerald-400 font-medium">Sub-2.0s Real-Time</span>
            </div>

            <div className="flex items-center justify-between text-white/50">
              <span className="text-[10px] uppercase">Taxonomy Depth</span>
              <span className="text-[#d4af37] font-semibold">10 Recyclable Fractions</span>
            </div>

            <div className="flex items-center justify-between text-white/50 border-t border-white/[0.06] pt-2">
              <span className="text-[10px] uppercase flex items-center gap-1.5">
                <ShieldIcon size={12} className="text-[#d4af37]" />
                <span>Quota Resilience</span>
              </span>
              <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Multi-Key Failover Pool</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Interactive Analysis Chamber */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Visual Upload / Scan Inspection Canvas (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Upload & Action Bar */}
          <div className="border border-white/[0.08] bg-[#060a10] p-3.5 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-2">
              {/* Hidden file input */}
              <input
                id={fileInputId}
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="sr-only"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-white text-black font-semibold hover:bg-[#d4af37] transition-colors flex items-center gap-1.5"
              >
                <UploadCloudIcon size={14} />
                <span>Upload Photo/Video</span>
              </button>

              <button
                type="button"
                onClick={() => startLiveCamera()}
                className="px-3 py-1.5 border border-white/20 hover:border-[#d4af37] text-white/90 hover:text-white transition-colors flex items-center gap-1.5 group"
              >
                <CameraIcon size={14} className="text-[#d4af37] group-hover:scale-110 transition-transform" />
                <span>Snap Camera</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/40 uppercase">Scan ID: {analysis.scanId}</span>
              <button
                type="button"
                onClick={() => analyzeImage(currentImage)}
                disabled={isAnalyzing}
                className="p-1.5 border border-white/20 hover:border-[#d4af37] text-white/60 hover:text-white transition-colors"
                title="Re-run AI Analysis"
              >
                <RefreshCwIcon size={13} className={isAnalyzing ? 'animate-spin text-[#d4af37]' : ''} />
              </button>
            </div>
          </div>

          {/* Interactive Bounding Canvas Viewport */}
          <div className="relative aspect-[16/10] w-full overflow-hidden border border-white/[0.12] bg-[#020408] group">
            {/* Background Waste Image */}
            <img
              src={currentImage}
              alt="Uploaded Waste Sample"
              className="w-full h-full object-cover select-none"
            />

            {/* Subtle Industrial Grid Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

            {/* Scanning Laser Line when analyzing */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 z-30 font-mono text-xs">
                <div className="w-12 h-12 border-2 border-white/20 border-t-[#d4af37] rounded-full animate-spin" />
                <span className="text-white font-semibold animate-pulse tracking-wider">
                  IDENTIFYING POLYMERS & MATERIAL FRACTIONS...
                </span>
                <span className="text-white/40 text-[10px]">Processing via Gemini Multimodal Vision</span>
              </div>
            )}

            {/* Bounding Reticles for Detected Items */}
            {!isAnalyzing &&
              (analysis.detectedItems || []).map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const box = Array.isArray(item.box) && item.box.length === 4 ? item.box : [20, 20, 50, 50];
                const [ymin, xmin, ymax, xmax] = box;
                const width = Math.max(4, xmax - xmin);
                const height = Math.max(4, ymax - ymin);

                let colorBorder = 'border-sky-400';
                let bgBadge = 'bg-sky-400 text-black';
                if (item.category === 'cardboard') {
                  colorBorder = 'border-amber-400';
                  bgBadge = 'bg-amber-400 text-black';
                } else if (item.category === 'metal') {
                  colorBorder = 'border-slate-300';
                  bgBadge = 'bg-slate-200 text-black';
                } else if (item.category === 'polythene') {
                  colorBorder = 'border-teal-400';
                  bgBadge = 'bg-teal-400 text-black';
                } else if (item.category === 'glass') {
                  colorBorder = 'border-purple-400';
                  bgBadge = 'bg-purple-400 text-black';
                } else if (item.category === 'fiber') {
                  colorBorder = 'border-yellow-300';
                  bgBadge = 'bg-yellow-300 text-black';
                } else if (item.category === 'biodegradable') {
                  colorBorder = 'border-emerald-400';
                  bgBadge = 'bg-emerald-400 text-black';
                } else if (item.category === 'hazard') {
                  colorBorder = 'border-rose-500';
                  bgBadge = 'bg-rose-500 text-white';
                } else if (item.category === 'non-biodegradable') {
                  colorBorder = 'border-slate-400';
                  bgBadge = 'bg-slate-400 text-black';
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    style={{
                      top: `${ymin}%`,
                      left: `${xmin}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                    }}
                    className={`absolute border transition-transform cursor-pointer ${colorBorder} ${
                      isSelected
                        ? 'border-2 ring-2 ring-white/90 z-30 scale-[1.02] shadow-lg'
                        : 'border-opacity-80 hover:scale-[1.01] hover:z-20'
                    }`}
                  >
                    {/* Reticle Tag Badge */}
                    <div
                      className={`absolute -top-5 left-0 px-1.5 py-0.5 text-[9px] font-mono font-bold whitespace-nowrap flex items-center gap-1 max-w-[130px] overflow-hidden truncate shadow-sm ${bgBadge} ${
                        isSelected ? 'z-30 ring-1 ring-white' : 'opacity-90'
                      }`}
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="shrink-0 text-[8px]">{(item.confidence * 100).toFixed(0)}%</span>
                    </div>

                    {/* Centroid Crosshair */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 border border-white bg-black/60 flex items-center justify-center">
                      <span className="w-0.5 h-0.5 bg-white" />
                    </div>
                  </div>
                );
              })}

            {/* Bottom Status Ribbon */}
            <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-[#020508]/95 border-t border-white/[0.08] flex items-center justify-between font-mono text-[10px] text-white/60">
              <div className="flex items-center gap-2">
                {analysis.inferenceEngine === 'NEURAL-EDGE-SIMULATOR' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-300 font-semibold">⚠️ Offline Simulation (Cloud AI Busy)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-300 font-medium">⚡ Live AI Vision ({analysis.inferenceEngine})</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                {analysis.inferenceEngine === 'NEURAL-EDGE-SIMULATOR' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      analyzeImage(currentImage);
                    }}
                    className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-200 hover:bg-amber-500 hover:text-black font-semibold transition-colors"
                  >
                    Retry Live AI Scan
                  </button>
                )}
                <span className="text-white/40">
                  {analysis.detectedItems.length} items cataloged
                </span>
              </div>
            </div>
          </div>

          {/* PROJECTED MATERIAL EXTRACTS & CIRCULAR COMMODITY YIELD */}
          <div className="border border-white/[0.08] bg-[#060a10] p-5 font-mono text-xs space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/[0.08] gap-2">
              <div>
                <div className="flex items-center gap-2 text-white font-semibold uppercase tracking-wider text-[11px]">
                  <LayersIcon size={14} className="text-[#d4af37]" />
                  <span>Total Material Extracts Produced If Recycled</span>
                </div>
                <p className="text-white/50 text-[10px] mt-0.5 font-sans font-light">
                  Projected secondary raw materials & industrial circular commodities generated upon processing:
                </p>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">
                  Circular Yield
                </span>
              </div>
            </div>

            {/* Macro Extraction Summary Strip */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="border border-white/[0.06] bg-black/40 p-2.5">
                <div className="text-[9px] uppercase text-white/40 tracking-wider">Total Extract Output</div>
                <div className="text-sm sm:text-base font-bold text-white mt-0.5">
                  {totalExtractedGrams >= 1000 ? `${(totalExtractedGrams / 1000).toFixed(2)} kg` : `${totalExtractedGrams}g`}
                </div>
                <div className="text-[9px] text-emerald-400 mt-0.5">Recoverable Mass</div>
              </div>
              <div className="border border-white/[0.06] bg-black/40 p-2.5">
                <div className="text-[9px] uppercase text-white/40 tracking-wider">Conversion Efficiency</div>
                <div className="text-sm sm:text-base font-bold text-[#d4af37] mt-0.5">
                  {extractEfficiency}%
                </div>
                <div className="text-[9px] text-white/50 mt-0.5">Avg Yield Rate</div>
              </div>
              <div className="border border-white/[0.06] bg-black/40 p-2.5">
                <div className="text-[9px] uppercase text-white/40 tracking-wider">Virgin Resource Offset</div>
                <div className="text-sm sm:text-base font-bold text-sky-400 mt-0.5">
                  {analysis.recyclabilityScore}%
                </div>
                <div className="text-[9px] text-white/50 mt-0.5">Circular Offset</div>
              </div>
            </div>

            {/* Individual Extract Cards */}
            <div className="space-y-2.5 pt-1">
              {materialExtracts.map((ext, idx) => (
                <div
                  key={idx}
                  className="border border-white/[0.06] hover:border-white/20 bg-white/[0.015] hover:bg-white/[0.03] p-3 transition-colors space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: ext.color }} />
                      <span className="text-white font-semibold text-[11px]">{ext.extractName}</span>
                      <span className="text-[9px] px-1.5 py-0.2 border border-white/10 text-white/50 bg-black/30">
                        {ext.circularLoop}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-white/40">From: {ext.displayName}</span>
                      <span className="text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20">
                        +{ext.outputFormatted} produced
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-white/60 font-sans border-t border-white/[0.04] pt-2">
                    <div className="flex items-start gap-1.5">
                      <span className="text-white/40 font-mono text-[9px] uppercase shrink-0">Output As:</span>
                      <span className="text-white/80 line-clamp-1">{ext.applications}</span>
                    </div>
                    <div className="flex items-start gap-1.5 sm:justify-end">
                      <ZapIcon size={11} className="text-[#d4af37] shrink-0 mt-0.5" />
                      <span className="text-white/70 line-clamp-1">{ext.ecoBenefit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Industrial Circularity Guarantee Footer */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-white/40">
              <div className="flex items-center gap-1.5">
                <CheckCircleIcon size={12} className="text-[#d4af37]" />
                <span>Closed-loop mechanical & biological recovery eliminates landfill emissions</span>
              </div>
              <span className="text-[#d4af37] font-mono text-[9px] uppercase hidden sm:inline">
                ISO 14021 Recycled Content Standard
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: The Composition Dashboard & Visual Pie Chart (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* AI Optical Characterization & Live Diagnostic Summary */}
          <div className="border border-white/[0.08] bg-[#060a10] p-4.5 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <div className="flex items-center gap-2 text-white font-semibold uppercase tracking-wider text-[11px]">
                <SparklesIcon size={14} className="text-[#d4af37]" />
                <span>AI Optical Characterization</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 uppercase font-medium">{analysis.inferenceEngine}</span>
              </div>
            </div>

            <p className="text-white/85 font-sans text-xs leading-relaxed font-light">
              {analysis.summary}
            </p>

            {/* Cataloged Items Chips */}
            {analysis.detectedItems && analysis.detectedItems.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-white/[0.04]">
                <div className="flex items-center justify-between text-[10px] text-white/50">
                  <span className="uppercase tracking-wider">Cataloged Items in Pile ({analysis.detectedItems.length})</span>
                  <span className="text-[#d4af37]">Click to locate</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto pr-1">
                  {analysis.detectedItems.map((item) => {
                    const isSelected = selectedItem?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className={`px-2 py-1 text-[10px] border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'border-[#d4af37] bg-[#d4af37]/20 text-white shadow-sm'
                            : 'border-white/10 bg-black/40 text-white/70 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isRecyclable ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <span>{item.name}</span>
                        <span className="text-white/40 text-[9px]">{item.weightEst}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Item Quick Inspector Drawer */}
            {selectedItem && (
              <div className="border border-[#d4af37]/40 bg-[#d4af37]/[0.04] p-2.5 space-y-1 text-[10px]">
                <div className="flex items-center justify-between font-semibold text-white">
                  <div className="flex items-center gap-1.5">
                    <CrosshairIcon size={11} className="text-[#d4af37]" />
                    <span>Target: {selectedItem.name}</span>
                  </div>
                  <span className="text-[#d4af37]">{(selectedItem.confidence * 100).toFixed(0)}% Confidence</span>
                </div>
                <div className="text-white/60 font-sans leading-tight">
                  <span className="font-mono text-[#d4af37] uppercase text-[9px]">Guidance: </span>
                  {selectedItem.advice}
                </div>
              </div>
            )}
          </div>

          {/* Executive Macro Stat Metrics Strip */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="border border-white/[0.08] bg-[#060a10] p-4">
              <span className="text-white/40 text-[10px] uppercase block tracking-wider">
                Recyclability Score
              </span>
              <div className="font-serif text-3xl text-emerald-400 font-normal mt-1">
                {analysis.recyclabilityScore}%
              </div>
              <span className="text-[10px] text-white/50 mt-1 block">Divertible from Landfill</span>
            </div>

            <div className="border border-white/[0.08] bg-[#060a10] p-4">
              <span className="text-white/40 text-[10px] uppercase block tracking-wider">
                Est. Total Mass
              </span>
              <div className="font-serif text-3xl text-[#d4af37] font-normal mt-1">
                {analysis.totalEstimatedWeight}
              </div>
              <span className="text-[10px] text-white/50 mt-1 block">
                CO2 Offset: {analysis.carbonOffsetKg}
              </span>
            </div>
          </div>

          {/* Composition Donut / Pie Chart Instrument */}
          <div className="border border-white/[0.08] bg-[#060a10] p-6 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-5">
              <div className="flex items-center gap-2 text-white font-semibold uppercase tracking-wider text-[11px]">
                <PieChartIcon size={14} className="text-[#d4af37]" />
                <span>Composition Distribution</span>
              </div>
              <span className="text-[#d4af37] text-[10px]">Multi-Spectral Share</span>
            </div>

            {/* SVG Donut Chart with Center Readout */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
              <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 180 180">
                  {pieSlices.map((slice) => {
                    const isHovered = hoveredSlice === slice.category;
                    return (
                      <path
                        key={slice.category}
                        d={slice.pathData}
                        fill={slice.color}
                        stroke="#060a10"
                        strokeWidth="2"
                        className="transition-transform duration-200 cursor-pointer hover:opacity-90"
                        style={{
                          transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                          transformOrigin: '90px 90px',
                        }}
                        onMouseEnter={() => setHoveredSlice(slice.category)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  })}
                </svg>

                {/* Donut Center Display */}
                <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="font-serif text-3xl font-light text-white">
                    {hoveredSlice
                      ? `${analysis.compositions.find((c) => c.category === hoveredSlice)?.percentage}%`
                      : `${analysis.compositions.length}`}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-white/40">
                    {hoveredSlice
                      ? analysis.compositions.find((c) => c.category === hoveredSlice)?.displayName
                      : 'Fractions'}
                  </span>
                </div>
              </div>

              {/* Biodegradable vs Non-Biodegradable Bar */}
              <div className="w-full space-y-2 border-t sm:border-t-0 sm:border-l border-white/[0.08] pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[10px] text-white/40 uppercase tracking-wider block">
                  Organic Breakdown Ratio:
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400">Biodegradable</span>
                    <span className="font-semibold text-white">
                      {analysis.biodegradableRatio?.biodegradable ?? 25}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.06] overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-400"
                      style={{ width: `${analysis.biodegradableRatio?.biodegradable ?? 25}%` }}
                    />
                    <div
                      className="h-full bg-slate-400"
                      style={{ width: `${analysis.biodegradableRatio?.nonBiodegradable ?? 75}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/60">
                    <span>Non-Biodegradable</span>
                    <span>{analysis.biodegradableRatio?.nonBiodegradable ?? 75}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Normal Listing of Compositions (Comprehensive Table) */}
          <div className="border border-white/[0.08] bg-[#060a10] p-6 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
              <span className="text-white font-semibold uppercase tracking-wider text-[11px]">
                Material Fractions & Destination
              </span>
              <span className="text-white/40 text-[10px]">Mass (g) / Share</span>
            </div>

            <div className="space-y-3">
              {analysis.compositions.map((item) => (
                <div
                  key={item.category}
                  onMouseEnter={() => setHoveredSlice(item.category)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  className={`border-b border-white/[0.04] pb-2.5 transition-colors ${
                    hoveredSlice === item.category ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-white font-medium">{item.displayName}</span>
                    </span>

                    <div className="flex items-center gap-3">
                      <span className="text-white/40 text-[10px]">{item.weightEst}</span>
                      <span className="font-semibold text-white w-10 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-white/50 mt-1 pl-4.5">
                    <span className="truncate pr-2">{item.disposalBin}</span>
                    <span
                      className={`px-1.5 py-0.2 text-[9px] font-semibold border ${
                        item.isRecyclable
                          ? 'border-emerald-500/40 text-emerald-400'
                          : 'border-slate-500/40 text-slate-400'
                      }`}
                    >
                      {item.isRecyclable ? 'RECYCLE' : 'RESIDUAL'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Export Official Audit Certificate Action */}
            <div className="pt-5 mt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowCertModal(true)}
                className="w-full py-2.5 bg-white/[0.06] hover:bg-white text-white hover:text-black font-semibold border border-white/20 transition-colors flex items-center justify-center gap-2"
              >
                <FileTextIcon size={14} />
                <span>Issue & Print Official Material Audit Certificate</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
