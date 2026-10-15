from __future__ import annotations

import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..schemas.lab import (
    LabCreate,
    LabUpdate,
    LabResponse,
    LabImport,
    GraphData,
    ScanResponse,
    ScanSummary,
)
from ..services import lab_service
from ..security_engine.registry import registry
from ..security_engine.analyzer import SecurityAnalyzer

# Ensure rules are registered
import app.security_engine.rules  # noqa: F401

router = APIRouter(prefix="/api")
analyzer = SecurityAnalyzer(registry)


def _lab_to_response(lab, db: Session) -> dict:
    """Convert a Lab ORM object to a LabResponse-compatible dict."""
    graph = lab.graph_data or {"nodes": [], "edges": []}
    nodes = graph.get("nodes", [])
    # Get last scan status
    scans = lab_service.get_scan_history(db, lab.id)
    last_scan_status = None
    if scans:
        last_scan = scans[0]
        summary = last_scan.summary or {}
        if last_scan.failed == 0:
            last_scan_status = "passed"
        else:
            last_scan_status = f"{last_scan.failed} issues"
    return {
        "id": lab.id,
        "name": lab.name,
        "description": lab.description,
        "created_at": lab.created_at,
        "updated_at": lab.updated_at,
        "graph_data": graph,
        "schema_version": lab.schema_version,
        "node_count": len(nodes),
        "last_scan_status": last_scan_status,
    }


@router.get("/health")
def health_check():
    return {"status": "ok", "app": "RedLab", "version": "1.0.0"}


@router.get("/labs")
def list_labs(db: Session = Depends(get_db)):
    labs = lab_service.get_labs(db)
    return [_lab_to_response(lab, db) for lab in labs]


@router.post("/labs", status_code=201)
def create_lab(data: LabCreate, db: Session = Depends(get_db)):
    lab = lab_service.create_lab(db, data)
    return _lab_to_response(lab, db)


@router.get("/labs/{lab_id}")
def get_lab(lab_id: str, db: Session = Depends(get_db)):
    lab = lab_service.get_lab(db, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    return _lab_to_response(lab, db)


@router.put("/labs/{lab_id}")
def update_lab(lab_id: str, data: LabUpdate, db: Session = Depends(get_db)):
    lab = lab_service.update_lab(db, lab_id, data)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    return _lab_to_response(lab, db)


@router.delete("/labs/{lab_id}", status_code=204)
def delete_lab(lab_id: str, db: Session = Depends(get_db)):
    success = lab_service.delete_lab(db, lab_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lab not found")
    return None


@router.post("/labs/{lab_id}/scan")
def run_scan(lab_id: str, db: Session = Depends(get_db)):
    lab = lab_service.get_lab(db, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    graph_dict = lab.graph_data or {"nodes": [], "edges": []}
    graph = GraphData(**graph_dict)

    result = analyzer.analyze(graph)

    # Persist scan result
    scan_record = lab_service.save_scan_result(db, lab_id, result)

    # Build response
    findings = result["findings"]
    return ScanResponse(
        id=scan_record.id,
        lab_id=lab_id,
        timestamp=scan_record.created_at,
        total_rules=result["total_rules"],
        passed=result["passed"],
        failed=result["failed"],
        findings=findings,
        findings_by_severity=result["findings_by_severity"],
        risk_score=result["risk_score"],
        summary=result["summary"],
        attack_paths=[ap.model_dump() for ap in result["attack_paths"]],
    )


@router.get("/labs/{lab_id}/scans")
def get_scan_history(lab_id: str, db: Session = Depends(get_db)):
    lab = lab_service.get_lab(db, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    scans = lab_service.get_scan_history(db, lab_id)
    return [
        ScanSummary.model_validate(s)
        for s in scans
    ]


@router.post("/labs/import", status_code=201)
def import_lab(data: LabImport, db: Session = Depends(get_db)):
    try:
        lab = lab_service.import_lab(db, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _lab_to_response(lab, db)


@router.get("/labs/{lab_id}/export")
def export_lab(lab_id: str, db: Session = Depends(get_db)):
    lab = lab_service.get_lab(db, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    return {
        "name": lab.name,
        "description": lab.description,
        "graph_data": lab.graph_data,
        "schema_version": lab.schema_version,
    }
