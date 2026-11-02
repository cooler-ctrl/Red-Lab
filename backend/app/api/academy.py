from __future__ import annotations

import datetime
import random
from collections import defaultdict
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session, joinedload

from ..core.database import get_db
from ..models.academy import (
    AcademyAchievement,
    AcademyCertificate,
    AcademyCourse,
    AcademyExamAttempt,
    AcademyLesson,
    AcademyLessonProgress,
    AcademyLearnerProfile,
    AcademyQuickCheckAttempt,
)
from ..academy.seed import seed_academy

router = APIRouter(prefix="/api/academy", tags=["academy"])
LOCAL_LEARNER = "local-student"
PASS_SCORE = 50
EXAM_DURATION_MINUTES = 30


class QuickCheckSubmission(BaseModel):
    option_id: str = Field(min_length=1, max_length=32)


class ExamSubmission(BaseModel):
    answers: dict[str, str] = Field(default_factory=dict)


class ProfileUpdate(BaseModel):
    student_name: str = Field(min_length=2, max_length=80)

    @field_validator("student_name")
    @classmethod
    def normalize_student_name(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError("Student name must contain at least two non-space characters")
        return normalized


def get_academy_db(db: Session = Depends(get_db)):
    if not db.query(AcademyCourse).filter_by(slug="cybersecurity-foundations").first():
        seed_academy(db)
    yield db


def _course(db: Session, course_id: str) -> AcademyCourse:
    course = db.query(AcademyCourse).options(joinedload(AcademyCourse.lessons)).filter(
        (AcademyCourse.id == course_id) | (AcademyCourse.slug == course_id)
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def _public_question(question: dict, option_ids: list[str] | None = None) -> dict:
    options = question["options"]
    if option_ids:
        by_id = {option["id"]: option for option in options}
        options = [by_id[item] for item in option_ids if item in by_id]
    return {
        "id": question["id"],
        "lesson": question.get("lesson"),
        "topic": question.get("topic", "Course concepts"),
        "question": question["question"],
        "options": options,
    }


def _utc(value: datetime.datetime | None):
    if value is None:
        return None
    return value.replace(tzinfo=datetime.UTC) if value.tzinfo is None else value.astimezone(datetime.UTC)


def _public_course(course: AcademyCourse, completed_ids: set[str], attempts: list[AcademyExamAttempt], certificate: AcademyCertificate | None) -> dict:
    lessons = [
        {
            "id": lesson.id,
            "slug": lesson.slug,
            "order": lesson.order_index,
            "title": lesson.title,
            "duration_minutes": lesson.duration_minutes,
            "completed": lesson.id in completed_ids,
            "lab_kind": lesson.lab_kind,
        }
        for lesson in course.lessons
    ]
    passed = any(attempt.passed for attempt in attempts)
    latest = max(attempts, key=lambda attempt: attempt.started_at) if attempts else None
    return {
        "id": course.id,
        "slug": course.slug,
        "title": course.title,
        "level": course.level,
        "level_name": course.level_name,
        "description": course.description,
        "estimated_hours": course.estimated_hours,
        "lesson_count": len(lessons),
        "completed_lessons": sum(lesson["completed"] for lesson in lessons),
        "progress_percent": round(100 * sum(lesson["completed"] for lesson in lessons) / len(lessons)) if lessons else 0,
        "lessons": lessons,
        "exam_unlocked": len(lessons) > 0 and all(lesson["completed"] for lesson in lessons),
        "completed": passed,
        "latest_exam": {"score": latest.score, "passed": latest.passed, "submitted_at": latest.submitted_at} if latest and latest.submitted_at else None,
        "certificate": {"id": certificate.id, "student_name": certificate.student_name, "score": certificate.score, "issued_at": certificate.issued_at} if certificate else None,
    }


def _course_state(db: Session, course: AcademyCourse):
    lessons = list(course.lessons)
    lesson_ids = [lesson.id for lesson in lessons]
    completed_ids = {
        row.lesson_id for row in db.query(AcademyLessonProgress).filter(
            AcademyLessonProgress.learner_id == LOCAL_LEARNER,
            AcademyLessonProgress.lesson_id.in_(lesson_ids or ["__none__"]),
        ).all()
    }
    attempts = db.query(AcademyExamAttempt).filter(
        AcademyExamAttempt.learner_id == LOCAL_LEARNER,
        AcademyExamAttempt.course_id == course.id,
    ).order_by(AcademyExamAttempt.started_at.desc()).all()
    certificate = db.query(AcademyCertificate).filter(
        AcademyCertificate.learner_id == LOCAL_LEARNER,
        AcademyCertificate.course_id == course.id,
    ).first()
    return completed_ids, attempts, certificate


def _achievement(db: Session, key: str) -> None:
    exists = db.query(AcademyAchievement).filter_by(learner_id=LOCAL_LEARNER, achievement_key=key).first()
    if not exists:
        db.add(AcademyAchievement(learner_id=LOCAL_LEARNER, achievement_key=key))


def _learning_streak(db: Session) -> int:
    dates = {
        row.completed_at.date()
        for row in db.query(AcademyLessonProgress).filter_by(learner_id=LOCAL_LEARNER).all()
    }
    today = datetime.datetime.now(datetime.UTC).date()
    cursor = today if today in dates else today - datetime.timedelta(days=1)
    streak = 0
    while cursor in dates:
        streak += 1
        cursor -= datetime.timedelta(days=1)
    return streak


def _dashboard(db: Session) -> dict:
    courses = db.query(AcademyCourse).options(joinedload(AcademyCourse.lessons)).order_by(AcademyCourse.level).all()
    course_views = []
    all_attempts: list[AcademyExamAttempt] = []
    all_lessons = 0
    complete_lessons = 0
    next_lesson = None
    for course in courses:
        completed_ids, attempts, certificate = _course_state(db, course)
        view = _public_course(course, completed_ids, attempts, certificate)
        course_views.append(view)
        all_attempts.extend(attempt for attempt in attempts if attempt.submitted_at)
        all_lessons += len(course.lessons)
        complete_lessons += len(completed_ids)
        if next_lesson is None:
            candidate = next((lesson for lesson in course.lessons if lesson.id not in completed_ids), None)
            if candidate:
                next_lesson = {"course_id": course.id, "course_slug": course.slug, "lesson_id": candidate.id, "lesson_title": candidate.title, "course_title": course.title}
    completed_courses = sum(course["completed"] for course in course_views)
    score_values = [attempt.score for attempt in all_attempts if attempt.score is not None]
    achievements = db.query(AcademyAchievement).filter_by(learner_id=LOCAL_LEARNER).order_by(AcademyAchievement.earned_at.desc()).all()
    certificates = db.query(AcademyCertificate).filter_by(learner_id=LOCAL_LEARNER).order_by(AcademyCertificate.issued_at.desc()).all()
    streak = _learning_streak(db)
    profile = db.query(AcademyLearnerProfile).filter_by(learner_id=LOCAL_LEARNER).first()
    activity_rows = db.query(AcademyLessonProgress).filter_by(learner_id=LOCAL_LEARNER).all()
    activity_by_day: dict[datetime.date, int] = defaultdict(int)
    for row in activity_rows:
        activity_by_day[row.completed_at.date()] += 1
    today = datetime.datetime.now(datetime.UTC).date()
    activity = [
        {"date": (today - datetime.timedelta(days=offset)).isoformat(), "completed": activity_by_day[today - datetime.timedelta(days=offset)]}
        for offset in reversed(range(7))
    ]
    return {
        "student_name": profile.student_name if profile else "RedLab Student",
        "current_level": "Beginner" if completed_courses == 0 else ("Intermediate" if completed_courses < 2 else "Advanced"),
        "overall_progress": round(100 * complete_lessons / all_lessons) if all_lessons else 0,
        "completed_lessons": complete_lessons,
        "total_lessons": all_lessons,
        "completed_courses": completed_courses,
        "current_course": next((course["title"] for course in course_views if not course["completed"]), course_views[0]["title"] if course_views else None),
        "average_exam_score": round(sum(score_values) / len(score_values), 1) if score_values else None,
        "exam_attempts": [{"course_title": next((course.title for course in courses if course.id == attempt.course_id), "Course"), "score": attempt.score, "passed": attempt.passed, "submitted_at": attempt.submitted_at} for attempt in sorted(all_attempts, key=lambda item: item.started_at, reverse=True)],
        "learning_streak": streak,
        "activity": activity,
        "recommended_lesson": next_lesson,
        "courses": course_views,
        "certificates": [{"id": cert.id, "course_id": cert.course_id, "student_name": cert.student_name, "score": cert.score, "issued_at": cert.issued_at} for cert in certificates],
        "achievements": [{"key": item.achievement_key, "earned_at": item.earned_at} for item in achievements],
    }


@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_academy_db)):
    return _dashboard(db)


