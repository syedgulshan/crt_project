# Requirement Conflict & Overlap Analyzer

> **AI-Powered Semantic Analysis & Cross-Document Traceability Platform for SRS, BRD, and FRD Specifications**

[![Production Ready](https://img.shields.io/badge/status-production--ready-brightgreen.svg)]()
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)]()
[![AWS EC2](https://img.shields.io/badge/deployment-AWS%20EC2-orange.svg)]()

---

## 1. Overview

**Requirement Conflict & Overlap Analyzer** is an enterprise-grade web application designed for software engineering, systems architecture, and business analysis teams. It solves the critical problem of identifying contradictory, conflicting, duplicate, and semantically overlapping requirements across complex specification documents (SRS, BRD, FRD, PRD).

Instead of relying on simplistic keyword matching or string similarity, the platform analyzes the **semantic meaning, intent, operational constraints, and authorization models** of requirements.

### Core Capabilities:
- **Direct Contradiction Detection:** Detects mutually incompatible logical rules, timing constraints, and authorization flows (e.g., 15-minute inactivity timeout vs 30-minute inactivity timeout; self-service email recovery vs administrator-only verification).
- **Partial Conflict Identification:** Identifies divergent cancellation windows, role entitlement mismatches, and conflicting operational parameters.
- **Semantic Overlap Mapping:** Flags requirements expressing equivalent business capabilities using different terminology (e.g., "cancel order before shipment" vs "cancel until dispatch").
- **Smart Distinction Between Similarity & Contradiction:** Strictly complies with Rule 17: requirements like *"Users can update email"* and *"Users can change profile info"* are correctly classified as **Semantic Overlap**, **never** incorrectly flagged as logical contradictions.
- **Potential Duplicate & Ambiguity Detection:** Flags redundant requirements and unquantifiable statements lacking SLA numbers.
- **100% Traceable Findings:** Every conflict links directly to source document filename, section title, page number, and original unmodified requirement statements.
- **Multi-Format Document Upload:** Ingests PDF, DOCX, and TXT specifications.
- **Enterprise Reporting:** Exports to Markdown, CSV, printable PDF/HTML, and structured JSON.

---

## 2. Architecture & Pluggable AI Engine

The system is built with a modular architecture that cleanly decouples authentication, document parsing, requirement extraction, database storage, and AI analysis:

```
├── client/                     # Vite + React 19 + TypeScript + Vanilla CSS
│   ├── src/
│   │   ├── components/         # Modals, Navbar, Sidebar, MetricCards, Charts
│   │   ├── context/            # AuthContext (Firebase + Session State)
│   │   ├── pages/              # Dashboard, Documents, Requirements, Analysis, Reports, Settings, Login
│   │   ├── services/           # API Client & Firebase Integration
│   │   └── styles/             # Enterprise Dark Theme & Glassmorphism Design System
│
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/             # SQLite WAL Database with strict user-level data isolation
│   │   ├── middleware/         # Auth verification & Multer file upload
│   │   ├── routes/             # Auth, Documents, Requirements, Analysis, Reports
│   │   └── services/           # DocumentParser, RequirementExtractor, SemanticAnalyzer, ReportGenerator, DemoData
│
├── deploy/                     # Production AWS EC2 deployment assets (Nginx, PM2, systemd, setup script)
├── sample_documents/           # Physical sample SRS, BRD, and FRD documents for immediate upload testing
├── Dockerfile                  # Production multi-stage Docker container build
├── docker-compose.yml          # Docker Compose orchestration
└── DEPLOYMENT_EC2.md           # Step-by-step AWS EC2 deployment guide
```

### Pluggable AI Provider Architecture:
1. **Built-in High-Accuracy Local Logic Engine (Active by Default):**
   - Works **100% out of the box with zero external API keys**.
   - Performs intent extraction (actors, actions, domain concepts, timing/unit normalization, polarity).
   - Evaluates contradiction matrices for timing, authorization hierarchies, and business logic.
2. **Cloud LLM Providers (Google Gemini & OpenAI GPT-4o):**
   - Seamlessly upgrades to Google Gemini 1.5 or OpenAI GPT-4o when `GEMINI_API_KEY` or `OPENAI_API_KEY` are provided in `.env` or in the Settings tab.

---

## 3. Quick Start / Running Locally

### Prerequisites
- Node.js 20+ or 22 LTS (Windows, macOS, or Linux)
- npm 10+

### Step 1: Install Dependencies
```bash
# In the project root directory
npm install
npm --prefix client install
```

### Step 2: Build the Frontend Static Bundle
```bash
npm --prefix client run build
```

### Step 3: Run the Application
```bash
# Starts the fullstack application on http://localhost:5000
npm start
```
Open **http://localhost:5000** in your browser.

> In development mode with hot-reloading:
> - Start backend: `npm run server` (runs on port 5000)
> - Start frontend dev server: `npm run client` (runs on port 3000 with proxy to port 5000)

---

## 4. Immediate Testing via 1-Click Demo Mode

To test all application features immediately without manually preparing documents:

1. Open **http://localhost:5000**.
2. Click **"1-Click Demo Access (Google Analyst)"** on the login screen.
3. In the top navigation bar or the dashboard banner, click **"⚡ Load Sample SRS & BRD Data"**.
4. The system automatically seeds:
   - **SRS E-Commerce Platform (SRS-001 through SRS-008)**
   - **BRD Enterprise Governance (BRD-014 through BRD-080)**
   - **FRD Identity & Order Flow (FRD-101 through FRD-106)**
5. Click **"Run Analysis"** to inspect detected contradictions, overlaps, duplicates, and ambiguities.
6. Click any finding to inspect the **side-by-side comparison modal**.

### Manual Document Upload Testing:
You can also test uploading physical files located in the `sample_documents/` directory:
- `sample_documents/Sample_SRS_ECommerce.txt`
- `sample_documents/Sample_BRD_Procurement.txt`
- `sample_documents/Sample_FRD_IdentityAccess.txt`

---

## 5. Firebase Authentication Setup

The client is pre-wired with Firebase Authentication supporting:
- Google Sign-In (OAuth Popup)
- Apple Sign-In (OAuth Popup)
- Session token synchronization and route protection

To connect your own Firebase project:
1. Create a project in [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** with Google and Apple providers.
3. Add your Firebase credentials to `.env` and `client/.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

---

## 6. AWS EC2 Production Deployment

The project is configured for deployment on an **AWS EC2 Linux instance**.

See [DEPLOYMENT_EC2.md](file:///c:/Users/Malik/OneDrive/Desktop/crt%20project/DEPLOYMENT_EC2.md) for full instructions.

### Quick Deployment via Automated Script:
```bash
# On your EC2 Ubuntu / Amazon Linux instance:
git clone <your-repo-url> /var/www/requirement-analyzer
cd /var/www/requirement-analyzer
chmod +x deploy/ec2-setup.sh
./deploy/ec2-setup.sh
```

### Docker Deployment on EC2:
```bash
docker compose up -d --build
```

---

## 7. Data Model & Database Schema

The platform uses SQLite with **Write-Ahead Logging (WAL)** mode for high concurrency and zero configuration:
- `users`: User identity, provider, and timestamps.
- `documents`: Uploaded document metadata, format, file path, status, requirement count.
- `requirements`: Extracted requirements with stable references (`SRS-001`), sections, page numbers, priority, metadata.
- `conflicts`: Detected contradictions and overlaps, severity levels, similarity scores, conflicting condition explanations, and neutral suggested clarifications.
- `analysis_jobs`: Asynchronous job state (`pending → processing → completed → failed`).

---

## 8. Exporting Audit Reports

From the **Conflict Reports** tab, audit reports can be exported in four formats:
- **Print / PDF:** Clean, professional printable HTML report with print-to-PDF styles.
- **Markdown:** GitHub-flavored markdown report (`requirement-conflict-report.md`).
- **CSV:** Tabular export for spreadsheet analysis (`requirement-conflicts.csv`).
- **JSON:** Complete machine-readable payload.
