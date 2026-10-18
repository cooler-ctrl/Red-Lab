# Pull Request: <Concise Title Following Conventional Commits>

## 1. Summary & Motivation
<High-level summary of what this pull request changes and why.>

**Related Issue:** Closes #<Issue Number or RL-ID>

---

## 2. Implementation Details
- Subsystem modified: `frontend` / `backend` / `security_engine` / `docs` / `devops`
- Key classes/functions touched:
  - `<file/component>`: `<brief note>`
  - `<file/component>`: `<brief note>`
- Architectural notes & trade-offs:

---

## 3. Testing & Verification Performed
Please detail exact steps taken to verify this change:

### Automated Tests
- [ ] Backend tests passing: `cd backend && python3 -m pytest tests/ -v`
- [ ] Frontend tests passing: `cd frontend && npm test`
- [ ] Frontend build succeeds: `cd frontend && npm run build` (0 TypeScript errors)

### Test Logs / Screenshots
```text
<Paste snippet of passing pytest / vitest output here>
```

---

## 4. Acceptance Criteria Verification
List every acceptance criterion from the issue and confirm satisfaction:
- [x] Criterion 1: Verified via `<test or manual step>`
- [x] Criterion 2: Verified via `<test or manual step>`

---

## 5. Security & Isolation Impact
- [ ] No real AWS cloud calls introduced.
- [ ] No plaintext credentials or secrets committed.
- [ ] Input validation enforced with Pydantic / TypeScript types.
- [ ] Sandbox boundaries preserved (if touching script execution).

---

## 6. Definition of Done Checklist
- [ ] All acceptance criteria met.
- [ ] Follows domain ownership boundaries (`TEAM_WORKFLOW.md`).
- [ ] Code formatted and linted cleanly.
- [ ] No extraneous files or merge conflicts.