@router.put("/profile")
def update_profile(data: ProfileUpdate, db: Session = Depends(get_academy_db)):
    profile = db.query(AcademyLearnerProfile).filter_by(learner_id=LOCAL_LEARNER).first()
    if not profile:
        profile = AcademyLearnerProfile(learner_id=LOCAL_LEARNER, student_name=data.student_name.strip())
        db.add(profile)
    else:
        profile.student_name = data.student_name.strip()
    db.commit()
    return {"student_name": profile.student_name}


@router.get("/courses")
def list_courses(db: Session = Depends(get_academy_db)):
    return _dashboard(db)["courses"]


@router.get("/courses/{course_id}")
def get_course(course_id: str, db: Session = Depends(get_academy_db)):
    course = _course(db, course_id)
    completed_ids, attempts, certificate = _course_state(db, course)
    return _public_course(course, completed_ids, attempts, certificate)


@router.get("/courses/{course_id}/lessons/{lesson_id}")
def get_lesson(course_id: str, lesson_id: str, db: Session = Depends(get_academy_db)):
    course = _course(db, course_id)
    lesson = next((item for item in course.lessons if item.id == lesson_id or item.slug == lesson_id), None)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    progress = db.query(AcademyLessonProgress).filter_by(learner_id=LOCAL_LEARNER, lesson_id=lesson.id).first()
    checks = {record.question_id: record for record in db.query(AcademyQuickCheckAttempt).filter_by(learner_id=LOCAL_LEARNER, lesson_id=lesson.id).all()}
    public_checks = []
    for question in lesson.quick_checks:
        public = _public_question(question)
        previous = checks.get(question["id"])
        if previous:
            public.update({
                "answered_option": previous.option_id,
                "correct": previous.correct,
                "correct_option": question["correct_option"],
                "explanation": question["explanation"],
            })
        public_checks.append(public)
    return {
        "id": lesson.id,
        "slug": lesson.slug,
        "course_id": course.id,
        "title": lesson.title,
        "order": lesson.order_index,
        "duration_minutes": lesson.duration_minutes,
        "objectives": lesson.objectives,
        "sections": lesson.sections,
        "quick_checks": public_checks,
        "video_url": lesson.video_url,
        "lab_kind": lesson.lab_kind,
        "completed": progress is not None,
    }


