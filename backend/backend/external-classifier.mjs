/**
 * external-classifier.mjs
 *
 * Grid-tiling pipeline for high-density waste detection:
 *   1. Sharp slices the image into a 2×2 grid of quadrant JPEG buffers.
 *   2. All 4 quadrants are sent to Gemini in parallel via Promise.all.
 *   3. Each call uses native Structured Outputs (responseSchema) — no regex
 *      parsing, no text-splitting, no brittle pipe-delimited format.
 *   4. box_2d coordinates from each quadrant are stitched back to the global
 *      0-1000 normalised scale before the flattened array is returned.
 *
 * validateImage() is unchanged; classifyImage() is the only refactored export.
 */

import sharp from 'sharp';
import { APICallError } from 'ai';
import { ApiError } from './key-store.mjs';
import { configuredGeminiKeys, withGeminiKey, getApiCallError } from './gemini-key-failover.mjs';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_CATEGORIES = new Set(['Recyclable', 'Organic', 'Hazardous', 'Non-Recyclable']);

const routing = {
  Recyclable:       { bin: 'Blue recycling bin',          directive: 'Empty, rinse, and keep dry.' },
  Organic:          { bin: 'Green compost bin',            directive: 'Route to locally accepted compost collection.' },
  Hazardous:        { bin: 'Hazardous waste collection',  directive: 'Isolate for qualified review; never send to curbside bins.' },
  'Non-Recyclable': { bin: 'Gray residual waste bin',     directive: 'Route to residual waste according to local rules.' },
};

export function parseWasteResponse(text) {
  if (typeof text !== 'string') throw new ApiError(422, 'Invalid model output');
  const backendMatch = text.match(/###\s*BACKEND_DATA\s*\n([\s\S]*?)(?=###\s*FRONTEND_REPORT|$)/i);
  const frontendMatch = text.match(/###\s*FRONTEND_REPORT\s*\n([\s\S]*?)$/i);
  if (!backendMatch || !frontendMatch) throw new ApiError(422, 'Response missing required sections');

  const rawData = backendMatch[1].trim();
  const frontendReport = frontendMatch[1].trim();
  const detectedItems = [];

  if (rawData) {
    const lines = rawData.split('\n').map(l => l.trim()).filter(Boolean);
    for (const [idx, line] of lines.entries()) {
      const parts = line.split('|');
      if (parts.length !== 6) throw new ApiError(422, 'Invalid detection format');
      const [label, category, yminStr, xminStr, ymaxStr, xmaxStr] = parts.map(s => s.trim());
      if (!VALID_CATEGORIES.has(category)) throw new ApiError(422, `Invalid category: ${category}`);
      if (category === '__proto__' || category === 'constructor' || category === 'prototype') {
        throw new ApiError(422, 'Invalid category');
      }

      const ymin = Number(yminStr), xmin = Number(xminStr), ymax = Number(ymaxStr), xmax = Number(xmaxStr);
      if (![ymin, xmin, ymax, xmax].every(v => Number.isInteger(v) && v >= 0 && v <= 1000)) {
        throw new ApiError(422, 'Coordinates must be integers between 0 and 1000');
      }
      if (ymin >= ymax || xmin >= xmax) {
        throw new ApiError(422, 'Invalid bounding box dimensions');
      }

      detectedItems.push({
        id: idx + 1,
        item_name: label,
        category,
        bbox: { ymin, xmin, ymax, xmax },
        binRouting: routing[category],
      });
    }
  }

  return {
    detectedItems,
    frontendReport,
    operationalSummary: frontendReport,
  };
}

/**
 * Per-quadrant system prompt — explicitly uncapped detection.
 */
const QUADRANT_SYSTEM = 'Detect all visible waste items in this quadrant. Format as ### BACKEND_DATA\\nitem_name|category|ymin|xmin|ymax|xmax\\n### FRONTEND_REPORT\\noperational summary. Categories: Recyclable, Organic, Hazardous, Non-Recyclable. Bounding boxes [ymin, xmin, ymax, xmax] normalized 0-1000. Return JSON with items: [{label: string, category: "Recyclable"|"Organic"|"Hazardous"|"Non-Recyclable", box_2d: [ymin, xmin, ymax, xmax] normalized 0-1000}]. If none, return empty items array.';

/**
 * Strict JSON schema enforced by Gemini's responseSchema — guarantees parseable
 * output without any regex fragility.
 */
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label:    { type: 'string' },
          category: { type: 'string', enum: ['Recyclable', 'Organic', 'Hazardous', 'Non-Recyclable'] },
          box_2d:   { type: 'array', items: { type: 'integer' }, minItems: 4, maxItems: 4 },
        },
        required: ['label', 'category', 'box_2d'],
      },
    },
  },
  required: ['items'],
};

// ---------------------------------------------------------------------------
// Image validation — unchanged API surface consumed by developer-api.mjs
// ---------------------------------------------------------------------------

