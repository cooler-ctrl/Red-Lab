# CLAUDE.md — RedLab Developer & Assistant Guidelines (v1.1.1)

## Product Mission
RedLab is a visual network attack simulation and defense laboratory for students (like Cisco Packet Tracer + Kali Linux). It simulates TCP port scanning, firewall rule filtering, DDoS SYN floods, SQL injection auth bypass, and lateral attack paths. Zero cloud services (no AWS/IAM).

## Commands
- **Frontend Dev Server:** `cd frontend && npm run dev` (starts on port 5173 with proxy to 8000)
- **Frontend Production Build:** `cd frontend && npm run build`
- **Frontend Test Suite:** `cd frontend && npm test`
- **Backend API Server:** `cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- **Backend Test Suite:** `cd backend && python3 -m pytest tests/ -v`

## Team & Git Branch Workflow
- Lead Architect: Owner (`feature/security-network-attacks`, `main`, `develop`)
- 5 Core Domain Contributors:
  - Dev 1: Canvas & Visual Graph (`feature/canvas-*`)
  - Dev 2: Inspector, Forms, Modals & UI (`feature/ui-*`)
  - Dev 3: Python Network Engine & Security Rules (`feature/security-*`)
  - Dev 4: FastAPI REST API & Storage (`feature/backend-*`)
  - Dev 5: QA, Testing & CI (`feature/qa-*`)
- Branching: Branch off `develop`, submit PR into `develop`, tag Lead for review. Never push directly to `main`.

## Architectural Invariants
1. Single Source of Truth for editor is Zustand (`editorStore.ts`).
2. Single Source of Truth for simulations is Zustand (`simulationStore.ts`).
3. Visual network graph serializes to `{ nodes: GraphNode[], edges: GraphEdge[] }`.
4. All attack scenarios and rules are deterministic Python classes evaluated against real topology graphs.
5. Dark cybersecurity theme only (`#0B0D12` background, `#11151D` panels, `#FF3B4E` primary red accent).
6. Educational Forensics: Always explain *who* closed a port (OS Kernel TCP RST vs. Firewall DROP) and what action to take.
7. See `TEAM_SYNC.txt` and `AGENTS.md` for full instructions.
