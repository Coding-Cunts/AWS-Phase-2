# TERRA — Local Development & Operations Guide

Welcome to the unified TERRA application. This guide outlines how to configure, run, test, and deploy TERRA locally.

---

## 1. Prerequisites

Ensure your system has the following runtimes installed:

- **Node.js**: `v22.0.0` or higher (Tested on Node `v26.7.0`)
- **npm**: `v10.0.0` or higher
- **Python**: `3.12+` or `3.13` (for AWS Lambda Python test suite)

---

## 2. Environment Configuration

1. Copy the template `.env.example` to `.env` in the root directory (or in both `frontend/` and `backend/`):
   ```bash
   cp .env.example .env
   ```

2. Configure your Google Gemini API keys in `.env`:
   ```ini
   # Primary Gemini API key from Google AI Studio (https://aistudio.google.com/)
   GEMINI_API_KEY=AIzaSy...

   # Optional: Secondary key for automatic quota failover & cooldown recovery
   GEMINI_API_KEY_BACKUP=AIzaSy...

   # Vision Model
   GEMINI_MODEL=gemini-3.7-flash

   # Operator Secret for remote key management (localhost is exempt)
   ECO_ADMIN_SECRET=terra_super_admin_secret_2026

   # Backend Port (defaults to 3001)
   PORT=3001

   # Frontend Proxy Target
   BACKEND_URL=http://127.0.0.1:3001
   ```

---

## 3. Running Locally

### Option A: Unified Concurrent Runner (Recommended)

Run both the Next.js frontend and the Express backend simultaneously with one command from the project root:

```bash
npm run dev
```

This launches:
- **TERRA Frontend:** [http://localhost:3000](http://localhost:3000)
- **TERRA Backend:** [http://localhost:3001](http://localhost:3001)

Log lines from both processes are streamed to the terminal with color-coded tags (`[Frontend :3000]` and `[Backend :3001]`). Press `Ctrl+C` once to gracefully shut down both services.

---

### Option B: Running Services Individually

If you need to debug or work on frontend or backend in isolation:

#### Running the Backend Only:
```bash
cd backend
npm run start
```
*Listens on port 3001, loads `.env` automatically.*

#### Running the Frontend Only:
```bash
cd frontend
npm run dev
```
*Listens on port 3000, proxies `/api/*` to `BACKEND_URL`.*

---

## 4. Testing & Verification

Run the entire unified test suite across all subsystems from the root:

```bash
npm test
```

This executes:
1. **Node Backend Test Suite (31 tests):**
   - `developer-api.test.mjs` (KeyStore transactions, security, rate limiting, MIME validation)
   - `gemini.test.mjs` (Provider adapter, private instructions, model parser validation)
   - `gemini-failover.test.mjs` (Primary cooldown, backup rotation, HTTP 429 recovery)
2. **Python Lambda Test Suite (9 tests):**
   - `test_lambda_function.py` (SAM CloudFormation handler, crop calculations, error telemetry)
3. **Frontend TypeScript Typecheck:**
   - `npx tsc --noEmit` across all Next.js pages, layouts, and components.

### Individual Test Commands:
```bash
# Node backend tests only:
cd backend && npm test

# Python Lambda tests only:
cd backend && python -m unittest test_lambda_function.py

# Frontend production build:
cd frontend && npm run build
```

---

## 5. Architectural Features & Workspaces

### 1. Narrative Canvas Experience
- Located at `/` (Homepage).
- Driven by `NarrativeCanvas.tsx` with 300 high-fidelity frames stored in `frontend/public/sequence_frames/`.
- Uses custom canvas rendering and requestAnimationFrame scroll interpolation to deliver smooth 60fps Earth rotation.

### 2. Live Audit Workspace
- Accessible via the **Audit Workspace** tab on the navigation bar.
- Uploads or snaps camera frames and calls `POST /api/analyze-waste`.
- Uses Sharp 2×2 grid slicing with Gemini Structured Outputs to catalog objects without hallucinating fake fallback items.
- Displays bounding box reticles, material breakdown compositions, compost/recyclability percentages, and carbon offset estimates.

### 3. Developer API Hub & Playground
- Accessible via the **Developer Hub** tab.
- **Key Manager (`/api/keys`):** Issues SHA-256 hashed API keys (`eco_live_...`), manages usage counters, and allows immediate key revocation.
- **Interactive Playground (`/api/v1/classify-external`):** Simulates external robotics client calls with live bounding box overlays, latency metrics, and copyable cURL / Python / Node snippets.

### 4. AWS Lambda & SAM Serverless Pipeline
- `backend/lambda_function.py`: AWS Lambda container entrypoint for serverless cloud pipelines.
- `backend/waste_cropper.py`: High-throughput crop helper for localized waste characterization.
- `backend/template.yaml`: AWS Serverless Application Model (SAM) deployment template.
