# Product Requirements Document
## Waste Intelligence & Material Audit Platform

**Document Status:** Product Definition  
**Product Type:** B2B / B2G Waste Intelligence Platform  
**Primary Domain:** Waste Management, Recycling & Material Recovery  
**Primary Product:** Waste Composition & Material Audit  
**Secondary Products:** Contamination QA, Worker Assistance, Recovery Intelligence, Robot-Ready Detection API

---

# 1. Executive Summary

The **Waste Intelligence Platform** is a computer-vision system that converts photographs or videos of mixed waste into structured, measurable information.

The core product is **not an automated waste sorter**.

Instead, it acts as a **measurement and auditing layer** over waste streams.

A user captures or uploads an image of a waste pile, sorting output, bale, or other waste stream. The system identifies visible materials, measures their relative composition, detects potential hazards and contamination, estimates recoverable value, and stores the resulting audit for historical analysis.

The platform can subsequently provide actionable recommendations to workers and expose its detection results through an API for future robotic or automated systems.

### Product thesis

> **Humans can see waste. We turn it into measurable intelligence.**

The original concept initially centered on a ranked recovery/pick list. The product is intentionally reframed around **composition, measurement, auditing, and historical data**, with the pick list becoming a secondary capability. This addresses the fundamental weakness of positioning the product as simply another waste-sorting system.

---

# 2. Product Vision

Create a digital intelligence layer for the physical waste-management industry.

Today, waste exists as a physical stream:

```text
Waste pile
     ↓
Workers / sorting equipment
     ↓
Recovered materials
```

The platform adds a persistent information layer:

```text
                    ┌────────────────────────┐
                    │   WASTE INTELLIGENCE   │
                    │                        │
                    │ Composition            │
                    │ Contamination          │
                    │ Hazards                │
                    │ Recoverable value      │
                    │ Historical trends      │
                    │ Audit records          │
                    └───────────┬────────────┘
                                │
             ┌──────────────────┼──────────────────┐
             ▼                  ▼                  ▼
       Municipalities       Recyclers           MRFs
```

The long-term vision is for the platform to become a **data and intelligence infrastructure layer for waste operations**, rather than simply a computer-vision application.

---

# 3. Problem Definition

## 3.1 The Core Problem

Waste operators can physically observe waste, but observation does not automatically produce reliable, structured, historical data.

A waste pile may contain:

- Multiple recyclable materials
- Contaminants
- Hazardous objects
- Potentially valuable materials
- Non-recoverable material

Understanding the composition of that waste is useful for planning, quality assurance, reporting, and recovery decisions.

The platform's source material does **not establish a universal current process or market size for waste characterization**. Those assumptions should be validated with actual industry users before being used as factual claims in commercial material.

---

# 4. Product Opportunity

The opportunity is to transform waste from an unstructured physical resource into a **measurable data source**.

A single scan could become:

```text
                WASTE SCAN
                    │
                    ▼
          ┌───────────────────┐
          │ Material Detection│
          └─────────┬─────────┘
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
     Composition  Hazards  Contamination
          │         │         │
          └─────────┼─────────┘
                    ▼
             Value Estimate
                    │
                    ▼
             AUDIT RECORD
                    │
                    ▼
            Historical Dataset
```

Over time, individual scans become a dataset that can reveal changes in:

- Material composition
- Contamination
- Recoverable value
- Hazard frequency
- Site performance

---

# 5. Product Goals

## Primary Goals

### G1 — Material Measurement

Convert visual waste into measurable material composition.

### G2 — Waste Auditing

Create repeatable digital audit records for waste streams.

### G3 — Contamination Monitoring

Enable operators to understand contamination in waste outputs or material streams.

### G4 — Hazard Awareness

Identify potentially hazardous materials and highlight them to workers.

### G5 — Historical Intelligence

Allow organizations to compare waste composition and quality over time.

### G6 — Actionable Intelligence

Convert detections into recommendations that help users decide what deserves attention or recovery.

### G7 — Extensibility

Provide structured detection data that can eventually be consumed by external systems and robotics.

---

# 6. Non-Goals

The product should **not** initially attempt to:

- Replace human waste workers.
- Replace industrial sorting equipment.
- Function as a complete robotic sorting system.
- Identify every possible waste material.
- Guarantee commodity-market valuations.
- Make safety-critical decisions without human oversight.
- Claim material identification capabilities beyond what the underlying sensors/model can reliably determine.

