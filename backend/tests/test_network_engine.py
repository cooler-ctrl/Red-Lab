"""
Tests for the v1.1 Network Engine (topology validation, connectivity, simulator)
and Scenario Engine (assessment logic).
"""
from __future__ import annotations

import pytest
from app.schemas.lab import GraphData, GraphNode, GraphEdge
from app.network_engine.topology import validate_topology
from app.network_engine.connectivity import evaluate_connectivity
from app.network_engine.simulator import simulate_ping, simulate_topology, simulate_port_scan
from app.scenarios.definitions import get_all_scenarios, get_scenario, assess_scenario


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_pc(node_id: str, label: str, ip: str, prefix: str = "24", gateway: str = "") -> GraphNode:
    return GraphNode(
        id=node_id, type="pc", position={"x": 0, "y": 0}, label=label,
        config={
            "name": label,
            "interfaces": [{"id": "eth0", "name": "eth0", "ip_address": ip, "cidr_prefix": prefix, "enabled": True}],
            "default_gateway": gateway, "dns_servers": [],
        }
    )


def _make_server(node_id: str, label: str, ip: str, prefix: str = "24", gateway: str = "") -> GraphNode:
    return GraphNode(
        id=node_id, type="server", position={"x": 0, "y": 0}, label=label,
        config={"name": label, "ip_address": ip, "cidr_prefix": prefix, "default_gateway": gateway, "services": []},
    )


def _make_switch(node_id: str, label: str = "Switch") -> GraphNode:
    return GraphNode(id=node_id, type="switch", position={"x": 0, "y": 0}, label=label,
                     config={"name": label, "ports": [], "default_vlan": 1})


def _make_router(node_id: str, label: str, interfaces: list[dict]) -> GraphNode:
    return GraphNode(id=node_id, type="router", position={"x": 0, "y": 0}, label=label,
                     config={"name": label, "interfaces": interfaces, "static_routes": [], "nat_enabled": False})


def _make_firewall(node_id: str, label: str, ip: str, prefix: str = "24",
                   inbound_rules: list[dict] | None = None,
                   default_inbound: str = "allow") -> GraphNode:
    return GraphNode(
        id=node_id, type="firewall", position={"x": 0, "y": 0}, label=label,
        config={
            "name": label, "ip_address": ip, "cidr_prefix": prefix, "default_gateway": "",
            "inbound_rules": inbound_rules or [],
            "outbound_rules": [],
            "default_inbound_action": default_inbound,
            "default_outbound_action": "allow",
        }
    )


def _edge(eid: str, src: str, tgt: str) -> GraphEdge:
    return GraphEdge(id=eid, source=src, target=tgt, relationship_type="connects", metadata={})


# ===========================================================================
# Topology Validation Tests
# ===========================================================================

