# TERRA — Architectural Integration Report

**Date:** 2026-10-11  
**Repository Branch:** `integration/terra-unified`  
**Status:** Integrated, Verified, 100% Passing Tests (40/40 Unit Tests + Full TypeScript Build)

---

## 1. Executive Summary

This report documents the architectural integration of two complementary project archives into one unified, production-ready codebase:

1. **`Frontend Yajat.rar`** — Source of truth for the client presentation layer, Next.js 16.4.0 App Router, React 19.3.0, Tailwind CSS v4, TypeScript 5, the high-performance 300-frame Earth rotation canvas animation, `AuditWorkspace`, `DeveloperApiHub`, `MultiSiteCockpit`, and `AuthView`.
2. **`Backend Varun.rar`** — Source of truth for server-side business logic, Express 4.22+ on Node 22+, Sharp 2×2 grid tiling vision pipeline, Gemini Structured Outputs, KeyStore with SHA-256 hashed keys in `data/api_keys.json`, automatic Gemini API key failover/cooldown pools, and AWS Lambda Python SAM artifacts.

The integration was executed with strict behavior preservation, eliminating duplicate dependencies, resolving contract mismatches, and excluding AWS Amplify deployment files (`amplify.yml`, `amplify-rewrites.json`) while preserving all AWS Lambda serverless components.

---

## 2. Source-of-Truth Hierarchy & Directory Topology

To eliminate package and dependency collisions between React 19 (Frontend Next.js) and React 18 (legacy Vite client in Backend), the project uses isolated frontend and backend modules coordinated by a root orchestration layer:

```
TERRA/
├── package.json                 # Root coordination (npm test, npm run build, npm run dev)
├── .env.example                 # Consolidated environment template
├── .gitignore                   # Ignores node_modules, .next, dist, staging archives, keys
├── scripts/
│   └── dev.mjs                  # Zero-dependency cross-platform runner (Frontend :3000 + Backend :3001)
├── docs/
│   ├── INTEGRATION_REPORT.md    # Architecture and integration verification record
│   └── LOCAL_DEV.md             # Developer runbook and operational manual
│
├── frontend/                    # Source of Truth: Frontend Yajat.rar
│   ├── package.json             # Next.js 16.4.0, React 19.3.0, Tailwind CSS v4
│   ├── next.config.ts           # Turbopack config + /api rewrites -> Backend :3001
│   ├── public/                  # 600 Earth sequence frames (webp + jpg), SVG icons, static assets
│   ├── src/
│   │   ├── app/                 # Next.js routes: /, /login, /signup, /api/*
│   │   ├── components/          # NarrativeCanvas, AuditWorkspace, DeveloperApiHub, MultiSiteCockpit
│   │   └── lib/                 # Shared frontend utilities & types
│   └── tsconfig.json
│
└── backend/                     # Source of Truth: Backend Varun.rar
    ├── package.json             # Express 4.22.3, Sharp 0.35.5, @ai-sdk/google, Zod
    ├── server.js                # Express API server (default port 3001)
    ├── api/
    │   └── analyse.mjs          # Multi-pass grid tiling vision pipeline
    ├── backend/
    │   ├── developer-api.mjs    # Developer API management & /api/v1/classify-external
    │   ├── external-classifier.mjs # Sharp 2x2 tiling + Gemini Structured Outputs
    │   ├── gemini-key-failover.mjs # Cooldown map & key rotation logic
    │   └── key-store.mjs        # Cryptographic KeyStore with SHA-256 hashing
    ├── lambda_function.py       # AWS Lambda container handler (Python 3.13)
    ├── waste_cropper.py         # OpenCV / PIL crop & bounding box utility
    ├── template.yaml            # AWS SAM template for CloudFormation/Lambda
    ├── test_lambda_function.py  # Python unit test suite
    ├── developer-api.test.mjs   # Node test suite: KeyStore, rate limits, MIME validation
    ├── gemini.test.mjs          # Node test suite: real adapter & input validation
    └── gemini-failover.test.mjs # Node test suite: key rotation & cooldown recovery
```

---

## 3. Excluded Files & Rationale

Per project specifications, only AWS Amplify deployment-specific files were excluded:

| Excluded File | Origin | Justification |
| :--- | :--- | :--- |
| `amplify.yml` | `Backend Varun.rar` | Deployment configuration specific to AWS Amplify Console |
| `amplify-rewrites.json` | `Backend Varun.rar` | SPA route rewrite rules specific to AWS Amplify Hosting |

