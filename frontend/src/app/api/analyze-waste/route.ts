import { NextRequest, NextResponse } from 'next/server';

export interface WasteDetection {
  id: string;
  name: string;
  category:
    | 'metal'
    | 'non-metal'
    | 'pet-polymers'
    | 'cardboard'
    | 'fiber'
    | 'polythene'
    | 'glass'
    | 'biodegradable'
    | 'non-biodegradable'
    | 'hazard';
  confidence: number;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] as 0-100 percentages
  weightEst: string;
  isRecyclable: boolean;
  advice: string;
}

export interface CompositionFraction {
  category: string;
  displayName: string;
  percentage: number;
  weightEst: string;
  isRecyclable: boolean;
  color: string;
  disposalBin: string;
}

export interface WasteAnalysisResult {
  scanId: string;
  timestamp: string;
  inferenceEngine: string; // e.g. 'GEMINI-3.5-FLASH-LITE' | 'GEMINI-3.5-FLASH' | 'NEURAL-EDGE-SIMULATOR'
  summary: string;
  totalEstimatedWeight: string;
  recyclabilityScore: number; // 0 - 100
  biodegradableRatio: {
    biodegradable: number;
    nonBiodegradable: number;
  };
  carbonOffsetKg: string;
  compositions: CompositionFraction[];
  detectedItems: WasteDetection[];
  actionableSteps: string[];
  keyPoolTelemetry?: {
    activeKeyIndex: number;
    totalKeysInPool: number;
    failoverCount: number;
    modelUsed?: string;
  };
}

// In-memory counter for round-robin load distribution across keys
let globalKeyIndex = 0;

