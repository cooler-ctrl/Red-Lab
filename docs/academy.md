# RED-Lab Academy

RED-Lab Academy is an integrated learning area served by the existing React app and FastAPI backend. The first course is **Cybersecurity Foundations** at Beginner level. It contains exactly 10 lessons, lesson objectives and reading sections, locally generated silent WebM explainers, two to four quick checks per lesson, simulated RedLab exercises, and a 20-question final examination.

## Learner flow

1. Open **Academy** from the simulator dashboard.
2. Set the local learner display name on the Academy dashboard.
3. Read lessons and answer their quick checks. These checks provide immediate feedback and are not part of the exam score.
4. Complete all 10 lessons to unlock the final examination.
5. Complete the randomized, 30-minute examination. The server calculates the score; 50% (10/20) is a pass. A failed attempt remains in history and can be retaken.
6. On passing, the Academy stores a certificate and achievements. The certificate page can be printed or saved as PDF through the browser's print dialog.

Practical exercises create a fictional network lab with the existing RedLab simulator. They do not use real systems or send simulated attack traffic outside the local lab. Selected external educational videos open only after the learner clicks their link.

## Persistence and API

Course text and answer keys are seeded into SQLite by `init_db`; the frontend receives public lesson and question fields without answer keys. Final exam attempts store their randomized question and option order, saved answers, expiry, score, and pass result. Lesson completions, learner profile, achievements, and certificates are stored in separate Academy tables. Existing `Base.metadata.create_all` startup behavior creates these tables without changing the existing Lab tables.

Academy routes are grouped under `/api/academy`:

- `GET /dashboard`, `GET /courses`, and `GET /courses/{course_id}`
- `GET /courses/{course_id}/lessons/{lesson_id}`
- `POST /lessons/{lesson_id}/quick-checks/{question_id}` and `POST /lessons/{lesson_id}/complete`
- `POST /courses/{course_id}/exams/start`, `PUT /exams/{attempt_id}/answers`, and `POST /exams/{attempt_id}/submit`
- `GET /exams/active`, `GET /exams/{attempt_id}`, `PUT /profile`, and `GET /certificates/{certificate_id}`

## Current scope

The existing RedLab application has no authentication or role system, so this release uses one local learner profile (`local-student`) and does not expose administrator course editing. The dashboard previews all four requested learning levels, while only the Beginner foundations course is currently available. Course content is maintained in `backend/app/academy/content.py` and synchronized into the database at startup.

Each lesson can render a silent WebM explainer in the browser from its database content and save the generated file. Selected lessons also link to official CISA, FTC, and Cisco videos; those sites open in a separate tab only after the learner clicks. Videos generated locally are temporary and can be regenerated when a lesson is reopened.
