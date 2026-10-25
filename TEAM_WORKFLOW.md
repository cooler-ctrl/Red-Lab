# RedLab — Team Collaboration & Git Branching Guide

**Lead:** You (Repository Owner & Lead Architect)  
**Team Size:** 6 Engineers (1 Lead + 5 Core Contributors)  
**Methodology:** GitFlow-inspired Feature Branching with Mandatory Code Reviews & Automated Testing  

---

## 1. Team Domain & Ownership Matrix

To prevent overlapping edits and merge conflicts, each team member owns a specific subsystem. Whenever an AI model is used by a team member, it should know their exact area of responsibility.

| Member | Focus Area | Key Responsibilities | Primary Directories / Files | Branch Prefix |
| :--- | :--- | :--- | :--- | :--- |
| **Lead (You)** | **System Architect & Release Manager** | Core schemas, API contract stability, PR reviews, release tagging, database migrations | Entire repo (`app/schemas/`, `types/index.ts`, `docs/`) | `main`, `develop`, `release/*` |
| **Dev 1** | **Visual Canvas & Graph Engine** | React Flow integration, custom node rendering, connection validation logic, drag-and-drop mechanics, cable repair | `frontend/src/features/editor/EditorCanvas.tsx`, `ResourceNode.tsx`, `exampleLab.ts` | `feature/canvas-*` |
| **Dev 2** | **Forms, Inspector, Modals & UX** | Dynamic property inspector, firewall ACL rule editor, port service bindings, victim screen modal, dashboard | `frontend/src/features/editor/PropertyInspector.tsx`, `CompromisedScreenModal.tsx`, `SimulationPanel.tsx` | `feature/ui-*` |
| **Dev 3** | **Network & Security Simulation Engine** | Python network attack simulator, SYN flood telemetry, port forensics heuristics, rule registry | `backend/app/network_engine/`, `backend/app/security_engine/` (`rules/`, `registry.py`) | `feature/security-*` |
| **Dev 4** | **Backend API & Data Persistence** | FastAPI routers, SQLAlchemy models, SQLite persistence, lab JSON import/export validation | `backend/app/api/`, `backend/app/models/`, `backend/app/services/` | `feature/backend-*` |
| **Dev 5** | **QA, Testing & DevSecOps** | Pytest suites, Vitest component tests, end-to-end user journeys, GitHub Actions CI workflow | `backend/tests/`, `frontend/src/test/`, `.github/workflows/` | `feature/qa-*` |

---

## 2. Git Branch Strategy

```
           main (Production Release)
             ▲
             │ [Tagged Releases v1.0, v1.1]
             │
          develop (Integration Branch)
          ▲   ▲   ▲   ▲   ▲
         ╱    │   │   │    ╲
        ╱     │   │   │     ╲
feature/    feature/  feature/  feature/  feature/
canvas-*    ui-*     security-* backend-* qa-*
```

### 2.1 Branch Hierarchy
1. **`main`**: Production-ready, stable codebase. Only merges come from `develop` via Lead approval. Direct pushes are blocked.
2. **`develop`**: Active integration branch. All feature branches branch off `develop` and merge back into `develop` via Pull Requests.
3. **`feature/<role>-<feature-name>`**: Individual feature development branches. Isolated from other teammates.
4. **`fix/<issue-name>`**: Dedicated bugfix branches.

### 2.2 Step-by-Step Developer Workflow

#### Step 1: Sync with `develop`
```bash
git checkout develop
git pull origin develop
```

#### Step 2: Create a Feature Branch
```bash
# Example for Dev 3 (Security Engineer)
git checkout -b feature/security-dns-spoofing

# Example for Dev 1 (Canvas Engineer)
git checkout -b feature/canvas-cable-packet-animation
```

#### Step 3: Implement Code & Verify Tests
Before committing, team members must run the local test suites:
```bash
# For backend changes:
cd backend && python3 -m pytest tests/ -v

# For frontend changes:
cd frontend && npm run build && npm test
```

#### Step 4: Commit with Conventional Messages
Format: `<type>(<scope>): <short description>`
- `feat(security): add DNS cache poisoning attack scenario`
- `fix(canvas): prevent duplicate connections between router and switch`
- `test(api): add negative test for malformed lab import`
- `refactor(inspector): extract firewall rule row into component`

```bash
git add .
git commit -m "feat(security): add DNS cache poisoning attack scenario"
```

#### Step 5: Push Branch & Open Pull Request
```bash
git push -u origin feature/security-s3-mfa-delete
```
Open a Pull Request targeting the **`develop`** branch.

---

## 3. Pull Request Review Checklist (For Lead)

Before approving and merging any PR into `develop`:

- [ ] **Tests Pass:** Backend tests (`pytest tests/`) and frontend checks (`npm run build && npm test`) pass with 0 errors.
- [ ] **No Schema Drift:** If domain models changed in `backend/app/schemas/lab.py`, the corresponding interfaces in `frontend/src/types/index.ts` must match.
- [ ] **Theme Adherence:** Dark theme colors from `frontend/src/theme.ts` are respected. No arbitrary light colors or unstyled controls.
- [ ] **Deterministic Rules:** Any new security rule subclasses `SecurityRule`, evaluates real graph data, and has both positive and negative unit tests.
- [ ] **Clean Git History:** Feature branch has concise, meaningful commits without merge conflicts.

---

## 4. Resolving Merge Conflicts

If two teammates touch overlapping files:
1. Rebase feature branch on top of latest `develop`:
   ```bash
   git checkout feature/my-feature
   git fetch origin
   git rebase origin/develop
   ```
2. Resolve conflicts in your editor.
3. Re-run tests to confirm resolution didn't break functionality:
   ```bash
   python3 -m pytest backend/tests/ -v
   cd frontend && npm test
   ```
4. Continue rebase and force push to feature branch:
   ```bash
   git add <resolved-files>
   git rebase --continue
   git push --force-with-lease origin feature/my-feature
   ```
