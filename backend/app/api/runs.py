"""
API routes for simulation runs and scenarios.
"""
from __future__ import annotations

import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..schemas.lab import (
    GraphData,
    LabRunCreate,
    LabRunResponse,
    ScenarioResponse,
    AssessmentRequest,
    AssessmentResponse,
    TopologyValidationResult,
    AttackExecutionRequest,
    AttackExecutionResponse,
    VerifyDefenseRequest,
)
from ..services import lab_service
from ..network_engine.topology import validate_topology
from ..network_engine.simulator import (
    simulate_topology,
    simulate_ping,
    simulate_port_scan,
    execute_attack_scenario,
    verify_defense,
)
from ..scenarios.definitions import get_all_scenarios, get_scenario, assess_scenario

router = APIRouter(prefix="/api")


def _run_to_response(run) -> LabRunResponse:
    events = run.events or []
    return LabRunResponse(
        id=run.id,
        lab_id=run.lab_id,
        mode=run.mode,
        status=run.status,
        scenario_id=run.scenario_id,
        started_at=run.started_at,
        ended_at=run.ended_at,
        validation=run.validation,
        events=events,
        result_summary=run.result_summary,
    )


# ---------------------------------------------------------------------------
# Topology validation
# ---------------------------------------------------------------------------

@router.post("/labs/{lab_id}/validate")
def validate_lab_topology(lab_id: str, db: Session = Depends(get_db)):
    """Validate the topology of a lab without running a simulation."""
    lab = lab_service.get_lab(db, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    graph_dict = lab.graph_data or {"nodes": [], "edges": []}
    graph = GraphData(**graph_dict)
    result = validate_topology(graph)
    return result.model_dump()


# ---------------------------------------------------------------------------
# Lab Runs
# ---------------------------------------------------------------------------

@router.post("/labs/{lab_id}/runs", status_code=201)
def create_lab_run(lab_id: str, data: LabRunCreate, db: Session = Depends(get_db)):
    """
    Create and immediately execute a simulation run for a lab.
    Simulator Mode only in this release.
    """
    lab = lab_service.get_lab(db, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    if data.mode not in ("simulator", "real_lab"):
        raise HTTPException(status_code=400, detail="mode must be 'simulator' or 'real_lab'")

    if data.mode == "real_lab":
        raise HTTPException(
            status_code=503,
            detail=(
                "Real Lab Mode is not available in this environment. "
                "Docker-based network isolation is not configured. "
                "Use Simulator Mode instead."
            ),
        )

    # If scenario_id provided, validate it exists
    if data.scenario_id:
        sc = get_scenario(data.scenario_id)
        if not sc:
            raise HTTPException(status_code=404, detail=f"Scenario '{data.scenario_id}' not found")

    # Create run record
    run = lab_service.create_run(db, lab_id, mode=data.mode, scenario_id=data.scenario_id)

    # Move to validating
    lab_service.update_run(db, run, status="validating")

    graph_dict = lab.graph_data or {"nodes": [], "edges": []}
    graph = GraphData(**graph_dict)
    validation = validate_topology(graph)

    if not validation.valid:
        lab_service.update_run(
            db, run,
            status="failed",
            ended_at=datetime.datetime.now(datetime.UTC),
            validation=validation.model_dump(),
        )
        return _run_to_response(lab_service.get_run(db, run.id))

    # Run simulation
    lab_service.update_run(
        db, run,
        status="running",
        started_at=datetime.datetime.now(datetime.UTC),
        validation=validation.model_dump(),
    )

    events, result_summary = simulate_topology(graph, run.id, validation)

    # Serialize events
    serialized_events = [e.model_dump(mode="json") for e in events]

    lab_service.update_run(
        db, run,
        status="completed",
        ended_at=datetime.datetime.now(datetime.UTC),
        events=serialized_events,
        result_summary=result_summary,
    )

    return _run_to_response(lab_service.get_run(db, run.id))


@router.get("/runs/{run_id}")
def get_lab_run(run_id: str, db: Session = Depends(get_db)):
    run = lab_service.get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return _run_to_response(run)


@router.post("/runs/{run_id}/stop")
def stop_lab_run(run_id: str, db: Session = Depends(get_db)):
    run = lab_service.get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run.status not in ("running", "queued", "starting"):
        raise HTTPException(status_code=400, detail=f"Run is not stoppable (status: {run.status})")
    lab_service.update_run(db, run, status="stopped", ended_at=datetime.datetime.now(datetime.UTC))
    return _run_to_response(lab_service.get_run(db, run.id))


@router.get("/runs/{run_id}/events")
def get_run_events(run_id: str, db: Session = Depends(get_db)):
    run = lab_service.get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run.events or []


@router.get("/labs/{lab_id}/runs")
def list_lab_runs(lab_id: str, db: Session = Depends(get_db)):
    lab = lab_service.get_lab(db, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    runs = lab_service.get_runs_for_lab(db, lab_id)
    return [_run_to_response(r) for r in runs]


# ---------------------------------------------------------------------------
# Ping simulation (ad-hoc)
# ---------------------------------------------------------------------------

@router.post("/labs/{lab_id}/ping")
def run_ping(
    lab_id: str,
    body: dict,
    db: Session = Depends(get_db),
):
    """
    Simulate a ping between two nodes in a lab.
    Body: { "source_id": "...", "dest_id": "..." }
    """
    lab = lab_service.get_lab(db, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    source_id = body.get("source_id", "")
    dest_id = body.get("dest_id", "")
    if not source_id or not dest_id:
        raise HTTPException(status_code=400, detail="source_id and dest_id are required")

    graph_dict = lab.graph_data or {"nodes": [], "edges": []}
    graph = GraphData(**graph_dict)
    run_id = f"ping-{str(uuid4())[:8]}"

    events = simulate_ping(graph, run_id, source_id, dest_id)
    return [e.model_dump(mode="json") for e in events]


@router.post("/labs/{lab_id}/port-scan")
def run_port_scan(
    lab_id: str,
    body: dict,
    db: Session = Depends(get_db),
):
    """
    Simulate a TCP SYN / Service discovery port scan between two nodes in a lab.
    Body: { "source_id": "...", "dest_id": "...", "ports": [22, 80, ...] }
    """
    lab = lab_service.get_lab(db, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    source_id = body.get("source_id", "")
    dest_id = body.get("dest_id", "")
    if not source_id or not dest_id:
        raise HTTPException(status_code=400, detail="source_id and dest_id are required")

    ports = body.get("ports")
    graph_dict = lab.graph_data or {"nodes": [], "edges": []}
    graph = GraphData(**graph_dict)
    run_id = f"scan-{str(uuid4())[:8]}"

    events = simulate_port_scan(graph, run_id, source_id, dest_id, ports)
    return [e.model_dump(mode="json") for e in events]


# ---------------------------------------------------------------------------
# Attack Mode & Defend Mode Execution
# ---------------------------------------------------------------------------

@router.post("/labs/{lab_id}/attack", response_model=AttackExecutionResponse)
def run_attack(
    lab_id: str,
    data: AttackExecutionRequest,
    db: Session = Depends(get_db),
):
    """
    Execute a controlled attack scenario against an authorized lab target.
    Enforces mode restrictions: Attacks can only be launched in Attack Mode.
    """
    lab = lab_service.get_lab(db, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    if data.app_mode == "defend":
        raise HTTPException(
            status_code=403,
            detail=(
                "Permission Denied: Attack operations cannot be launched while in Defend Mode. "
                "Switch to Attack Mode (Red Team) or use the 'Verify Defense' workflow."
            ),
        )

    graph_dict = lab.graph_data or {"nodes": [], "edges": []}
    graph = GraphData(**graph_dict)

    # Validate target exists in this specific lab
    target_ids = {n.id for n in graph.nodes}
    if data.target_id not in target_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Target '{data.target_id}' does not belong to this authorized lab environment.",
        )

    try:
        response = execute_attack_scenario(graph, data)
        # Store attack execution as a lab run record
        run = lab_service.create_run(db, lab_id, mode="simulator", scenario_id=data.scenario_id)
        lab_service.update_run(
            db,
            run,
            status="completed",
            ended_at=datetime.datetime.now(datetime.UTC),
            events=[e.model_dump(mode="json") for e in response.events],
            result_summary={
                "outcome": response.outcome,
                "target_id": response.target_id,
                "evidence": response.evidence,
                "takeaway": response.educational_takeaway,
            },
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/labs/{lab_id}/verify-defense", response_model=AttackExecutionResponse)
def run_verify_defense(
    lab_id: str,
    data: VerifyDefenseRequest,
    db: Session = Depends(get_db),
):
    """
    Verify defensive controls by rerunning an approved attack scenario test against the lab.
    Returns a side-by-side Before/After comparison.
    """
    lab = lab_service.get_lab(db, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    graph_dict = lab.graph_data or {"nodes": [], "edges": []}
    graph = GraphData(**graph_dict)

    target_ids = {n.id for n in graph.nodes}
    if data.target_id not in target_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Target '{data.target_id}' does not belong to this authorized lab environment.",
        )

    try:
        response = verify_defense(graph, data)
        # Store verification run record
        run = lab_service.create_run(db, lab_id, mode="simulator", scenario_id=data.scenario_id)
        lab_service.update_run(
            db,
            run,
            status="completed",
            ended_at=datetime.datetime.now(datetime.UTC),
            events=[e.model_dump(mode="json") for e in response.events],
            result_summary={
                "outcome": response.outcome,
                "defense_effective": response.comparison.defense_effective if response.comparison else False,
                "comparison": response.comparison.model_dump(mode="json") if response.comparison else None,
            },
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



# ---------------------------------------------------------------------------
# Scenarios
# ---------------------------------------------------------------------------

@router.get("/scenarios")
def list_scenarios():
    return get_all_scenarios()


@router.get("/scenarios/{scenario_id}")
def get_scenario_detail(scenario_id: str):
    sc = get_scenario(scenario_id)
    if not sc:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")
    from ..schemas.lab import ScenarioObjective
    return ScenarioResponse(
        id=sc["id"],
        title=sc["title"],
        description=sc["description"],
        category=sc["category"],
        difficulty=sc["difficulty"],
        objectives=[ScenarioObjective(**o) for o in sc["objectives"]],
        supported_modes=sc["supported_modes"],
        estimated_minutes=sc["estimated_minutes"],
        tags=sc["tags"],
    )


@router.post("/scenarios/{scenario_id}/start", status_code=201)
def start_scenario(scenario_id: str, db: Session = Depends(get_db)):
    """
    Create a new lab pre-loaded with the scenario's initial topology and return its ID.
    The user can then edit/run it as a regular lab.
    """
    sc = get_scenario(scenario_id)
    if not sc:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")

    from ..schemas.lab import LabCreate
    initial_topology = sc.get("initial_topology", {"nodes": [], "edges": []})
    graph = GraphData(**initial_topology)
    lab_data = LabCreate(
        name=f"[Scenario] {sc['title']}",
        description=sc["description"],
        graph_data=graph,
    )
    lab = lab_service.create_lab(db, lab_data)

    # Create a draft run associated with this scenario
    run = lab_service.create_run(db, lab.id, mode="simulator", scenario_id=scenario_id)

    return {
        "lab_id": lab.id,
        "run_id": run.id,
        "scenario_id": scenario_id,
        "message": f"Scenario lab created. Open lab {lab.id} to begin.",
    }


@router.post("/runs/{run_id}/assess")
def assess_run(run_id: str, body: AssessmentRequest, db: Session = Depends(get_db)):
    """
    Assess scenario completion for a given run against its current lab topology.
    """
    run = lab_service.get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if not run.scenario_id:
        raise HTTPException(status_code=400, detail="This run has no associated scenario")

    lab = lab_service.get_lab(db, run.lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    graph_dict = lab.graph_data or {"nodes": [], "edges": []}
    graph = GraphData(**graph_dict)

    answers = body.answers or {}
    answers["run_id"] = run_id

    result = assess_scenario(run.scenario_id, graph, answers)

    return AssessmentResponse(
        run_id=result["run_id"],
        scenario_id=result["scenario_id"],
        objectives_met=result["objectives_met"],
        objectives_failed=result["objectives_failed"],
        score=result["score"],
        max_score=result["max_score"],
        passed=result["passed"],
        explanation=result["explanation"],
        completed_at=datetime.datetime.fromisoformat(result["completed_at"]),
    )
