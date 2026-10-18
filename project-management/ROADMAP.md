# RedLab — Strategic Product & Engineering Roadmap

This document outlines the phased evolutionary roadmap for **RedLab** (Version 1.0 through 2.0). Each milestone builds upon prior architectural foundations to maintain a stable, verified, and production-grade educational platform.

---

## Roadmap Overview

```mermaid
gantt
    title RedLab Engineering Roadmap (Milestones 1–8)
    dateFormat  YYYY-MM-DD
    section Completed (v1.0.0)
    M1: Architecture & Foundation        :done, m1, 2026-09-01, 2026-09-20
    M2: Frontend & Visual Canvas MVP     :done, m2, 2026-09-15, 2026-10-05
    M3: Backend REST & SQLite Engine     :done, m3, 2026-09-20, 2026-10-10
    M4: Security Rules Engine & Heuristic:done, m4, 2026-10-01, 2026-10-15
    M7: Unit & Component Test Suites     :done, m7, 2026-10-05, 2026-10-16
    M8: Desktop Packaging & V1.0 Release :done, m8, 2026-10-10, 2026-10-17
    section Active & Upcoming (v1.1+)
    M1: Enterprise Multi-Tenant Models   :active, m1_follow, 2026-10-18, 2026-10-28
    M3: PostgreSQL & Alembic Migrations  :m3_follow, 2026-10-22, 2026-11-05
    M4: Ephemeral Target Sandboxes       :m4_follow, 2026-10-25, 2026-11-15
    M5: Disposable Script Execution      :m5, 2026-11-01, 2026-11-25
    M6: Multi-Container Docker & CI/CD   :m6, 2026-10-20, 2026-11-10
    M7: Sandbox Penetration & E2E Tests  :m7_follow, 2026-11-15, 2026-11-30
    M8: Challenge Guides & Prod Deploy   :m8_follow, 2026-11-20, 2026-12-05
```

---

## Milestone 1: Architecture and Foundation

**Goal:** Establish canonical system models, architectural boundaries, and reproducible contracts across client and server.

- [x] **1.1 Core System Architecture Specification** — Documented multi-tier structure in `docs/architecture.md`.
- [x] **1.2 Graph Primitive Schema Definition** — Pydantic models `GraphNode`, `GraphEdge`, `GraphData` in `backend/app/schemas/lab.py` and TypeScript interfaces in `frontend/src/types/index.ts`.
- [x] **1.3 Git Collaboration Strategy** — Defined 6-person ownership matrix and branch conventions in `TEAM_WORKFLOW.md` and `AGENTS.md`.
- [ ] **1.4 Enterprise Multi-Tenancy & Project Scoping Schema** — Expand database models to support User accounts, Organizations, Workspaces, and Lab version history (`RL-010`).
- [ ] **1.5 Strict OpenAPI & Contract Synchronization Pipeline** — Automated script verifying zero drift between Pydantic models and frontend TypeScript types.

---

## Milestone 2: Frontend and User Experience

**Goal:** Provide an intuitive visual workspace for cloud architecture design, security inspection, and telemetry observation.