The distinction is important because conventional optical sorting technologies can already perform specialized material identification that a normal RGB camera cannot necessarily reproduce.

---

# 7. Target Customers

## 7.1 Municipalities

### Needs

- Waste composition information
- Planning data
- Reporting
- Site-level comparisons
- Historical trends

### Product Value

The platform provides a standardized digital record of observed waste composition.

---

## 7.2 Waste Contractors

### Needs

- Site monitoring
- Waste-stream reporting
- Operational metrics
- Audit records

### Product Value

Contractors can maintain structured records of the waste they handle.

---

## 7.3 MRF / Sorting Facilities

**MRF = Materials Recovery Facility**

### Needs

- Output-quality monitoring
- Contamination detection
- Bale auditing
- Monitoring existing sorting operations

### Product Value

The platform operates as a **QA layer around existing sorting infrastructure**, rather than attempting to replace it.

---

## 7.4 Recyclers and Brands

Potential applications include:

- Contamination auditing
- Material traceability
- Supplier/stream verification
- Sustainability reporting

These commercial use cases should be validated with prospective customers before being treated as established demand.

---

## 7.5 Informal Waste-Recovery Operations

Potential users include:

- Waste-picker cooperatives
- Scrap yards
- Informal recovery operations

The system can provide visual guidance and material intelligence where industrial sorting infrastructure isn't available.

---

# 8. User Personas

## Persona A — Waste Operations Manager

**Goal:** Understand what is entering/leaving a facility.

Needs:

- Quick scans
- Reliable composition reports
- Historical comparisons
- Exportable reports

---

## Persona B — Municipal Waste Manager

**Goal:** Understand waste composition across locations.

Needs:

- Site comparisons
- Trends
- Audit history
- Reporting

---

## Persona C — MRF Quality Manager

**Goal:** Monitor contamination and sorting quality.

Needs:

- Output analysis
- Contamination percentage
- Historical QA
- Alerts

---

## Persona D — Field Worker / Waste Picker

**Goal:** Identify useful or dangerous items quickly.

Needs:

- Simple visual overlay
- Hazard warnings
- Recovery recommendations
- Minimal interaction

---

## Persona E — Integration Developer

**Goal:** Consume detection data in another system.

Needs:

- API
- Machine-readable results
- Stable schema
- Confidence values
- Object locations

---

# 9. Core Product Model

The platform should be organized around four major concepts:

```text
Organization
     │
     ├── Sites
     │     │
     │     ├── Scans
     │     │     ├── Detections
     │     │     └── Audits
     │     │
     │     └── Historical Data
     │
     └── Users
```

### Organization

The customer account.

### Site

A physical waste-processing location.

### Scan

A single image/video analysis event.

### Detection

An individual material/object identified inside a scan.

### Audit

An interpreted collection of scan results.

---

# 10. Core Product Workflow

## Step 1 — Capture

A user captures:

- Photograph
- Video
- Potentially later, live camera footage

## Step 2 — Upload

The media is uploaded to the platform.

## Step 3 — Computer Vision

The system:

1. Segments visible objects.
2. Classifies materials.
3. Calculates confidence.
4. Determines object location.
5. Identifies potential hazards.

## Step 4 — Intelligence Layer

The platform aggregates detections into:

- Composition
- Contamination
- Value estimate
- Hazard summary
- Recovery recommendations

## Step 5 — Audit

The results are stored as an auditable scan.

## Step 6 — Analysis

Users can compare the scan against:

- Previous scans
- Other sites
- Historical averages

---

# 11. Feature Requirements

## 11.1 Waste Scan

### Description

Allow authorized users to submit waste imagery for analysis.

### Functional Requirements

The system shall:

- Accept supported image formats.
- Store the original media.
- Create a unique scan ID.
- Record timestamp and site.
- Initiate analysis.
- Track processing status.

### Scan States

```text
UPLOADED
   ↓
PROCESSING
   ↓
COMPLETED
   │
   └── FAILED
```

---

## 11.2 Material Segmentation

The system shall identify visible objects/material regions.

Each detection should contain:

- Bounding/visual location
- Segmentation mask
- Material class
- Confidence
- Scan ID

The product requires segmentation rather than classification alone because it needs to know where individual materials are located within the image.

