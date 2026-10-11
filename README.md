# TERRA — Waste Intelligence & Autonomous Material Audit Platform

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16.4.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.22-lightgrey?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Gemini Vision AI](https://img.shields.io/badge/Gemini_Vision_AI-Flash_Lite_%26_3.8-orange?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![AWS Lambda](https://img.shields.io/badge/AWS_Lambda-Python_3.13-FF9900?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com/lambda/)
[![Tests](https://img.shields.io/badge/Tests-40%2F40_Passing-brightgreen?style=for-the-badge&logo=checkmarx)](docs/INTEGRATION_REPORT.md)

<p align="center">
  <strong>An enterprise B2B / B2G measurement, auditing, and computer-vision intelligence layer over waste streams.</strong><br>
  <em>"Humans see waste. We turn it into measurable intelligence."</em>
</p>

[Quick Start](#-quick-start) •
[Key Capabilities](#-key-capabilities) •
[Architecture](#-system-architecture) •
[API Reference](#-api-endpoints) •
[Testing](#-testing--validation) •
[Deployment](#-deployment)

</div>

---

## 📖 Overview

**TERRA** is a full-stack, enterprise-grade waste intelligence system designed for municipal contractors, recycling facilities (MRFs), and automated sorting systems. Rather than attempting mechanical sorting on device, TERRA provides an **auditing and telemetry measurement layer**:

1. **High-Density Vision AI**: Captures photographs or video frames of mixed waste piles, sorting docks, or conveyor belts.
2. **2×2 Grid-Tiling Segmentation**: Uses Sharp to slice scenes into quadrants, performing parallel model inference and stitching coordinates back into a global 1000×1000 normalized coordinate space.
3. **Circular Material Passport**: Analyzes polymer yields (rPET, LDPE, HDPE/PP), secondary fiber grades (Spec-11 OCC), non-ferrous metals (Alloy 3004 UBC), aggregate cullet, and organic bio-humus.
4. **Safety & Hazard Lockouts**: Automatically isolates toxic lithium-ion battery cells, biohazards, and chemical contaminants before materials reach high-speed mechanical sorting chutes.
5. **Robot-Ready Developer API**: Issues cryptographically secure, rate-limited developer API keys for autonomous pick-and-place robotic integration.

---

## ⚡ Key Capabilities

### 🛰️ Dynamic Visual Experience
- **Scroll-Driven 300-Frame Earth Rotation**: Ultra-smooth, high-performance canvas engine rendering photorealistic Earth telemetry based on scroll position.
- **Real-Time Bounding Box Overlays**: Live interactive viewport displaying detected objects, confidence scores, color-coded material classifications, and physical item dimensions.

### 🧠 Enterprise Vision AI & Failover Engine
- **Multi-Model Auto-Failover**: Zero-downtime resilience cascading across `gemini-flash-lite-latest`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, and `gemini-3.8-flash` on HTTP 429 quota limits or 503 load spikes.
- **Dynamic Key Rotation Pool**: Automatically rotates through a pool of Gemini API keys with independent per-model cooldown trackers, ensuring high-throughput uptime on Google AI Studio tiers.
- **Multi-Strategy JSON Extractor**: Bulletproof response parsing supporting native structured schemas, markdown code fence stripping, outer-bracket extraction, and legacy pipe-delimited format fallback.

### 🏢 Production Operations
- **Audit Workspace**: Interactive analysis cockpit providing mass estimations, recyclability indices, carbon offset values (kg CO₂e), and printable audit certificates.
- **Multi-Site Facility Cockpit**: Real-time multi-location dashboard tracking conveyor throughput, dock contamination rates, and regional recovery benchmarks.
- **Developer API Hub**: Self-serve portal for generating and managing SHA-256 hashed API keys with granular per-key quotas and rate limiting.

---

## 🏗️ System Architecture

```text
TERRA/
├── package.json                 # Root coordination (npm run dev, npm run build, npm test)
├── .env.example                 # Unified configuration template
├── .gitignore                   # Enterprise ignore rules (secrets, node_modules, caches)
├── scripts/
│   └── dev.mjs                  # Zero-dependency runner with stale port cleanup (3000 + 3001)
├── docs/
│   ├── INTEGRATION_REPORT.md    # Complete architectural verification report
│   └── LOCAL_DEV.md             # Local developer playbook & troubleshooting guide
│
├── frontend/                    # Client Presentation Layer (Next.js 16 + React 19)
│   ├── package.json             # Next.js 16.4.0, React 19.3.0, Tailwind CSS v4, Lucide
│   ├── next.config.ts           # Turbopack config & API proxy rewrites -> Backend :3001
│   ├── public/                  # 300 Earth rotation frames (jpg), SVG icons, branding
│   ├── src/
│   │   ├── app/                 # Next.js App Router (/, /login, /signup, /api/*)
│   │   ├── components/          # AuditWorkspace, EarthCanvas, DeveloperApiHub, MultiSiteCockpit
│   │   └── lib/                 # Shared client utilities, key validation, and contracts
│   └── tsconfig.json
│
└── backend/                     # Business Logic & Vision Engine (Express + AWS Lambda)
    ├── package.json             # Express 4.22+, Sharp 0.35+, @ai-sdk/google, Zod
    ├── server.js                # Express API server with hot-reload watch mode (Port 3001)
    ├── api/
    │   └── analyse.mjs          # Multi-pass grid tiling vision pipeline
    ├── backend/
    │   ├── developer-api.mjs    # Developer API management & /api/v1/classify-external
    │   ├── external-classifier.mjs # 2×2 Sharp grid tiling + Gemini structured schema
    │   ├── gemini-key-failover.mjs # Multi-key pool rotation & cooldown map
    │   └── key-store.mjs        # Cryptographic KeyStore with SHA-256 hashing
    ├── lambda_function.py       # AWS Lambda container handler (Python 3.13)
    ├── waste_cropper.py         # OpenCV / PIL crop & bounding box utility
    ├── template.yaml            # AWS SAM CloudFormation template
    ├── test_lambda_function.py  # Python Lambda unit test suite (9 tests)
    ├── developer-api.test.mjs   # Node test suite: KeyStore, rate limits, MIME validation
    ├── gemini.test.mjs          # Node test suite: Gemini vision adapter
    └── gemini-failover.test.mjs # Node test suite: API key failover & recovery
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ / v22+ recommended)
- **npm**: v9.0.0 or higher
- **Python**: v3.10+ (optional, only required for running AWS Lambda test suites)
- **Google Gemini API Key**: Free API key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone & Configure

```bash
# Clone the repository
git clone https://github.com/Coding-Cunts/AWS-Phase-2.git
cd AWS-Phase-2

# Copy the environment template
cp .env.example .env
```

Open `.env` in your editor and add your Gemini API key:
```ini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-flash-lite-latest
PORT=3001
BACKEND_URL=http://127.0.0.1:3001
```

### 2. Install Dependencies

Install dependencies for all workspaces with a single command:
```bash
npm install
```
*(This automatically runs `npm install` in both `frontend/` and `backend/`)*

### 3. Launch Development Server

```bash
npm run dev
```

The unified runner starts both microservices concurrently:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API Server**: [http://localhost:3001](http://localhost:3001)
- **API Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## ⚙️ Environment Variables

| Variable | Description | Default | Required? |
| :--- | :--- | :--- | :---: |
| `GEMINI_API_KEY` | Primary Google Gemini Vision AI API key | — | **Yes** |
| `GEMINI_API_KEY_BACKUP` | Secondary backup key for automatic failover | — | Optional |
| `GEMINI_API_KEYS` | Comma-delimited list of multiple keys for pooling | — | Optional |
| `GEMINI_MODEL` | Vision model identifier | `gemini-flash-lite-latest` | Recommended |
| `PORT` | Express backend server listen port | `3001` | **Yes** |
| `BACKEND_URL` | Target URL for Next.js API proxy rewrites | `http://127.0.0.1:3001` | **Yes** |
| `NEXT_PUBLIC_APP_URL` | Public frontend origin | `http://localhost:3000` | Optional |
| `ECO_ADMIN_SECRET` | Secret required to manage API keys remotely | — | Optional |

---

## 📡 API Endpoints

### 1. Core Waste Analysis
```http
POST /api/analyze-waste
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,... (or https://image-url.jpg)"
}
```
**Response (200 OK):**
```json
{
  "scanId": "WA-8832-AI",
  "timestamp": "Just now",
  "inferenceEngine": "gemini-flash-lite-latest",
  "summary": "Grid-tiling scan detected 4 item(s): 3 Recyclable, 1 Non-Recyclable.",
  "totalEstimatedWeight": "180g",
  "recyclabilityScore": 75,
  "biodegradableRatio": { "biodegradable": 25, "nonBiodegradable": 75 },
  "carbonOffsetKg": "0.48 kg CO2e",
  "detectedItems": [
    {
      "id": "ITEM-1",
      "name": "aluminum beverage can",
      "category": "pet-polymers",
      "confidence": 0.95,
      "box": [51.4, 16.1, 100.0, 50.0],
      "weightEst": "45g",
      "isRecyclable": true,
      "advice": "Empty, rinse, and keep dry."
    }
  ]
}
```

### 2. Robotics & Developer API
```http
POST /api/v1/classify-external
x-api-key: eco_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json

{
  "imageBase64": "data:image/jpeg;base64,..."
}
```

### 3. Key Management
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/keys` | List issued developer API keys | Localhost or `x-admin-key` |
| `POST` | `/api/keys/generate` | Generate a new developer API key | Localhost or `x-admin-key` |
| `POST` | `/api/keys/revoke` | Revoke an API key immediately | Localhost or `x-admin-key` |

### 4. Interactive Assistant & Health
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/chat` | Context-aware waste segregation advice based on scanned items |
| `GET` | `/api/health` | Service health status and active API key pool count |

---

## 🧪 Testing & Validation

The codebase maintains a 100% test pass rate across Node.js and Python test suites:

```bash
# 1. Run all Node.js backend unit tests (31 tests)
npm test

# 2. Run AWS Lambda Python unit tests (9 tests)
python backend/test_lambda_function.py

# 3. Validate frontend TypeScript types and build
npm run build
```

**Test Coverage Summary:**
- ✅ **KeyStore & Security**: SHA-256 hash storage, revocation, expiration, concurrency, rate-limits.
- ✅ **Input Validation**: Rejection of oversized payloads (>8MB), corrupt JPEG/PNG headers, cross-origin protection.
- ✅ **Failover & Recovery**: Automatic rotation upon HTTP 429 quota exhaustion, cooldown tracking, and multi-model fallbacks.
- ✅ **Serverless Handler**: Event payload parsing, base64 image decoding, error boundaries, and robotics telemetry output.

---

## 🚢 Deployment

### Production Build
```bash
# Compile both frontend and backend
npm run build

# Start production server
npm start
```

### Serverless Deployment (AWS Lambda + SAM)
The repository includes an AWS SAM template ready for deployment to AWS CloudFormation, API Gateway, and Lambda:

```bash
cd backend
sam build
sam deploy --guided
```

### Containerized Deployment (Docker)
Both `frontend/` and `backend/` are decoupled and can be deployed via standard Docker containers to AWS ECS, Google Cloud Run, or Kubernetes.

---

## 📄 License & Attribution

- **Project:** TERRA (AWS Phase 2)
- **Organization:** Coding-Cunts
- **License:** MIT License — Free for commercial and research use.
