from app.academy.seed import seed_academy
from app.models.academy import AcademyCertificate, AcademyCourse, AcademyLesson, AcademyLessonProgress


COURSE = "cybersecurity-foundations"


def _complete_all_lessons(client, db_session):
    dashboard = client.get("/api/academy/dashboard").json()
    course = dashboard["courses"][0]
    assert course["lesson_count"] == 10
    stored_course = db_session.query(AcademyCourse).filter_by(slug=COURSE).first()
    lessons = {lesson.slug: lesson for lesson in stored_course.lessons}
    for lesson in course["lessons"]:
        for question in lessons[lesson["slug"]].quick_checks:
            response = client.post(
                f"/api/academy/lessons/{lesson['slug']}/quick-checks/{question['id']}",
                json={"option_id": question["correct_option"]},
            )
            assert response.status_code == 200
        response = client.post(f"/api/academy/lessons/{lesson['slug']}/complete")
        assert response.status_code == 200
    return course


def _answers_for_score(db_session, attempt, number_correct):
    course = db_session.query(AcademyCourse).filter_by(slug=COURSE).first()
    question_map = {question["id"]: question for question in course.exam_questions}
    answers = {}
    for index, question_id in enumerate(attempt["questions"]):
        question = question_map[question_id["id"]]
        if index < number_correct:
            answers[question_id["id"]] = question["correct_option"]
        else:
            answers[question_id["id"]] = next(
                option["id"] for option in question["options"]
                if option["id"] != question["correct_option"]
            )
    return answers


def test_course_has_ten_lessons_and_quick_check_answers_stay_server_side(client):
    response = client.get(f"/api/academy/courses/{COURSE}")
    assert response.status_code == 200
    course = response.json()
    assert course["lesson_count"] == 10

    lesson = client.get(f"/api/academy/courses/{COURSE}/lessons/security-and-information").json()
    assert len(lesson["quick_checks"]) == 2
    assert all("correct_option" not in question for question in lesson["quick_checks"])
    question = lesson["quick_checks"][0]
    result = client.post(
        f"/api/academy/lessons/security-and-information/quick-checks/{question['id']}",
        json={"option_id": "b"},
    )
    assert result.status_code == 200
    assert result.json()["correct"] is True
    blocked = client.post("/api/academy/lessons/security-and-information/complete")
    assert blocked.status_code == 409
    second = lesson["quick_checks"][1]
    assert client.post(
        f"/api/academy/lessons/security-and-information/quick-checks/{second['id']}",
        json={"option_id": "a"},
    ).status_code == 200
    assert client.post("/api/academy/lessons/security-and-information/complete").status_code == 200
    assert client.get(f"/api/academy/courses/{COURSE}").json()["completed_lessons"] == 1


def test_exam_requires_lessons_and_passing_at_exactly_fifty_percent_awards_certificate(client, db_session):
    denied = client.post(f"/api/academy/courses/{COURSE}/exams/start")
    assert denied.status_code == 403
    _complete_all_lessons(client, db_session)

    attempt = client.post(f"/api/academy/courses/{COURSE}/exams/start").json()
    assert attempt["question_count"] == 20
    assert len(attempt["questions"]) == 20
    assert all("correct_option" not in question for question in attempt["questions"])
    result = client.post(
        f"/api/academy/exams/{attempt['id']}/submit",
        json={"answers": _answers_for_score(db_session, attempt, 10)},
    )
    assert result.status_code == 200
    assert result.json()["score"] == 50
    assert result.json()["passed"] is True
    assert db_session.query(AcademyCertificate).count() == 1


def test_nine_correct_fails_and_attempt_can_be_retried(client, db_session):
    _complete_all_lessons(client, db_session)
    first_attempt = client.post(f"/api/academy/courses/{COURSE}/exams/start").json()
    first_result = client.post(
        f"/api/academy/exams/{first_attempt['id']}/submit",
        json={"answers": _answers_for_score(db_session, first_attempt, 9)},
    ).json()
    assert first_result["score"] == 45
    assert first_result["passed"] is False
    assert db_session.query(AcademyCertificate).count() == 0

    retry = client.post(f"/api/academy/courses/{COURSE}/exams/start")
    assert retry.status_code == 200
    assert retry.json()["id"] != first_attempt["id"]


def test_seed_migrates_legacy_duplicate_network_lesson(client, db_session):
    client.get(f"/api/academy/courses/{COURSE}")
    course = db_session.query(AcademyCourse).filter_by(slug=COURSE).first()
    network_lesson = next(lesson for lesson in course.lessons if lesson.slug == "networking-fundamentals")
    legacy_lesson = AcademyLesson(
        course_id=course.id, slug="basic-network-security", order_index=11,
        title="Legacy network lesson", duration_minutes=30, objectives=[], sections=[], quick_checks=[],
    )
    db_session.add(legacy_lesson)
    db_session.flush()
    legacy_progress = AcademyLessonProgress(learner_id="local-student", lesson_id=legacy_lesson.id)
    db_session.add(legacy_progress)
    db_session.commit()

    seed_academy(db_session)
    lessons = db_session.query(AcademyLesson).filter_by(course_id=course.id).all()
    assert len(lessons) == 10
    assert not any(lesson.slug == "basic-network-security" for lesson in lessons)
    assert db_session.query(AcademyLessonProgress).filter_by(
        learner_id="local-student", lesson_id=network_lesson.id,
    ).count() == 1
