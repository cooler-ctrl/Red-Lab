from sqlalchemy.orm import Session

from ..models.academy import AcademyCourse, AcademyLearnerProfile, AcademyLesson, AcademyLessonProgress, AcademyQuickCheckAttempt
from .content import BEGINNER_COURSE


def seed_academy(db: Session) -> None:
    """Keep the built-in starter course in sync with local database content."""
    profile = db.query(AcademyLearnerProfile).filter_by(learner_id="local-student").first()
    if not profile:
        db.add(AcademyLearnerProfile(learner_id="local-student", student_name="RedLab Student"))

    course = db.query(AcademyCourse).filter_by(slug=BEGINNER_COURSE["slug"]).first()
    if not course:
        course = AcademyCourse(slug=BEGINNER_COURSE["slug"])
        db.add(course)
    course.title = BEGINNER_COURSE["title"]
    course.level = BEGINNER_COURSE["level"]
    course.level_name = BEGINNER_COURSE["level_name"]
    course.description = BEGINNER_COURSE["description"]
    course.estimated_hours = BEGINNER_COURSE["estimated_hours"]
    course.exam_questions = BEGINNER_COURSE["exam_questions"]
    db.flush()

    existing = {lesson.slug: lesson for lesson in db.query(AcademyLesson).filter_by(course_id=course.id).all()}
    wanted_slugs = {item["slug"] for item in BEGINNER_COURSE["lessons"]}
    targets = {slug: lesson for slug, lesson in existing.items() if slug in wanted_slugs}

    for index, data in enumerate(BEGINNER_COURSE["lessons"], start=1):
        lesson = existing.get(data["slug"])
        if not lesson:
            lesson = AcademyLesson(course_id=course.id, slug=data["slug"])
            db.add(lesson)
        lesson.order_index = index
        lesson.title = data["title"]
        lesson.duration_minutes = data["duration_minutes"]
        lesson.objectives = data["objectives"]
        lesson.sections = data["sections"]
        lesson.quick_checks = data["quick_checks"]
        lesson.video_url = data["video_url"]
        lesson.lab_kind = data["lab_kind"]
        targets[data["slug"]] = lesson

    for slug, obsolete in existing.items():
        if slug in wanted_slugs:
            continue
        # Keep completion when the old network-security lesson is merged into
        # networking-fundamentals, avoiding duplicate progress for the learner.
        target = targets.get("networking-fundamentals") if slug == "basic-network-security" else None
        progress_rows = db.query(AcademyLessonProgress).filter_by(lesson_id=obsolete.id).all()
        for progress in progress_rows:
            target_progress = db.query(AcademyLessonProgress).filter_by(
                learner_id=progress.learner_id,
                lesson_id=target.id if target else "__none__",
            ).first()
            if target and not target_progress:
                progress.lesson_id = target.id
            else:
                db.delete(progress)
        for check_attempt in db.query(AcademyQuickCheckAttempt).filter_by(lesson_id=obsolete.id).all():
            db.delete(check_attempt)
        db.delete(obsolete)
    db.commit()
