import datetime
from uuid import uuid4

from sqlalchemy import Column, String, DateTime, Integer, JSON, ForeignKey, Float
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
    schema_version = Column(String, default="1.1")

    scans = relationship("ScanResult", back_populates="lab", cascade="all, delete-orphan")
    runs = relationship("LabRun", back_populates="lab", cascade="all, delete-orphan")


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


class LabRun(Base):
    """Represents a simulation or real-lab execution run."""
    __tablename__ = "lab_runs"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    lab_id = Column(String, ForeignKey("labs.id", ondelete="CASCADE"), nullable=False)
    mode = Column(String, default="simulator")       # "simulator" | "real_lab"
    status = Column(String, default="draft")          # RunStatus enum values
    scenario_id = Column(String, nullable=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    validation = Column(JSON, nullable=True)          # TopologyValidationResult dict
    events = Column(JSON, default=list)               # list[NetworkEvent] dicts
    result_summary = Column(JSON, nullable=True)      # arbitrary result metadata

    lab = relationship("Lab", back_populates="runs")
