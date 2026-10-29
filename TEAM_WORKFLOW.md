# RedLab — Team Collaboration & Git Branching Guide

**Lead Architect & Project Lead:** Pashtrik Maliqi (@cooler-ctrl)  
**Team Size:** 6 Engineers (Pashtrik Maliqi [Lead] + Aridoni, Engjulli, Lavda, Basha, Nazmi)  
**Methodology:** GitFlow-inspired Feature Branching with Mandatory Code Reviews & Automated Testing  

> **EXCLUSIVE LEAD APPROVAL POLICY:**  
> **Only Pashtrik Maliqi (@cooler-ctrl)** is authorized to approve pull requests, merges, and releases into `main`. Direct pushes to `main` are strictly blocked. All contributions merge through PRs reviewed and approved by Pashtrik.

---

## 1. Team Domain & Ownership Matrix

To prevent overlapping edits and merge conflicts, each team member owns a specific subsystem:

| Member | Role & Focus Area | Key Responsibilities | Primary Directories / Files | Branch Prefix & Dedicated Branch |
| :--- | :--- | :--- | :--- | :--- |
| **Pashtrik Maliqi** | **Lead Architect & Project Lead (Owner)** | Overall system design, technical direction, code quality, final releases, merge approvals | Entire repo (`app/schemas/`, `types/index.ts`, `docs/`) | `main`, `develop`, `release/*` |
| **Aridoni** | **API & Backend Developer** | REST APIs, backend application logic, authentication, session management, simulation requests | `backend/app/api/`, `backend/app/services/` | `feature/backend-*`, `feature/backend-aridoni` |
| **Engjulli** | **Cyberattack Simulation Developer** | Red-team attack simulation engine, attack scenarios, device/host attack models, event logs | `backend/app/network_engine/`, `backend/app/security_engine/` | `feature/security-*`, `feature/security-engjulli` |
| **Lavda** | **Database & Web Application Developer** | Data architecture, DB schemas, SQLAlchemy models, persistence, scenario/user history | `backend/app/models/`, `backend/app/core/database.py`, scenario storage | `feature/database-*`, `feature/database-lavda`, `feature/backend-lavda` |
| **Basha** | **Frontend Web Developer** | Web interface, reusable UI components, visual network canvas editor, topology configuration | `frontend/src/features/editor/EditorCanvas.tsx`, `ResourceNode.tsx`, `ResourceLibrary.tsx` | `feature/canvas-*`, `feature/canvas-basha`, `feature/frontend-basha` |
| **Nazmi** | **Solution Architect & Frontend Application Developer** | Technical solution design, core application screens, navigation, state management, UI flows | `frontend/src/features/editor/PropertyInspector.tsx`, `SimulationPanel.tsx`, `LinuxTerminal.tsx` | `feature/ui-*`, `feature/ui-nazmi`, `feature/frontend-nazmi` |

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
1. **`main`**: Production-ready, stable codebase. Only merges come from `develop` via Lead approval from Pashtrik Maliqi (@cooler-ctrl). Direct pushes to `main` are strictly forbidden and blocked by GitHub branch protection.
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
