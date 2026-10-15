# RedLab — Visual Cloud Security Lab (V1.0)

[![Python 3.12+](https://img.shields.io/badge/Python-3.12%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev/)
[![React Flow](https://img.shields.io/badge/@xyflow/react-12.4-FF0072.svg)](https://reactflow.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC.svg)](https://tailwindcss.com/)

> **RedLab** is an interactive, browser-based cloud security simulation platform inspired by Cisco Packet Tracer, built for computer science students, security engineers, and cloud architects. Users visually construct AWS environments, configure service security postures, execute deterministic security scans, discover vulnerabilities, trace lateral attack paths, and apply defensive remediations.

---

## Key Features

1. **Interactive Visual Infrastructure Editor:**
   - Full drag-and-drop canvas powered by `@xyflow/react`.
   - Grid background, minimap, zoom, pan, and fit-to-view navigation.
   - Directional connection validation (e.g. subnets inside VPCs, instances inside subnets, security groups attached to compute/databases).
   - Real-time finding count alert chips rendered directly on vulnerable canvas nodes.

2. **Supported Cloud Resources:**
   - **Networking:** VPC, Public Subnet, Private Subnet, Internet Gateway, Security Group (with structured tabular rule editor).
   - **Compute:** EC2 Instance (public IP toggle, instance type, IAM role association).
   - **Storage:** S3 Bucket (Block Public Access, public access flags, server-side encryption, versioning).
   - **Database:** RDS Database (public accessibility, encryption at rest, subnet binding, engine selection).
   - **Identity & Access Management:** IAM Role (structured policy editor with allowed actions and resource scoping).

3. **Deterministic Python Security Engine:**
   - 10 extensible detection rules evaluating real graph topology and configuration fields.
   - Categorized findings with severity levels (`Critical`, `High`, `Medium`, `Low`).
   - Contextual risk scoring calculated from weighted severity metrics.
   - Multi-step attack path analyzer showing realistic attack chains from external public IPs to overprivileged IAM roles and sensitive internal data stores.

4. **Persistence & Lifecycle:**
   - Persistent SQLite database storing labs and audit scan history.
   - Export and import laboratories as validated JSON packages with schema integrity validation.
   - One-click loading of a built-in deliberately insecure benchmark environment (*"Insecure Cloud Environment"*).

5. **Team Collaboration & AI Guardrails:**
   - Pre-configured team git branching workflow for 6-person teams (`TEAM_WORKFLOW.md`).
   - AI system prompt rules (`AGENTS.md`, `.cursorrules`, `CLAUDE.md`) ensuring AI assistants used by team members strictly adhere to architectural boundaries without drift.

---

## Technology Stack

### Frontend
- **Framework:** React 19 with strict TypeScript
- **Bundler:** Vite 6
- **Visual Graph Editor:** `@xyflow/react` (React Flow)
- **Styling:** Tailwind CSS v4 with dark cybersecurity theme
- **State Management:** Zustand
- **Icons:** Lucide React
- **Validation:** Zod & React Hook Form
- **Testing:** Vitest & React Testing Library with JSDOM

### Backend
- **Framework:** FastAPI with Python 3.12+ (tested on Python 3.14)
- **Data Validation:** Pydantic V2
- **ORM & Storage:** SQLAlchemy 2.0 with SQLite (local development)
- **API Documentation:** OpenAPI / Swagger UI automatically generated at `/api/docs`
- **Testing:** Pytest & HTTPX TestClient

---

## Prerequisites

- **Python:** Version 3.12 or newer (`python3 --version`)
- **Node.js:** Version 20 or newer (`node --version`)
- **npm:** Version 10 or newer (`npm --version`)

---

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repo-url> redlab
cd redlab
```

### 2. Backend Setup
```bash
cd backend

# Install Python dependencies
pip3 install -r requirements.txt

# Start the FastAPI backend server
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend initializes the SQLite database (`backend/redlab.db`) automatically upon startup.  
Verify the health check: `http://localhost:8000/api/health`

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
The frontend will launch at `http://localhost:5173/`.  
The Vite dev server automatically proxies `/api` calls to `http://localhost:8000`.

---

## Running Automated Tests

### Backend Unit & Integration Tests (29 Tests)
```bash
cd backend
python3 -m pytest tests/ -v
```
Tests cover:
- Lab CRUD, validation rejections, export/import schema integrity.
- Positive and negative cases for all 10 security rules.
- Multi-step attack path generation.
- Full remediation cycle (detect vulnerability $\rightarrow$ update config $\rightarrow$ rescan $\rightarrow$ 0 findings).

### Frontend Component & Store Tests (9 Tests)
```bash
cd frontend
npm test
```
Tests cover:
- Zustand store state transitions (`labStore` and `editorStore`).
- `FindingCard` component rendering, severity pills, accordion expansion, and resource selection callbacks.

### Frontend Production Build
```bash
cd frontend
npm run build
```
Compiles TypeScript into production assets in `frontend/dist/` with 0 type errors.

---

## Project Structure

```
redlab/
├── frontend/
│   ├── src/
│   │   ├── components/          # Atomic UI (Button, Modal, Toast)
│   │   ├── features/
│   │   │   ├── dashboard/       # DashboardPage, LabCard, CreateLabModal
│   │   │   ├── editor/          # Canvas, Library, Inspector, ResourceNode
│   │   │   └── security/        # ScanPanel, FindingCard, AttackPathView
│   │   ├── services/            # api.ts (REST client), exampleLab.ts
│   │   ├── stores/              # Zustand editorStore & labStore
│   │   ├── test/                # Vitest test suite & setup
│   │   ├── theme.ts             # Dark cybersecurity palette
│   │   └── types/               # TypeScript domain interfaces
│   ├── package.json
│   ├── vite.config.ts
│   └── vitest.config.ts
├── backend/
│   ├── app/
│   │   ├── api/                 # REST routes (/api/labs, /api/health)
│   │   ├── core/                # DB engine, config settings
│   │   ├── models/              # SQLAlchemy Lab & ScanResult models
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── services/            # Lab CRUD service logic
│   │   ├── security_engine/     # Modular security engine
│   │   │   ├── rules/           # 10 security rule implementations
│   │   │   ├── analyzer.py      # Graph analyzer & attack path engine
│   │   │   └── registry.py      # Abstract rule class & registry
│   │   └── main.py              # FastAPI application entry
│   ├── tests/                   # Pytest test suite
│   └── requirements.txt
├── docs/
│   ├── architecture.md          # System architecture & sequence diagrams
│   └── security-rules.md        # Rule catalog & remediation reference
├── AGENTS.md                    # Universal AI model guardrails
├── .cursorrules                 # Cursor IDE rules
├── CLAUDE.md                    # Claude Code assistant commands & guidelines
├── TEAM_WORKFLOW.md             # 6-person team Git branching handbook
└── README.md
```

---

## The Simulated Security Model

RedLab is a **purely local simulation environment**:
- No AWS credentials or cloud provider accounts are required.
- No actual cloud resources are created or billed.
- Network routing and firewall relationships are evaluated deterministically from graph nodes and typed edges.
- Risk scores provide immediate pedagogical feedback on infrastructure hardening.

---

## Built-In Example Walkthrough

When you open RedLab for the first time, click **"Load Example: Insecure Cloud Environment"** on the Dashboard:
1. **Explore the Architecture:** The canvas renders a complete 10-node simulated VPC containing an Internet Gateway, Public Subnet, Private Subnet, EC2 Instance, two Security Groups, an S3 Bucket, an RDS Postgres Database, and an IAM Role.
2. **Execute a Scan:** Click **"Run Security Scan"** in the top toolbar.
3. **Analyze Findings:** The bottom drawer displays identified misconfigurations:
   - S3 bucket has public access enabled and Block Public Access disabled.
   - S3 bucket has encryption disabled.
   - Security group allows unrestricted port 22 (SSH) and database ports from `0.0.0.0/0`.
   - RDS database has public accessibility enabled with open firewall rules.
   - IAM role has full administrative wildcard permissions (`*` on `*`).
4. **Inspect Attack Paths:** Switch to the **Attack Paths** tab to see how an internet actor can compromise the public EC2 instance, leverage the overprivileged IAM role, and exfiltrate database records.
5. **Remediate:** Click on the S3 bucket node, toggle off public access, enable Block Public Access, and turn on encryption. Rescan to watch the findings resolve in real-time.

---

## Known Limitations & Future Roadmap

### Current Version (V1.0)
- Local SQLite database (suitable for single-user development).
- Graph connectivity supports standard containment and attachment relationships; complex multi-hop route tables are represented via subnet and gateway attachments.

### Future Roadmap
- Guided challenges and interactive scenario tutorials with scoring.
- Additional AWS services (Lambda, ALB, CloudFront, KMS, DynamoDB).
- Multi-cloud simulation support (Google Cloud, Azure).
- Automated Terraform and AWS CloudFormation import/export.
- Instructor assignment management and student grading dashboards.
