# RedLab — Master Task Inventory

This document serves as the single source of truth for all engineering tasks in RedLab. Each task is granular, assigned to a specific domain role, carries measurable acceptance criteria, and enforces strict security and verification standards.

---

## Task Summary & Status Dashboard

| ID | Title | Milestone | Priority | Role | Status | Issue |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RL-001** | Core Architecture Specification & Graph Schema | M1 | P0 | Lead | Completed | [#1](https://github.com/cooler-ctrl/Red-Lab/issues/1) |
| **RL-002** | Interactive Visual Canvas with React Flow | M2 | P0 | Dev 1 | Completed | [#2](https://github.com/cooler-ctrl/Red-Lab/issues/2) |
| **RL-003** | Dynamic Property Inspector & Rule Editors | M2 | P0 | Dev 2 | Completed | [#3](https://github.com/cooler-ctrl/Red-Lab/issues/3) |
| **RL-004** | FastAPI REST API & SQLAlchemy SQLite Persistence | M3 | P0 | Dev 4 | Completed | [#4](https://github.com/cooler-ctrl/Red-Lab/issues/4) |
| **RL-005** | Lab JSON Export/Import with Schema Validation | M3 | P1 | Dev 4 | Completed | [#5](https://github.com/cooler-ctrl/Red-Lab/issues/5) |
| **RL-006** | Deterministic Security Engine & 10 AWS Rules | M4 | P0 | Dev 3 | Completed | [#6](https://github.com/cooler-ctrl/Red-Lab/issues/6) |
| **RL-007** | Lateral Attack Path Discovery & Risk Scoring | M4 | P0 | Dev 3 | Completed | [#7](https://github.com/cooler-ctrl/Red-Lab/issues/7) |
| **RL-008** | Automated Pytest & Vitest Verification Test Suites | M7 | P0 | Dev 5 | Completed | [#8](https://github.com/cooler-ctrl/Red-Lab/issues/8) |
| **RL-009** | Standalone Cross-Platform Desktop Client Packaging | M8 | P1 | Dev 5 | Completed | [#9](https://github.com/cooler-ctrl/Red-Lab/issues/9) |
| **RL-010** | Multi-Tenancy & Project Scoping Data Models | M1 | P0 | Lead | Ready | [#10](https://github.com/cooler-ctrl/Red-Lab/issues/10) |
| **RL-011** | User Authentication & Workspace Management UI | M2 | P1 | Dev 2 | Ready | [#11](https://github.com/cooler-ctrl/Red-Lab/issues/11) |
| **RL-012** | Real-Time Simulation Event & Timeline Visualizer | M2 | P1 | Dev 1 | Ready | [#12](https://github.com/cooler-ctrl/Red-Lab/issues/12) |
| **RL-013** | In-Browser Safe Script Editor & Syntax Validator | M2 | P2 | Dev 2 | Ready | [#13](https://github.com/cooler-ctrl/Red-Lab/issues/13) |
| **RL-014** | PostgreSQL Database Migration & Alembic Tooling | M3 | P0 | Dev 4 | Ready | [#14](https://github.com/cooler-ctrl/Red-Lab/issues/14) |
| **RL-015** | User Authentication & Role-Based Access Control | M3 | P0 | Dev 4 | Ready | [#15](https://github.com/cooler-ctrl/Red-Lab/issues/15) |
| **RL-016** | Asynchronous Simulation Task Queue & Worker | M3 | P1 | Dev 4 | Ready | [#16](https://github.com/cooler-ctrl/Red-Lab/issues/16) |
| **RL-017** | Ephemeral Lab Environment Lifecycle Controller | M4 | P0 | Dev 3 | Ready | [#17](https://github.com/cooler-ctrl/Red-Lab/issues/17) |
| **RL-018** | Predefined Threat Simulation Scenario Catalog | M4 | P1 | Dev 3 | Ready | [#18](https://github.com/cooler-ctrl/Red-Lab/issues/18) |
| **RL-019** | Simulation Event Telemetry & Impact Recording | M4 | P1 | Dev 3 | Ready | [#19](https://github.com/cooler-ctrl/Red-Lab/issues/19) |
| **RL-020** | Execution Quotas, Resource Limits & Watchdog | M4 | P1 | Dev 3 | Ready | [#20](https://github.com/cooler-ctrl/Red-Lab/issues/20) |
| **RL-021** | Isolated Disposable Script Sandbox Architecture | M5 | P0 | Lead | Ready | [#21](https://github.com/cooler-ctrl/Red-Lab/issues/21) |
| **RL-022** | Script Sandbox Engine with gVisor / Non-Root | M5 | P0 | Dev 3 | Ready | [#22](https://github.com/cooler-ctrl/Red-Lab/issues/22) |
| **RL-023** | Real-Time Stdout/Stderr Execution Stream Capture | M5 | P1 | Dev 4 | Ready | [#23](https://github.com/cooler-ctrl/Red-Lab/issues/23) |
| **RL-024** | Sandbox Boundary Egress Lockdown & Host Isolation | M5 | P0 | Dev 3 | Ready | [#24](https://github.com/cooler-ctrl/Red-Lab/issues/24) |
| **RL-025** | Multi-Container Docker Compose Development Stack | M6 | P0 | Dev 5 | Ready | [#25](https://github.com/cooler-ctrl/Red-Lab/issues/25) |
| **RL-026** | GitHub Actions CI Pipeline for Lint, Test & Build | M6 | P0 | Dev 5 | Ready | [#26](https://github.com/cooler-ctrl/Red-Lab/issues/26) |
| **RL-027** | Container & Dependency Security Auditing | M6 | P1 | Dev 5 | Ready | [#27](https://github.com/cooler-ctrl/Red-Lab/issues/27) |
| **RL-028** | Structured JSON Logging & Prometheus Metrics | M6 | P1 | Dev 4 | Ready | [#28](https://github.com/cooler-ctrl/Red-Lab/issues/28) |
| **RL-029** | End-to-End Simulation Lifecycle Integration Tests | M7 | P0 | Dev 5 | Ready | [#29](https://github.com/cooler-ctrl/Red-Lab/issues/29) |
| **RL-030** | Sandbox Boundary Escape & Resource Quota Tests | M7 | P0 | Dev 5 | Ready | [#30](https://github.com/cooler-ctrl/Red-Lab/issues/30) |
| **RL-031** | API Rate Limiting, Input Guards & Hardening | M7 | P1 | Dev 4 | Ready | [#31](https://github.com/cooler-ctrl/Red-Lab/issues/31) |
| **RL-032** | Interactive Scenario Walkthrough Guides | M8 | P1 | Dev 2 | Ready | [#32](https://github.com/cooler-ctrl/Red-Lab/issues/32) |
| **RL-033** | Production Deployment & Disaster Recovery Runbook | M8 | P1 | Dev 5 | Ready | [#33](https://github.com/cooler-ctrl/Red-Lab/issues/33) |

---

## Completed Tasks (V1.0.0 Release)

### [RL-001] Core Architecture Specification & Graph Schema
- **Milestone:** M1: Architecture and Foundation
- **Priority:** P0 (Blocker)
- **Role:** Lead (System Architect)
- **Status:** Completed
- **Description:** Formulate core architecture documents, sequence diagrams, and canonical schemas for graph nodes, edges, and laboratory configurations.
- **Outcome:** Defined `GraphNode`, `GraphEdge`, `GraphData` in `backend/app/schemas/lab.py` and `frontend/src/types/index.ts`. Documented in `docs/architecture.md`.
- **Evidence:** Code merged in commit `3e8b734`.

### [RL-002] Interactive Visual Canvas with React Flow
- **Milestone:** M2: Frontend and User Experience
- **Priority:** P0 (Blocker)
- **Role:** Dev 1 (Visual Canvas Engineer)
- **Status:** Completed
- **Description:** Implement interactive drag-and-drop canvas with directional handles, minimap, zoom/pan navigation, and connection validation guards.
- **Outcome:** Operational canvas in `frontend/src/features/editor/EditorCanvas.tsx` and custom node rendering in `ResourceNode.tsx`.
- **Evidence:** Frontend test suite passes (`stores.test.ts`).

### [RL-003] Dynamic Property Inspector & Rule Editors
- **Milestone:** M2: Frontend and User Experience
- **Priority:** P0 (Blocker)
- **Role:** Dev 2 (UI & Inspector Engineer)
- **Status:** Completed
- **Description:** Build dynamic property inspector supporting VPCs, subnets, EC2, S3, RDS, IAM, and Security Groups with tabular rule editors.
- **Outcome:** Inspector implemented in `PropertyInspector.tsx`, `SecurityGroupRuleEditor.tsx`, and `IAMPolicyEditor.tsx`.
- **Evidence:** Tested with Vitest component tests (`FindingCard.test.tsx`).

### [RL-004] FastAPI REST API & SQLAlchemy SQLite Persistence
- **Milestone:** M3: Backend and Database
- **Priority:** P0 (Blocker)
- **Role:** Dev 4 (Backend API Engineer)
- **Status:** Completed
- **Description:** Implement FastAPI application with SQLAlchemy ORM, SQLite database storage, and complete REST endpoints for lab CRUD operations.
- **Outcome:** Operational endpoints `/api/labs`, `/api/labs/{id}`, `/api/labs/{id}/scan`, and `/api/health`.
- **Evidence:** 10 API integration tests in `backend/tests/test_api.py` passing with 100% success rate.

### [RL-005] Lab JSON Export/Import with Schema Validation
- **Milestone:** M3: Backend and Database
- **Priority:** P1 (High)
- **Role:** Dev 4 (Backend API Engineer)
- **Status:** Completed
- **Description:** Implement export and import functionality to allow users to save and share lab configurations as validated JSON packages.
- **Outcome:** Endpoint `/api/labs/{id}/export` and `/api/labs/import` with structural validation rejecting corrupted inputs.
- **Evidence:** `test_export_and_import_lab` and `test_import_validation_rejections` passing.

### [RL-006] Deterministic Security Engine & 10 AWS Rules
- **Milestone:** M4: Simulation Engine
- **Priority:** P0 (Blocker)
- **Role:** Dev 3 (Security Analysis Engineer)
- **Status:** Completed
- **Description:** Build modular rule registry and 10 deterministic security rules evaluating S3, SG, RDS, IAM, and EC2 configurations.
- **Outcome:** Rule registry in `app/security_engine/registry.py` and 10 rules under `app/security_engine/rules/`.
- **Evidence:** 19 unit tests passing in `backend/tests/test_security_engine.py`.

### [RL-007] Lateral Attack Path Discovery & Risk Scoring
- **Milestone:** M4: Simulation Engine
- **Priority:** P0 (Blocker)
- **Role:** Dev 3 (Security Analysis Engineer)
- **Status:** Completed
- **Description:** Create graph search algorithm tracing lateral attack paths from public internet entry points to internal databases via IAM roles.
- **Outcome:** Attack path generator in `app/security_engine/analyzer.py` and UI presentation in `AttackPathView.tsx`.
- **Evidence:** `test_attack_path_generation` passing.

### [RL-008] Automated Pytest & Vitest Verification Test Suites
- **Milestone:** M7: Testing and Security
- **Priority:** P0 (Blocker)
- **Role:** Dev 5 (QA & DevSecOps Engineer)
- **Status:** Completed
- **Description:** Establish comprehensive automated test coverage across both backend and frontend codebases.
- **Outcome:** 29 passing Pytest tests and 9 passing Vitest tests with 0 failures.
- **Evidence:** Verified in terminal: Pytest exited code 0, Vitest exited code 0.

### [RL-009] Standalone Cross-Platform Desktop Client Packaging
- **Milestone:** M8: Documentation and MVP Release
- **Priority:** P1 (High)
- **Role:** Dev 5 (QA & DevSecOps Engineer)
- **Status:** Completed
- **Description:** Package RedLab as a standalone desktop application for macOS (`.dmg`) and Windows (`.exe`) with bundled assets and build scripts.
- **Outcome:** Packaged desktop shell in `desktop/`, packaging scripts in `scripts/`, and automated release workflow in `.github/workflows/build-desktop.yml`.
- **Evidence:** Merged in commits `102b727` and `577341e`.

---

## Actionable Master Tasks (Active & Upcoming)

---

### [RL-010] Multi-Tenancy & Project Scoping Data Models
- **Milestone:** M1: Architecture and Foundation
- **Priority:** P0 (Blocker)
- **Role:** Lead (System Architect)
- **Dependencies:** RL-001, RL-004
- **Description:** Extend database schema to introduce `User`, `Workspace`, and `Project` entities, associating each `Lab` with a workspace and owner to support multi-tenant educational environments.
- **Implementation Steps:**
  1. Define `User`, `Workspace`, `Project` models in `backend/app/models/user.py` and `project.py`.
  2. Add foreign keys `workspace_id` and `created_by` to `Lab` model in `backend/app/models/lab.py`.
  3. Create Pydantic v2 schemas in `backend/app/schemas/project.py`.
  4. Synchronize TypeScript interfaces in `frontend/src/types/index.ts`.
- **Acceptance Criteria:**
  - `User` table contains `id`, `email`, `hashed_password`, `role`, `created_at`.
  - `Workspace` table groups labs and associates members.
  - Foreign key cascades cleanly delete associated labs when a workspace is removed.
  - Pydantic models validate workspace membership.
- **Verification Instructions:** Run `python3 -m pytest backend/tests/test_models.py -v`.
- **Required Evidence:** Pytest test output demonstrating multi-entity relational integrity.
- **Security Considerations:** Enforce strict tenant isolation; no queries may leak labs across workspaces.

---

### [RL-011] User Authentication & Workspace Management UI
- **Milestone:** M2: Frontend and User Experience
- **Priority:** P1 (High)
- **Role:** Dev 2 (UI & Inspector Engineer)
- **Dependencies:** RL-010, RL-015
- **Description:** Build authentication views (Login, Registration, Workspace Switcher) in the frontend matching the dark cybersecurity theme.
- **Implementation Steps:**
  1. Create `LoginPage.tsx` and `RegisterPage.tsx` under `frontend/src/features/auth/`.
  2. Implement `useAuthStore` in `frontend/src/stores/authStore.ts` storing JWT tokens in memory/secure storage.
  3. Add workspace selector dropdown in the top navigation header.
  4. Add route guards redirecting unauthenticated users to `/login`.
- **Acceptance Criteria:**
  - Login form validates email format and password presence.
  - Invalid credentials display friendly error toasts using existing `Toast` component.
  - Successful login transitions user to the Dashboard with active workspace labs.
  - Dark mode palette `#0B0D12` / `#11151D` strictly maintained.
- **Verification Instructions:** Run `npm run build && npm test`. Test login interaction via browser.
- **Required Evidence:** Vitest unit test for `authStore` and screenshot of login modal.
- **Security Considerations:** Never log plain text passwords. Clear tokens on logout.

---

### [RL-012] Real-Time Simulation Event & Timeline Visualizer
- **Milestone:** M2: Frontend and User Experience
- **Priority:** P1 (High)
- **Role:** Dev 1 (Visual Canvas Engineer)
- **Dependencies:** RL-002, RL-019
- **Description:** Create an interactive simulation timeline panel that renders sequential attack events, log streams, and visual indicators on canvas nodes during an active simulation run.
- **Implementation Steps:**
  1. Create `SimulationTimeline.tsx` component in `frontend/src/features/security/`.
  2. Implement scrubber controls (Play, Pause, Step Forward, Reset).
  3. Emit highlight events to `useEditorStore` to glow active nodes (e.g. Red for compromised, Yellow for targeted).
  4. Display timestamped event messages with severity badges.
- **Acceptance Criteria:**
  - Scrubbing to step $N$ highlights the corresponding node and displays step impact details.
  - Play button automatically steps through stages every 1.5 seconds.
  - Reset button clears highlight states back to default idle styling.
- **Verification Instructions:** Mount component in editor and verify node highlighting transitions.
- **Required Evidence:** Vitest component test for `SimulationTimeline`.
- **Security Considerations:** Sanitize all simulation log outputs before rendering to prevent XSS.

---

### [RL-013] In-Browser Safe Script Editor & Syntax Validator
- **Milestone:** M2: Frontend and User Experience
- **Priority:** P2 (Medium)
- **Role:** Dev 2 (UI & Inspector Engineer)
- **Dependencies:** RL-003, RL-021
- **Description:** Embed a syntax-highlighted code editor allowing users to author custom security test scripts (Python/Bash) with client-side syntax and safety validation.
- **Implementation Steps:**
  1. Integrate code editor component (e.g. lightweight Monaco or CodeMirror).
  2. Add language selector (Python 3, Bash).
  3. Implement regex pre-checks warning users of prohibited operations (e.g. `rm -rf /`, raw socket creation).
  4. Add "Execute in Sandbox" action button dispatching to the sandbox API.
- **Acceptance Criteria:**
  - Editor supports line numbers, syntax coloring, and tab indentation.
  - Pre-validator flags dangerous patterns before network submission.
  - Editor state persists in `useEditorStore`.
- **Verification Instructions:** Build frontend with `npm run build`; test code typing and warning highlights.
- **Required Evidence:** Vitest test checking client pre-validation warnings.
- **Security Considerations:** Client-side validation is UX-only; backend sandbox must strictly enforce all boundaries independently.

---

### [RL-014] PostgreSQL Database Migration & Alembic Tooling
- **Milestone:** M3: Backend and Database
- **Priority:** P0 (Blocker)
- **Role:** Dev 4 (Backend API Engineer)
- **Dependencies:** RL-004, RL-010
- **Description:** Configure PostgreSQL connection support alongside SQLite and initialize Alembic database migration management.
- **Implementation Steps:**
  1. Install `asyncpg`, `psycopg2-binary`, and `alembic` in `backend/requirements.txt`.
  2. Initialize Alembic configuration in `backend/alembic/`.
  3. Update `backend/app/core/database.py` to inspect `DATABASE_URL` (supporting both `sqlite:///` and `postgresql://`).
  4. Generate baseline migration script for `labs`, `scan_results`, `users`, and `workspaces`.
- **Acceptance Criteria:**
  - Running `alembic upgrade head` applies schema on fresh PostgreSQL instance.
  - SQLite continues working seamlessly for local standalone development.
  - Connection pooling configured with health ping verification.
- **Verification Instructions:** Execute `alembic upgrade head` on test database and run `pytest tests/`.
- **Required Evidence:** Alembic migration logs and passing API test suite.
- **Security Considerations:** Store database passwords in environment variables only (`.env`).

---

### [RL-015] User Authentication & Role-Based Access Control
- **Milestone:** M3: Backend and Database
- **Priority:** P0 (Blocker)
- **Role:** Dev 4 (Backend API Engineer)
- **Dependencies:** RL-010, RL-014
- **Description:** Implement JWT authentication endpoints (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`) with Argon2 password hashing and role validation dependencies.
- **Implementation Steps:**
  1. Add `pyjwt` and `pwdlib[argon2]` to backend dependencies.
  2. Create auth utility module in `backend/app/core/security.py`.
  3. Build FastAPI router `backend/app/api/auth.py`.
  4. Add dependency `get_current_user` checking token expiry and user status.
- **Acceptance Criteria:**
  - Password hashed using Argon2 with zero plain-text storage.
  - Expired or malformed JWT returns standard 401 Unauthorized.
  - Protected endpoints require valid Bearer token in `Authorization` header.
- **Verification Instructions:** Run `python3 -m pytest backend/tests/test_auth.py -v`.
- **Required Evidence:** Pytest test results covering registration, login, token expiry, and unauthorized access.
- **Security Considerations:** Enforce minimum password entropy (8+ chars) and secure token lifetimes.

---

### [RL-016] Asynchronous Simulation Task Queue & Worker
- **Milestone:** M3: Backend and Database
- **Priority:** P1 (High)
- **Role:** Dev 4 (Backend API Engineer)
- **Dependencies:** RL-004, RL-017
- **Description:** Implement asynchronous simulation job execution using background tasks to prevent blocking HTTP workers during multi-stage simulations.
- **Implementation Steps:**
  1. Create task execution queue manager in `backend/app/services/task_queue.py`.
  2. Update `/api/labs/{id}/simulate` to return `202 Accepted` with a `job_id`.
  3. Add polling/status endpoint `/api/jobs/{job_id}` reporting progress, status (`queued`, `running`, `completed`, `failed`), and logs.
  4. Provide WebSocket or SSE endpoint for real-time job log streaming.
- **Acceptance Criteria:**
  - Simulation job initiates in background without blocking HTTP thread.
  - Status endpoint accurately reflects state transitions.
  - Failed simulation jobs capture traceback and mark state as `failed`.
- **Verification Instructions:** Execute async simulation request via test client and poll status until completion.
- **Required Evidence:** Pytest test verifying job submission and status progression.
- **Security Considerations:** Protect status endpoints to ensure users can only inspect jobs in their workspace.

---

### [RL-017] Ephemeral Lab Environment Lifecycle Controller
- **Milestone:** M4: Simulation Engine
- **Priority:** P0 (Blocker)
- **Role:** Dev 3 (Security Analysis Engineer)
- **Dependencies:** RL-006, RL-016
- **Description:** Create lifecycle manager that provisions, starts, pauses, resets, and destroys isolated virtual simulation environments based on canvas graph definitions.
- **Implementation Steps:**
  1. Create `EnvironmentController` in `backend/app/simulation/controller.py`.
  2. Implement lifecycle hooks: `provision()`, `start()`, `pause()`, `reset()`, `teardown()`.
  3. Bind virtual state dictionary to the active `Lab` session.
  4. Ensure teardown executes reliably on timeout or abnormal termination.
- **Acceptance Criteria:**
  - Calling `provision(graph_data)` initializes all simulated node states.
  - `reset()` returns all nodes and services back to initial pristine configurations.
  - `teardown()` releases all in-memory or ephemeral runtime resources cleanly.
- **Verification Instructions:** Run simulation lifecycle unit tests in `backend/tests/test_simulation_controller.py`.
- **Required Evidence:** Pytest test log showing full provision -> start -> reset -> teardown cycle.
- **Security Considerations:** Prevent dangling processes or resource leaks via guaranteed `finally` cleanup handlers.

---

### [RL-018] Predefined Threat Simulation Scenario Catalog
- **Milestone:** M4: Simulation Engine
- **Priority:** P1 (High)
- **Role:** Dev 3 (Security Analysis Engineer)
- **Dependencies:** RL-006, RL-017
- **Description:** Create an extensible catalog of predefined cloud security attack scenarios demonstrating real-world threat actor tactics (MITRE ATT&CK for Cloud).
- **Implementation Steps:**
  1. Create scenario definition schema in `backend/app/schemas/scenario.py`.
  2. Implement scenario catalog in `backend/app/simulation/scenarios/`.
  3. Add Scenario 1: *S3 Public Data Leakage & Bucket Exfiltration*.
  4. Add Scenario 2: *SSRF via IMDSv1 on Public EC2 Leading to IAM Credential Theft*.
  5. Add Scenario 3: *Lateral Movement from Compromised Web Instance to RDS Database*.
- **Acceptance Criteria:**
  - Each scenario defines objective, target node, initial entry point, attack stages, and detection signals.
  - Scenarios execute deterministically against appropriately configured lab graphs.
  - Scenarios fail with explanatory error if required graph topology is absent.
- **Verification Instructions:** Run `python3 -m pytest backend/tests/test_scenarios.py -v`.
- **Required Evidence:** Test results for all 3 scenarios evaluating pass/fail states.
- **Security Considerations:** All scenario actions are purely emulated within local software state; no real packets are emitted.

---

### [RL-019] Simulation Event Telemetry & Impact Recording
- **Milestone:** M4: Simulation Engine
- **Priority:** P1 (High)
- **Role:** Dev 3 (Security Analysis Engineer)
- **Dependencies:** RL-017, RL-018
- **Description:** Implement an event emitter tracking every state mutation, network traversal, and security alert triggered during a simulation run.
- **Implementation Steps:**
  1. Create `SimulationEvent` model with fields `timestamp`, `stage`, `source_node`, `target_node`, `action`, `status`, `log_message`.
  2. Record events into database table `simulation_events`.
  3. Generate summary impact report detailing compromised data, privilege escalation achieved, and recommended mitigations.
- **Acceptance Criteria:**
  - Events are chronologically ordered with microsecond timestamps.
  - Each event links back to the originating simulation job.
  - Impact report calculates blast radius percentage across total lab resources.
- **Verification Instructions:** Execute scenario and verify event records in database.
- **Required Evidence:** Sample JSON event log extracted from test run.
- **Security Considerations:** Ensure sensitive configuration attributes (e.g. simulated passwords) are masked in event logs.

---

### [RL-020] Execution Quotas, Resource Limits & Watchdog
- **Milestone:** M4: Simulation Engine
- **Priority:** P1 (High)
- **Role:** Dev 3 (Security Analysis Engineer)
- **Dependencies:** RL-017
- **Description:** Implement strict watchdog timers and resource throttling to protect host systems from runaway simulation loops or infinite recursion.
- **Implementation Steps:**
  1. Define global configuration limits in `backend/app/core/config.py`: max simulation runtime (e.g. 60s), max step count (e.g. 50 steps), max memory per simulation.
  2. Implement watchdog timer wrapping execution in `backend/app/simulation/watchdog.py`.
  3. Raise `SimulationTimeoutException` if threshold exceeded and trigger immediate cleanup.
- **Acceptance Criteria:**
  - Simulation exceeding timeout is forcibly terminated within 500ms of limit.
  - User receives descriptive error indicating timeout was reached.
  - System resources are immediately reclaimed.
- **Verification Instructions:** Run negative test with intentional infinite loop; assert termination.
- **Required Evidence:** Pytest test log verifying timeout enforcement.
- **Security Considerations:** Denial of Service mitigation for multi-user shared host environments.

---

### [RL-021] Isolated Disposable Script Sandbox Architecture
- **Milestone:** M5: Custom Script Execution
- **Priority:** P0 (Blocker)
- **Role:** Lead (System Architect)
- **Dependencies:** RL-001, RL-020
- **Description:** Author comprehensive security specification defining zero-trust sandbox architecture for executing arbitrary user-provided scripts safely.
- **Implementation Steps:**
  1. Define sandbox threat vectors in `project-management/SECURITY-REQUIREMENTS.md`.
  2. Specify defense-in-depth isolation layers: unprivileged user (`uid 65534`), read-only root filesystem, dropped Linux capabilities (`CAP_DROP ALL`), seccomp filter profiling, cgroup v2 CPU/memory limits.
  3. Specify ephemeral disposable directory lifecycle and zero-persistence rules.
- **Acceptance Criteria:**
  - Architecture defines isolation boundaries, prohibited syscalls, and network restrictions.
  - Document reviewed and approved by Lead and Security Engineer.
- **Verification Instructions:** Review architectural specification against CIS Docker and Linux Hardening benchmarks.
- **Required Evidence:** Published document in `project-management/SECURITY-REQUIREMENTS.md`.
- **Security Considerations:** Core security architecture foundation.

---

### [RL-022] Script Sandbox Engine with gVisor / Non-Root
- **Milestone:** M5: Custom Script Execution
- **Priority:** P0 (Blocker)
- **Role:** Dev 3 (Security Analysis Engineer)
- **Dependencies:** RL-021
- **Description:** Implement container sandbox executor utilizing unprivileged container execution (or gVisor `runsc` runtime where supported) to run user Python/Bash scripts.
- **Implementation Steps:**
  1. Create `backend/app/sandbox/executor.py`.
  2. Implement container execution wrapper passing flags `--read-only`, `--cap-drop=ALL`, `--security-opt=no-new-privileges`, `--user=1000:1000`.
  3. Mount disposable ephemeral scratch directory with strict `noexec,nosuid` on non-target mounts.
  4. Enforce hard execution timeout (default: 10 seconds).
- **Acceptance Criteria:**
  - User script executes within isolated non-root context.
  - Attempting to write outside ephemeral mount fails with Permission Denied.
  - Sandbox terminates immediately upon script exit or timeout.
- **Verification Instructions:** Run automated tests in `backend/tests/test_sandbox.py`.
- **Required Evidence:** Pytest test verifying non-root uid and read-only filesystem enforcement.
- **Security Considerations:** Never run user scripts directly on the host operating system.

---

### [RL-023] Real-Time Stdout/Stderr Execution Stream Capture
- **Milestone:** M5: Custom Script Execution
- **Priority:** P1 (High)
- **Role:** Dev 4 (Backend API Engineer)
- **Dependencies:** RL-022, RL-013
- **Description:** Capture live stdout, stderr, and exit codes from sandbox execution and stream them back to the frontend terminal interface.
- **Implementation Steps:**
  1. Implement asynchronous process pipe reader in `backend/app/sandbox/stream.py`.
  2. Create WebSocket route `/api/sandbox/{session_id}/ws` emitting chunked text frames.
  3. Buffer output up to maximum size (e.g. 1 MB) to prevent buffer exhaustion attacks.
  4. Emit exit status code and execution duration summary upon completion.
- **Acceptance Criteria:**
  - Stdout and stderr streams are interleaved accurately with sub-100ms latency.
  - Terminal buffer caps output at 1 MB without memory leak.
  - Final message delivers integer exit code.
- **Verification Instructions:** Execute test script printing 1,000 lines; verify complete stream receipt.
- **Required Evidence:** Pytest test verifying stream framing and buffer cap enforcement.
- **Security Considerations:** Sanitize terminal control sequences to prevent terminal injection vulnerabilities.

---

### [RL-024] Sandbox Boundary Egress Lockdown & Host Isolation
- **Milestone:** M5: Custom Script Execution
- **Priority:** P0 (Blocker)
- **Role:** Dev 3 (Security Analysis Engineer)
- **Dependencies:** RL-022
- **Description:** Configure network namespace isolation ensuring script sandboxes have zero access to host interfaces, internal network subnets, or public internet unless explicitly permitted.
- **Implementation Steps:**
  1. Execute containers with `--network none` by default.
  2. For simulated networking, bind container to an isolated internal Docker bridge with strict iptables rules.
  3. Drop all egress traffic to link-local metadata addresses (`169.254.169.254`).
  4. Block access to host loopback (`127.0.0.1`) and host LAN.
- **Acceptance Criteria:**
  - Scripts cannot reach `169.254.169.254` (cloud metadata service).
  - Scripts cannot ping or connect to host machine ports.
  - DNS requests to external domains fail immediately unless simulation explicitly enables mock gateway.
- **Verification Instructions:** Execute probe script attempting curl to metadata IP; assert connection refused/timeout.
- **Required Evidence:** Pytest test log verifying network egress blockage.
- **Security Considerations:** Critical defense against cloud credential exfiltration (SSRF to AWS IMDS).

---

### [RL-025] Multi-Container Docker Compose Development Stack
- **Milestone:** M6: DevOps and Infrastructure
- **Priority:** P0 (Blocker)
- **Role:** Dev 5 (QA & DevSecOps Engineer)
- **Dependencies:** RL-004, RL-014
- **Description:** Provide production-grade `docker-compose.yml` orchestrating frontend, backend, PostgreSQL database, and Redis background broker with hot-reloading for developers.
- **Implementation Steps:**
  1. Create `Dockerfile` for frontend (multi-stage build with Nginx for production, Node for dev).
  2. Create `Dockerfile` for backend (Python 3.12+ with unprivileged user).
  3. Write `docker-compose.yml` and `docker-compose.dev.yml` in repository root.
  4. Configure named volumes for PostgreSQL data and healthcheck dependencies.
- **Acceptance Criteria:**
  - Running `docker compose up --build` launches fully functional application on `http://localhost:5173` and API on `http://localhost:8000`.
  - Database healthcheck ensures backend waits until PostgreSQL is ready.
  - Zero hardcoded passwords; all credentials referenced from `.env.example`.
- **Verification Instructions:** Run `docker compose config` and verify valid compose configuration syntax.
- **Required Evidence:** Terminal log of successful compose validation.
- **Security Considerations:** Run all containers as non-root users.

---

### [RL-026] GitHub Actions CI Pipeline for Lint, Test & Build
- **Milestone:** M6: DevOps and Infrastructure
- **Priority:** P0 (Blocker)
- **Role:** Dev 5 (QA & DevSecOps Engineer)
- **Dependencies:** RL-008, RL-025
- **Description:** Implement GitHub Actions continuous integration workflow running on every pull request to `main` and `develop`.
- **Implementation Steps:**
  1. Create `.github/workflows/ci.yml`.
  2. Add job `backend-checks`: Python 3.12 setup, Ruff linter, Pytest suite with coverage.
  3. Add job `frontend-checks`: Node.js 20 setup, `npm run build` (zero TS errors), Vitest test suite.
  4. Add job `security-scan`: `pip-audit` and `npm audit` checking for known CVEs.
- **Acceptance Criteria:**
  - Workflow triggers on `pull_request` to `main` and `develop`.
  - All jobs must pass before PR merge can be approved.
  - Detailed test failure annotations rendered in GitHub Actions UI.
- **Verification Instructions:** Test workflow with `act` locally or trigger test PR.
- **Required Evidence:** Validated `.github/workflows/ci.yml` syntax.
- **Security Considerations:** Prevent execution of workflows on untrusted fork PRs with write secrets.

---

### [RL-027] Container & Dependency Security Auditing
- **Milestone:** M6: DevOps and Infrastructure
- **Priority:** P1 (High)
- **Role:** Dev 5 (QA & DevSecOps Engineer)
- **Dependencies:** RL-025, RL-026
- **Description:** Integrate automated vulnerability scanners to detect vulnerable dependencies and base image misconfigurations.
- **Implementation Steps:**
  1. Add Trivy scanner job to GitHub Actions workflow.
  2. Configure `pip-audit` in backend pre-commit and CI.
  3. Configure `npm audit --audit-level=high` in frontend CI.
  4. Document remediation process for flagged CVEs.
- **Acceptance Criteria:**
  - CI fails if Critical or High CVEs are discovered in production dependencies.
  - Weekly scheduled scan detects zero-day vulnerabilities in container base images.
- **Verification Instructions:** Execute `pip-audit` locally and verify zero unpatched critical vulnerabilities.
- **Required Evidence:** Audit scan summary report.
- **Security Considerations:** Shift-left security posture.

---

### [RL-028] Structured JSON Logging & Prometheus Metrics
- **Milestone:** M6: DevOps and Infrastructure
- **Priority:** P1 (High)
- **Role:** Dev 4 (Backend API Engineer)
- **Dependencies:** RL-004
- **Description:** Implement structured JSON logging with correlation IDs and export Prometheus metrics for system health, scan counts, and simulation latencies.
- **Implementation Steps:**
  1. Configure `structlog` or standard library JSON formatter in `backend/app/core/logging.py`.
  2. Inject unique `X-Correlation-ID` header into every request via middleware.
  3. Integrate `prometheus-fastapi-instrumentator` exposing `/api/metrics`.
  4. Define custom counters: `scans_total`, `simulation_duration_seconds`, `vulnerabilities_detected_total`.
- **Acceptance Criteria:**
  - All application logs output structured single-line JSON.
  - `/api/metrics` returns valid Prometheus exposition format.
  - Sensitive parameters (passwords, tokens) automatically redacted.
- **Verification Instructions:** Query `/api/metrics` via HTTP and assert valid metrics output.
- **Required Evidence:** Sample JSON log line and Prometheus metrics output.
- **Security Considerations:** Prevent log injection and credential leakage.

---

### [RL-029] End-to-End Simulation Lifecycle Integration Tests
- **Milestone:** M7: Testing and Security
- **Priority:** P0 (Blocker)
- **Role:** Dev 5 (QA & DevSecOps Engineer)
- **Dependencies:** RL-008, RL-017, RL-018
- **Description:** Create end-to-end integration test suite exercising the entire lab lifecycle: creation, node configuration, simulation trigger, event inspection, and teardown.
- **Implementation Steps:**
  1. Create `backend/tests/test_e2e_simulation.py`.
  2. Test full lifecycle against *Insecure Cloud Environment* benchmark.
  3. Assert all attack stages complete in sequence.
  4. Assert simulation events are persisted and queried accurately.
  5. Assert teardown leaves zero orphaned resources.
- **Acceptance Criteria:**
  - Test executes cleanly in CI within 15 seconds.
  - 100% assertions pass across creation, execution, and cleanup.
- **Verification Instructions:** Run `python3 -m pytest backend/tests/test_e2e_simulation.py -v`.
- **Required Evidence:** Pytest test report.
- **Security Considerations:** Ensure test harnesses use isolated temporary database files.

---

### [RL-030] Sandbox Boundary Escape & Resource Quota Tests
- **Milestone:** M7: Testing and Security
- **Priority:** P0 (Blocker)
- **Role:** Dev 5 (QA & DevSecOps Engineer)
- **Dependencies:** RL-022, RL-024
- **Description:** Author adversarial penetration tests attempting to break out of script sandboxes, access host files, bypass resource quotas, or establish unauthorized network connections.
- **Implementation Steps:**
  1. Create `backend/tests/test_sandbox_security.py`.
  2. Test Case 1: Attempt to read `/etc/shadow` or host `/proc`.
  3. Test Case 2: Attempt fork bomb / thread exhaustion.
  4. Test Case 3: Attempt socket connection to `169.254.169.254` and local gateway.
  5. Test Case 4: Attempt to write to read-only container root.
- **Acceptance Criteria:**
  - All 4 attack vectors are thwarted deterministically.
  - Fork bomb killed by PID/cgroup limit without impacting host.
  - Network connection attempts drop with immediate failure.
- **Verification Instructions:** Run `python3 -m pytest backend/tests/test_sandbox_security.py -v`.
- **Required Evidence:** Pytest test log confirming all hostile attempts were blocked.
- **Security Considerations:** Continuous verification of isolation guarantees.

---

### [RL-031] API Rate Limiting, Input Guards & Hardening
- **Milestone:** M7: Testing and Security
- **Priority:** P1 (High)
- **Role:** Dev 4 (Backend API Engineer)
- **Dependencies:** RL-004, RL-015
- **Description:** Implement API rate limiting using SlowAPI, configure strict HTTP security headers, and add strict Pydantic payload size validation guards.
- **Implementation Steps:**
  1. Add `slowapi` rate limiting to FastAPI application.
  2. Apply rate limits: 100 req/min for general endpoints, 10 req/min for simulation/scan endpoints.
  3. Add security headers middleware: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy`.
  4. Restrict JSON payload size to maximum 5 MB to prevent memory exhaustion.
- **Acceptance Criteria:**
  - Exceeding rate limit returns HTTP 429 Too Many Requests.
  - Security headers present on all HTTP responses.
  - Payloads exceeding 5 MB rejected with 413 Payload Too Large.
- **Verification Instructions:** Run `python3 -m pytest backend/tests/test_security_hardening.py -v`.
- **Required Evidence:** Pytest test assertions for 429 and 413 status codes.
- **Security Considerations:** Defense against brute force, denial of service, and clickjacking.

---

### [RL-032] Interactive Scenario Walkthrough Guides
- **Milestone:** M8: Documentation and MVP Release
- **Priority:** P1 (High)
- **Role:** Dev 2 (UI & Inspector Engineer)
- **Dependencies:** RL-018, RL-007
- **Description:** Create step-by-step interactive instructional guides for students and instructors detailing attack scenarios and remediation exercises.
- **Implementation Steps:**
  1. Create `docs/scenarios/` directory.
  2. Author Guide 1: *Securing AWS S3 Buckets against Public Exposure*.
  3. Author Guide 2: *Hardening Security Groups and Eliminating Public Ingress*.
  4. Author Guide 3: *IAM Least Privilege and Preventing Lateral Escalation*.
  5. Include before/after architecture diagrams and remediation checklists.
- **Acceptance Criteria:**
  - Guides provide clear pedagogical explanations of vulnerability mechanics.
  - Every exercise links to corresponding RedLab canvas actions.
  - Guides formatted in clean GitHub markdown with visual diagrams.
- **Verification Instructions:** Review rendered markdown files in browser.
- **Required Evidence:** Markdown documents committed under `docs/scenarios/`.
- **Security Considerations:** Educational material highlighting defensive best practices.

---

### [RL-033] Production Deployment & Disaster Recovery Runbook
- **Milestone:** M8: Documentation and MVP Release
- **Priority:** P1 (High)
- **Role:** Dev 5 (QA & DevSecOps Engineer)
- **Dependencies:** RL-025, RL-014
- **Description:** Produce operational runbook covering production deployment, TLS certificate management, automated database backups, and disaster recovery procedures.
- **Implementation Steps:**
  1. Create `docs/DEPLOYMENT_RUNBOOK.md`.
  2. Document production architecture (Reverse proxy, ASGI workers, PostgreSQL cluster).
  3. Document automated database backup script (`pg_dump` with S3/local encryption).
  4. Document recovery procedure and backup restoration verification.
- **Acceptance Criteria:**
  - Runbook contains clear, copy-pasteable shell commands.
  - Backup restoration steps tested and proven functional.
  - Secrets management policies clearly articulated.
- **Verification Instructions:** Perform simulated backup and restore dry-run on staging environment.
- **Required Evidence:** Completed `docs/DEPLOYMENT_RUNBOOK.md`.
- **Security Considerations:** Zero secrets in documentation; ensure backups are encrypted at rest.
