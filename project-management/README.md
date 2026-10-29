# RedLab — Project Management & Engineering Workflow System

Welcome to the RedLab project management system. This directory defines the operational framework, master roadmap, actionable task inventory, quality criteria, and review processes that coordinate the 6-member engineering team.

---

## 1. Quick Navigation

| Document | Purpose |
| :--- | :--- |
| **[ROADMAP.md](file:///Users/tiki/redlab/project-management/ROADMAP.md)** | Strategic milestones (M1 through M8) tracking past releases, active goals, and future capabilities. |
| **[TASKS.md](file:///Users/tiki/redlab/project-management/TASKS.md)** | Master inventory of actionable engineering tasks (`RL-001` to `RL-033+`) with GitHub Issue mappings. |
| **[DEFINITION-OF-DONE.md](file:///Users/tiki/redlab/project-management/DEFINITION-OF-DONE.md)** | Non-negotiable quality criteria required before any pull request is merged. |
| **[REVIEW-PROCESS.md](file:///Users/tiki/redlab/project-management/REVIEW-PROCESS.md)** | Step-by-step lifecycle from backlog triage to branch creation, code review, verification, and merge. |
| **[CONTRIBUTING.md](file:///Users/tiki/redlab/project-management/CONTRIBUTING.md)** | Branching strategies, conventional commit formats, code conventions, and PR expectations. |
| **[SECURITY-REQUIREMENTS.md](file:///Users/tiki/redlab/project-management/SECURITY-REQUIREMENTS.md)** | Threat model, sandbox isolation specifications, network controls, and zero-secrets policies. |
| **[templates/](file:///Users/tiki/redlab/project-management/templates/)** | Offline markdown templates for tasks, features, bugs, and pull requests. |

---

## 2. Team Structure & Domain Ownership

To prevent overlapping edits and merge conflicts, each member operates within dedicated subsystem boundaries:

> **EXCLUSIVE LEAD APPROVAL POLICY:**  
> **Pashtrik Maliqi (@cooler-ctrl)** is the **Lead Architect & Project Lead**.  
> **ONLY Pashtrik Maliqi has the authority to approve pull requests, merges, and pushes into `main`.**

```
                                  ┌─────────────────────────────┐
                                  │   Pashtrik Maliqi (Lead)    │
                                  │ Architecture & Integrations │
                                  └──────────────┬──────────────┘
                                                 │
          ┌─────────────────┬────────────────────┼───────────────────┬─────────────────┐
          │                 │                    │                   │                 │
┌─────────┴─────────┐ ┌─────┴───────────┐ ┌──────┴──────────┐ ┌──────┴─────────┐ ┌─────┴───────────┐
│       Basha       │ │      Nazmi      │ │     Engjulli    │ │     Aridoni     │ │      Lavda      │
│  Visual Canvas &  │ │ Solution Arch & │ │ Cyberattack Sim │ │  API & Backend  │ │ Database & Web  │
│    Web Frontend   │ │   UI Screens    │ │     Engine      │ │    Developer    │ │   App Developer │
└───────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

| Member & Role | Primary Domain | Core Directories / Files | Branch Prefix & Dedicated Branch |
| :--- | :--- | :--- | :--- |
| **Pashtrik Maliqi** — Lead Architect & Project Lead | System Architecture, Schemas, Release Management & Sole Approver for `main` | `app/schemas/`, `types/index.ts`, `docs/`, `project-management/` | `main`, `develop`, `release/*` |
| **Aridoni** — API & Backend Developer | REST APIs, backend logic, authentication, simulation request validation | `backend/app/api/`, `backend/app/services/` | `feature/backend-*`, `feature/backend-aridoni` |
| **Engjulli** — Cyberattack Simulation Developer | Red-team attack simulation engine, attack scenarios, network events | `backend/app/network_engine/`, `backend/app/security_engine/` | `feature/security-*`, `feature/security-engjulli` |
| **Lavda** — Database & Web Application Developer | Data architecture, DB schemas, models, persistence, scenario history | `backend/app/models/`, `backend/app/core/database.py` | `feature/database-*`, `feature/database-lavda`, `feature/backend-lavda` |
| **Basha** — Frontend Web Developer | Visual Canvas, React Flow, Node Geometry, Web UI components | `frontend/src/features/editor/EditorCanvas.tsx`, `ResourceNode.tsx` | `feature/canvas-*`, `feature/canvas-basha`, `feature/frontend-basha` |
| **Nazmi** — Solution Architect & Frontend App Dev | Solution design, core application screens, navigation, state management | `frontend/src/features/editor/PropertyInspector.tsx`, `SimulationPanel.tsx` | `feature/ui-*`, `feature/ui-nazmi`, `feature/frontend-nazmi` |

---

## 3. Daily Developer Lifecycle

```mermaid
flowchart LR
    A["1. Pick Task from Backlog"] --> B["2. Assign & Move to 'In Progress'"]
    B --> C["3. Checkout 'feature/<role>-<name>'"]
    C --> D["4. Code & Write Tests"]
    D --> E["5. Verify (pytest & vitest)"]
    E --> F["6. Open PR to develop"]
    F --> G["7. Review & Verification"]
    G --> H{"Approved?"}
    H -- "No (Changes Req.)" --> D
    H -- "Yes" --> I["8. Merge & Move to 'Approved'"]
```

1. **Pick an assigned task:** Locate your task in `TASKS.md` or the GitHub Issues backlog.
2. **Assign yourself:** Claim the GitHub Issue and move its status to `In Progress`.
3. **Branch from `develop`:** Create your isolated branch following `feature/<role>-<topic>`.
4. **Implement incrementally:** Build the feature or fix while keeping changes scoped to your domain.
5. **Verify locally:** Run full test suites (`python3 -m pytest backend/tests/ -v` and `cd frontend && npm test && npm run build`).
6. **Open PR:** Target `develop` using the Pull Request template. Link the issue (`Closes #<ID>`).
7. **Peer Review:** Address review comments, ensure CI passes, and verify functional acceptance criteria.
8. **Merge & Complete:** Merged via squash/rebase into `develop`; close issue and celebrate.

---

## 4. GitHub Issue & Milestone Management

RedLab uses GitHub Issues and Milestones for real-time tracking:
- **Milestones:** Align with `ROADMAP.md` (Milestones 1 through 8).
- **Labels:**
  - Priority: `priority:P0` (Blocker), `priority:P1` (High), `priority:P2` (Medium), `priority:P3` (Low).
  - Subsystems: `area:frontend`, `area:backend`, `area:database`, `area:simulation`, `area:security`, `area:devops`, `area:documentation`, `area:architecture`.
  - Workflow State: `status:backlog`, `status:assigned`, `status:in-progress`, `status:needs-review`, `status:approved`.

---

## 5. Setting Up the GitHub Projects Board

To configure the team's visual Kanban board on GitHub:

### Option A: Via GitHub CLI (Recommended)
1. Request the `project` scope:
   ```bash
   gh auth refresh -s project,read:org
   ```
2. Create the board:
   ```bash
   gh project create --owner cooler-ctrl --title "RedLab Project Management"
   ```
3. Configure the Kanban columns:
   - `Backlog`
   - `Assigned`
   - `In Progress`
   - `In Review`
   - `Changes Requested`
   - `Approved`

### Option B: Via Web UI
1. Navigate to **[GitHub Projects](https://github.com/users/cooler-ctrl/projects)**.
2. Click **New project** $\rightarrow$ Select **Board** template.
3. Title the project **RedLab Engineering Board**.
4. Link repository: `cooler-ctrl/Red-Lab`.
5. Set columns to match the workflow: `Backlog`, `Assigned`, `In Progress`, `In Review`, `Changes Requested`, `Approved`.
