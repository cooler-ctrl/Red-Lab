# CLAUDE.md — RedLab Developer & Assistant Guidelines

## Commands
- **Frontend Dev Server:** `cd frontend && npm run dev` (starts on port 5173 with proxy to 8000)
- **Frontend Production Build:** `cd frontend && npm run build`
- **Frontend Test Suite:** `cd frontend && npm test`
- **Backend API Server:** `cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- **Backend Test Suite:** `cd backend && python3 -m pytest tests/ -v`

## Team & Git Branch Workflow
- Lead: You / Architect
- 5 Team Members:
  - Dev 1: Canvas & Visual Graph (`feature/canvas-*`)
  - Dev 2: Inspector, Forms & Dashboard (`feature/ui-*`)
  - Dev 3: Python Security Rules & Registry (`feature/security-*`)
  - Dev 4: FastAPI REST API & Storage (`feature/backend-*`)
  - Dev 5: QA, E2E & Automation (`feature/qa-*`)
- Branching: Branch off `develop`, submit Pull Request into `develop`, tag Lead for review. Never push directly to `main`.

## Architectural Invariants
1. Single Source of Truth for editor is Zustand (`editorStore.ts`).
2. Visual cloud graph serializes to `{ nodes: GraphNode[], edges: GraphEdge[] }`.
3. All security rules inherit from `SecurityRule` in `backend/app/security_engine/registry.py`.
4. Dark cybersecurity theme only (`#0B0D12` background, `#FF3B4E` primary red accent).
5. Deterministic security evaluations — no mock scan outputs.