---

## 11.3 Material Classification

The initial supported classes are:

- PET
- HDPE
- Paper/Cardboard
- Metal
- Glass
- Hazardous

These are the initial taxonomy and should not be treated as a permanent limitation.

Future taxonomy expansion should be model- and data-driven.

---

## 11.4 Composition Audit

The platform shall aggregate individual detections into a composition summary.

Example:

```text
Material            Share
────────────────────────────
PET                  31%
Cardboard            18%
HDPE                 14%
Metal                11%
Glass                 8%
Hazardous             4%
Other                14%
```

The system should also retain the underlying detections so the aggregate can be traced back to the original image.

---

## 11.5 Contamination Analysis

The platform shall support defining an expected material stream and identifying material outside that target.

Example:

```text
Expected stream: PET

Detected:
PET       87%
HDPE       6%
Paper      3%
Other      4%

Contamination: 13%
```

This makes the platform useful alongside existing sorting infrastructure rather than competing directly with it.

---

## 11.6 Hazard Detection

The system shall identify and flag supported hazardous objects.

Initial examples:

- Batteries
- Sharps
- Medical waste

Hazard detections shall receive:

- Hazard category
- Confidence
- Location
- Visual highlight

The platform should communicate that detection is an AI prediction rather than an absolute safety certification.

---

## 11.7 Recoverable Value

The system may calculate an estimated recoverable value from detected material quantities and configurable material-value data.

Conceptually:

```text
Estimated Value =
Σ(material quantity × reference material value)
```

The result must be explicitly labeled as an **estimate**.

The platform should support configurable pricing rather than hard-coding values into the computer-vision model.

---

## 11.8 Recovery Recommendations

The system can generate a ranked list of objects/materials that deserve attention.

Ranking factors may include:

- Estimated value
- Hazard
- Reachability/accessibility
- Material priority

The recommendation engine is **not the core product**. It exists on top of the measurement platform.

---

## 11.9 Historical Analytics

Every completed scan should become part of the organization's historical dataset.

Users should be able to view:

- Composition over time
- Contamination over time
- Recoverable value over time
- Hazard frequency
- Site comparisons

Example:

```text
SITE A

             SEPT     OCT     NOV
PET           26%     31%     29%
Cardboard     21%     18%     22%
Metal         12%     11%     14%
Contamination 15%     12%      9%
```

---

## 11.10 Audit Reports

Users should be able to generate a structured report containing:

### Scan Information

- Site
- Date/time
- Operator
- Source image

### Composition

- Material breakdown
- Percentages

### Quality

- Contamination

### Safety

- Hazard detections

### Economics

- Estimated recoverable value

### Evidence

- Original image
- Segmentation overlay

---

## 11.11 Human Review

Because real-world waste is difficult to classify reliably, the production system should support human correction.

A reviewer should be able to:

- Correct material class
- Reject a false detection
- Add a missed detection
- Mark a detection as uncertain
- Correct hazard classification

These corrections can eventually become valuable training data.

---

# 12. Dashboard Requirements

## Main Dashboard

The dashboard should answer:

> **“What is happening with my waste?”**

It should contain:

### Overview

- Total scans
- Sites
- Recent audits
- Latest composition
- Latest contamination

### Composition

Visual breakdown of material categories.

### Quality

Contamination trends.

### Safety

Hazard detections.

### Economics

Recoverable-value trends.

### Sites

Comparison across facilities.

---

# 13. Scan Detail Page

A scan detail page should contain:

```text
┌──────────────────────────────────────────┐
│ Waste Scan — Site A                     │
│ 08 Oct 2026                             │
├──────────────────────────────────────────┤
│                                          │
│       SEGMENTED WASTE IMAGE              │
│                                          │
├────────────────────┬─────────────────────┤
│ Composition        │ Safety              │
│                    │                     │
│ PET        31%     │ ⚠ 2 hazards        │
│ Cardboard  18%     │                     │
│ HDPE       14%     │                     │
│ ...                │                     │
├────────────────────┴─────────────────────┤
│ Estimated Recoverable Value: ₹XXX        │
│ Contamination: XX%                       │
└──────────────────────────────────────────┘
```

---

# 14. Organization & Access Control

The production platform should support multiple users within an organization.

## Suggested Roles

### Organization Admin

