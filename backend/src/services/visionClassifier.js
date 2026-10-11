// Vision Classifier & Client-Side Canvas Optimizer
// Implements FR-01, FR-02 Quality Gatekeeper, & Edge Canvas Compression

import { SAMPLE_ITEMS } from '../data/wasteDatabase.js';

export class VisionClassifier {
  /**
   * Calculates average luminance of an image element or HTML5 Canvas
   * Formula: L = 0.299*R + 0.587*G + 0.114*B (Standard Rec. 601 Luma)
   * Returns luminance score between 0 and 255.
   */
  static analyzeLuminance(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return 128; // fallback default
    
    // Sample a 100x100 grid for performance
    const sampleWidth = Math.min(100, canvas.width);
    const sampleHeight = Math.min(100, canvas.height);
    const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
    const data = imageData.data;
    
    let totalLuminance = 0;
    const pixelCount = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuminance += luminance;
    }

    return Math.round(totalLuminance / pixelCount);
  }

  /**
   * Compresses image canvas to 1080px JPEG @ 0.85 quality per PRD Section 4
   */
  static compressCanvas(sourceCanvas, targetMaxDim = 1080, quality = 0.85) {
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    
    let targetWidth = width;
    let targetHeight = height;

    if (width > targetMaxDim || height > targetMaxDim) {
      if (width > height) {
        targetWidth = targetMaxDim;
        targetHeight = Math.round((height * targetMaxDim) / width);
      } else {
        targetHeight = targetMaxDim;
        targetWidth = Math.round((width * targetMaxDim) / height);
      }
    }

    const compressedCanvas = document.createElement('canvas');
    compressedCanvas.width = targetWidth;
    compressedCanvas.height = targetHeight;
    
    const ctx = compressedCanvas.getContext('2d');
    ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
    
    const dataUrl = compressedCanvas.toDataURL('image/jpeg', quality);
    return {
      canvas: compressedCanvas,
      dataUrl,
      width: targetWidth,
      height: targetHeight,
      sizeKb: Math.round((dataUrl.length * 0.75) / 1024)
    };
  }

  /**
   * Calls the AWS Backend (/api/classify) where GEMINI_API_KEY is securely kept.
   * Returns { detectedItems: Array<{item_name, category, bbox}>, frontendReport: string, raw: string }
   */
  static async callBackendClassification(imageBase64) {
    const endpoint = '/api/classify';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(msg);
    }

    const data = await response.json();
    // result shape: { detectedItems, frontendReport, raw }
    return data;
  }

  /**
   * Main classification handler
   */
  static async classifyImage({ canvas, overrideItem = null, networkTier = '4g' }) {
    const startTime = performance.now();
    
    // Step 1: Quality Gatekeeper Luminance Check (FR-02)
    const luminance = this.analyzeLuminance(canvas);
    if (luminance < 30) {
      return {
        success: false,
        tooDark: true,
        luminance,
        message: 'Environment too dark (< 30/255). Turn on lights or flash.'
      };
    }

    // Step 2: Edge Image Compression
    const compressed = this.compressCanvas(canvas);

    // If override sample chosen from library
    if (overrideItem) {
      let delay = 450;
      if (networkTier === '5g') delay = 220;
      if (networkTier === 'wifi') delay = 180;
      await new Promise(res => setTimeout(res, delay));
      const totalMs = Math.round(performance.now() - startTime);

      return {
        success: true,
        tooDark: false,
        luminance,
        source: 'sample_library',
        compressedInfo: compressed,
        inference_latency_ms: totalMs,
        result: { ...overrideItem }
      };
    }

    // Step 3: Try calling the secure AWS Backend endpoint (/api/classify)
    try {
      const base64Data = compressed.dataUrl.split(',')[1];
      const backendRes = await this.callBackendClassification(base64Data);
      const totalMs = Math.round(performance.now() - startTime);

      return {
        success: true,
        tooDark: false,
        luminance,
        source: 'gemini_vision_ai',
        compressedInfo: compressed,
        inference_latency_ms: totalMs,
        // New shape: detectedItems[] + frontendReport string
        result: backendRes.result
      };
    } catch (err) {
      console.warn('Backend /api/classify call unavailable or offline. Falling back to local classifier:', err.message);

      let baseNetworkDelay = 450;
      if (networkTier === '5g') baseNetworkDelay = 220;
      if (networkTier === 'wifi') baseNetworkDelay = 180;
      if (networkTier === '3g') baseNetworkDelay = 1100;

      const delay = Math.floor(baseNetworkDelay + Math.random() * 250);
      await new Promise(res => setTimeout(res, delay));

      const totalMs = Math.round(performance.now() - startTime);

      // Offline fallback: return a minimal scene result matching the new shape
      return {
        success: true,
        tooDark: false,
        luminance,
        source: 'local_taxonomy',
        offlineNotice: err.message,
        compressedInfo: compressed,
        inference_latency_ms: totalMs,
        result: {
          detectedItems: [],
          frontendReport: 'Offline mode: AI classification unavailable. Please check your connection and try again.',
          raw: ''
        }
      };
    }
  }
}
