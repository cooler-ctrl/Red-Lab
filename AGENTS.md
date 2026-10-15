# AI MODEL INSTRUCTIONS & ARCHITECTURAL GUARDRAILS

> **CRITICAL NOTICE FOR ALL AI CODING ASSISTANTS & MODELS (Cursor, Claude, Copilot, ChatGPT, Antigravity):**  
> You are working inside the **RedLab** repository—a visual cloud security laboratory. You are pair-programming with one of the 6 engineering team members. **You must strictly obey the architectural rules, directory structures, and git conventions defined below.** Do not deviate, drift, invent unsupported schemas, or rewrite working modules.

---

## 1. Project Mission & Identity

- **Product:** RedLab (Version 1.0)
- **Concept:** Visual cloud security simulation (like Cisco Packet Tracer, but for AWS cloud security & threat modeling).
- **Core Loop:** Build Infrastructure on Canvas → Configure Properties → Run Security Scan → Inspect Findings & Attack Paths → Remediate Misconfigurations → Rescan (Deterministic Verification).
- **Hard Constraint:** RedLab is a **local, self-contained educational simulation**.
  - **DO NOT** add real AWS SDKs (boto3 calling real accounts).
  - **DO NOT** make real external network requests or run exploits.
  - **DO NOT** introduce paid cloud APIs, external LLM dependencies, or mock buttons.

---

## 2. Team Structure & Git Branching Policy

There are **6 team members** on this project. Every member works in an isolated Git branch. **Never commit directly to `main` or `develop`.**

| Role | Domain / Scope | Allowed Branch Prefixes |
| :--- | :--- | :--- |
| **Team Lead (Owner)** | Architecture, core schemas, release reviews, integration | `main`, `develop`, `release/*` |
| **Dev 1 (Canvas & Graph)** | React Flow visual editor, node connectors, canvas UX | `feature/canvas-*` |
| **Dev 2 (UI & Inspector)** | Inspector forms, SG/IAM rule editors, dashboard, modals | `feature/ui-*` |
| **Dev 3 (Security Engine)** | Python security rules, registry, attack-path heuristics | `feature/security-*` |
| **Dev 4 (Backend & DB)** | FastAPI endpoints, SQLAlchemy models, import/export | `feature/backend-*` |
| **Dev 5 (QA & Testing)** | Pytest, Vitest, integration tests, CI pipelines | `feature/qa-*`, `test/*` |

### Git Rules for the AI Assistant:
1. When asked to create or switch branches, use `git checkout -b feature/<your-domain>-<feature-description>`.
2. Format commit messages following Conventional Commits:  
   `feat(scope): ...`, `fix(scope): ...`, `test(scope): ...`, `docs(scope): ...`.
3. Before advising that code is complete, verify that existing tests still pass.

---

## 3. Technology Stack & Directory Boundaries

```
redlab/
├── frontend/                # React 19 + TypeScript + Vite + Tailwind CSS v4
│   ├── src/
│   │   ├── components/      # Reusable atomic UI (Button, Modal, Toast)
│   │   ├── features/
│   │   │   ├── dashboard/   # DashboardPage, LabCard, CreateLabModal
│   │   │   ├── editor/      # EditorCanvas, ResourceLibrary, PropertyInspector, ResourceNode
│   │   │   └── security/    # ScanPanel, FindingCard, AttackPathView
│   │   ├── services/        # api.ts (REST client), exampleLab.ts
│   │   ├── stores/          # Zustand stores (editorStore.ts, labStore.ts)
│   │   ├── test/            # Vitest unit & component tests
│   │   ├── theme.ts         # Dark theme constants
│   │   └── types/           # Canonical TypeScript interfaces (types/index.ts)
│   ├── package.json
│   └── vite.config.ts
├── backend/                 # Python 3.14 + FastAPI + SQLAlchemy + SQLite
│   ├── app/
│   │   ├── api/             # FastAPI routers (api/labs.py)
│   │   ├── core/            # Database engine (database.py), config (config.py)
│   │   ├── models/          # SQLAlchemy models (models/lab.py)
│   │   ├── schemas/         # Pydantic v2 schemas (schemas/lab.py)
│   │   ├── services/        # Business logic & DB queries (services/lab_service.py)
│   │   ├── security_engine/ # Modular rule registry & analyzer (analyzer.py, registry.py)
│   │   │   └── rules/       # 10 security rules (s3, sg, rds, iam, ec2, network)
│   │   └── main.py          # FastAPI application entry point
│   ├── tests/               # Pytest suite (test_api.py, test_security_engine.py)
│   └── requirements.txt
├── docs/                    # Architecture, rules catalog, workflows
├── AGENTS.md                # This file (AI model instructions)
└── README.md                # Project documentation
```