- Manage organization
- Manage sites
- Manage users
- View all data
- Configure settings

### Site Manager

- Manage assigned sites
- View scans
- Generate reports
- Review detections

### Operator

- Create scans
- View assigned scans
- Perform corrections

### Viewer

- Read-only access

### API User

- Programmatic access to permitted data

---

# 15. Multi-Site Architecture

A customer may operate multiple physical locations.

```text
Organization
│
├── Site A
│   ├── Scans
│   └── Analytics
│
├── Site B
│   ├── Scans
│   └── Analytics
│
└── Site C
    ├── Scans
    └── Analytics
```

This allows the platform to evolve from a **single-site scanning tool** into an organizational analytics platform.

---

# 16. AI/ML Requirements

## Model Pipeline

The production pipeline should support:

```text
Image
 ↓
Segmentation
 ↓
Material Classification
 ↓
Confidence Calibration
 ↓
Hazard Classification
 ↓
Detection Aggregation
 ↓
Audit
```

## Model Management

The production system should support:

```text
Training Data
     ↓
Training
     ↓
Evaluation
     ↓
Model Registry
     ↓
Staging
     ↓
Production
```

---

# 17. Model Confidence

Every prediction should include confidence.

Example:

```text
PET
Confidence: 94%
```

The UI should distinguish between:

- High-confidence detection
- Low-confidence detection
- Human-reviewed detection

Low-confidence predictions should not silently appear as guaranteed facts.

---

# 18. Dataset Strategy

The system should maintain a dataset representing actual deployment conditions.

A production dataset should contain variation in:

- Lighting
- Camera angle
- Waste density
- Occlusion
- Dirt
- Material condition
- Geographic environment
- Facility type

---

# 19. Detection API

The platform should expose a versioned API.

A detection response should contain at minimum:

```json
{
  "scan_id": "scan_123",
  "detection_id": "det_456",
  "material": "PET",
  "confidence": 0.94,
  "mask": "...",
  "location": {
    "x": 412,
    "y": 287
  },
  "estimated_value": 2.4,
  "hazard": false
}
```

---

# 20. Robot Integration

Robotics should be treated as an **integration capability**, not the central product.

The API should eventually support fields useful for automated manipulation:

```text
Material
Confidence
Mask
Object position
Grasp point
Value
Hazard
```

### Product positioning

**Correct:**

> “The platform produces robot-ready detection data.”

**Incorrect:**

> “The platform is an autonomous robotic waste sorter.”

---

# 21. AI Agent Layer

A reasoning layer can sit above the raw computer-vision results.

### Responsibilities

- Explain audit results
- Explain recovery rankings
- Summarize anomalies
- Answer questions about a scan
- Generate human-readable reports

Example:

> **Why was this object prioritized?**

> “This metal object was ranked highly because its estimated recoverable value is high relative to other detected materials and it is accessible.”

The agent should **not override raw model results**. Its role is interpretation and explanation.

---

# 22. System Architecture

```text
                         USER
                           │
                           ▼
                 ┌──────────────────┐
                 │ Web / Mobile UI  │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │      API         │
                 └────────┬─────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
       ┌─────────────┐         ┌─────────────┐
       │     S3      │         │  DynamoDB   │
       │ Media Store │         │ Application │
       └──────┬──────┘         │    Data     │
              │                └─────────────┘
              ▼
       ┌─────────────┐
       │ Orchestration│
       │   Lambda     │
       └──────┬──────┘
              │
              ▼
       ┌─────────────┐
       │  SageMaker  │
       │ Vision Model│
       └──────┬──────┘
              │
              ▼
       ┌─────────────┐
       │ Detection   │
       │   Engine    │
       └──────┬──────┘
              │
       ┌──────┼──────────────┐
       ▼      ▼              ▼
 Composition Hazard      Contamination
       │      │              │
       └──────┼──────────────┘
              ▼
       ┌─────────────┐
       │ Intelligence│
       │    Layer    │
       └──────┬──────┘
              │
       ┌──────┴──────┐
       ▼             ▼
  Dashboard      Bedrock/
                 Strands
                    │
                    ▼
               Explanations
```

---

# 23. Data Architecture

## Organization

```text
organization_id
name
subscription
settings
```

## Site

```text
site_id
organization_id
name
location
type
settings
```

## User

```text
user_id
organization_id
role
site_permissions
```

