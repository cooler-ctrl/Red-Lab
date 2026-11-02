from __future__ import annotations

import datetime
from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import relationship

from ..core.database import Base


class AcademyCourse(Base):
    __tablename__ = "academy_courses"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    slug = Column(String, nullable=False, unique=True, index=True)
    title = Column(String, nullable=False)
    level = Column(String, nullable=False, default="beginner")
    level_name = Column(String, nullable=False, default="Beginner")
    description = Column(String, nullable=False, default="")
    estimated_hours = Column(Integer, nullable=False, default=8)
    exam_questions = Column(JSON, nullable=False, default=list)
    lessons = relationship("AcademyLesson", back_populates="course", cascade="all, delete-orphan", order_by="AcademyLesson.order_index")


class AcademyLesson(Base):
    __tablename__ = "academy_lessons"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    course_id = Column(String, ForeignKey("academy_courses.id", ondelete="CASCADE"), nullable=False, index=True)
    slug = Column(String, nullable=False)
    order_index = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    duration_minutes = Column(Integer, nullable=False, default=35)
    objectives = Column(JSON, nullable=False, default=list)
    sections = Column(JSON, nullable=False, default=list)
    quick_checks = Column(JSON, nullable=False, default=list)
    video_url = Column(String, nullable=True)
    lab_kind = Column(String, nullable=True)
    __table_args__ = (UniqueConstraint("course_id", "slug", name="uq_academy_lesson_slug"),)

    course = relationship("AcademyCourse", back_populates="lessons")


class AcademyLessonProgress(Base):
    __tablename__ = "academy_lesson_progress"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    learner_id = Column(String, nullable=False, index=True, default="local-student")
    lesson_id = Column(String, ForeignKey("academy_lessons.id", ondelete="CASCADE"), nullable=False)
    completed_at = Column(DateTime, nullable=False, default=lambda: datetime.datetime.now(datetime.UTC))
    __table_args__ = (UniqueConstraint("learner_id", "lesson_id", name="uq_academy_learner_lesson"),)


class AcademyQuickCheckAttempt(Base):
    __tablename__ = "academy_quick_check_attempts"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    learner_id = Column(String, nullable=False, index=True, default="local-student")
    lesson_id = Column(String, ForeignKey("academy_lessons.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String, nullable=False)
    option_id = Column(String, nullable=False)
    correct = Column(Boolean, nullable=False)
    answered_at = Column(DateTime, nullable=False, default=lambda: datetime.datetime.now(datetime.UTC))
    __table_args__ = (UniqueConstraint("learner_id", "lesson_id", "question_id", name="uq_academy_quick_check"),)


class AcademyExamAttempt(Base):
    __tablename__ = "academy_exam_attempts"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    learner_id = Column(String, nullable=False, index=True, default="local-student")
    course_id = Column(String, ForeignKey("academy_courses.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime, nullable=False, default=lambda: datetime.datetime.now(datetime.UTC))
    expires_at = Column(DateTime, nullable=False)
    submitted_at = Column(DateTime, nullable=True)
    score = Column(Float, nullable=True)
    correct_count = Column(Integer, nullable=True)
    passed = Column(Boolean, nullable=True)
    question_order = Column(JSON, nullable=False, default=list)
    option_order = Column(JSON, nullable=False, default=dict)
    answers = Column(JSON, nullable=False, default=dict)


class AcademyCertificate(Base):
    __tablename__ = "academy_certificates"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    learner_id = Column(String, nullable=False, index=True, default="local-student")
    course_id = Column(String, ForeignKey("academy_courses.id", ondelete="CASCADE"), nullable=False)
    student_name = Column(String, nullable=False, default="RedLab Student")
    score = Column(Float, nullable=False)
    issued_at = Column(DateTime, nullable=False, default=lambda: datetime.datetime.now(datetime.UTC))
    __table_args__ = (UniqueConstraint("learner_id", "course_id", name="uq_academy_certificate"),)


class AcademyAchievement(Base):
    __tablename__ = "academy_achievements"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    learner_id = Column(String, nullable=False, index=True, default="local-student")
    achievement_key = Column(String, nullable=False)
    earned_at = Column(DateTime, nullable=False, default=lambda: datetime.datetime.now(datetime.UTC))
    __table_args__ = (UniqueConstraint("learner_id", "achievement_key", name="uq_academy_achievement"),)


class AcademyLearnerProfile(Base):
    __tablename__ = "academy_learner_profiles"

    learner_id = Column(String, primary_key=True, default="local-student")
    student_name = Column(String, nullable=False, default="RedLab Student")
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.datetime.now(datetime.UTC), onupdate=lambda: datetime.datetime.now(datetime.UTC))