---

## 4. Architectural Guardrails (DO NOT BREAK)

### Frontend Rules
1. **Zustand is the Single Source of Truth:**
   - Visual nodes and edges live in `useEditorStore`.
   - Never manage global lab or canvas state inside local component `useState`.
   - Any property change in `PropertyInspector` must dispatch to `updateNodeConfig(nodeId, newConfig)`.
2. **Strict Dark Mode Theme:**
   - RedLab uses a dark cybersecurity aesthetic.
   - Backgrounds: `#0B0D12` (main), `#11151D` (secondary), `#171C26` (panels).
   - Borders: `#293140`.
   - Text: `#F3F5F8` (primary), `#9BA5B5` (muted).
   - Accents: Red `#FF3B4E`, High `#FF8A4C`, Medium `#F5C451`, Low `#60A5FA`, Secure `#34D399`.
   - **Do not introduce light themes, glassmorphism, or non-matching CSS.**
3. **TypeScript Strictness:**
   - Never use `any` unless strictly interfacing with a third-party untyped library handle.
   - All domain objects must reference `src/types/index.ts`.

### Backend Rules
1. **Modular Rule Architecture:**
   - Every security rule **MUST** inherit from `SecurityRule` in `app/security_engine/registry.py`.
   - Implement `evaluate(graph: GraphData) -> list[Finding]`.
   - Register the rule instance in `app/security_engine/rules/__init__.py`.
   - **Never hardcode findings** in the API route or bypass the registry.
2. **Deterministic Analysis:**
   - Rules evaluate explicit graph state: nodes, configs, and connecting edges.
   - Findings must return complete metadata: `rule_id`, `title`, `severity`, `category`, `affected_resource_id`, `affected_resource_name`, `explanation`, `impact`, `remediation`, and `references`.
3. **Pydantic Schemas:**
   - Any API request/response change must update `app/schemas/lab.py` and synchronize with `frontend/src/types/index.ts`.

---

## 5. Testing & Verification Requirements

Whenever you write or modify code, you must execute the appropriate tests:

### Backend Testing (Python)
```bash
cd backend
python3 -m pytest tests/ -v
```
- **Rule Requirement:** Every new security rule must have both a **positive test** (vulnerability detected) and a **negative test** (remediated configuration passes) in `backend/tests/test_security_engine.py`.

### Frontend Testing (React / TypeScript)
```bash
cd frontend
npm run build    # Must compile with 0 TypeScript errors
npm test         # Must pass all Vitest tests
```

---

## 6. How to Implement Common Tasks

### Adding a New Security Rule
1. Create or edit `backend/app/security_engine/rules/<domain>_rules.py`.
2. Subclass `SecurityRule` with unique `rule_id`, `title`, `severity`, `category`.
3. Iterate over target nodes in `graph.nodes`, inspect `node.config`, inspect related edges in `graph.edges`.
4. Register the rule in `backend/app/security_engine/rules/__init__.py`.
5. Add unit tests in `backend/tests/test_security_engine.py`.
6. Run `pytest` to verify.

### Adding a New Cloud Resource Type
1. Update `backend/app/schemas/lab.py` and `frontend/src/types/index.ts` to include the new type in `ResourceType`.
2. Add default properties to `DEFAULT_CONFIGS` in `frontend/src/features/editor/ResourceLibrary.tsx`.
3. Add icon and color in `frontend/src/features/editor/ResourceNode.tsx`.
4. Add property editor form fields in `frontend/src/features/editor/PropertyInspector.tsx`.
5. Define valid edge connection rules in `frontend/src/features/editor/EditorCanvas.tsx`.
6. Add relevant security checks in the backend security engine.
