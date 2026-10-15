import datetime
from uuid import uuid4

from sqlalchemy import Column, String, DateTime, Integer, JSON, ForeignKey
from sqlalchemy.orm import relationship

from ..core.database import Base


class Lab(Base):
    __tablename__ = "labs"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    name = Column(String, nullable=False)
    description = Column(String, default="")
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.UTC))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.datetime.now(datetime.UTC),
        onupdate=lambda: datetime.datetime.now(datetime.UTC),
    )
    graph_data = Column(JSON, nullable=False, default=dict)
    schema_version = Column(String, default="1.0")

    scans = relationship("ScanResult", back_populates="lab", cascade="all, delete-orphan")


class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    lab_id = Column(String, ForeignKey("labs.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.UTC))
    total_rules = Column(Integer, default=0)
    passed = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    findings = Column(JSON, default=list)
    summary = Column(JSON, default=dict)

    lab = relationship("Lab", back_populates="scans")