class TestTopologyValidation:

    def test_valid_empty_topology_passes(self):
        g = GraphData(nodes=[], edges=[])
        r = validate_topology(g)
        assert r.valid is True
        assert r.errors == []

    def test_valid_two_pcs_on_switch(self):
        g = GraphData(
            nodes=[
                _make_pc("pc1", "PC-A", "192.168.1.10"),
                _make_pc("pc2", "PC-B", "192.168.1.20"),
                _make_switch("sw1"),
            ],
            edges=[_edge("e1", "pc1", "sw1"), _edge("e2", "pc2", "sw1")],
        )
        r = validate_topology(g)
        assert r.valid is True

    def test_duplicate_node_id_rejected(self):
        g = GraphData(
            nodes=[_make_pc("pc1", "PC-A", "192.168.1.10"), _make_pc("pc1", "PC-B", "192.168.1.20")],
            edges=[],
        )
        r = validate_topology(g)
        assert r.valid is False
        codes = [e.code for e in r.errors]
        assert "DUPLICATE_NODE_ID" in codes

    def test_invalid_ip_address_rejected(self):
        g = GraphData(
            nodes=[_make_pc("pc1", "PC-A", "999.999.999.999")],
            edges=[],
        )
        r = validate_topology(g)
        assert r.valid is False
        codes = [e.code for e in r.errors]
        assert "INVALID_IP_ADDRESS" in codes

    def test_invalid_prefix_rejected(self):
        g = GraphData(
            nodes=[GraphNode(id="pc1", type="pc", position={"x": 0, "y": 0}, label="PC-1",
                             config={"name": "PC-1", "interfaces": [{"id": "eth0", "name": "eth0", "ip_address": "192.168.1.10", "cidr_prefix": "99", "enabled": True}]})],
            edges=[],
        )
        r = validate_topology(g)
        assert r.valid is False
        codes = [e.code for e in r.errors]
        assert "INVALID_PREFIX" in codes

    def test_edge_missing_source_rejected(self):
        g = GraphData(
            nodes=[_make_pc("pc1", "PC-A", "192.168.1.10")],
            edges=[_edge("e1", "nonexistent-node", "pc1")],
        )
        r = validate_topology(g)
        assert r.valid is False
        codes = [e.code for e in r.errors]
        assert "MISSING_EDGE_SOURCE" in codes

    def test_edge_missing_target_rejected(self):
        g = GraphData(
            nodes=[_make_pc("pc1", "PC-A", "192.168.1.10")],
            edges=[_edge("e1", "pc1", "nonexistent-target")],
        )
        r = validate_topology(g)
        assert r.valid is False
        codes = [e.code for e in r.errors]
        assert "MISSING_EDGE_TARGET" in codes

    def test_unsupported_device_type_rejected(self):
        g = GraphData(
            nodes=[GraphNode(id="x1", type="alien_device", position={"x": 0, "y": 0}, label="X", config={})],
            edges=[],
        )
        r = validate_topology(g)
        assert r.valid is False
        codes = [e.code for e in r.errors]
        assert "UNSUPPORTED_DEVICE_TYPE" in codes

    def test_invalid_gateway_rejected(self):
        g = GraphData(
            nodes=[_make_pc("pc1", "PC-A", "192.168.1.10", gateway="not-an-ip")],
            edges=[],
        )
        r = validate_topology(g)
        assert r.valid is False
        codes = [e.code for e in r.errors]
        assert "INVALID_GATEWAY" in codes

    def test_isolated_device_produces_warning_not_error(self):
        g = GraphData(
            nodes=[
                _make_pc("pc1", "PC-A", "192.168.1.10"),
                _make_pc("pc2", "PC-B", "192.168.1.20"),
            ],
            edges=[],  # No connections
        )
        r = validate_topology(g)
        # Isolated devices are warnings, not hard errors
        assert r.valid is True
        codes = [w.code for w in r.warnings]
        assert "ISOLATED_DEVICE" in codes

    def test_invalid_server_port_rejected(self):
        g = GraphData(
            nodes=[GraphNode(
                id="srv1", type="server", position={"x": 0, "y": 0}, label="Server",
                config={"name": "Server", "ip_address": "10.0.0.1", "cidr_prefix": "24",
                        "default_gateway": "", "services": [{"name": "Bad", "port": 99999, "protocol": "tcp", "enabled": True}]},
            )],
            edges=[],
        )
        r = validate_topology(g)
        assert r.valid is False
        codes = [e.code for e in r.errors]
        assert "INVALID_PORT" in codes


# ===========================================================================
# Connectivity Evaluation Tests
# ===========================================================================

