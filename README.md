# RedLab — Visual Network Attack Simulation & Defense Platform (v1.1.1)

[![Python 3.12+](https://img.shields.io/badge/Python-3.12%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev/)
[![React Flow](https://img.shields.io/badge/@xyflow/react-12.4-FF0072.svg)](https://reactflow.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC.svg)](https://tailwindcss.com/)

> **RedLab (v1.1.1)** is an interactive, browser-based network attack simulation and defense education platform inspired by Cisco Packet Tracer. Users visually construct computer network topologies on a canvas, configure Layer 2/3 devices, simulate live packet flow, conduct deterministic TCP port scanning and service discovery, evaluate firewall ACL rules, inspect deep packet events, evaluate security rules that detect network attack surfaces, trace multi-hop lateral movement attack paths, and complete guided cybersecurity challenges.

---

## Key Features in RedLab 1.1.1

1. **Global Attack Mode (RED) & Defend Mode (BLUE):**
   - **Prominent Toolbar Mode Switch:** Seamlessly switch perspectives between Attacker and Defender without rebuilding networks.
   - **Mode-Aware Themes & Visual Identity:** Red-accented attacker aesthetic (`#FF3B4E`) vs Blue-accented defender aesthetic (`#3B82F6`) with dynamic link recoloring and node indicators.
   - **Dual-Layer Mode Enforcement:** Defense policy edits are locked in Attack Mode, and backend independently rejects prohibited operations (403 Forbidden) if mode validation fails.

2. **Custom Visual Network Editor & 11 Device Types:**
   - **PC / Workstation:** Standard client host with IP, subnet, gateway, and DNS configuration.
   - **Linux Server:** Dedicated Linux target with SSH daemons, configurable root passwords, fail2ban auto-banning, and rate limiting.
   - **Web Application Server:** HTTP/HTTPS server with toggleable WAF inspection, SQLi/XSS input sanitization, and TLS 1.3 encryption.
   - **DNS Server:** Authoritative and recursive DNS server with configurable A records and DNSSEC zone signing.
   - **Generic Server:** Multi-service host running HTTP, SSH, MySQL, and custom ports.
   - **Router (L3):** Multi-interface Layer 3 routing engine with per-port IP configuration, static routing tables, and NAT support.
   - **Layer 3 Switch:** High-performance multi-VLAN switch with Switch Virtual Interfaces (SVIs) and hardware line-rate inter-VLAN routing.
   - **Layer 2 Switch:** Ethernet bridge with access/trunk port modes and VLAN tagging (802.1Q).
   - **Firewall:** Stateful Layer 3/4 packet filter with prioritized rule evaluation (allow/deny, TCP/UDP/ICMP/Any, source/dest, port range).
   - **IDS / IPS Sensor:** Intrusion detection & inline prevention sensor with signature matching (`emerging_threats`) and packet dropping.
   - **External Network / Internet:** WAN boundary definition (`0.0.0.0/0`) for perimeter attacks and lateral movement testing.
   - **Generic Endpoint:** IoT device, printer, or peripheral endpoint.

3. **Attack Scenario System & Interactive Launcher:**
   - **Scenario A (Network Reconnaissance):** TCP SYN port scanning, socket fingerprinting, and service discovery.
   - **Scenario B (Authentication Security):** SSH dictionary brute force against weak root credentials with fail2ban detection.
   - **Scenario C (Traffic Analysis):** Cleartext HTTP token capture vs encrypted TLS 1.3 handshake with PCAP capture references.
   - **Scenario D (Web Security Injection):** OWASP Top 10 SQL Injection (`' OR '1'='1'`) and reflected XSS payload execution.
   - **Scenario E (Firewall & Segmentation Testing):** Cross-VLAN lateral movement probe evaluating firewall default-deny filtering.
   - **Live Evidence Capture:** Automatically captures leaked passwords, bearer tokens, open sockets, and packet traces.

4. **Defend Mode & "Verify Defense" Workflow:**
   - Configure defensive ACLs, WAF rules, IPS dropping, and fail2ban rate limits in the Property Inspector.
   - Controlled **"Verify Defense"** workflow reruns the approved test against the hardened lab without exposing raw attack launch controls.
   - **Side-by-Side Before/After Comparison:** Displays Initial Attack (e.g. 100% compromise rate) vs Defended Outcome (e.g. 0% exploit rate, packets blocked).
   - **Educational Root Cause & Verdict:** Clear explanations explaining how the defense neutralized the threat.

5. **Deterministic Network Simulation Engine:**
   - Topology validation: duplicate IDs, link integrity, IP address syntax, CIDR prefixes, and isolated devices.
   - Layer 2/3 connectivity: same-subnet switching, router hops, gateway validation, and firewall stateful inspection.
   - Interactive Ping Tool and Traffic Inspector with protocol filtering.

6. **Safety & Execution Isolation:**
   - Fully local, self-contained educational simulation with 0 external network requests or real exploits.
   - Server-side target boundary isolation preventing attacks outside the selected lab environment.

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

## Desktop Software (macOS & Windows)

RedLab is available as a standalone, downloadable desktop software with zero external setup required:
- **macOS:** Downloadable `.dmg` disk image and `.zip` archive (Universal Apple Silicon & Intel).
- **Windows PC:** Graphical installer (`RedLab Setup 1.0.0.exe`) and portable executable (`RedLab 1.0.0.exe`).

For full download instructions and build scripts, consult the [Desktop Installation Guide](docs/DESKTOP_INSTALLATION.md).

---

## Installation & Setup (Web / Local Development)

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

### Backend Unit & Integration Tests (66 Tests)
```bash
cd backend
python3 -m pytest tests/ -v
```
Tests cover:
- Lab CRUD, validation rejections, export/import schema integrity.
- Port scan simulation, firewall filtering, and packet trace generation.
- Positive and negative cases for all 8 network security rules.
- Network attack path generation and ingress chain modeling.
- Full remediation cycle (detect vulnerability $\rightarrow$ update config $\rightarrow$ rescan $\rightarrow$ 0 findings).

### Frontend Component & Store Tests (14 Tests)
```bash
cd frontend
npm test
```
Tests cover:
- Zustand store state transitions (`labStore`, `editorStore`, and `simulationStore`).
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
│   │   │   ├── security/        # ScanPanel, FindingCard, AttackPathView
│   │   │   └── simulation/      # SimulationPanel, PortScanner, TrafficInspector
│   │   ├── services/            # api.ts (REST client), exampleNetworkLab.ts
│   │   ├── stores/              # Zustand editorStore, labStore & simulationStore
│   │   ├── test/                # Vitest test suite & setup
│   │   ├── theme.ts             # Dark cybersecurity palette
│   │   └── types/               # TypeScript domain interfaces
│   ├── package.json
│   ├── vite.config.ts
│   └── vitest.config.ts
├── backend/
│   ├── app/
│   │   ├── api/                 # REST routes (/api/labs, /api/runs, /api/scenarios)
│   │   ├── core/                # DB engine, config settings
│   │   ├── models/              # SQLAlchemy Lab, ScanResult & Run models
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── services/            # Lab, Run, Scenario CRUD service logic
│   │   ├── network_engine/      # Topology validator, connectivity & port scan simulator
│   │   ├── security_engine/     # 8 Network rules, analyzer, and attack path engine
│   │   └── main.py              # FastAPI application entry
│   ├── tests/                   # Pytest test suite (66 tests)
│   └── requirements.txt
├── docs/
│   ├── architecture.md          # System architecture & sequence diagrams
│   └── security-rules.md        # Network rule catalog & remediation reference
├── AGENTS.md                    # Universal AI model guardrails
└── README.md
```

---

## The Simulated Security Model

RedLab is a **purely local simulation environment**:
- No external network sockets or exploits are launched.
- Network routing, firewall ACLs, and port scan responses are evaluated deterministically from graph nodes and typed edges.
- Risk scores provide immediate pedagogical feedback on network hardening.

---

## Built-In Example Walkthrough

When you open RedLab for the first time, click **"Load Enterprise Network Example"** on the Dashboard:
1. **Explore the Architecture:** The canvas renders a complete perimeter network containing an External WAN node, an Attacker Workstation, a Stateful Perimeter Firewall, an Internal Switch, and an Internal Application & Database Server.
2. **Execute a Port Scan:** Open the bottom drawer, select the **Port Scanner** tab, choose the Attacker PC as source and Server as target, and click **"Run TCP Port Scan"**. Observe open ports (HTTP:80, MySQL:3306, SSH:22) discovered through the network path.
3. **Run Security Scan:** Click **"Run Security Scan"** in the top toolbar.
4. **Analyze Findings:** Inspect identified network vulnerabilities:
   - Firewall default policy permits unsolicited traffic.
   - Permissive firewall rule allows `0.0.0.0/0` access to sensitive internal ports.
   - Unencrypted cleartext service (HTTP:80) running on server.
   - Management port (SSH:22) exposed to unauthenticated network access.
5. **Inspect Attack Paths:** Switch to the **Attack Paths** tab to see how an attacker on the external network bridges past the permissive firewall to exploit vulnerable services.
6. **Remediate:** Adjust the firewall default policy to `deny`, add specific authorized IP filters, upgrade services to HTTPS/SSH, and rescan to watch the findings resolve in real-time.
