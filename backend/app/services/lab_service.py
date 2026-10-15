from __future__ import annotations

import datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from ..models.lab import Lab, ScanResult
from ..schemas.lab import LabCreate, LabUpdate, LabImport, GraphData


def get_labs(db: Session) -> list[Lab]:
    return db.query(Lab).order_by(Lab.updated_at.desc()).all()


def get_lab(db: Session, lab_id: str) -> Lab | None:
    return db.query(Lab).filter(Lab.id == lab_id).first()


def create_lab(db: Session, data: LabCreate) -> Lab:
    lab = Lab(
        id=str(uuid4()),
        name=data.name,
        description=data.description,
        graph_data=data.graph_data.model_dump(),
    )
    db.add(lab)
    db.commit()
    db.refresh(lab)
    return lab


def update_lab(db: Session, lab_id: str, data: LabUpdate) -> Lab | None:
    lab = get_lab(db, lab_id)
    if not lab:
        return None
    if data.name is not None:
        lab.name = data.name
    if data.description is not None:
        lab.description = data.description
    if data.graph_data is not None:
        lab.graph_data = data.graph_data.model_dump()
    lab.updated_at = datetime.datetime.now(datetime.UTC)
    db.commit()
    db.refresh(lab)
    return lab


def delete_lab(db: Session, lab_id: str) -> bool:
    lab = get_lab(db, lab_id)
    if not lab:
        return False
    db.delete(lab)
    db.commit()
    return True


def import_lab(db: Session, data: LabImport) -> Lab:
    # Validate node references in edges
    node_ids = {n.id for n in data.graph_data.nodes}
    valid_types = {"vpc", "subnet", "ec2", "s3", "rds", "security_group", "iam_role", "internet_gateway"}
    for node in data.graph_data.nodes:
        if node.type not in valid_types:
            raise ValueError(f"Invalid node type: {node.type}")
    for edge in data.graph_data.edges:
        if edge.source not in node_ids:
            raise ValueError(f"Edge source '{edge.source}' references nonexistent node")
        if edge.target not in node_ids:
            raise ValueError(f"Edge target '{edge.target}' references nonexistent node")

    lab = Lab(
        id=str(uuid4()),
        name=data.name,
        description=data.description,
        graph_data=data.graph_data.model_dump(),
        schema_version=data.schema_version,
    )
    db.add(lab)
    db.commit()
    db.refresh(lab)
    return lab


def save_scan_result(
    db: Session, lab_id: str, scan_data: dict
) -> ScanResult:
    result = ScanResult(
        id=str(uuid4()),
        lab_id=lab_id,
        total_rules=scan_data["total_rules"],
        passed=scan_data["passed"],
        failed=scan_data["failed"],
        findings=[f.model_dump() if hasattr(f, "model_dump") else f for f in scan_data["findings"]],
        summary={
            "risk_score": scan_data["risk_score"],
            "summary": scan_data["summary"],
            "findings_by_severity": scan_data["findings_by_severity"],
        },
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


def get_scan_history(db: Session, lab_id: str) -> list[ScanResult]:
    return (
        db.query(ScanResult)
        .filter(ScanResult.lab_id == lab_id)
        .order_by(ScanResult.created_at.desc())
        .limit(20)
        .all()
    )