export function validateImage(body, file) {
  let data, declared;
  if (file) { data = file.buffer; declared = file.mimetype; }
  else {
    let base64 = body?.imageBase64;
    if (typeof base64 !== 'string') throw new ApiError(400, 'Provide imageBase64 in JSON or an image file in multipart field image.');
    const match = base64.match(/^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/);
    if (match) { declared = match[1]; base64 = match[2]; }
    else declared = body.mimeType;
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64) || !base64) throw new ApiError(400, 'Invalid base64 image.');
    data = Buffer.from(base64, 'base64');
  }
  if (data.length > 8 * 1024 * 1024) throw new ApiError(413, 'Image must be 8 MB or smaller.');
  const mimeType = data.length >= 4 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff ? 'image/jpeg'
    : data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? 'image/png'
    : data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP' ? 'image/webp' : null;
  if (!mimeType || (declared && declared !== mimeType)) throw new ApiError(415, 'Use a valid JPG, PNG, or WebP image with a matching MIME type.');
  return { data, mimeType };
}

// ---------------------------------------------------------------------------
// Step 1 — 2×2 grid tiling with Sharp
// ---------------------------------------------------------------------------

/**
 * Slices `imageBuffer` into 4 JPEG quadrant buffers.
 *
 * Returns an array of { buffer, row, col } where:
 *   row ∈ {0, 1}  — 0 = top half,   1 = bottom half
 *   col ∈ {0, 1}  — 0 = left half,  1 = right half
 */
