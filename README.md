# RedLab — Visual Network Attack Simulation & Defense Platform (v1.1.0)

[![Python 3.12+](https://img.shields.io/badge/Python-3.12%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev/)
[![React Flow](https://img.shields.io/badge/@xyflow/react-12.4-FF0072.svg)](https://reactflow.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC.svg)](https://tailwindcss.com/)

> **RedLab (v1.1.0)** is an interactive, browser-based network attack simulation and defense education platform inspired by Cisco Packet Tracer. Users visually construct computer network topologies on a canvas, configure Layer 2/3 devices, simulate live packet flow, conduct deterministic TCP port scanning and service discovery, evaluate firewall ACL rules, inspect deep packet events, evaluate security rules that detect network attack surfaces, trace multi-hop lateral movement attack paths, and complete guided cybersecurity challenges.

---

## Key Features

1. **Interactive Visual Network Editor:**
   - Full drag-and-drop canvas powered by `@xyflow/react`.
   - Grid background, minimap, zoom, pan, and fit-to-view navigation.
   - Comprehensive relationship validation across Layer 2/3 network link topologies.
   - Real-time finding count alert chips and running service indicators rendered directly on canvas nodes.

2. **Network Device & Host Catalog:**
   - **PC / Workstation:** Endpoint host with multi-interface IP addressing, subnet mask, default gateway, and DNS configuration.
   - **Router:** Multi-interface Layer 3 routing engine with per-port IP configuration, static routing tables, and NAT support.
   - **Switch:** Layer 2 broadcast domain forwarding with multi-port bridge and VLAN segmentation.
   - **Server:** Host running network daemons (HTTP:80, HTTPS:443, SSH:22, MySQL:3306, FTP:21, Telnet:23, custom ports) with default gateway routing.
   - **Firewall:** Stateful Layer 3/4 packet filter with prioritized rule evaluation (allow/deny, TCP/UDP/ICMP/Any, source/destination/port range).
   - **External Network:** WAN / Internet boundary definition (0.0.0.0/0) for perimeter attack simulation.

3. **Network Attack & Port Scanning Engine:**
   - **TCP Port Scanner:** Scan target hosts from any source node (e.g. Attacker PC or External WAN) across specified port ranges or standard profiles.
   - **Service Discovery & Fingerprinting:** Deterministically maps ports as `OPEN` (daemon listening and reachable), `FILTERED` (blocked by firewall ACL), or `CLOSED` (TCP RST).
   - **Firewall Evasion & ACL Evaluation:** Tests stateful packet filtering and reveals unauthorized service exposure.

4. **Deterministic Network Simulation Engine:**
   - **Topology Validation:** Deep validation checking for duplicate IDs, link integrity, IP address syntax, CIDR prefixes, and isolated devices.
   - **Connectivity Evaluation:** Evaluates same-subnet direct communication, Layer 2 switch forwarding, cross-subnet router hops with gateway validation, and inline firewall filtering.
   - **Interactive Ping Tool:** Test live connectivity between any two nodes on the canvas with packet exchange trace logs.
   - **Traffic Inspector:** Packet-level network event log capturing `icmp_request`, `icmp_reply`, `icmp_unreachable`, `port_scan_probe`, `port_scan_open`, `port_scan_filtered`, `firewall_allow`, `firewall_deny`, `routing_lookup`, and `arp_request`.

5. **Guided Training Scenarios with Automated Assessment:**
   - **Basic Network Connectivity:** Hands-on IP subnetting and gateway routing lab.
   - **Firewall Defense Lab:** Perimeter security exercise to block unauthorized SSH access while maintaining legitimate web traffic.
   - **Network Troubleshooting:** Interactive fault diagnostic challenge where students diagnose and remediate broken routing tables and gateway configurations.
   - Automated deterministic grading engine scoring submitted topologies against scenario objectives.

6. **Network Security & Attack Path Engine:**
   - 8 deterministic security rules evaluating WAN exposure, firewall policies, unencrypted services, and VLAN segmentation.
   - Multi-step attack path analyzer showing realistic attack chains from external public IPs and attacker workstations through perimeter firewalls to internal vulnerable servers.

7. **Persistence & Lifecycle:**
   - Persistent SQLite database storing labs, runs, packet event histories, port scan traces, and security audits.
   - Export and import laboratories as validated JSON packages with schema integrity validation.
   - Built-in one-click template: *"Enterprise Perimeter & DMZ Network"*.

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