@router.post("/lessons/{lesson_id}/quick-checks/{question_id}")
def submit_quick_check(lesson_id: str, question_id: str, data: QuickCheckSubmission, db: Session = Depends(get_academy_db)):
    lesson = db.query(AcademyLesson).filter((AcademyLesson.id == lesson_id) | (AcademyLesson.slug == lesson_id)).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    question = next((item for item in lesson.quick_checks if item["id"] == question_id), None)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    valid = {option["id"] for option in question["options"]}
    if data.option_id not in valid:
        raise HTTPException(status_code=422, detail="Unknown answer option")
    correct = data.option_id == question["correct_option"]
    record = db.query(AcademyQuickCheckAttempt).filter_by(
        learner_id=LOCAL_LEARNER, lesson_id=lesson.id, question_id=question_id,
    ).first()
    if not record:
        record = AcademyQuickCheckAttempt(learner_id=LOCAL_LEARNER, lesson_id=lesson.id, question_id=question_id)
        db.add(record)
    record.option_id = data.option_id
    record.correct = correct
    record.answered_at = datetime.datetime.now(datetime.UTC)
    db.commit()
    return {
        "correct": correct,
        "correct_option": question["correct_option"],
        "explanation": question["explanation"],
    }


@router.post("/lessons/{lesson_id}/complete")
def complete_lesson(lesson_id: str, db: Session = Depends(get_academy_db)):
    lesson = db.query(AcademyLesson).filter((AcademyLesson.id == lesson_id) | (AcademyLesson.slug == lesson_id)).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    required_questions = {question["id"] for question in lesson.quick_checks}
    answered_questions = {
        record.question_id for record in db.query(AcademyQuickCheckAttempt).filter_by(
            learner_id=LOCAL_LEARNER, lesson_id=lesson.id,
        ).all()
    }
    if not required_questions.issubset(answered_questions):
        raise HTTPException(status_code=409, detail="Answer all lesson knowledge checks before marking it complete")
    progress = db.query(AcademyLessonProgress).filter_by(learner_id=LOCAL_LEARNER, lesson_id=lesson.id).first()
    if not progress:
        progress = AcademyLessonProgress(learner_id=LOCAL_LEARNER, lesson_id=lesson.id)
        db.add(progress)
    db.flush()
    new_count = db.query(AcademyLessonProgress).filter_by(learner_id=LOCAL_LEARNER).count()
    if new_count >= 1:
        _achievement(db, "first_lesson")
    if new_count >= 10:
        _achievement(db, "ten_lessons")
    if _learning_streak(db) >= 7:
        _achievement(db, "seven_day_streak")
    db.commit()
    return {"completed": True, "lesson_id": lesson.id, "completed_at": progress.completed_at}