class TestConnectivity:

    def test_same_subnet_direct_reachable(self):
        g = GraphData(
            nodes=[_make_pc("pc1", "PC-A", "192.168.1.10"), _make_pc("pc2", "PC-B", "192.168.1.20")],
            edges=[_edge("e1", "pc1", "pc2")],
        )
        r = evaluate_connectivity(g, "pc1", "pc2")
        assert r.reachable is True

    def test_same_subnet_via_switch_reachable(self):
        g = GraphData(
            nodes=[_make_pc("pc1", "PC-A", "192.168.1.10"), _make_pc("pc2", "PC-B", "192.168.1.20"), _make_switch("sw1")],
            edges=[_edge("e1", "pc1", "sw1"), _edge("e2", "pc2", "sw1")],
        )
        r = evaluate_connectivity(g, "pc1", "pc2")
        assert r.reachable is True
        assert "sw1" in r.path or "Switch" in r.path_labels

    def test_different_subnet_without_router_unreachable(self):
        g = GraphData(
            nodes=[_make_pc("pc1", "PC-A", "192.168.1.10"), _make_pc("pc2", "PC-B", "10.0.0.10")],
            edges=[_edge("e1", "pc1", "pc2")],
        )
        r = evaluate_connectivity(g, "pc1", "pc2")
        assert r.reachable is False
        assert "subnet" in r.reason.lower() or "router" in r.reason.lower()

    def test_cross_subnet_via_router_with_gateway_reachable(self):
        g = GraphData(
            nodes=[
                _make_pc("pc1", "PC-A", "192.168.1.10", gateway="192.168.1.1"),
                _make_switch("sw1"),
                _make_router("r1", "Router", [
                    {"id": "eth0", "name": "eth0", "ip_address": "192.168.1.1", "cidr_prefix": "24", "enabled": True},
                    {"id": "eth1", "name": "eth1", "ip_address": "10.0.0.1", "cidr_prefix": "24", "enabled": True},
                ]),
                _make_server("srv1", "Server", "10.0.0.10", gateway="10.0.0.1"),
            ],
            edges=[
                _edge("e1", "pc1", "sw1"),
                _edge("e2", "sw1", "r1"),
                _edge("e3", "r1", "srv1"),
            ],
        )
        r = evaluate_connectivity(g, "pc1", "srv1")
        assert r.reachable is True
        assert "r1" in r.path

    def test_cross_subnet_missing_gateway_unreachable(self):
        g = GraphData(
            nodes=[
                _make_pc("pc1", "PC-A", "192.168.1.10", gateway=""),  # No gateway
                _make_switch("sw1"),
                _make_router("r1", "Router", [
                    {"id": "eth0", "name": "eth0", "ip_address": "192.168.1.1", "cidr_prefix": "24", "enabled": True},
                    {"id": "eth1", "name": "eth1", "ip_address": "10.0.0.1", "cidr_prefix": "24", "enabled": True},
                ]),
                _make_server("srv1", "Server", "10.0.0.10", gateway="10.0.0.1"),
            ],
            edges=[
                _edge("e1", "pc1", "sw1"),
                _edge("e2", "sw1", "r1"),
                _edge("e3", "r1", "srv1"),
            ],
        )
        r = evaluate_connectivity(g, "pc1", "srv1")
        assert r.reachable is False
        assert "gateway" in r.reason.lower()

    def test_wrong_gateway_unreachable(self):
        g = GraphData(
            nodes=[
                _make_pc("pc1", "PC-A", "192.168.1.10", gateway="192.168.1.99"),  # Wrong GW
                _make_switch("sw1"),
                _make_router("r1", "Router", [
                    {"id": "eth0", "name": "eth0", "ip_address": "192.168.1.1", "cidr_prefix": "24", "enabled": True},
                    {"id": "eth1", "name": "eth1", "ip_address": "10.0.0.1", "cidr_prefix": "24", "enabled": True},
                ]),
                _make_server("srv1", "Server", "10.0.0.10", gateway="10.0.0.1"),
            ],
            edges=[
                _edge("e1", "pc1", "sw1"),
                _edge("e2", "sw1", "r1"),
                _edge("e3", "r1", "srv1"),
            ],
        )
        r = evaluate_connectivity(g, "pc1", "srv1")
        assert r.reachable is False
        assert "gateway" in r.reason.lower() or "192.168.1.99" in r.reason

    def test_firewall_deny_rule_blocks_traffic(self):
        fw = _make_firewall(
            "fw1", "Firewall", "10.0.0.1",
            inbound_rules=[
                {"id": "r1", "priority": 10, "action": "deny", "protocol": "tcp",
                 "source": "any", "destination": "any", "port_range": "22", "description": "Block SSH", "enabled": True},
            ],
            default_inbound="allow",
        )
        g = GraphData(
            nodes=[
                _make_pc("pc1", "PC-A", "10.0.0.20", gateway="10.0.0.1"),
                fw,
                _make_server("srv1", "Server", "10.0.0.10", gateway="10.0.0.1"),
            ],
            edges=[
                _edge("e1", "pc1", "fw1"),
                _edge("e2", "fw1", "srv1"),
            ],
        )
        r = evaluate_connectivity(g, "pc1", "srv1", protocol="tcp", port=22)
        assert r.reachable is False
        assert r.blocked_by == "fw1"

    def test_firewall_allow_rule_permits_http(self):
        fw = _make_firewall(
            "fw1", "Firewall", "10.0.0.1",
            inbound_rules=[
                {"id": "r1", "priority": 10, "action": "allow", "protocol": "tcp",
                 "source": "any", "destination": "any", "port_range": "80", "description": "Allow HTTP", "enabled": True},
            ],
            default_inbound="deny",
        )
        g = GraphData(
            nodes=[
                _make_pc("pc1", "PC-A", "10.0.0.20"),
                fw,
                _make_server("srv1", "Server", "10.0.0.10", gateway="10.0.0.1"),
            ],
            edges=[
                _edge("e1", "pc1", "fw1"),
                _edge("e2", "fw1", "srv1"),
            ],
        )
        r = evaluate_connectivity(g, "pc1", "srv1", protocol="tcp", port=80)
        assert r.reachable is True