- [x] **2.1 Visual Canvas Engine** — Drag-and-drop workspace using `@xyflow/react` with minimap, zoom controls, and grid snapping (`frontend/src/features/editor/EditorCanvas.tsx`).
- [x] **2.2 AWS Cloud Resource Palette** — Custom nodes for VPC, Subnet (public/private), Internet Gateway, EC2, S3, RDS, IAM Role, and Security Group (`ResourceLibrary.tsx`, `ResourceNode.tsx`).
- [x] **2.3 Dynamic Property Inspector** — Tabular Security Group rule editor and structured IAM policy statement editor (`PropertyInspector.tsx`, `SecurityGroupRuleEditor.tsx`, `IAMPolicyEditor.tsx`).
- [x] **2.4 Finding Details & Lateral Attack Path Viewer** — Collapsible bottom drawer with severity pills, remediation guides, and multi-step attack chain visualization (`ScanPanel.tsx`, `FindingCard.tsx`, `AttackPathView.tsx`).
- [x] **2.5 Dashboard & Lab Management** — Lab creation cards, search, deletion modals, and built-in insecure benchmark loader (`DashboardPage.tsx`).
- [ ] **2.6 User Authentication & Session UI** — Login, registration, token refresh, and profile management screens (`RL-011`).
- [ ] **2.7 Real-Time Simulation Event & Timeline Visualizer** — Dynamic timeline player rendering live event logs, exploit stages, and traffic activity (`RL-012`).
- [ ] **2.8 In-Browser Safe Script Editor & Validator** — Syntax-highlighted code editor for user testing scripts with client-side validation against restricted system calls (`RL-013`).

---

## Milestone 3: Backend and Database

**Goal:** Deliver a resilient, high-performance API server with robust data persistence, validation, and background processing.

- [x] **3.1 FastAPI Application Core** — Asynchronous route handlers with Swagger UI documentation at `/api/docs` (`backend/app/main.py`).
- [x] **3.2 Lab CRUD & Scan Execution Endpoints** — Create, read, update, delete, and scan operations (`backend/app/api/labs.py`).
- [x] **3.3 SQLite Persistence Layer** — SQLAlchemy 2.0 ORM models for `Lab` and `ScanResult` (`backend/app/models/lab.py`).
- [x] **3.4 Export / Import Package Serialization** — Schema-validated JSON import/export with structural integrity checks (`backend/app/services/lab_service.py`).
- [ ] **3.5 PostgreSQL Database Migration & Alembic Tooling** — Configure production PostgreSQL connection pooling and Alembic migration scripts (`RL-014`).
- [ ] **3.6 JWT Authentication & Role-Based Access Control (RBAC)** — Secure user endpoints, password hashing (Argon2/bcrypt), and role validation (`RL-015`).
- [ ] **3.7 Asynchronous Simulation Task Queue** — Background worker integration (Redis/Celery or Asyncio worker) for long-running simulation jobs (`RL-016`).

---

## Milestone 4: Simulation Engine

**Goal:** Move beyond static graph scanning into active, deterministic simulation of cloud environments and attack techniques.

- [x] **4.1 Modular Security Rule Registry** — Extensible `SecurityRule` base class and automatic registration framework (`backend/app/security_engine/registry.py`).
- [x] **4.2 10 Deterministic AWS Security Rules** — S3 public access, S3 encryption, SG unrestricted SSH, SG database exposure, RDS public access, RDS encryption, EC2 public exposure, EC2 missing IAM, IAM wildcard privileges (`backend/app/security_engine/rules/`).
- [x] **4.3 Risk Score Calculation Heuristic** — Weighted severity formula evaluating aggregate environmental posture (`backend/app/security_engine/analyzer.py`).
- [x] **4.4 Lateral Attack Path Graph Generator** — Pathfinding algorithm tracing internet ingress to internal databases via overprivileged credentials (`analyzer.py`).
- [ ] **4.5 Ephemeral Lab Environment Lifecycle Controller** — Safe creation, startup, teardown, and reset of simulated target environments (`RL-017`).
- [ ] **4.6 Catalog of Predefined Threat Scenarios** — Structured scenario definitions (e.g. S3 bucket data exfiltration, SSRF against IMDSv1, IAM privilege escalation) (`RL-018`).
- [ ] **4.7 Simulation Event Telemetry Engine** — Event bus recording step-by-step simulation states with timestamped impact logs (`RL-019`).
- [ ] **4.8 Execution Quotas & Watchdog Timers** — Hard timeouts and memory/CPU limits preventing runaway simulation processes (`RL-020`).

---

## Milestone 5: Custom Script Execution

**Goal:** Empower users to write and execute defensive or offensive validation scripts within tightly constrained, zero-trust sandbox boundaries.