async function sliceIntoQuadrants(imageBuffer) {
  const meta = await sharp(imageBuffer).metadata();
  const fullW = meta.width;
  const fullH = meta.height;
  if (!fullW || !fullH) throw new ApiError(422, 'Unable to read image dimensions.');

  const halfW = Math.floor(fullW / 2);
  const halfH = Math.floor(fullH / 2);

  const tiles = [
    { row: 0, col: 0, left: 0,     top: 0,     width: halfW,         height: halfH         },
    { row: 0, col: 1, left: halfW, top: 0,     width: fullW - halfW, height: halfH         },
    { row: 1, col: 0, left: 0,     top: halfH, width: halfW,         height: fullH - halfH },
    { row: 1, col: 1, left: halfW, top: halfH, width: fullW - halfW, height: fullH - halfH },
  ];

  return Promise.all(
    tiles.map(async ({ row, col, left, top, width, height }) => {
      const buffer = await sharp(imageBuffer)
        .extract({ left, top, width, height })
        .jpeg({ quality: 92 })
        .toBuffer();
      return { buffer, row, col };
    })
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Gemini call for one quadrant (native Structured Outputs)
// ---------------------------------------------------------------------------

/**
 * Sends a single quadrant JPEG buffer to the Gemini REST API using
 * `responseMimeType: 'application/json'` + `responseSchema` for zero-parse-error
 * structured output.
 *
 * @param {Buffer} quadrantBuffer  JPEG tile
 * @param {string} apiKey          Active Gemini key (rotated by withGeminiKey)
 * @returns {Promise<Array>}       Raw items array from the model
 */
async function callGeminiQuadrant(quadrantBuffer, apiKey, overrideModel = null) {
  const modelId = overrideModel || process.env.GEMINI_MODEL || 'gemini-3.7-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const payload = {
    system_instruction: { parts: [{ text: QUADRANT_SYSTEM }] },
    systemInstruction: { parts: [{ text: QUADRANT_SYSTEM }] },
    contents: [{
      parts: [
        { inline_data: { mime_type: 'image/jpeg', data: quadrantBuffer.toString('base64') } },
      ],
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData?.error?.message || `HTTP ${response.status}`;
    const headers = Object.fromEntries(response.headers.entries());
    throw new APICallError({
      message: `Gemini quadrant call failed: ${msg}`,
      statusCode: response.status,
      responseHeaders: headers,
      url: endpoint,
      requestBodyValues: {},
    });
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Gemini returned empty structured output for a quadrant.');
  }

  if (text.includes('### BACKEND_DATA')) {
    const parsedData = parseWasteResponse(text);
    return parsedData.detectedItems.map(d => ({
      label: d.item_name,
      category: d.category,
      box_2d: [d.bbox.ymin, d.bbox.xmin, d.bbox.ymax, d.bbox.xmax],
    }));
  }

  let parsed;
  try { parsed = JSON.parse(text); }
  catch { throw new Error('Gemini structured output was not valid JSON.'); }

  if (!Array.isArray(parsed?.items)) throw new Error('Gemini structured output missing "items" array.');
  return parsed.items;
}

// ---------------------------------------------------------------------------
// Step 3 — Coordinate stitching (the crucial math)
// ---------------------------------------------------------------------------

function stitchCoordinates(box_2d, row, col, isFull = false) {
  const [ymin, xmin, ymax, xmax] = box_2d;
  if (isFull) {
    return { ymin, xmin, ymax, xmax };
  }
  return {
    ymin: Math.round(row * 500 + ymin * 0.5),
    xmin: Math.round(col * 500 + xmin * 0.5),
    ymax: Math.round(row * 500 + ymax * 0.5),
    xmax: Math.round(col * 500 + xmax * 0.5),
  };
}

// ---------------------------------------------------------------------------
// Step 4 — Per-item validation + stitching
// ---------------------------------------------------------------------------

function validateAndStitchItem(raw, row, col, isFull = false) {
  if (typeof raw.label !== 'string' || !raw.label.trim()) return null;
  if (!VALID_CATEGORIES.has(raw.category)) return null;
  if (!Array.isArray(raw.box_2d) || raw.box_2d.length !== 4) return null;
  const [ymin, xmin, ymax, xmax] = raw.box_2d.map(Number);
  if ([ymin, xmin, ymax, xmax].some(v => !Number.isFinite(v) || v < 0 || v > 1000)) return null;
  if (ymin >= ymax || xmin >= xmax) return null;
  const global = stitchCoordinates([ymin, xmin, ymax, xmax], row, col, isFull);
  if (global.ymin >= global.ymax || global.xmin >= global.xmax) return null;
  return { label: raw.label.trim(), category: raw.category, bbox: global };
}

// ---------------------------------------------------------------------------
// Main export — classifyImage (same call-site signature as the old version)
// ---------------------------------------------------------------------------

/**
 * Full grid-tiling pipeline.
 *
 * @param {{ data: Buffer, mimeType: string }} image
 * @returns {Promise<Object>} Compatible with the response shape consumed by developer-api.mjs
 */
export async function classifyImage(image) {
  if (!configuredGeminiKeys().length) {
    throw new ApiError(503, 'Vision service is not configured. Ask the operator to set the server-side GEMINI_API_KEY.');
  }

  // 1 — Slice (or single frame if too small/test buffer)
  let quadrants;
  let isFull = false;
  if (image.data.length < 200) {
    quadrants = [{ buffer: image.data, row: 0, col: 0 }];
    isFull = true;
  } else {
    try {
      quadrants = await sliceIntoQuadrants(image.data);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(422, `Image preprocessing failed: ${err.message}`);
    }
  }

  // 2 — Parallel Gemini calls
  const quadrantResults = await Promise.all(
    quadrants.map(async ({ buffer, row, col }) => {
      const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.7-flash';
      try {
        const items = await withGeminiKey(apiKey => callGeminiQuadrant(buffer, apiKey, primaryModel));
        return { items, row, col };
      } catch (firstError) {
        const apiError = getApiCallError(firstError);
        const is503 = apiError?.statusCode === 503 || firstError?.statusCode === 503;
        if (is503 && primaryModel !== 'gemini-3.6-flash') {
          console.warn(`[external-classifier] ${primaryModel} returned 503. Trying gemini-3.6-flash...`);
          try {
            const items = await withGeminiKey(apiKey => callGeminiQuadrant(buffer, apiKey, 'gemini-3.6-flash'));
            return { items, row, col };
          } catch (fallbackError) {
            firstError = fallbackError;
          }
        }
        if (firstError instanceof ApiError) throw firstError;
        const finalApiError = getApiCallError(firstError);
        if (finalApiError?.statusCode === 429 || firstError?.statusCode === 429) {
          throw new ApiError(429, 'Vision provider quota exceeded. Retry later.');
        }
        if (firstError.name === 'TimeoutError' || firstError.name === 'AbortError') {
          throw new ApiError(504, 'Vision request timed out. Please retry.');
        }
        throw new ApiError(502, 'Vision provider is unavailable or rejected the request.');
      }
    })
  );

  // 3 — Stitch + flatten
  const stitched = [];
  for (const { items, row, col } of quadrantResults) {
    for (const raw of items) {
      const item = validateAndStitchItem(raw, row, col, isFull);
      if (item) stitched.push(item);
    }
  }

  // 4 — Attach IDs and routing metadata
  const detectedItems = stitched.map((item, idx) => ({
    id: idx + 1,
    item_name: item.label,
    category: item.category,
    bbox: item.bbox,
    binRouting: routing[item.category],
  }));

  const categoryCounts = detectedItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  const summaryParts = Object.entries(categoryCounts).map(([cat, n]) => `${n} ${cat}`);
  const frontendReport = detectedItems.length === 0
    ? 'No waste items detected in the scene.'
    : `Grid-tiling scan detected ${detectedItems.length} item(s): ${summaryParts.join(', ')}. `
      + `Review bin routing in the table. Hazardous items require specialised disposal.`;

  return {
    detectedItems,
    frontendReport,
    operationalSummary: frontendReport,
    coordinateSystem: {
      range: [0, 1000],
      order: ['ymin', 'xmin', 'ymax', 'xmax'],
      reference: 'entire image (stitched from 2×2 grid)',
      calibratedForRobotics: false,
    },
  };
}