# ===========================================================================
# Simulator Tests
# ===========================================================================

class TestSimulator:

    def test_ping_reachable_generates_events(self):
        g = GraphData(
            nodes=[_make_pc("pc1", "PC-A", "192.168.1.10"), _make_pc("pc2", "PC-B", "192.168.1.20")],
            edges=[_edge("e1", "pc1", "pc2")],
        )
        events = simulate_ping(g, "run-test", "pc1", "pc2")
        types = [e.event_type for e in events]
        assert "icmp_request" in types
        assert "icmp_reply" in types
        # All events are labelled as simulated
        assert all(e.provenance == "simulated" for e in events)

    def test_ping_unreachable_generates_unreachable_event(self):
        g = GraphData(
            nodes=[_make_pc("pc1", "PC-A", "192.168.1.10"), _make_pc("pc2", "PC-B", "10.0.0.10")],
            edges=[_edge("e1", "pc1", "pc2")],
        )
        events = simulate_ping(g, "run-test", "pc1", "pc2")
        types = [e.event_type for e in events]
        assert "icmp_request" in types
        assert "icmp_unreachable" in types or "firewall_deny" in types
        assert "icmp_reply" not in types

    def test_full_topology_simulation_returns_summary(self):
        from app.schemas.lab import TopologyValidationResult
        g = GraphData(
            nodes=[
                _make_pc("pc1", "PC-A", "192.168.1.10"),
                _make_pc("pc2", "PC-B", "192.168.1.20"),
                _make_switch("sw1"),
            ],
            edges=[_edge("e1", "pc1", "sw1"), _edge("e2", "pc2", "sw1")],
        )
        validation = TopologyValidationResult(valid=True)
        events, summary = simulate_topology(g, "run-001", validation)
        assert len(events) > 0
        assert "pairs_tested" in summary
        assert summary["pairs_tested"] == 1
        assert summary["reachable_pairs"] == 1

    def test_port_scan_discovers_open_service(self):
        g = GraphData(
            nodes=[
                _make_pc("pc1", "Attacker-PC", "192.168.1.10"),
                _make_server("srv1", "Web-Server", "192.168.1.20"),
            ],
            edges=[_edge("e1", "pc1", "srv1")],
        )
        # Enable HTTP port 80 on server
        g.nodes[1].config["services"] = [
            {"name": "HTTP", "port": 80, "protocol": "tcp", "enabled": True}
        ]
        events = simulate_port_scan(g, "run-scan-1", "pc1", "srv1", ports=[80, 22])
        types = [e.event_type for e in events]
        assert "port_scan_start" in types
        assert "port_scan_open" in types
        assert "port_scan_closed" in types
        assert "port_scan_complete" in types

        open_events = [e for e in events if e.event_type == "port_scan_open"]
        assert len(open_events) == 1
        assert open_events[0].detail["port"] == 80
        assert open_events[0].detail["service"] == "HTTP"

    def test_port_scan_filtered_by_firewall(self):
        fw = _make_firewall(
            "fw1", "Edge-FW", "10.0.0.1",
            inbound_rules=[{"id": "r1", "action": "deny", "protocol": "tcp", "port_range": "22", "source": "any", "enabled": True}],
            default_inbound="allow",
        )
        g = GraphData(
            nodes=[
                _make_pc("pc1", "Scanner", "10.0.0.20"),
                fw,
                _make_server("srv1", "Target", "10.0.0.10", gateway="10.0.0.1"),
            ],
            edges=[_edge("e1", "pc1", "fw1"), _edge("e2", "fw1", "srv1")],
        )
        events = simulate_port_scan(g, "run-scan-2", "pc1", "srv1", ports=[22])
        types = [e.event_type for e in events]
        assert "port_scan_filtered" in types


