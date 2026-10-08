# Google Gemini Vision API Integration Guide for EcoScan

This project now supports **real-time AI waste segregation** powered by Google's **Gemini 1.5 Flash Multimodal Vision** model.

---

## 1. Quick Start (Browser-Direct / Zero Backend Install)

You can use the live Gemini Vision AI directly without having to run any backend servers or install Node/Python.

1. Open [`index.html`](./index.html) in your browser (double-click in File Explorer or open in Chrome / Edge).
2. Look at the top navigation bar and click the **"Gemini AI"** button (with the purple sparkle icon).
3. Paste your Gemini API key:
   - If you don't have one yet, generate a free key at [Google AI Studio](https://aistudio.google.com/app/apikey).
4. Click **"Save & Enable AI"**.
   - Your key is saved locally in browser `localStorage` (`ecoscan_gemini_api_key`).
   - The purple badge will indicate that Gemini AI is active.
5. Go to **"Launch Live Waste Scanner"** or **"Add Photos From Library"**:
   - Take a snapshot of any real object using your webcam or phone camera.
   - Upload any image file.
6. The image will be processed by `gemini-1.5-flash`, which returns:
   - **Primary Target Bin**: `RECYCLABLE` (Blue), `COMPOST` (Green), `NON_RECYCLABLE` (Gray), or `HAZARDOUS` (Orange)
   - **Material Subtype & Resin Code** (e.g., `#1 PET`, `#2 HDPE`, `ALUMINUM`, `E_WASTE`)
   - **Safety / Hazard Warnings** (e.g. Lithium battery fire risks, grease contamination)
   - **Hygiene & Preparation Instructions** (e.g. Rinse clean, remove caps)
   - **AI Analysis Rationale** explaining why the item was sorted into that stream.

---

## 2. Gemini API Details & Prompt Structure

- **Model**: `gemini-1.5-flash`
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY`
- **Format**: JSON schema output (`responseMimeType: "application/json"`)
- **Latency**: Typically ~400ms – 900ms.
- **Offline / Fallback Resilience**: If no API key is set, or if offline, the app seamlessly falls back to the embedded local municipal waste taxonomy.