@router.post("/courses/{course_id}/exams/start")
def start_exam(course_id: str, db: Session = Depends(get_academy_db)):
    course = _course(db, course_id)
    completed_ids, _, _ = _course_state(db, course)
    if len(course.lessons) != 10:
        raise HTTPException(status_code=409, detail="This course is not ready for examination")
    if len(completed_ids) != len(course.lessons):
        raise HTTPException(status_code=403, detail="Complete all 10 lessons before starting the examination")
    existing = db.query(AcademyExamAttempt).filter_by(learner_id=LOCAL_LEARNER, course_id=course.id, submitted_at=None).order_by(AcademyExamAttempt.started_at.desc()).first()
    now = datetime.datetime.now(datetime.UTC)
    if existing:
        if existing.expires_at.replace(tzinfo=datetime.UTC) > now:
            return _exam_view(existing, course)
        existing.submitted_at = now
        result = _exam_result(existing, course)
        existing.score = result["score"]
        existing.correct_count = result["correct_count"]
        existing.passed = False
        db.commit()
    questions = list(course.exam_questions or [])
    if len(questions) != 20:
        raise HTTPException(status_code=409, detail="The examination must contain exactly 20 questions")
    random.shuffle(questions)
    option_order = {}
    for question in questions:
        ids = [option["id"] for option in question["options"]]
        random.shuffle(ids)
        option_order[question["id"]] = ids
    attempt = AcademyExamAttempt(
        id=str(uuid4()), learner_id=LOCAL_LEARNER, course_id=course.id,
        started_at=now, expires_at=now + datetime.timedelta(minutes=EXAM_DURATION_MINUTES),
        question_order=[question["id"] for question in questions], option_order=option_order,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return _exam_view(attempt, course)


def _exam_view(attempt: AcademyExamAttempt, course: AcademyCourse) -> dict:
    question_map = {question["id"]: question for question in course.exam_questions or []}
    return {
        "id": attempt.id,
        "course_id": course.id,
        "started_at": _utc(attempt.started_at),
        "expires_at": _utc(attempt.expires_at),
        "duration_minutes": EXAM_DURATION_MINUTES,
        "question_count": len(attempt.question_order),
        "answers": attempt.answers or {},
        "questions": [_public_question(question_map[question_id], (attempt.option_order or {}).get(question_id)) for question_id in attempt.question_order if question_id in question_map],
    }


@router.get("/exams/active")
def get_active_exam(db: Session = Depends(get_academy_db)):
    now = datetime.datetime.now(datetime.UTC)
    attempts = db.query(AcademyExamAttempt).filter_by(learner_id=LOCAL_LEARNER, submitted_at=None).order_by(AcademyExamAttempt.started_at.desc()).all()
    attempt = next((item for item in attempts if item.expires_at.replace(tzinfo=datetime.UTC) > now), None)
    if not attempt:
        return None
    course = _course(db, attempt.course_id)
    return _exam_view(attempt, course)


@router.put("/exams/{attempt_id}/answers")
def save_exam_answers(attempt_id: str, data: ExamSubmission, db: Session = Depends(get_academy_db)):
    attempt = db.query(AcademyExamAttempt).filter_by(id=attempt_id, learner_id=LOCAL_LEARNER).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Exam attempt not found")
    if attempt.submitted_at:
        raise HTTPException(status_code=409, detail="This examination has already been submitted")
    if attempt.expires_at.replace(tzinfo=datetime.UTC) <= datetime.datetime.now(datetime.UTC):
        raise HTTPException(status_code=409, detail="The examination time has expired")
    question_map = {question["id"]: question for question in _course(db, attempt.course_id).exam_questions or []}
    if set(data.answers) - set(attempt.question_order):
        raise HTTPException(status_code=422, detail="Submission contains unknown question ids")
    for question_id, option_id in data.answers.items():
        if option_id not in {option["id"] for option in question_map[question_id]["options"]}:
            raise HTTPException(status_code=422, detail=f"Unknown answer for question {question_id}")
    attempt.answers = data.answers
    db.commit()
    return {"saved": True, "answered": len(data.answers)}


def _exam_result(attempt: AcademyExamAttempt, course: AcademyCourse) -> dict:
    question_map = {question["id"]: question for question in course.exam_questions or []}
    review = []
    correct = 0
    topic_counts: dict[str, list[int]] = defaultdict(lambda: [0, 0])
    for question_id in attempt.question_order:
        question = question_map.get(question_id)
        if not question:
            continue
        selected = (attempt.answers or {}).get(question_id)
        is_correct = selected == question["correct_option"]
        correct += int(is_correct)
        topic = question.get("topic", "Course concepts")
        topic_counts[topic][0] += int(is_correct)
        topic_counts[topic][1] += 1
        options = {option["id"]: option["text"] for option in question["options"]}
        review.append({
            "question_id": question_id, "lesson": question.get("lesson"), "topic": topic,
            "question": question["question"], "selected_option": selected,
            "selected_text": options.get(selected), "correct_option": question["correct_option"],
            "correct_text": options.get(question["correct_option"]), "correct": is_correct,
            "explanation": question["explanation"],
        })
    count = len(review)
    score = round(correct / count * 100, 1) if count else 0
    expiry = attempt.expires_at.replace(tzinfo=datetime.UTC)
    submitted = attempt.submitted_at
    if submitted is not None and submitted.tzinfo is None:
        submitted = submitted.replace(tzinfo=datetime.UTC)
    expired = submitted is not None and submitted > expiry
    return {
        "attempt_id": attempt.id, "course_id": course.id, "score": score,
        "correct_count": correct, "question_count": count, "passed": score >= PASS_SCORE and not expired,
        "pass_score": PASS_SCORE, "submitted_at": attempt.submitted_at,
        "expired": expired,
        "review": review,
        "topics_to_review": [{"topic": topic, "correct": counts[0], "total": counts[1]} for topic, counts in topic_counts.items() if counts[0] < counts[1]],
    }


@router.post("/exams/{attempt_id}/submit")
def submit_exam(attempt_id: str, data: ExamSubmission, db: Session = Depends(get_academy_db)):
    attempt = db.query(AcademyExamAttempt).filter_by(id=attempt_id, learner_id=LOCAL_LEARNER).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Exam attempt not found")
    course = _course(db, attempt.course_id)
    if attempt.submitted_at:
        return _exam_result(attempt, course)
    question_ids = set(attempt.question_order)
    if set(data.answers) - question_ids:
        raise HTTPException(status_code=422, detail="Submission contains unknown question ids")
    question_map = {question["id"]: question for question in course.exam_questions or []}
    for question_id, option_id in data.answers.items():
        if option_id not in {option["id"] for option in question_map[question_id]["options"]}:
            raise HTTPException(status_code=422, detail=f"Unknown answer for question {question_id}")
    attempt.answers = data.answers
    attempt.submitted_at = datetime.datetime.now(datetime.UTC)
    db.flush()
    result = _exam_result(attempt, course)
    attempt.score = result["score"]
    attempt.correct_count = result["correct_count"]
    attempt.passed = result["passed"]
    if result["passed"]:
        _achievement(db, "first_course")
        _achievement(db, "beginner_level")
        if result["score"] == 100:
            _achievement(db, "perfect_score")
        existing = db.query(AcademyCertificate).filter_by(learner_id=LOCAL_LEARNER, course_id=course.id).first()
        if not existing:
            profile = db.query(AcademyLearnerProfile).filter_by(learner_id=LOCAL_LEARNER).first()
            db.add(AcademyCertificate(learner_id=LOCAL_LEARNER, course_id=course.id, score=result["score"], student_name=profile.student_name if profile else "RedLab Student"))
    db.commit()
    db.refresh(attempt)
    return _exam_result(attempt, course)


@router.get("/exams/{attempt_id}")
def get_exam_result(attempt_id: str, db: Session = Depends(get_academy_db)):
    attempt = db.query(AcademyExamAttempt).filter_by(id=attempt_id, learner_id=LOCAL_LEARNER).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Exam attempt not found")
    if not attempt.submitted_at:
        if attempt.expires_at.replace(tzinfo=datetime.UTC) > datetime.datetime.now(datetime.UTC):
            return _exam_view(attempt, _course(db, attempt.course_id))
        attempt.answers = attempt.answers or {}
        attempt.submitted_at = datetime.datetime.now(datetime.UTC)
        course = _course(db, attempt.course_id)
        result = _exam_result(attempt, course)
        attempt.score = result["score"]
        attempt.correct_count = result["correct_count"]
        attempt.passed = False
        db.commit()
        db.refresh(attempt)
        return _exam_result(attempt, course)
    return _exam_result(attempt, _course(db, attempt.course_id))


@router.get("/certificates/{certificate_id}")
def get_certificate(certificate_id: str, db: Session = Depends(get_academy_db)):
    certificate = db.query(AcademyCertificate).filter_by(id=certificate_id, learner_id=LOCAL_LEARNER).first()
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    course = _course(db, certificate.course_id)
    return {"id": certificate.id, "certificate_id": f"RED-{certificate.id[:8].upper()}", "student_name": certificate.student_name, "course_title": course.title, "level_name": course.level_name, "score": certificate.score, "issued_at": certificate.issued_at}