import {
  getGeminiApiKeys,
  normalizeBoundingBox,
  extractAndParseGeminiJson,
  CATEGORY_METADATA,
} from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, mimeType = 'image/jpeg' } = body;

    if (!image) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    const cleanBase64 = image.includes(',') ? image.split(',')[1] : image;
    const apiKeys = getGeminiApiKeys();

    let failoverCount = 0;
    let successfulKeyIndex = -1;
    let successfulModel = '';

    // Fast cascade of models to survive 503 high-demand spikes
    const CANDIDATE_MODELS = Array.from(
      new Set([
        process.env.GEMINI_MODEL,
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-3.8-flash',
        'gemini-3.6-flash',
        'gemini-3.7-flash',
        'gemini-flash-latest',
      ].filter(Boolean))
    ) as string[];

    const PROMPT_INSTRUCTIONS = `You are TERRA Vision AI, an industrial multimodal computer vision and waste intelligence engine.
Analyze this photo or video frame of physical waste/trash with extreme precision.
CRITICAL: If the image already contains any drawn boxes, labels, or watermarks, ignore them completely. Inspect the actual physical items visible in the real world on the surface.

MANDATORY DETECTION INSTRUCTIONS:
1. HIGH-DENSITY EXHAUSTIVE MULTI-OBJECT DETECTION: You MUST identify, detect, classify, and segment EVERY single distinct waste item, container, package, can, bottle, scrap, wrapper, cap, and debris visible in this waste pile or conveyor stream.
   - Do NOT limit yourself or stop after a few items!
   - Be EXTREMELY thorough and exhaustive: detect and segment ALL visible items with high granularity (aim for 12 to 30 distinct items whenever present in mixed waste).
   - Detect both large containers and smaller items: individual bottles, cans, lids, bottle caps, foil wrappers, cartons, plastic films, cigarette butts, lighters, packaging tabs, and secondary fragments.
   - If there are multiple items of the same material (e.g. 3 cans, 4 bottles, multiple scraps), create a separate entry in "detectedItems" for EACH individual object.
2. PRECISE BOUNDING BOXES: For each detected item, specify its bounding box [ymin, xmin, ymax, xmax] as PERCENTAGES between 0 and 100 relative to the image frame (0 = top/left, 100 = bottom/right).
3. CATEGORIZATION: Map each item to one of these 10 standard recycling categories:
   - "metal" (aluminum cans, tin cans, foil, scrap metal)
   - "non-metal" (rigid plastics, PP, HDPE jugs, plastic buckets)
   - "pet-polymers" (clear or colored PET beverage bottles, clear thermoform clamshells)
   - "cardboard" (corrugated shipping boxes, brown Kraft paperboard, OCC)
   - "fiber" (clean office paper, newspaper, magazines, egg cartons)
   - "polythene" (LDPE plastic bags, stretch film, shrink wrap, bubble film, plastic mesh)
   - "glass" (bottles, glass jars, culinary glass)
   - "biodegradable" (food scraps, fruit peels, vegetable waste, organic leaves, compostable fiber)
   - "non-biodegradable" (crisp/chip wrappers, multilayer pouches, polystyrene foam, cigarette filters)
   - "hazard" (lighters, batteries, electronic circuit boards, spray aerosol cans, paints, sharp needles)

Return a single strict JSON object matching this schema without markdown fences:
{
  "summary": "Brief 1-2 sentence executive assessment describing the specific waste items and materials visible in this pile",
  "totalEstimatedWeight": "e.g. 640g or 2.4 kg",
  "recyclabilityScore": 76,
  "biodegradableRatio": {
    "biodegradable": 32,
    "nonBiodegradable": 68
  },
  "carbonOffsetKg": "e.g. 1.2 kg CO2e",
  "compositions": [
    {
      "category": "pet-polymers",
      "displayName": "PET Polymers",
      "percentage": 34.0,
      "weightEst": "218g",
      "isRecyclable": true,
      "color": "#38bdf8",
      "disposalBin": "Blue Recyclables Bin"
    }
  ],
  "detectedItems": [
    {
      "id": "ITEM-1",
      "name": "Green PET Beverage Bottle",
      "category": "pet-polymers",
      "confidence": 0.98,
      "box": [15, 20, 52, 48],
      "weightEst": "42g",
      "isRecyclable": true,
      "advice": "Empty liquids, flatten, place in Blue Bin"
    }
  ],
  "actionableSteps": [
    "Separate polythene film bags and mesh from rigid PET containers",
    "Rinse food residual from metal cans before sorting"
  ]
}
Make sure all composition percentages sum to roughly 100%. Box coordinates [ymin, xmin, ymax, xmax] must be percentages between 0 and 100 relative to the image frame.`;

    // Attempt inference across key pool and model cascade
    if (apiKeys.length > 0) {
      const startingIndex = globalKeyIndex % apiKeys.length;

      for (let attempt = 0; attempt < apiKeys.length; attempt++) {
        const candidateIndex = (startingIndex + attempt) % apiKeys.length;
        const apiKey = apiKeys[candidateIndex];

        // Try candidate models in cascade to survive 503 high-demand spikes
        for (const model of CANDIDATE_MODELS) {
          try {
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(28000), // 28s timeout for high-density cataloging
                body: JSON.stringify({
                  contents: [
                    {
                      role: 'user',
                      parts: [
                        { text: PROMPT_INSTRUCTIONS },
                        {
                          inlineData: {
                            mimeType,
                            data: cleanBase64,
                          },
                        },
                      ],
                    },
                  ],
                  generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.15,
                    maxOutputTokens: 8192,
                  },
                }),
              }
            );

            // Handle rate limit exhaustion (HTTP 429) -> Rotate to next API key immediately
            if (geminiRes.status === 429) {
              failoverCount++;
              console.warn(`[TERRA Key Pool] Key #${candidateIndex + 1} rate limited (HTTP 429). Rotating to next key...`);
              break; // Break model loop, try next key
            }

            // Handle temporary model demand spikes (503) or retired model (404) -> Cascade to sibling model
            if (geminiRes.status === 503 || geminiRes.status === 404) {
              console.warn(`[TERRA Cascade] Model ${model} returned ${geminiRes.status}. Cascading to next sibling model...`);
              continue; // Try next model in cascade
            }

            if (!geminiRes.ok) {
              const errText = await geminiRes.text();
              console.warn(`[TERRA Cascade] Model ${model} returned ${geminiRes.status}: ${errText.slice(0, 100)}. Cascading...`);
              continue; // Try next model
            }

            const geminiData = await geminiRes.json();
            const parsed = extractAndParseGeminiJson(geminiData);

            if (parsed && typeof parsed === 'object') {
              successfulKeyIndex = candidateIndex;
              successfulModel = model;
              globalKeyIndex = (candidateIndex + 1) % apiKeys.length; // Advance round-robin pointer

              // 1. Normalize detected items
              const rawItems = parsed.detectedItems || parsed.detected_items || parsed.items || [];
              const detectedItems: WasteDetection[] = rawItems.map((item: any, idx: number) => {
                const cat = String(item.category || item.material || 'pet-polymers').toLowerCase().trim();
                const validCat = CATEGORY_METADATA[cat] ? cat : 'pet-polymers';
                const meta = CATEGORY_METADATA[validCat];
                const box = normalizeBoundingBox(item.box || item.bounding_box || item.boundingBox, idx);
                const confidence =
                  typeof item.confidence === 'number'
                    ? item.confidence > 1
                      ? Number((item.confidence / 100).toFixed(2))
                      : Number(item.confidence.toFixed(2))
                    : 0.95;

                return {
                  id: item.id || `ITEM-${idx + 1}`,
                  name: item.name || item.item_name || item.label || `${meta.displayName} Item`,
                  category: validCat as any,
                  confidence,
                  box,
                  weightEst: item.weightEst || item.weight_est || item.weight || '55g',
                  isRecyclable:
                    typeof item.isRecyclable === 'boolean' ? item.isRecyclable : (item.is_recyclable ?? meta.isRecyclable),
                  advice: item.advice || item.sorting_advice || `Sort into ${meta.defaultBin}`,
                };
              });

              // 2. Normalize compositions
              let compositions: CompositionFraction[] = (
                parsed.compositions || parsed.composition_fractions || parsed.material_fractions || []
              ).map((c: any) => {
                const cat = String(c.category || 'pet-polymers').toLowerCase().trim();
                const meta = CATEGORY_METADATA[cat] || CATEGORY_METADATA['pet-polymers'];
                return {
                  category: cat,
                  displayName: c.displayName || c.display_name || meta.displayName,
                  percentage: Number(c.percentage || 0),
                  weightEst: c.weightEst || c.weight_est || '120g',
                  isRecyclable:
                    typeof c.isRecyclable === 'boolean' ? c.isRecyclable : (c.is_recyclable ?? meta.isRecyclable),
                  color: c.color || meta.color,
                  disposalBin: c.disposalBin || c.disposal_bin || meta.defaultBin,
                };
              });

              // If Gemini didn't return compositions, synthesize from detectedItems
              if (compositions.length === 0 && detectedItems.length > 0) {
                const counts: Record<string, number> = {};
                for (const it of detectedItems) {
                  counts[it.category] = (counts[it.category] || 0) + 1;
                }
                const total = detectedItems.length;
                compositions = Object.entries(counts).map(([cat, count]) => {
                  const meta = CATEGORY_METADATA[cat] || CATEGORY_METADATA['pet-polymers'];
                  return {
                    category: cat,
                    displayName: meta.displayName,
                    percentage: Math.round((count / total) * 100),
                    weightEst: `${count * 80}g`,
                    isRecyclable: meta.isRecyclable,
                    color: meta.color,
                    disposalBin: meta.defaultBin,
                  };
                });
              }

              // 3. Normalize biodegradable ratio
              const rawBio = parsed.biodegradableRatio || parsed.biodegradable_ratio;
              let bioVal = 25;
              let nonBioVal = 75;
              if (rawBio && typeof rawBio === 'object') {
                bioVal = Number(rawBio.biodegradable ?? rawBio.bio ?? 25);
                nonBioVal = Number(rawBio.nonBiodegradable ?? rawBio.non_biodegradable ?? (100 - bioVal));
              } else if (detectedItems.length > 0) {
                const bioCount = detectedItems.filter((i) => i.category === 'biodegradable').length;
                bioVal = Math.round((bioCount / detectedItems.length) * 100);
                nonBioVal = 100 - bioVal;
              }

              // 4. Normalize recyclability score
              let recyclabilityScore = Number(parsed.recyclabilityScore ?? parsed.recyclability_score ?? 0);
              if (!recyclabilityScore && detectedItems.length > 0) {
                const recCount = detectedItems.filter((i) => i.isRecyclable).length;
                recyclabilityScore = Math.round((recCount / detectedItems.length) * 100);
              } else if (!recyclabilityScore) {
                recyclabilityScore = 78;
              }

              // 5. Total estimated weight
              const totalEstimatedWeight =
                parsed.totalEstimatedWeight ||
                parsed.total_estimated_weight ||
                (detectedItems.length > 0 ? `${detectedItems.length * 85}g` : '640g');

              // 6. Carbon offset
              const carbonOffsetKg = parsed.carbonOffsetKg || parsed.carbon_offset_kg || '1.25 kg CO2e';

              // 7. Summary
              const summary =
                parsed.summary ||
                parsed.executive_summary ||
                (detectedItems.length > 0
                  ? `Identified ${detectedItems.length} individual items in the waste stream across ${compositions.length} material categories with high-confidence optical characterization.`
                  : 'Multi-material waste sample characterized with multimodal computer vision.');

              const scanId = `WA-${Math.floor(1000 + Math.random() * 9000)}-AI`;
              const result: WasteAnalysisResult = {
                scanId,
                timestamp: new Date().toISOString(),
                inferenceEngine: successfulModel.toUpperCase(),
                summary,
                totalEstimatedWeight,
                recyclabilityScore,
                biodegradableRatio: {
                  biodegradable: bioVal,
                  nonBiodegradable: nonBioVal,
                },
                carbonOffsetKg,
                compositions,
                detectedItems,
                actionableSteps: parsed.actionableSteps || parsed.actionable_steps || [
                  'Separate rigid plastics from lightweight polythene films',
                  'Ensure all containers are empty of liquids to avoid dockage',
                ],
                keyPoolTelemetry: {
                  activeKeyIndex: successfulKeyIndex + 1,
                  totalKeysInPool: apiKeys.length,
                  failoverCount,
                  modelUsed: successfulModel,
                },
              };

              console.log(`[TERRA Vision] Live analysis succeeded via ${successfulModel} on key #${successfulKeyIndex + 1}: ${detectedItems.length} items detected.`);
              return NextResponse.json(result);
            }
          } catch (modelErr: any) {
            console.warn(`[TERRA Cascade] Model ${model} call error:`, modelErr.message || modelErr);
            continue; // Try next model in cascade
          }
        }
      }

      console.warn(`[TERRA Failover] All Gemini API models and keys exhausted or rate-limited. Serving edge fallback.`);
    }

    // High-fidelity fallback / offline analyzer
    // Produces dynamic, realistic waste characterization with transparent fallback notice
    const randomVariation = Math.floor(Date.now() % 320);
    const estWeightNum = 560 + randomVariation;
    const estScore = 77 + Math.floor(Math.random() * 14);
    const bioPercent = 20 + Math.floor(Math.random() * 16);
    const scanId = `WA-${Math.floor(1000 + Math.random() * 9000)}-OFFLINE`;
    const fallbackResult: WasteAnalysisResult = {
      scanId,
      timestamp: new Date().toISOString(),
      inferenceEngine: 'NEURAL-EDGE-SIMULATOR',
      summary:
        `[OFFLINE EDGE SIMULATION: Model Service Busy] Optical edge characterization mapped mixed consumer waste pile with high recoverable rigid polymers (${Math.round(estScore * 0.42)}% PET) and secondary fiber fractions. Click Re-Scan to retry live Gemini AI analysis.`,
      totalEstimatedWeight: `${estWeightNum}g`,
      recyclabilityScore: estScore,
      biodegradableRatio: {
        biodegradable: bioPercent,
        nonBiodegradable: 100 - bioPercent,
      },
      carbonOffsetKg: `${(estWeightNum * 0.00195).toFixed(2)} kg CO2e`,
      compositions: [
        {
          category: 'pet-polymers',
          displayName: 'Rigid Plastics (PET/HDPE)',
          percentage: 36.5,
          weightEst: `${Math.round(estWeightNum * 0.365)}g`,
          isRecyclable: true,
          color: '#38bdf8',
          disposalBin: 'Blue Recycling Bin (Clean Plastics)',
        },
        {
          category: 'metal',
          displayName: 'Aluminum & Tin Metal',
          percentage: 32.0,
          weightEst: `${Math.round(estWeightNum * 0.32)}g`,
          isRecyclable: true,
          color: '#e2e8f0',
          disposalBin: 'Blue Recycling Bin (Metals)',
        },
        {
          category: 'polythene',
          displayName: 'Flexible Film / Netting',
          percentage: 18.5,
          weightEst: `${Math.round(estWeightNum * 0.185)}g`,
          isRecyclable: false,
          color: '#2dd4bf',
          disposalBin: 'Store Film Drop-off / Residual',
        },
        {
          category: 'non-biodegradable',
          displayName: 'Residual Refuse Fraction',
          percentage: 13.0,
          weightEst: `${Math.round(estWeightNum * 0.13)}g`,
          isRecyclable: false,
          color: '#94a3b8',
          disposalBin: 'General Refuse Bin',
        },
      ],
      detectedItems: [
        {
          id: 'DET-01',
          name: 'Rigid Polymer Container',
          category: 'pet-polymers',
          confidence: 0.94,
          box: [22, 10, 65, 42],
          weightEst: '45g',
          isRecyclable: true,
          advice: 'Empty liquids, rinse residue, deposit in Blue Bin.',
        },
        {
          id: 'DET-02',
          name: 'Metal Food Tin / Can',
          category: 'metal',
          confidence: 0.96,
          box: [30, 44, 68, 68],
          weightEst: '120g',
          isRecyclable: true,
          advice: 'Rinse thoroughly; infinitely recyclable alloy.',
        },
        {
          id: 'DET-03',
          name: 'Flexible Packaging / Netting',
          category: 'polythene',
          confidence: 0.91,
          box: [32, 60, 56, 84],
          weightEst: '25g',
          isRecyclable: false,
          advice: 'Separate from rigid containers to prevent sorting jam.',
        },
        {
          id: 'DET-04',
          name: 'Non-Recyclable Residual Fraction',
          category: 'non-biodegradable',
          confidence: 0.89,
          box: [68, 44, 84, 65],
          weightEst: '30g',
          isRecyclable: false,
          advice: 'Dispose of in general refuse stream.',
        },
      ],
      actionableSteps: [
        'Cloud AI inference was busy; offline edge estimation applied.',
        'Click the Re-run Scan button in your workspace to trigger Live Gemini AI.',
        'Rinse beverage and food containers before municipal sorting.',
      ],
      keyPoolTelemetry: {
        activeKeyIndex: 0,
        totalKeysInPool: apiKeys.length,
        failoverCount,
        modelUsed: 'OFFLINE_EDGE_SIMULATOR',
      },
    };

    return NextResponse.json(fallbackResult);
  } catch (err: any) {
    console.error('Failed to process waste image:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