## Scan

```text
scan_id
organization_id
site_id
created_by
timestamp
source_media
status
model_version
```

## Detection

```text
detection_id
scan_id
material
confidence
mask
position
value
hazard
review_status
```

## Audit

```text
audit_id
scan_id
composition
contamination
recoverable_value
hazard_summary
```

---

# 24. Security & Privacy

The production system should provide:

- Organization-level data isolation
- Role-based access control
- Encrypted media storage
- Encrypted application data
- Secure API authentication
- Audit logging
- Controlled model/data access
- Configurable data retention

Images should only be accessible to authorized users and services.

If imagery can contain people, vehicles, addresses, or other identifying information, the production system should additionally define appropriate privacy handling and retention policies.

---

# 25. Reliability Requirements

The platform should distinguish between:

### System Failure

Example:

> Model endpoint unavailable.

and:

### Model Uncertainty

Example:

> Model processed image but confidence is low.

These must not be presented as the same state.

A scan should have explicit statuses such as:

```text
Queued
Processing
Completed
Completed — Low Confidence
Failed
Requires Review
```

---

# 26. Observability

The production system should monitor:

### Infrastructure

- API latency
- Error rates
- Lambda failures
- Storage failures
- Model endpoint health

### ML

- Model confidence
- Class distribution
- Detection frequency
- Drift
- Human correction rate

### Product

- Scans per site
- Repeat usage
- Audit generation
- Report exports
- Review frequency

---

# 27. Product Analytics

Important product-level metrics include:

## Adoption

- Organizations onboarded
- Active sites
- Monthly active users

## Usage

- Scans/site/month
- Audits/site/month
- Repeat scan rate

## AI

- Detection accuracy
- Human correction rate
- False-positive rate
- False-negative rate

## Business

- Revenue/site
- Cost/scan
- Customer retention
- Audit volume

## Value

Potentially:

- Material recovered
- Contamination identified
- Hazardous detections
- Estimated recoverable value

These should be treated as product metrics rather than claims about environmental impact unless independently measured.

---

# 28. Reporting & Export

Users should be able to export:

### Individual Audit

- PDF
- CSV / structured data

### Historical Data

- CSV
- API

### Organizational Reporting

- Site comparison
- Date-range reports
- Composition trends
- Contamination trends

---

# 29. Notifications & Alerts

The platform can eventually support configurable alerts.

### Contamination Alert

> “Contamination at Site A exceeded 15%.”

### Hazard Alert

> “Hazardous material detected in today's scan.”

### Composition Change

> “PET composition has increased significantly compared with the previous period.”

Alerts should be configurable by organization/site.

---

# 30. Billing Model

The product can support:

### Per-Site Subscription

```text
Organization
    ↓
Site subscription
    ↓
Recurring revenue
```

### Per-Audit

```text
Scan
 ↓
Audit fee
```

### Future API / Enterprise Licensing

For organizations requiring:

- High-volume processing
- API access
- Integrations
- Advanced analytics

Pricing should ultimately be configurable through product plans rather than hard-coded into the system.

---

# 31. Product Packaging

A possible production packaging structure:

## Audit

For organizations primarily needing composition reports.

**Includes:**

- Waste scans
- Composition
- Hazard detection
- Reports

## Operations

For facilities requiring ongoing monitoring.

**Includes:**

- Everything in Audit
- Contamination
- Historical analytics
- Alerts
- Multi-site management

## Intelligence / API

For organizations integrating the platform into other systems.

**Includes:**

- Everything above
- API
- Programmatic access
- Integration capabilities
- Higher-volume processing

These are proposed packaging concepts, not established pricing.

---

# 32. Roadmap

## Phase 1 — Measurement

```text
Image
 ↓
Detection
 ↓
Composition
 ↓
Audit
```

## Phase 2 — Operational Intelligence

Add:

- Contamination
- Historical analytics
- Reports
- Alerts
- Human review
- Value estimation

## Phase 3 — Worker Intelligence

Add:

- Recovery ranking
- Visual guidance
- AI explanations
- Mobile workflows

## Phase 4 — Infrastructure Intelligence

Add:

- Multi-site analytics
- API ecosystem
- Third-party integrations
- Advanced reporting

## Phase 5 — Automation

Add:

- Live camera streams
- Automated monitoring
- Robotics integrations
- Machine-to-machine workflows

