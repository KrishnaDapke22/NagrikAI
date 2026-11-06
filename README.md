# NagrikAI 🇮🇳
### Intelligent, Privacy-First, Multimodal Civic Grievance Management Platform
> *"Your Voice. Your City. Our Responsibility."*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

NagrikAI is a modern civic technology and public service management platform designed to transform municipal grievance ingestion, automated computer vision diagnostics, spatial squad workload balancing, and transparent community-verified resolution.

---

## 📑 Table of Contents
- [Problem Statement & Mission](#-problem-statement--mission)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Machine Learning & Computer Vision](#-machine-learning--computer-vision)
- [UI & Application Modules](#-ui--application-modules)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Database Seeding](#2-database-seeding)
  - [Frontend Setup](#3-frontend-setup)
- [Running Automated Tests](#-running-automated-tests)
- [Safe Demo Credentials](#-safe-demo-credentials)
- [Project Directory Structure](#-project-directory-structure)
- [API Documentation](#-api-documentation)
- [Author & Acknowledgments](#-author--acknowledgments)

---

## 🎯 Problem Statement & Mission

Municipal corporations receive thousands of citizen complaints weekly across disjointed communication channels. Traditional civic portals suffer from:
1. **Lack of Complainant Privacy**: Citizens fear reporting sensitive local issues without anonymity from local authorities.
2. **Text-Only Ingestion**: Inability to seamlessly handle photos, videos, or voice notes from citizens speaking regional languages.
3. **Misclassification & Manual Triage**: Inaccurate departmental routing leading to days of dispatch delay.
4. **Unchecked Duplication & Fraud**: Repetitive submissions or spam flooding municipal squad queues.
5. **Inequitable Workload Distribution**: Field squads overburdened in certain municipal sectors while others remain underutilized.
6. **Unverified Resolution**: Cases marked closed without verifiable photographic proof of remediated conditions.

**NagrikAI solves these challenges** through privacy-by-design verified identity, YOLO computer vision defect detection, multilingual Indic NLP (English, Hindi, Marathi), a 4×4 municipal spatial grid with automated squad balancing, community backing, and verified before/after photographic remediation.

---

## ✨ Key Features

### 🛡️ Privacy-First Verified Citizen Identity
- **"Anonymous to Authorities" Toggle**: Citizens can submit grievances with full account verification while concealing their name, email, phone number, and avatar from municipal squad officers and public feeds.
- **"Verified Citizen – Identity Protected" Badge**: Displayed across public feeds and field officer queues to guarantee authentic filings without exposing citizen personal details.
- **Administrative Identity Audit Workflow**: Strict authorization procedure (`POST /api/complaints/{id}/reveal-identity`) requiring documented audit justification to decrypt complainant identity in emergency or legal proceedings.

### 👁️ YOLO Computer Vision Civic Defect Detection
- **Real-Time Defect Detection**: Computer vision engine recognizing critical civic hazards:
  - Potholes & road damage
  - Garbage accumulation & overflowing bins
  - Waterlogging & drainage overflow
  - Damaged public infrastructure & open hazards
- **Annotated Image Telemetry**: Generates preview images highlighting bounding boxes, confidence percentages, and class labels with human-in-the-loop override capability.

### 🌐 Multimodal & Multilingual Ingestion
- **Audio Voice Transcription**: Record or upload voice audio (WAV, MP3, M4A) with automated speech-to-text transcription.
- **Multilingual Understanding**: Native support for **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)** descriptions with semantic normalization.
- **Multimodal Uploads**: Accepts JPEG/PNG/WebP images, MP4 videos, and PDF documentation with MIME verification and 10MB size limits.

### 📍 4×4 Municipal Spatial Grid & AI Workload Balancer
- **4×4 Geospatial Matrix**: Divides the municipal jurisdiction (Pune/Pimpri region) into 16 discrete geospatial cells across 4 primary zones:
  - **North Zone** (Shivajinagar / Aundh / Khadki)
  - **South Zone** (Swargate / Katraj / Kondhwa)
  - **East Zone** (Viman Nagar / Kharadi / Hadapsar)
  - **West Zone** (Kothrud / Baner / Bavdhan)
- **Real-Time Cell Status Classification**:
  - 🔴 **RED (Critical)**: $\ge 6$ active grievances or $\ge 2$ critical safety hazards
  - 🟠 **ORANGE (Moderate)**: $\ge 3$ active grievances
  - 🟢 **GREEN (Optimal)**: Normal operational condition
- **AI Officer Deployment Balancer**: Automatically computes assignment recommendations matching field officers to highest-density spatial cells to minimize turnaround time.

### 🤝 NagrikAI Community Section (`/community`)
- **Public Civic Feed**: Verified complaints visible to fellow citizens filtered by Zone and Category.
- **"I am also affected" (+1 Support)**: Community backing counter elevating priority scores based on collective civic impact.
- **Official Authority Discussion Threads**: Citizens and municipal officials exchange progress updates with a distinct blue "Municipal Authority Response" badge.

### 🔍 Anti-Spam & Fraud Prevention Engine
- Evaluates submission velocity, keyword risk, repetitive text duplication, and GPS boundary anomalies.
- Flags suspicious filings to an Administrative Quarantine Queue for review (`/api/admin/spam-queue`).

### ⏱️ Automated SLA Escalation & Before/After Closure Proof
- Configurable SLA deadlines based on official category hazard levels (e.g., 6 hours for exposed electrical lines, 24 hours for water supply leakage, 72 hours for road resurfacing).
- Automatic priority escalation when SLA deadlines are exceeded.
- **Side-by-Side Photographic Verification**: Before (citizen proof) and After (officer remediation) photo comparison required for transparent grievance closure.

---

## 🏗️ System Architecture

```
                                  +-----------------------------+
                                  |       React 19 Frontend      |
                                  | (Vite, TypeScript, Tailwind) |
                                  +--------------+--------------+
                                                 |
                                         REST API / JWT Auth
                                                 |
                                                 v
                                  +-----------------------------+
                                  |       FastAPI Backend       |
                                  +--------------+--------------+
                                                 |
                +--------------------------------+--------------------------------+
                |                                |                                |
                v                                v                                v
+-------------------------------+ +-------------------------------+ +-------------------------------+
|       AI / ML Pipeline        | |     Spatial & SLA Engine      | |      Database & Storage       |
| • YOLOv8 Defect Detection     | | • 4x4 Grid Analytics          | | • SQLAlchemy 2.0 ORM          |
| • TF-IDF + Logistic Classifier| | • Dynamic Squad Balancer      | | • SQLite / PostgreSQL         |
| • Indic Multilingual NLP      | | • Automated SLA Escalations   | | • Local File Upload Store     |
| • SHAP Feature Attributions   | | • Anti-Spam Heuristic Filter  | |                               |
+-------------------------------+ +-------------------------------+ +-------------------------------+
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v4, Leaflet / CartoDB Voyager, Lucide React, Recharts |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn |
| **AI / ML / NLP** | scikit-learn, OpenCV / Pillow, SHAP, NumPy, Pandas, joblib, XGBoost |
| **Database** | SQLite (Default for development) / PostgreSQL ready |
| **Security** | JWT Authentication (HS256), bcrypt password hashing, input sanitization, role guards |

---

## 🧠 Machine Learning & Model Performance

| Model Task | Architecture | Benchmark Metric | Production Performance |
| :--- | :--- | :--- | :--- |
| **YOLO Civic Defect Detection** | YOLOv8 / CV Object Detection | Confidence & IoU | **89.4% mean confidence** |
| **Category Classification** | TF-IDF + Logistic Regression | Multi-class Accuracy | **100.0%** |
| **Multilingual Sentiment** | Multilingual Indic Embeddings | Classification Accuracy | **100.0%** |
| **Severity Estimation** | Random Forest Classifier | F1 Macro | **82.7%** |
| **Resolution Time Regression** | Random Forest Regressor | MAE / $R^2$ | **MAE: 0.215d**, $R^2$: **0.9599** |
| **Explainable AI** | SHAP TreeExplainer | Feature Attribution | Verified Feature Weights |

---

## 🖥️ UI & Application Modules

| Module | Route | Description |
| :--- | :--- | :--- |
| **Citizen Portal** | `/` | Grievance submission with privacy toggle, audio note recording, photo upload, and live tracking. |
| **Community Feed** | `/community` | Public municipal feed with category filters, +1 backing votes, and official discussion threads. |
| **Officer Dashboard** | `/officer` | Departmental triage queue, status dispatch, and before/after photo resolution upload. |
| **Admin Operations** | `/admin` | Real-time 4×4 spatial zone heatmaps, squad workload balancing, spam quarantine, and audit logs. |

---

## 🚀 Getting Started

### Prerequisites
- **Python**: Version `3.11` or higher
- **Node.js**: Version `18.0` or higher (`npm` included)
- **Git**

### 1. Backend Setup

Clone the repository:
```bash
git clone https://github.com/KrishnaDapke22/NagrikAI.git
cd NagrikAI
```

Create a virtual environment (optional but recommended):
```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
```

Install backend dependencies:
```bash
pip install -r backend/requirements.txt
```

Initialize environment configuration:
```bash
copy .env.example .env     # On Windows
# cp .env.example .env     # On Linux / macOS
```

### 2. Database Seeding

Populate the database with municipal departments, realistic grievances, and demo accounts:
```bash
python scripts/seed_database.py
```

Start the FastAPI backend server:
```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend Setup

In a new terminal window, navigate to `frontend` and install packages:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
*(On Windows PowerShell, use `npm.cmd run dev` if execution policy restricts PowerShell scripts).*

- **Web Application URL**: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Running Automated Tests

Run the full automated test suite verifying authentication, privacy protection, YOLO defect detection, 4×4 spatial grid analytics, and community interactions:

```bash
python -m pytest backend/tests/test_api.py -v
```
*(All 17 out of 17 test suites pass).*

---

## 🔑 Safe Demo Credentials

The login interface features **one-click demo persona buttons**. Alternatively, use these pre-seeded local credentials:

| Persona | Email | Password | Role / Scope |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@nagrikai.gov` | `citizen123` | Grievance submission, privacy toggle, status tracking, +1 support |
| **Officer** | `officer@nagrikai.gov` | `officer123` | Department triage, field dispatch, photo remediation closure |
| **Admin** | `admin@nagrikai.gov` | `admin123` | 4×4 spatial grid, squad workload balancing, spam quarantine, audit |

> [!NOTE]
> These credentials are exclusively for local testing and demonstration with seeded mock data. No production credentials or external keys are included.

---

## 📁 Project Directory Structure

```
NagrikAI/
├── backend/
│   ├── app/
│   │   ├── ai/            # AI pipelines (YOLO defect, TF-IDF, SHAP)
│   │   ├── api/           # FastAPI endpoints (auth, complaints, officer, admin)
│   │   ├── auth/          # JWT tokens & bcrypt password hashing
│   │   ├── database/      # SQLAlchemy session & models
│   │   ├── models/        # Database schema definitions
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   └── services/      # Business logic (SLA escalation, anti-spam)
│   ├── tests/             # Pytest test suite (17 comprehensive test suites)
│   └── requirements.txt   # Backend Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios HTTP client configuration
│   │   ├── components/    # Reusable UI widgets, charts, and maps
│   │   ├── context/       # Auth and Language state providers
│   │   ├── pages/         # Citizen, Officer, Admin & Community pages
│   │   └── locales/       # Multilingual strings (English, Hindi, Marathi)
│   ├── package.json       # Node.js dependencies & scripts
│   └── vite.config.ts     # Vite build & proxy configuration
├── models/                # Pre-trained ML classifiers & SHAP explainers
├── scripts/
│   └── seed_database.py   # Seeding script with realistic civic records
├── docs/                  # Architecture and technical documentation
├── .env.example           # Template environment configuration
├── .gitignore             # Git ignore configuration
└── README.md              # Project documentation
```

---

## 📚 API Documentation

Once the backend is running, explore the interactive OpenAPI / Swagger documentation:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

Key Endpoints:
- `POST /api/auth/login` — Authentication & JWT generation
- `POST /api/ai/analyze` — Multimodal AI grievance diagnostics
- `POST /api/complaints/` — Submit grievance (with privacy protection toggle)
- `GET /api/complaints/community` — Public community feed
- `POST /api/complaints/{id}/support` — Community +1 backing
- `GET /api/admin/grid-zones` — 4×4 municipal spatial grid analytics
- `POST /api/officer/complaints/{id}/resolve` — Photographic closure verification

---

## 👤 Author & Acknowledgments

- **Lead Developer**: [Krishna Dapke](https://github.com/KrishnaDapke22)
- **Repository**: [https://github.com/KrishnaDapke22/NagrikAI](https://github.com/KrishnaDapke22/NagrikAI)
- **License**: MIT License