- [ ] **5.1 Sandbox Architecture & Threat Model Specification** — Security specification defining isolation barriers, non-root execution, and resource throttling (`RL-021`).
- [ ] **5.2 Disposable Container Runtime Integration** — Container execution using lightweight runtimes (e.g. gVisor `runsc` or locked rootless container namespaces) (`RL-022`).
- [ ] **5.3 Real-Time Stdout/Stderr Stream Capture** — WebSocket/SSE streaming pipe returning stdout, stderr, and exit codes to the browser UI (`RL-023`).
- [ ] **5.4 Network Namespace Egress Lockdown & Host Isolation** — Strict iptables/nftables isolation preventing access to host loopback, internal cloud metadata, or unauthorized networks (`RL-024`).

---

## Milestone 6: DevOps and Infrastructure

**Goal:** Streamline local development, automate continuous integration, containerize services, and prepare for production deployment.

- [x] **6.1 Desktop Build Automation** — Automated packaging for macOS (`.dmg`) and Windows (`.exe`) via `.github/workflows/build-desktop.yml`.
- [ ] **6.2 Multi-Container Docker Compose Stack** — Orchestration of frontend (Vite/Nginx), backend (FastAPI), database (PostgreSQL), and cache/queue (Redis) (`RL-025`).
- [ ] **6.3 Continuous Integration Pipeline (GitHub Actions)** — Automated PR validation running linting (Ruff/ESLint), type checking (TypeScript/MyPy), and full test suites (`RL-026`).
- [ ] **6.4 Dependency & Container Security Auditing** — Automated scanning using `pip-audit`, `npm audit`, and Trivy for container images (`RL-027`).
- [ ] **6.5 Structured Logging & Prometheus Metrics** — JSON log formatters with request correlation IDs and Prometheus metrics endpoints (`RL-028`).

---

## Milestone 7: Testing and Security

**Goal:** Verify reliability, mathematical correctness of security algorithms, and impregnability of isolation boundaries.

- [x] **7.1 Comprehensive Backend Test Suite** — 29 automated Pytest tests validating lab CRUD, import/export, positive/negative rule evaluations, and attack path tracing.
- [x] **7.2 Frontend Component & Store Tests** — 9 Vitest tests validating Zustand store mutations and `FindingCard` UI interactions.
- [ ] **7.3 End-to-End Simulation Lifecycle Tests** — Full workflow integration tests simulating environment creation, attack execution, and teardown (`RL-029`).
- [ ] **7.4 Sandbox Boundary Penetration Tests** — Automated test suite verifying script sandbox cannot escape namespaces, read host files, or access network (`RL-030`).
- [ ] **7.5 API Security Hardening & Rate Limiting** — SlowAPI rate limiting, strict CORS whitelisting, and parameter validation guards (`RL-031`).

---

## Milestone 8: Documentation and MVP Release

**Goal:** Provide stellar documentation, reference materials, guided walkthroughs, and reliable deployment artifacts.

- [x] **8.1 Comprehensive Project README & Architecture Docs** — Clear architecture, data flow diagrams, setup steps, and security rules catalog (`README.md`, `docs/architecture.md`, `docs/security-rules.md`).
- [x] **8.2 Cross-Platform Desktop Installation Guide** — Detailed installation manual for macOS Gatekeeper and Windows SmartScreen (`docs/DESKTOP_INSTALLATION.md`).
- [x] **8.3 Pre-built Insecure Benchmark Walkthrough** — Built-in sample lab with one-click loader demonstrating vulnerabilities and remediation.
- [ ] **8.4 Interactive Scenario Walkthrough Guides** — Step-by-step instructional lab tutorials for students and security educators (`RL-032`).
- [ ] **8.5 Production Deployment & Disaster Recovery Runbook** — Operational documentation for cloud deployment, database backups, and restoration procedures (`RL-033`).