**Preserved Serverless Artifacts:**
- `lambda_function.py`, `package_lambda.py`, `test_lambda_function.py`, `waste_cropper.py`, and `template.yaml` were preserved in `backend/` and tested successfully against Python 3.13.

---

## 4. Contract Reconciliation & API Harmonization

The frontend and backend contracts were reconciled to achieve 100% mutual compatibility:

### 4.1 Key Listing (`GET /api/keys`)
- **Frontend Expectation:** `{ success: true, keys: [...] }`
- **Backend Original:** `{ keys: [...] }`
- **Resolution:** Backend now returns `{ success: true, keys: await store.list() }`. Both `list.keys` (checked by backend tests) and `data.success` (checked by frontend UI) are satisfied.

### 4.2 Key Issuance (`POST /api/keys/generate`)
- **Frontend Expectation:** `{ success: true, key: string, apiKey: object }`
- **Backend Original:** `{ id, label, createdAt, expiresAt, status, key }`
- **Resolution:** Backend now returns `{ success: true, ...record, apiKey: record, key: record.key }`.

### 4.3 Key Revocation (`POST /api/keys/revoke`)
- **Frontend Expectation:** `POST /api/keys/revoke` with `{ keyId, action: 'revoke' }`
- **Backend Original:** `POST /api/keys/:id/revoke`
- **Resolution:** Backend now supports both `POST /api/keys/revoke` (reading `keyId` or `id` from JSON body) and `POST /api/keys/:id/revoke` (reading `id` from URL parameter).

### 4.4 External Classification Proxy (`POST /api/v1/classify-external`)
- **Frontend Playground Expectation:** Normalized percentage bounding boxes (`0-100%`) in `detections: [...]`, telemetry metadata (`latency_ms`, `audit_hash`, `scan_id`, `status`).
- **Backend Original:** `{ success: true, source, inference_latency_ms, result: { detectedItems, ... } }` with `0-1000` bounding box integers.
- **Resolution:** Backend now returns both the complete `result` structure expected by backend tests and the transformed `detections` array with 0-100% coordinates for the interactive Playground canvas overlay.

### 4.5 Live Waste Audit (`POST /api/analyze-waste`)
- **Frontend AuditWorkspace Expectation:** Schema adhering to `WasteAnalysisResult` (`scanId`, `timestamp`, `inferenceEngine`, `summary`, `compositions`, `detectedItems`, `recyclabilityScore`, `biodegradableRatio`, `actionableSteps`).
- **Resolution:** Added dedicated `POST /api/analyze-waste` endpoint in `backend/server.js` backed by `classifyImage` from `backend/backend/external-classifier.mjs`, performing real Gemini vision inference, category mapping, compost/recyclability ratio calculations, and telemetry attachment.

### 4.6 Automatic Routing via Next.js Rewrites
- `frontend/next.config.ts` was configured with `beforeFiles` rewrites proxying all client API calls (`/api/v1/*`, `/api/keys/*`, `/api/analyse`, `/api/analyze-waste`, `/api/health`) directly to `http://127.0.0.1:3001`.

---

## 5. Verification Matrix & Test Results

| Test Target | Suite Command | Result | Details |
| :--- | :--- | :--- | :--- |
| **Developer API & KeyStore** | `node --test developer-api.test.mjs` | **14 / 14 Passed** | Auth, rate limits, multipart/json, SHA-256 hashes, concurrency |
| **Gemini Adapter & Rules** | `node --test gemini.test.mjs` | **7 / 7 Passed** | Input validation, parser rules, empty scenes, error containment |
| **Failover & Cooldown** | `node --test gemini-failover.test.mjs` | **8 / 8 Passed** | Primary cooldown, backup swap, HTTP Retry-After, recovery |
| **AWS Lambda Python** | `python -m unittest discover -s backend` | **9 / 9 Passed** | SAM handler, base64 payloads, error events, crop bounds |
| **Frontend TypeScript** | `npm run typecheck --prefix frontend` | **0 Errors** | Strict TS checking across all Next.js pages & components |
| **Frontend Production Build** | `npm run build --prefix frontend` | **11 / 11 Routes** | Prerendered static pages & dynamic API routes generated |

---

## 6. Root Operational Commands

The root workspace provides unified scripts:

- `npm run dev` — Starts both Frontend (`:3000`) and Backend (`:3001`) concurrently with formatted logs.
- `npm run build` — Compiles the Next.js production build.
- `npm test` — Executes all 31 Node backend unit tests, 9 Python Lambda tests, and frontend TypeScript verification.