The progression intentionally moves from **measurement → intelligence → action → automation**, rather than attempting to begin with robotics.

---

# 33. Key Product Risks

## 33.1 Model Accuracy

Real waste is difficult to analyze because items may be:

- Crushed
- Dirty
- Overlapping
- Partially hidden

### Mitigation

- Real-world datasets
- Confidence scores
- Human review
- Continuous retraining
- Transparent accuracy reporting

---

## 33.2 Dataset Bias

Public datasets may not represent actual deployment environments.

### Mitigation

Build a proprietary dataset from real operating environments.

---

## 33.3 False Hazard Detection

A false negative could have safety consequences.

### Mitigation

The system should be an **assistive detection tool**, not the sole basis for safety-critical handling decisions.

---

## 33.4 Value Estimate Reliability

Commodity prices vary.

### Mitigation

- Configurable pricing sources
- Timestamped values
- Clearly label estimates
- Never represent estimates as guaranteed revenue

---

## 33.5 Buyer Demand

The largest commercial risk is whether organizations actually value the resulting measurements enough to pay for them.

This should be validated with waste-industry participants before committing to the concept commercially.

---

# 34. Product Principles

### Principle 1 — Measure, Don't Just Detect

A detection is only useful if it contributes to an actionable measurement.

### Principle 2 — Auditability Over Black Box

Users should be able to trace an aggregate result back to the underlying detections.

### Principle 3 — Confidence Matters

Never present uncertain AI output as fact.

### Principle 4 — Human-in-the-Loop

Human corrections should improve the system rather than being treated purely as errors.

### Principle 5 — Complement Existing Infrastructure

The product should work **with** sorting equipment and workers where possible.

### Principle 6 — Automation-Ready, Not Automation-Dependent

Robotics should be an extension of the platform, not the justification for its existence.

### Principle 7 — Real-World Data Wins

Models should ultimately be trained and evaluated against the conditions in which they will actually operate.

---

# 35. Product North Star

The platform should ultimately answer four questions for every waste stream:

> **What is in it?**

**Composition**

> **How good is it?**

**Contamination**

> **What is dangerous or valuable?**

**Hazards + Recoverable Value**

> **How is it changing?**

**Historical Intelligence**

This is the core product loop:

```text
                 ┌─────────────┐
                 │    WASTE    │
                 └──────┬──────┘
                        │
                        ▼
                 ┌─────────────┐
                 │    SCAN     │
                 └──────┬──────┘
                        │
                        ▼
               ┌─────────────────┐
               │ AI DETECTION    │
               └────────┬────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
     Composition   Contamination   Hazards
          │             │             │
          └─────────────┼─────────────┘
                        ▼
                Recoverable Value
                        │
                        ▼
                ┌──────────────┐
                │ WASTE AUDIT  │
                └──────┬───────┘
                       │
                       ▼
                Historical Data
                       │
                       ▼
                 Better Decisions
```

---

# 36. Final Product Definition

### What are we building?

**A waste intelligence platform that transforms visual observations of waste into structured, auditable data.**

### What is the primary product?

**Waste composition and material auditing.**

### What are the major capabilities?

1. **Material detection**
2. **Composition analysis**
3. **Contamination analysis**
4. **Hazard detection**
5. **Recoverable-value estimation**
6. **Historical analytics**
7. **Audit reporting**
8. **Human review**
9. **Recovery recommendations**
10. **Robot-ready API**

### Who is it for?

Primarily:

- Municipalities
- Waste contractors
- MRFs/sorting facilities
- Recyclers
- Brands
- Waste-recovery organizations

### What is the fundamental differentiator?

Not:

> **“We can recognize garbage.”**

But:

> **“We turn waste into measurable, persistent, actionable data.”**

### Product hierarchy

```text
                    WASTE INTELLIGENCE PLATFORM
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
       MEASUREMENT         OPERATIONS        AUTOMATION
             │                 │                 │
      Composition          Contamination      API
      Material Data        QA                 Robotics
      Hazards              Reports            Integrations
      Value                Analytics
             │                 │
             └────────┬────────┘
                      ▼
                WASTE AUDIT
                      │
                      ▼
               DECISION SUPPORT
```

**The production product is built around the audit/measurement foundation. The ranked pick list remains valuable, but it sits on top of the audit rather than defining the product itself.**
