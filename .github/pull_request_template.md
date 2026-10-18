## 1. Summary of Changes
<!-- Provide a high-level summary of what this pull request changes and the architectural motivation. -->

**Related Issue:** Closes #

---

## 2. Implementation Details
<!-- Detail the key components, models, or algorithms touched. Note any non-obvious design decisions. -->
- **Subsystem:** `frontend` | `backend` | `security_engine` | `simulation` | `devops` | `docs`
- **Key Files Modified:**
  - `path/to/file`: description of change
- **Design Decisions / Trade-offs:**

---

## 3. Testing & Verification Performed
<!-- Detail the exact automated and manual tests executed before submitting. -->

### Automated Test Suites
- [ ] Backend tests passing (`cd backend && python3 -m pytest tests/ -v`)
- [ ] Frontend tests passing (`cd frontend && npm test`)
- [ ] Frontend build succeeds (`cd frontend && npm run build` — 0 TypeScript errors)

### Test Logs / Proof of Execution
```text
<!-- Paste terminal test output or logs here -->
```

---

## 4. Acceptance Criteria Verification
<!-- Copy the acceptance criteria from the related issue and mark each satisfied with proof. -->
- [ ] **Criterion 1:** <!-- Proof: e.g. test_xyz passes -->
- [ ] **Criterion 2:** <!-- Proof: e.g. manual verification in browser -->

---

## 5. Security & Isolation Implications
<!-- Note any impact on system boundaries, secrets, permissions, or script execution. -->
- [ ] **Local Simulation Model:** Operates entirely within local simulation boundaries; introduces zero external cloud SDKs or real AWS API calls.
- [ ] **Input Sanitization:** All payload inputs are validated through Pydantic schemas or TypeScript interfaces.
- [ ] **Sandbox Guarantees:** Any script execution features preserve non-root, read-only rootfs, and network drop controls per `SECURITY-REQUIREMENTS.md`.

---

## 6. Screenshots / UI Evidence (if applicable)
<!-- Attach screenshots or terminal recordings demonstrating UI or visual canvas updates. -->

---

## 7. Known Limitations & Follow-Up Work
<!-- Note any intentional edge cases or follow-up tasks deferred to future PRs. -->

---

## 8. Pre-Submission Safety Checklist
- [ ] **Zero Secrets:** Verified no passwords, API tokens, `.env` files, or private keys are committed (`git diff --cached`).
- [ ] **Zero Unrelated Changes:** Only files directly relevant to this task are staged.
- [ ] **Branching Policy:** Branch branched from `develop` using canonical naming prefix (`feature/<role>-<topic>`).
- [ ] **Conventional Commits:** All commit messages follow Conventional Commits specification.
- [ ] **Single Source of Truth:** Canvas state changes dispatch to `useEditorStore`; domain types synchronized with `frontend/src/types/index.ts`.
