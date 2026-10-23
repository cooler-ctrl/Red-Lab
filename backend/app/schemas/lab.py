from __future__ import annotations

import datetime
from pydantic import BaseModel, ConfigDict, Field


# ---------- Graph primitives ----------

VALID_RESOURCE_TYPES = {
    # Network devices (RedLab Network Attack Simulation)
    "pc", "router", "switch", "server", "firewall", "external_network",
}


class GraphNode(BaseModel):
    id: str
    type: str
    position: dict = Field(default_factory=lambda: {"x": 0, "y": 0})
    label: str
    config: dict = Field(default_factory=dict)


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship_type: str = "default"
    metadata: dict = Field(default_factory=dict)


class GraphData(BaseModel):
    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)


# ---------- Lab CRUD ----------

class LabCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str = ""
    graph_data: GraphData = Field(default_factory=GraphData)


class LabUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    graph_data: GraphData | None = None


class LabResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    graph_data: dict
    schema_version: str
    node_count: int = 0
    last_scan_status: str | None = None


class LabImport(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str = ""
    graph_data: GraphData
    schema_version: str = "1.1"


# ---------- Security findings (v1.0) ----------

class Finding(BaseModel):
    rule_id: str
    title: str
    severity: str  # critical, high, medium, low
    category: str
    affected_resource_id: str
    affected_resource_name: str
    explanation: str
    impact: str
    remediation: str
    references: list[str] = Field(default_factory=list)


class AttackPathStep(BaseModel):
    resource_id: str
    label: str
    action: str


class AttackPath(BaseModel):
    id: str
    title: str
    description: str
    severity: str
    steps: list[AttackPathStep]
    assumptions: list[str]


class ScanResponse(BaseModel):
    id: str
    lab_id: str
    timestamp: datetime.datetime
    total_rules: int
    passed: int
    failed: int
    findings: list[Finding]
    findings_by_severity: dict[str, int]
    risk_score: float
    summary: str
    attack_paths: list[AttackPath] = Field(default_factory=list)


class ScanSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    lab_id: str
    created_at: datetime.datetime
    total_rules: int
    passed: int
    failed: int


# ---------- v1.1 Network Simulation ----------

class TopologyValidationError(BaseModel):
    code: str
    message: str
    affected_node_id: str | None = None
    affected_edge_id: str | None = None


class TopologyValidationResult(BaseModel):
    valid: bool
    errors: list[TopologyValidationError] = Field(default_factory=list)
    warnings: list[TopologyValidationError] = Field(default_factory=list)


class NetworkEvent(BaseModel):
    id: str
    run_id: str
    timestamp: datetime.datetime
    event_type: str
    source_device_id: str | None = None
    source_device_name: str | None = None
    dest_device_id: str | None = None
    dest_device_name: str | None = None
    protocol: str | None = None
    interface_name: str | None = None
    summary: str
    detail: dict = Field(default_factory=dict)
    provenance: str = "simulated"  # "simulated" | "real"


class LabRunCreate(BaseModel):
    mode: str = "simulator"  # "simulator" | "real_lab"
    scenario_id: str | None = None


class LabRunResponse(BaseModel):
    id: str
    lab_id: str
    mode: str
    status: str
    scenario_id: str | None = None
    started_at: datetime.datetime | None = None
    ended_at: datetime.datetime | None = None
    validation: dict | None = None
    events: list[dict] = Field(default_factory=list)
    result_summary: dict | None = None


class PortScanRequest(BaseModel):
    source_id: str
    dest_id: str
    ports: list[int] | None = None


# ---------- v1.1 Scenarios ----------

class ScenarioObjective(BaseModel):
    id: str
    description: str
    required: bool = True


class ScenarioResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    difficulty: str
    objectives: list[ScenarioObjective]
    supported_modes: list[str]
    estimated_minutes: int
    tags: list[str]


class AssessmentRequest(BaseModel):
    answers: dict = Field(default_factory=dict)


class AssessmentResponse(BaseModel):
    run_id: str
    scenario_id: str
    objectives_met: list[str]
    objectives_failed: list[str]
    score: int
    max_score: int
    passed: bool
    explanation: str
    completed_at: datetime.datetime
