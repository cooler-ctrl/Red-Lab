# RedLab — Definition of Done (DoD)

The **Definition of Done (DoD)** is the shared quality contract across all RedLab engineering team members. A task, feature branch, or pull request is **NOT done** until every applicable item in this checklist is satisfied and verified.

---

## 1. Master Quality Checklist

Every pull request submitted to `develop` or `main` must satisfy:

- [ ] **1. Acceptance Criteria Met:** Every testable statement in the associated task specification (`RL-xxx`) is implemented and verified.
- [ ] **2. Architectural Alignment:** Follows the directory structure and role ownership defined in `AGENTS.md` and `TEAM_WORKFLOW.md`. No architectural drift or unauthorized dependencies.
- [ ] **3. Automated Tests Added / Updated:**
  - Backend: New endpoints or rules must have both positive and negative unit tests in `backend/tests/`.
  - Frontend: New UI components or state transitions must have Vitest tests in `frontend/src/test/`.
- [ ] **4. Test Suites Pass Cleanly (Zero Failures):**
  - Backend: `python3 -m pytest backend/tests/ -v` passes 100%.
  - Frontend: `cd frontend && npm test` passes 100%.
- [ ] **5. Build & Type Checking (Zero Errors):**
  - Frontend: `cd frontend && npm run build` compiles with 0 TypeScript errors and 0 lint warnings.
- [ ] **6. Schema Integrity Maintained:**
  - If backend schemas in `backend/app/schemas/` changed, the corresponding interfaces in `frontend/src/types/index.ts` are synchronized with zero drift.
- [ ] **7. Theme & Aesthetic Adherence:**
  - Strictly follows the dark cybersecurity theme defined in `frontend/src/theme.ts`.
  - Canvas nodes, inspector inputs, and modal dialogues maintain high-contrast styling with no light backgrounds, unstyled default browser controls, or jarring colors.
- [ ] **8. Security & Isolation Verified:**
  - Code introduces zero external network calls or cloud provider SDKs.
  - User input is validated with Pydantic v2 (backend) and Zod/TypeScript (frontend).
  - Script execution (if touched) is strictly constrained to isolated, unprivileged environments per `SECURITY-REQUIREMENTS.md`.
- [ ] **9. Zero Secrets or Credentials:**
  - No API tokens, passwords, `.env` files, or private keys are committed.
  - Verified with `git diff --cached` before committing.
- [ ] **10. Documentation Updated:**
  - Relevant architecture documents (`docs/architecture.md`), security catalogs (`docs/security-rules.md`), or project management tracking files are updated.
- [ ] **11. Clean Git History & Conventional Commits:**
  - Commits follow Conventional Commits format (`feat(...)`, `fix(...)`, `test(...)`, `docs(...)`).
  - No merge commits inside feature branches (rebased on `develop`).
- [ ] **12. Peer Code Review & Functional Verification:**
  - Approved by the designated subsystem owner or Lead Architect.
  - Reviewer has verified functionality locally or via CI evidence.

---

## 2. Non-Applicable Requirements Exemption Rule

In cases where a specific checklist item does not apply (for instance, a pure documentation task has no frontend TypeScript changes):
- The pull request author must **explicitly state why** the item is not applicable in the PR description (e.g., *"N/A: Documentation update only, no runtime code modified"*).
- The checklist item must not be silently skipped or deleted.

---

## 3. Reviewer Verification Mandate

Passing automated CI checks is a necessary precondition, but **not sufficient on its own** for approval:
1. The reviewer must verify that the implementation solves the actual business requirement.
2. The reviewer must check edge cases (e.g. empty states, error handling, network latency).
3. The reviewer must ensure the task does not introduce technical debt or circumvent guardrails.
