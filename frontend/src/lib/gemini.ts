/**
 * Shared TERRA Gemini Vision AI Utilities
 * Provides deduplicated API key resolution, coordinate normalization,
 * JSON extraction, and standardized waste category metadata.
 */

export const CATEGORY_METADATA: Record<
  string,
  { color: string; displayName: string; defaultBin: string; isRecyclable: boolean }
> = {
  'pet-polymers': { color: '#38bdf8', displayName: 'PET Polymers', defaultBin: 'Blue Bin · Clean Rigid Plastics', isRecyclable: true },
  'cardboard': { color: '#fbbf24', displayName: 'Corrugated Cardboard', defaultBin: 'Yellow Bin · Dry Fiber', isRecyclable: true },
  'metal': { color: '#e2e8f0', displayName: 'Aluminum & Metal', defaultBin: 'Blue Bin · Metals & Cans', isRecyclable: true },
  'glass': { color: '#c084fc', displayName: 'Container Glass', defaultBin: 'Glass Drop Cell', isRecyclable: true },
  'polythene': { color: '#2dd4bf', displayName: 'Polythene Film (LDPE)', defaultBin: 'Store Film Return Drop', isRecyclable: false },
  'fiber': { color: '#fde047', displayName: 'Mixed Paper Fiber', defaultBin: 'Yellow Bin · Paper Bales', isRecyclable: true },
  'non-metal': { color: '#60a5fa', displayName: 'Rigid Polyolefins (HDPE/PP)', defaultBin: 'Rigid Plastics Line', isRecyclable: true },
  'biodegradable': { color: '#10b981', displayName: 'Organic Bio-Waste', defaultBin: 'Green Organics Bin', isRecyclable: true },
  'non-biodegradable': { color: '#94a3b8', displayName: 'Residual Non-Recyclable', defaultBin: 'General Refuse Bin', isRecyclable: false },
  'hazard': { color: '#f43f5e', displayName: 'Hazardous Waste', defaultBin: 'Dedicated Hazardous Drop-off', isRecyclable: false },
};

/**
 * Extracts and deduplicates all configured Gemini API keys from environment variables.
 */
export function getGeminiApiKeys(): string[] {
  const keys: string[] = [];

  if (process.env.GEMINI_API_KEYS) {
    const list = process.env.GEMINI_API_KEYS.split(/[,;\n\r]+/)
      .map((k) => k.trim())
      .filter(Boolean);
    for (const k of list) {
      if (!keys.includes(k)) keys.push(k);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    const single = process.env.GEMINI_API_KEY.trim();
    if (single && !keys.includes(single)) {
      keys.push(single);
    }
  }

  if (process.env.GEMINI_API_KEY_BACKUP) {
    const backup = process.env.GEMINI_API_KEY_BACKUP.trim();
    if (backup && !keys.includes(backup)) {
      keys.push(backup);
    }
  }

  for (let i = 1; i <= 20; i++) {
    const envVal = process.env[`GEMINI_API_KEY_${i}`]?.trim();
    if (envVal && !keys.includes(envVal)) {
      keys.push(envVal);
    }
  }

  return keys;
}

/**
 * Normalizes any bounding box representation (array, object, 0-1 float, 0-1000 int)
 * into standard percentage bounds [ymin, xmin, ymax, xmax] clamped between 0 and 100.
 */
export function normalizeBoundingBox(rawBox: any, index: number): [number, number, number, number] {
  let coords: [number, number, number, number] = [20, 20, 50, 50];

  if (Array.isArray(rawBox) && rawBox.length === 4) {
    coords = [Number(rawBox[0]), Number(rawBox[1]), Number(rawBox[2]), Number(rawBox[3])];
  } else if (rawBox && typeof rawBox === 'object') {
    coords = [
      Number(rawBox.ymin ?? rawBox.top ?? 20),
      Number(rawBox.xmin ?? rawBox.left ?? 20),
      Number(rawBox.ymax ?? rawBox.bottom ?? 50),
      Number(rawBox.xmax ?? rawBox.right ?? 50),
    ];
  } else {
    const row = Math.floor(index / 2);
    const col = index % 2;
    return [12 + (row % 3) * 28, 12 + col * 44, 36 + (row % 3) * 28, 48 + col * 44];
  }

  let [ymin, xmin, ymax, xmax] = coords.map((n) => (isNaN(n) ? 20 : n));

  // 1. Detect 0..1000 scale: if ANY coordinate is > 100, the entire box is on 0..1000 scale
  if (ymin > 100 || xmin > 100 || ymax > 100 || xmax > 100) {
    ymin = ymin / 10;
    xmin = xmin / 10;
    ymax = ymax / 10;
    xmax = xmax / 10;
  }
  // 2. Detect 0..1 float scale: if all are <= 1.05 and any is > 0
  else if (ymin <= 1.05 && xmin <= 1.05 && ymax <= 1.05 && xmax <= 1.05 && (ymax > 0 || xmax > 0)) {
    ymin = ymin * 100;
    xmin = xmin * 100;
    ymax = ymax * 100;
    xmax = xmax * 100;
  }

  // Ensure ymin < ymax and xmin < xmax
  if (ymin > ymax) [ymin, ymax] = [ymax, ymin];
  if (xmin > xmax) [xmin, xmax] = [xmax, xmin];

  // Round to integers and clamp within 0..100 viewport
  ymin = Math.max(1, Math.min(92, Math.round(ymin)));
  xmin = Math.max(1, Math.min(92, Math.round(xmin)));
  ymax = Math.max(ymin + 4, Math.min(99, Math.round(ymax)));
  xmax = Math.max(xmin + 4, Math.min(99, Math.round(xmax)));

  return [ymin, xmin, ymax, xmax];
}

/**
 * Safely extracts markdown-fenced or raw JSON from Gemini API response candidates.
 */
export function extractAndParseGeminiJson(geminiData: any): any {
  if (!geminiData?.candidates?.[0]?.content?.parts) {
    return null;
  }
  const parts = geminiData.candidates[0].content.parts;
  let text = '';

  for (const part of parts) {
    if (!part.thought && typeof part.text === 'string' && part.text.trim()) {
      text = part.text;
      break;
    }
  }

  if (!text) {
    text = parts
      .filter((p: any) => !p.thought)
      .map((p: any) => p.text || '')
      .join('\n');
  }

  if (!text) {
    text = parts.map((p: any) => p.text || '').join('\n');
  }

  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('[TERRA Parser] JSON parse error on extracted text:', err);
    return null;
  }
}
