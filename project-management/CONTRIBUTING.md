# Contributing to RedLab

Thank you for contributing to RedLab! To maintain high code quality, security rigor, and architectural consistency across our 6-person team, all contributors must adhere to these guidelines.

---

## 1. Local Environment Setup

### Prerequisites
- **Python:** 3.12+ (tested up to Python 3.14)
- **Node.js:** 20.x or newer
- **npm:** 10.x or newer
- **Git:** 2.30+

### Step-by-Step Initialization
```bash
# 1. Clone repository
git clone https://github.com/cooler-ctrl/Red-Lab.git
cd Red-Lab

# 2. Setup backend virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Setup frontend dependencies
cd ../frontend
npm install
```

---

## 2. Git Branching Strategy

We follow a GitFlow-inspired branching strategy. All work is conducted on dedicated feature branches originating from and merging back into `develop`.

```
           main (Production Release)
             ▲
             │ [Tagged Releases v1.0, v1.1]
             │
          develop (Integration Branch)
          ▲   ▲   ▲   ▲   ▲
         ╱    │   │   │    ╲
feature/  feature/ feature/ feature/ feature/
canvas-*  ui-*    security-* backend-* qa-*
```

### Allowed Branch Prefixes by Role

> **EXCLUSIVE LEAD APPROVAL POLICY:**  
> **Only Pashtrik Maliqi (@cooler-ctrl)** can review and approve pull requests and merges into `main`. Direct pushes to `main` are strictly forbidden.

| Member & Role | Domain / Subsystem | Allowed Branch Prefix & Dedicated Branch |
| :--- | :--- | :--- |
| **Pashtrik Maliqi** (Lead Architect & Owner) | Schemas, integrations, release reviews, sole approval | `main`, `develop`, `release/*` |
| **Aridoni** (API & Backend Developer) | Backend API, services, auth, simulation logic | `feature/backend-*`, `feature/backend-aridoni` |
| **Engjulli** (Cyberattack Simulation Developer) | Security Engine, attack scenarios, telemetry | `feature/security-*`, `feature/security-engjulli` |
| **Lavda** (Database & Web App Developer) | Database schema, models, persistence, history | `feature/database-*`, `feature/database-lavda`, `feature/backend-lavda` |
| **Basha** (Frontend Web Developer) | Visual Canvas, React Flow, Node Geometry, Web UI | `feature/canvas-*`, `feature/canvas-basha`, `feature/frontend-basha` |
| **Nazmi** (Solution Architect & Frontend Dev) | UI, Inspector, Forms, Dashboard, Modals, UX | `feature/ui-*`, `feature/ui-nazmi`, `feature/frontend-nazmi` |
| **Bugfixes** | Bug resolutions across domains | `fix/<issue-name>` |

---

## 3. Commit Message Standards

RedLab strictly adheres to **Conventional Commits**:
`type(scope): subject`

### Allowed Types:
- `feat`: A new feature or capability.
- `fix`: A bug fix.
- `test`: Adding or correcting tests.
- `docs`: Documentation changes only.
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `perf`: Code change that improves performance.
- `chore`: Maintenance tasks, dependencies, build configurations.

### Examples:
- `feat(security): add S3 MFA delete detection rule`
- `fix(canvas): prevent duplicate edge connections to same subnet`
- `test(api): add negative test for corrupted lab import`
- `docs(project): update roadmap milestone 4 deliverables`

---

## 4. Code Standards & Architectural Rules

### Frontend Guidelines
- **Zustand is Single Source of Truth:** Canvas nodes and lab state live in `useEditorStore` and `useLabStore`. Avoid component-local `useState` for lab state.
- **Strict Dark Theme:** Colors from `frontend/src/theme.ts` must be used. No arbitrary light colors.
- **Strict TypeScript:** No implicit `any`. All API entities must reference `src/types/index.ts`.

### Backend Guidelines
- **Modular Rule Architecture:** All security rules must inherit from `SecurityRule` in `app/security_engine/registry.py` and implement `evaluate(graph: GraphData) -> list[Finding]`.
- **Zero Mock Data:** Rules evaluate real graph geometry and configuration dictionaries deterministically.
- **Zero Cloud SDKs:** RedLab is a self-contained local simulation. Do not install `boto3` to call real AWS accounts.

---

## 5. Verification Before Submitting PR

Before pushing your branch, execute the verification suite:

```bash
# Run backend tests
cd backend && python3 -m pytest tests/ -v

# Run frontend tests & build
cd ../frontend && npm test && npm run build
```

Both commands must exit with status `0`. Any failure must be resolved prior to requesting review.
