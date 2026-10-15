from __future__ import annotations

import datetime
from pydantic import BaseModel, ConfigDict, Field


# ---------- Graph primitives ----------

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
    schema_version: str = "1.0"


# ---------- Security findings ----------

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