# ===========================================================================
# API Tests — Runs and Scenarios
# ===========================================================================

class TestRunsAPI:

    def test_validate_topology_endpoint(self, client):
        # First create a lab
        res = client.post("/api/labs", json={"name": "Net Lab", "description": "", "graph_data": {"nodes": [], "edges": []}})
        assert res.status_code == 201
        lab_id = res.json()["id"]

        res = client.post(f"/api/labs/{lab_id}/validate")
        assert res.status_code == 200
        data = res.json()
        assert "valid" in data
        assert "errors" in data

    def test_create_simulator_run(self, client):
        # Create a lab with a simple network topology
        lab_payload = {
            "name": "Sim Test Lab",
            "graph_data": {
                "nodes": [
                    {"id": "pc1", "type": "pc", "position": {"x": 0, "y": 0}, "label": "PC-A",
                     "config": {"name": "PC-A", "interfaces": [{"id": "eth0", "name": "eth0", "ip_address": "192.168.1.10", "cidr_prefix": "24", "enabled": True}], "default_gateway": "", "dns_servers": []}},
                    {"id": "pc2", "type": "pc", "position": {"x": 200, "y": 0}, "label": "PC-B",
                     "config": {"name": "PC-B", "interfaces": [{"id": "eth0", "name": "eth0", "ip_address": "192.168.1.20", "cidr_prefix": "24", "enabled": True}], "default_gateway": "", "dns_servers": []}},
                    {"id": "sw1", "type": "switch", "position": {"x": 100, "y": 100}, "label": "SW1",
                     "config": {"name": "SW1", "ports": [], "default_vlan": 1}},
                ],
                "edges": [
                    {"id": "e1", "source": "pc1", "target": "sw1", "relationship_type": "connects", "metadata": {}},
                    {"id": "e2", "source": "pc2", "target": "sw1", "relationship_type": "connects", "metadata": {}},
                ],
            },
        }
        res = client.post("/api/labs", json=lab_payload)
        assert res.status_code == 201
        lab_id = res.json()["id"]

        # Start a simulation run
        run_res = client.post(f"/api/labs/{lab_id}/runs", json={"mode": "simulator"})
        assert run_res.status_code == 201
        run_data = run_res.json()
        assert run_data["status"] in ("completed", "failed")
        assert run_data["mode"] == "simulator"

    def test_real_lab_mode_returns_503(self, client):
        res = client.post("/api/labs", json={"name": "RL Test", "graph_data": {"nodes": [], "edges": []}})
        lab_id = res.json()["id"]
        run_res = client.post(f"/api/labs/{lab_id}/runs", json={"mode": "real_lab"})
        assert run_res.status_code == 503

    def test_get_run_events(self, client):
        lab_payload = {
            "name": "Events Test Lab",
            "graph_data": {
                "nodes": [
                    {"id": "pc1", "type": "pc", "position": {"x": 0, "y": 0}, "label": "PC-A",
                     "config": {"name": "PC-A", "interfaces": [{"id": "eth0", "name": "eth0", "ip_address": "192.168.1.10", "cidr_prefix": "24", "enabled": True}], "default_gateway": "", "dns_servers": []}},
                ],
                "edges": [],
            },
        }
        res = client.post("/api/labs", json=lab_payload)
        lab_id = res.json()["id"]
        run_res = client.post(f"/api/labs/{lab_id}/runs", json={"mode": "simulator"})
        run_id = run_res.json()["id"]

        events_res = client.get(f"/api/runs/{run_id}/events")
        assert events_res.status_code == 200
        assert isinstance(events_res.json(), list)

    def test_ping_endpoint(self, client):
        lab_payload = {
            "name": "Ping Test Lab",
            "graph_data": {
                "nodes": [
                    {"id": "pc1", "type": "pc", "position": {"x": 0, "y": 0}, "label": "PC-A",
                     "config": {"name": "PC-A", "interfaces": [{"id": "eth0", "name": "eth0", "ip_address": "192.168.1.10", "cidr_prefix": "24", "enabled": True}], "default_gateway": "", "dns_servers": []}},
                    {"id": "pc2", "type": "pc", "position": {"x": 100, "y": 0}, "label": "PC-B",
                     "config": {"name": "PC-B", "interfaces": [{"id": "eth0", "name": "eth0", "ip_address": "192.168.1.20", "cidr_prefix": "24", "enabled": True}], "default_gateway": "", "dns_servers": []}},
                ],
                "edges": [{"id": "e1", "source": "pc1", "target": "pc2", "relationship_type": "connects", "metadata": {}}],
            },
        }
        res = client.post("/api/labs", json=lab_payload)
        lab_id = res.json()["id"]
        ping_res = client.post(f"/api/labs/{lab_id}/ping", json={"source_id": "pc1", "dest_id": "pc2"})
        assert ping_res.status_code == 200
        events = ping_res.json()
        types = [e["event_type"] for e in events]
        assert "icmp_request" in types
        assert "icmp_reply" in types

    def test_port_scan_endpoint(self, client):
        lab_payload = {
            "name": "Port Scan Test Lab",
            "graph_data": {
                "nodes": [
                    {"id": "pc1", "type": "pc", "position": {"x": 0, "y": 0}, "label": "Attacker",
                     "config": {"name": "Attacker", "interfaces": [{"id": "eth0", "name": "eth0", "ip_address": "192.168.1.10", "cidr_prefix": "24", "enabled": True}], "default_gateway": ""}},
                    {"id": "srv1", "type": "server", "position": {"x": 100, "y": 0}, "label": "Target",
                     "config": {"name": "Target", "ip_address": "192.168.1.50", "cidr_prefix": "24", "default_gateway": "", "services": [{"name": "SSH", "port": 22, "protocol": "tcp", "enabled": True}]}},
                ],
                "edges": [{"id": "e1", "source": "pc1", "target": "srv1", "relationship_type": "connects", "metadata": {}}],
            },
        }
        res = client.post("/api/labs", json=lab_payload)
        lab_id = res.json()["id"]
        scan_res = client.post(f"/api/labs/{lab_id}/port-scan", json={"source_id": "pc1", "dest_id": "srv1", "ports": [22, 80]})
        assert scan_res.status_code == 200
        events = scan_res.json()
        types = [e["event_type"] for e in events]
        assert "port_scan_start" in types
        assert "port_scan_open" in types
        assert "port_scan_closed" in types
        assert "port_scan_complete" in types


