"""
RedLab 1.1 — Attack Mode & Defend Mode Integration Tests
Verifies:
- Attack execution endpoints and scenario simulation
- Mode restriction enforcement (Defend mode blocks attack launches)
- Target authorization and containment within lab
- Verify Defense workflow and Before/After comparison
- Extended device types support in topology and simulation
"""
import pytest
from app.schemas.lab import GraphData, GraphNode, GraphEdge, LabCreate
from app.network_engine.topology import validate_topology


@pytest.fixture
def sample_attack_lab(client):
    """Creates a standard attack & defend laboratory topology."""
    payload = {
        "name": "Attack & Defense Test Lab",
        "description": "Lab with attacker PC, perimeter firewall, and internal servers",
        "graph_data": {
            "nodes": [
                {
                    "id": "attacker-pc",
                    "type": "pc",
                    "label": "Attacker PC",
                    "position": {"x": 50, "y": 100},
                    "config": {
                        "name": "Attacker PC",
                        "interfaces": [
                            {"id": "eth0", "name": "eth0", "ip_address": "192.168.1.100", "cidr_prefix": "24", "enabled": True}
                        ],
                        "default_gateway": "192.168.1.1",
                    },
                },
                {
                    "id": "fw-edge",
                    "type": "firewall",
                    "label": "Perimeter Firewall",
                    "position": {"x": 200, "y": 100},
                    "config": {
                        "name": "Perimeter Firewall",
                        "ip_address": "192.168.1.1",
                        "cidr_prefix": "24",
                        "default_inbound_action": "allow",
                        "inbound_rules": [],
                    },
                },
                {
                    "id": "target-server",
                    "type": "server",
                    "label": "Internal Application Server",
                    "position": {"x": 350, "y": 100},
                    "config": {
                        "name": "Internal Application Server",
                        "ip_address": "192.168.1.50",
                        "cidr_prefix": "24",
                        "default_gateway": "192.168.1.1",
                        "allow_weak_passwords": True,
                        "services": [
                            {"name": "HTTP", "port": 80, "protocol": "tcp", "enabled": True},
                            {"name": "SSH", "port": 22, "protocol": "tcp", "enabled": True},
                        ],
                    },
                },
            ],
            "edges": [
                {"id": "e1", "source": "attacker-pc", "target": "fw-edge", "relationship_type": "connects", "metadata": {}},
                {"id": "e2", "source": "fw-edge", "target": "target-server", "relationship_type": "connects", "metadata": {}},
            ],
        },
    }
    res = client.post("/api/labs", json=payload)
    assert res.status_code == 201
    return res.json()["id"]


def test_attack_execution_port_scan(client, sample_attack_lab):
    payload = {
        "scenario_id": "attack_port_scan",
        "target_id": "target-server",
        "attacker_id": "attacker-pc",
        "parameters": {"ports": [22, 80]},
        "app_mode": "attack",
    }
    res = client.post(f"/api/labs/{sample_attack_lab}/attack", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["scenario_id"] == "attack_port_scan"
    assert data["target_id"] == "target-server"
    assert len(data["events"]) > 0
    event_types = [e["event_type"] for e in data["events"]]
    assert "port_scan_start" in event_types
    assert "port_scan_open" in event_types


def test_attack_execution_brute_force(client, sample_attack_lab):
    payload = {
        "scenario_id": "auth_brute_force",
        "target_id": "target-server",
        "attacker_id": "attacker-pc",
        "parameters": {"port": 22},
        "app_mode": "attack",
    }
    res = client.post(f"/api/labs/{sample_attack_lab}/attack", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["outcome"] == "compromised"
    event_types = [e["event_type"] for e in data["events"]]
    assert "auth_attempt" in event_types
    assert "auth_success" in event_types


def test_attack_mode_enforcement_rejects_defend_mode(client, sample_attack_lab):
    """Attack operations must be rejected when app_mode is 'defend'."""
    payload = {
        "scenario_id": "auth_brute_force",
        "target_id": "target-server",
        "attacker_id": "attacker-pc",
        "app_mode": "defend",
    }
    res = client.post(f"/api/labs/{sample_attack_lab}/attack", json=payload)
    assert res.status_code == 403
    assert "Defend Mode" in res.json()["detail"]


def test_target_outside_lab_rejected(client, sample_attack_lab):
    """Attacking a target not in the lab must be rejected."""
    payload = {
        "scenario_id": "attack_port_scan",
        "target_id": "nonexistent-target-id",
        "app_mode": "attack",
    }
    res = client.post(f"/api/labs/{sample_attack_lab}/attack", json=payload)
    assert res.status_code == 400
    assert "does not belong" in res.json()["detail"]


def test_verify_defense_workflow(client, sample_attack_lab):
    """Defend Mode allows 'verify-defense' to rerun attack tests and provide Before/After comparison."""
    # 1. Update lab with defensive firewall rule to deny port 22
    get_res = client.get(f"/api/labs/{sample_attack_lab}")
    lab_data = get_res.json()["graph_data"]

    # Modify firewall node to default deny
    for n in lab_data["nodes"]:
        if n["id"] == "fw-edge":
            n["config"]["default_inbound_action"] = "deny"

    update_res = client.put(f"/api/labs/{sample_attack_lab}", json={"graph_data": lab_data})
    assert update_res.status_code == 200

    # 2. Run verify-defense
    verify_payload = {
        "scenario_id": "auth_brute_force",
        "target_id": "target-server",
        "attacker_id": "attacker-pc",
        "applied_defense": "Firewall default-deny policy",
        "parameters": {"port": 22},
    }
    res = client.post(f"/api/labs/{sample_attack_lab}/verify-defense", json=verify_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["outcome"] == "blocked"
    assert data["comparison"] is not None
    assert data["comparison"]["defense_effective"] is True
    assert data["comparison"]["after_status"] == "blocked"


def test_extended_devices_in_topology():
    """Verify that all extended device types (web_server, dns_server, ids_ips, layer3_switch) validate cleanly."""
    g = GraphData(
        nodes=[
            GraphNode(id="l3sw", type="layer3_switch", position={"x": 0, "y": 0}, label="Core L3 Switch",
                      config={"name": "Core L3 Switch", "interfaces": [{"id": "vlan10", "name": "VLAN 10", "ip_address": "10.0.10.1", "cidr_prefix": "24", "enabled": True}]}),
            GraphNode(id="web1", type="web_server", position={"x": 100, "y": 0}, label="Web Server",
                      config={"name": "Web Server", "ip_address": "10.0.10.10", "cidr_prefix": "24", "default_gateway": "10.0.10.1"}),
            GraphNode(id="dns1", type="dns_server", position={"x": 200, "y": 0}, label="DNS Server",
                      config={"name": "DNS Server", "ip_address": "10.0.10.20", "cidr_prefix": "24", "default_gateway": "10.0.10.1"}),
            GraphNode(id="ids1", type="ids_ips", position={"x": 150, "y": 100}, label="Sensor 1",
                      config={"name": "Sensor 1", "mode": "ips", "ip_address": "10.0.10.5", "cidr_prefix": "24"}),
        ],
        edges=[
            GraphEdge(id="e1", source="l3sw", target="web1", relationship_type="connects"),
            GraphEdge(id="e2", source="l3sw", target="dns1", relationship_type="connects"),
            GraphEdge(id="e3", source="l3sw", target="ids1", relationship_type="connects"),
        ],
    )
    result = validate_topology(g)
    assert result.valid is True
    assert len(result.errors) == 0