class TestScenariosAPI:

    def test_list_scenarios_returns_three(self, client):
        res = client.get("/api/scenarios")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 3
        ids = [s["id"] for s in data]
        assert "basic_connectivity" in ids
        assert "firewall_defense" in ids
        assert "network_troubleshoot" in ids

    def test_get_scenario_detail(self, client):
        res = client.get("/api/scenarios/basic_connectivity")
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == "basic_connectivity"
        assert len(data["objectives"]) > 0

    def test_start_scenario_creates_lab_and_run(self, client):
        res = client.post("/api/scenarios/basic_connectivity/start")
        assert res.status_code == 201
        data = res.json()
        assert "lab_id" in data
        assert "run_id" in data
        assert data["scenario_id"] == "basic_connectivity"

    def test_assess_run(self, client):
        # Start the scenario which creates lab + run
        start_res = client.post("/api/scenarios/basic_connectivity/start")
        assert start_res.status_code == 201
        run_id = start_res.json()["run_id"]

        # Assess the run (initial topology should meet first objective at least)
        assess_res = client.post(f"/api/runs/{run_id}/assess", json={"answers": {}})
        assert assess_res.status_code == 200
        data = assess_res.json()
        assert "score" in data
        assert "passed" in data
        assert "objectives_met" in data
        assert "explanation" in data

    def test_unknown_scenario_returns_404(self, client):
        res = client.get("/api/scenarios/does_not_exist")
        assert res.status_code == 404


# ===========================================================================
# Scenario Assessment Unit Tests
# ===========================================================================

class TestScenarioAssessment:

    def test_basic_connectivity_same_subnet_passes(self):
        g = GraphData(
            nodes=[
                _make_pc("pc1", "PC-A", "192.168.1.10"),
                _make_pc("pc2", "PC-B", "192.168.1.20"),
                _make_switch("sw1"),
            ],
            edges=[_edge("e1", "pc1", "sw1"), _edge("e2", "pc2", "sw1")],
        )
        result = assess_scenario("basic_connectivity", g, {"run_id": "test"})
        assert "obj_same_subnet" in result["objectives_met"]

    def test_firewall_defense_ssh_block_passes(self):
        from app.schemas.lab import GraphNode
        g = GraphData(
            nodes=[
                GraphNode(id="ext", type="external_network", position={"x": 0, "y": 0}, label="Internet",
                          config={"name": "Internet", "description": "", "cidr_block": "0.0.0.0/0"}),
                _make_firewall("fw1", "Firewall", "10.0.0.1",
                               inbound_rules=[
                                   {"id": "r1", "priority": 10, "action": "deny", "protocol": "tcp",
                                    "source": "any", "destination": "any", "port_range": "22",
                                    "description": "Block SSH", "enabled": True},
                               ], default_inbound="allow"),
                _make_server("srv1", "Server", "10.0.0.10", gateway="10.0.0.1"),
                _make_pc("pc1", "PC", "10.0.0.20", gateway="10.0.0.1"),
            ],
            edges=[
                _edge("e1", "ext", "fw1"),
                _edge("e2", "fw1", "srv1"),
                _edge("e3", "fw1", "pc1"),
            ],
        )
        result = assess_scenario("firewall_defense", g, {"run_id": "test"})
        assert "obj_add_rule" in result["objectives_met"]
        assert "obj_verify_block" in result["objectives_met"]

    def test_firewall_defense_no_ssh_rule_fails(self):
        from app.schemas.lab import GraphNode
        g = GraphData(
            nodes=[
                GraphNode(id="ext", type="external_network", position={"x": 0, "y": 0}, label="Internet",
                          config={"name": "Internet", "description": "", "cidr_block": "0.0.0.0/0"}),
                _make_firewall("fw1", "Firewall", "10.0.0.1", inbound_rules=[], default_inbound="allow"),
                _make_server("srv1", "Server", "10.0.0.10"),
            ],
            edges=[_edge("e1", "ext", "fw1"), _edge("e2", "fw1", "srv1")],
        )
        result = assess_scenario("firewall_defense", g, {"run_id": "test"})
        assert "obj_add_rule" in result["objectives_failed"]

    def test_troubleshoot_fixed_topology_passes(self):
        g = GraphData(
            nodes=[
                _make_pc("pc1", "PC-A", "192.168.1.10", gateway="192.168.1.1"),  # CORRECT gateway
                _make_switch("sw1"),
                _make_router("r1", "Router", [
                    {"id": "eth0", "name": "eth0", "ip_address": "192.168.1.1", "cidr_prefix": "24", "enabled": True},
                    {"id": "eth1", "name": "eth1", "ip_address": "10.0.0.1", "cidr_prefix": "24", "enabled": True},
                ]),
                _make_server("srv1", "Server", "10.0.0.10", gateway="10.0.0.1"),
            ],
            edges=[
                _edge("e1", "pc1", "sw1"),
                _edge("e2", "sw1", "r1"),
                _edge("e3", "r1", "srv1"),
            ],
        )
        result = assess_scenario("network_troubleshoot", g, {"run_id": "test"})
        assert "obj_verify" in result["objectives_met"]
        assert result["passed"] is True

    def test_troubleshoot_broken_topology_fails(self):
        g = GraphData(
            nodes=[
                _make_pc("pc1", "PC-A", "192.168.1.10", gateway="192.168.1.99"),  # WRONG gateway
                _make_switch("sw1"),
                _make_router("r1", "Router", [
                    {"id": "eth0", "name": "eth0", "ip_address": "192.168.1.1", "cidr_prefix": "24", "enabled": True},
                    {"id": "eth1", "name": "eth1", "ip_address": "10.0.0.1", "cidr_prefix": "24", "enabled": True},
                ]),
                _make_server("srv1", "Server", "10.0.0.10", gateway="10.0.0.1"),
            ],
            edges=[
                _edge("e1", "pc1", "sw1"),
                _edge("e2", "sw1", "r1"),
                _edge("e3", "r1", "srv1"),
            ],
        )
        result = assess_scenario("network_troubleshoot", g, {"run_id": "test"})
        assert "obj_fix" in result["objectives_failed"]
        assert result["passed"] is False
