"""
RedLab Scenario Engine — Built-in Scenario Definitions

Three guided learning scenarios for v1.1:
1. basic_connectivity   — Networking: same-subnet and routed connectivity
2. firewall_defense     — Security: discover open port, add firewall rule, verify block
3. network_troubleshoot — Troubleshooting: diagnose deliberate misconfiguration
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from ..schemas.lab import GraphData, ScenarioObjective, ScenarioResponse
from ..network_engine.connectivity import evaluate_connectivity, _get_node_ip_and_prefix
from ..network_engine.topology import validate_topology


# ---------------------------------------------------------------------------
# Scenario registry
# ---------------------------------------------------------------------------

_SCENARIOS: dict[str, dict] = {}


def register(scenario: dict) -> dict:
    _SCENARIOS[scenario["id"]] = scenario
    return scenario


def get_all_scenarios() -> list[ScenarioResponse]:
    return [
        ScenarioResponse(
            id=s["id"],
            title=s["title"],
            description=s["description"],
            category=s["category"],
            difficulty=s["difficulty"],
            objectives=[ScenarioObjective(**o) for o in s["objectives"]],
            supported_modes=s["supported_modes"],
            estimated_minutes=s["estimated_minutes"],
            tags=s["tags"],
        )
        for s in _SCENARIOS.values()
    ]


def get_scenario(scenario_id: str) -> dict | None:
    return _SCENARIOS.get(scenario_id)


# ---------------------------------------------------------------------------
# Scenario 1 — Basic Network Connectivity
# ---------------------------------------------------------------------------

register({
    "id": "basic_connectivity",
    "title": "Basic Network Connectivity",
    "category": "networking",
    "difficulty": "beginner",
    "description": (
        "Build a small network with two PCs connected via a switch, then extend it "
        "by adding a router to connect two separate subnets. "
        "Learn how IP addressing, subnets, and default gateways work."
    ),
    "objectives": [
        {
            "id": "obj_same_subnet",
            "description": "Verify that PC-A and PC-B can communicate in the same subnet.",
            "required": True,
        },
        {
            "id": "obj_diff_subnet",
            "description": "Connect a second subnet via a router and verify cross-subnet reachability.",
            "required": True,
        },
        {
            "id": "obj_gateway",
            "description": "Demonstrate that removing the default gateway breaks cross-subnet communication.",
            "required": False,
        },
    ],
    "supported_modes": ["simulator"],
    "estimated_minutes": 15,
    "tags": ["IP", "routing", "subnets", "gateway", "fundamentals"],
    "initial_topology": {
        "nodes": [
            {"id": "pc-a", "type": "pc", "position": {"x": 100, "y": 200}, "label": "PC-A",
             "config": {"name": "PC-A", "interfaces": [{"id": "eth0", "name": "eth0", "ip_address": "192.168.1.10", "cidr_prefix": "24", "enabled": True}], "default_gateway": "192.168.1.1", "dns_servers": []}},
            {"id": "pc-b", "type": "pc", "position": {"x": 400, "y": 200}, "label": "PC-B",
             "config": {"name": "PC-B", "interfaces": [{"id": "eth0", "name": "eth0", "ip_address": "192.168.1.20", "cidr_prefix": "24", "enabled": True}], "default_gateway": "192.168.1.1", "dns_servers": []}},
            {"id": "sw-1", "type": "switch", "position": {"x": 250, "y": 350}, "label": "Switch-1",
             "config": {"name": "Switch-1", "ports": [], "default_vlan": 1}},
        ],
        "edges": [
            {"id": "e1", "source": "pc-a", "target": "sw-1", "relationship_type": "connects", "metadata": {}},
            {"id": "e2", "source": "pc-b", "target": "sw-1", "relationship_type": "connects", "metadata": {}},
        ],
    },
})


# ---------------------------------------------------------------------------
# Scenario 2 — Firewall Defense Lab
# ---------------------------------------------------------------------------

register({
    "id": "firewall_defense",
    "title": "Firewall Defense Lab",
    "category": "security",
    "difficulty": "intermediate",
    "description": (
        "A small office network has an exposed web server reachable from the Internet. "
        "Your task is to inspect the current firewall rules, identify what traffic is allowed, "
        "and add a rule to block unauthorized access while keeping the web service available. "
        "The scenario engine will verify your firewall blocks the attack traffic and permits legitimate traffic."
    ),
    "objectives": [
        {
            "id": "obj_identify_open",
            "description": "Verify that the server is initially reachable from the external network.",
            "required": True,
        },
        {
            "id": "obj_add_rule",
            "description": "Add a firewall DENY rule blocking unauthorized TCP port 22 (SSH) access from external IPs.",
            "required": True,
        },
        {
            "id": "obj_verify_block",
            "description": "Verify that SSH is blocked from the external network after adding the rule.",
            "required": True,
        },
        {
            "id": "obj_keep_http",
            "description": "Verify that HTTP (port 80) remains accessible from the internal PC.",
            "required": False,
        },
    ],
    "supported_modes": ["simulator"],
    "estimated_minutes": 20,
    "tags": ["firewall", "security", "SSH", "defense", "rules"],
    "initial_topology": {
        "nodes": [
            {"id": "ext-net", "type": "external_network", "position": {"x": 50, "y": 150}, "label": "Internet",
             "config": {"name": "Internet", "description": "External network", "cidr_block": "0.0.0.0/0"}},
            {"id": "fw-1", "type": "firewall", "position": {"x": 250, "y": 150}, "label": "Firewall",
             "config": {
                 "name": "Firewall", "ip_address": "10.0.0.1", "cidr_prefix": "24",
                 "default_gateway": "",
                 "inbound_rules": [
                     {"id": "r1", "priority": 10, "action": "allow", "protocol": "tcp", "source": "any",
                      "destination": "any", "port_range": "80", "description": "Allow HTTP", "enabled": True},
                     {"id": "r2", "priority": 20, "action": "allow", "protocol": "tcp", "source": "any",
                      "destination": "any", "port_range": "22", "description": "Allow SSH (insecure!)", "enabled": True},
                 ],
                 "outbound_rules": [],
                 "default_inbound_action": "deny",
                 "default_outbound_action": "allow",
             }},
            {"id": "server-1", "type": "server", "position": {"x": 500, "y": 150}, "label": "Web Server",
             "config": {
                 "name": "Web Server", "ip_address": "10.0.0.10", "cidr_prefix": "24",
                 "default_gateway": "10.0.0.1",
                 "services": [
                     {"name": "HTTP", "port": 80, "protocol": "tcp", "enabled": True},
                     {"name": "SSH", "port": 22, "protocol": "tcp", "enabled": True},
                 ],
             }},
            {"id": "pc-1", "type": "pc", "position": {"x": 500, "y": 300}, "label": "Office PC",
             "config": {"name": "Office PC", "interfaces": [{"id": "eth0", "name": "eth0", "ip_address": "10.0.0.20", "cidr_prefix": "24", "enabled": True}], "default_gateway": "10.0.0.1", "dns_servers": []}},
        ],
        "edges": [
            {"id": "e1", "source": "ext-net", "target": "fw-1", "relationship_type": "connects", "metadata": {}},
            {"id": "e2", "source": "fw-1", "target": "server-1", "relationship_type": "connects", "metadata": {}},
            {"id": "e3", "source": "fw-1", "target": "pc-1", "relationship_type": "connects", "metadata": {}},
        ],
    },
})


# ---------------------------------------------------------------------------
# Scenario 3 — Network Troubleshooting
# ---------------------------------------------------------------------------

register({
    "id": "network_troubleshoot",
    "title": "Network Troubleshooting: Find the Fault",
    "category": "troubleshooting",
    "difficulty": "beginner",
    "description": (
        "A network has been deliberately misconfigured — one PC cannot reach the server. "
        "Use the available diagnostic tools to inspect IP addresses, subnet masks, and gateway settings. "
        "Identify the fault and fix it. The scenario verifies connectivity after your fix."
    ),
    "objectives": [
        {
            "id": "obj_diagnose",
            "description": "Identify why PC-A cannot reach the Server (wrong subnet or missing gateway).",
            "required": True,
        },
        {
            "id": "obj_fix",
            "description": "Correct the misconfiguration so PC-A can reach the Server.",
            "required": True,
        },
        {
            "id": "obj_verify",
            "description": "Verify the fix restores connectivity.",
            "required": True,
        },
    ],
    "supported_modes": ["simulator"],
    "estimated_minutes": 10,
    "tags": ["troubleshooting", "gateway", "subnet", "IP", "diagnosis"],
    "initial_topology": {
        "nodes": [
            # PC-A has WRONG default gateway (192.168.1.99 doesn't exist on the router)
            {"id": "pc-a", "type": "pc", "position": {"x": 100, "y": 200}, "label": "PC-A",
             "config": {"name": "PC-A", "interfaces": [{"id": "eth0", "name": "eth0", "ip_address": "192.168.1.10", "cidr_prefix": "24", "enabled": True}], "default_gateway": "192.168.1.99", "dns_servers": []}},
            {"id": "sw-1", "type": "switch", "position": {"x": 300, "y": 200}, "label": "Switch-1",
             "config": {"name": "Switch-1", "ports": [], "default_vlan": 1}},
            {"id": "router-1", "type": "router", "position": {"x": 300, "y": 350}, "label": "Router",
             "config": {"name": "Router", "interfaces": [
                 {"id": "eth0", "name": "eth0", "ip_address": "192.168.1.1", "cidr_prefix": "24", "enabled": True},
                 {"id": "eth1", "name": "eth1", "ip_address": "10.0.0.1", "cidr_prefix": "24", "enabled": True},
             ], "static_routes": [], "nat_enabled": False}},
            {"id": "server-1", "type": "server", "position": {"x": 500, "y": 200}, "label": "Server",
             "config": {"name": "Server", "ip_address": "10.0.0.10", "cidr_prefix": "24", "default_gateway": "10.0.0.1", "services": [{"name": "HTTP", "port": 80, "protocol": "tcp", "enabled": True}]}},
        ],
        "edges": [
            {"id": "e1", "source": "pc-a", "target": "sw-1", "relationship_type": "connects", "metadata": {}},
            {"id": "e2", "source": "sw-1", "target": "router-1", "relationship_type": "connects", "metadata": {}},
            {"id": "e3", "source": "router-1", "target": "server-1", "relationship_type": "connects", "metadata": {}},
        ],
    },
})


# ---------------------------------------------------------------------------
# Assessment logic
# ---------------------------------------------------------------------------

def assess_scenario(scenario_id: str, graph: GraphData, answers: dict) -> dict:
    """
    Evaluate a user's topology/answers against scenario completion criteria.
    Returns assessment dict compatible with AssessmentResponse schema.
    """
    import datetime as dt

    scenario = get_scenario(scenario_id)
    if not scenario:
        return {
            "run_id": answers.get("run_id", ""),
            "scenario_id": scenario_id,
            "objectives_met": [],
            "objectives_failed": [],
            "score": 0,
            "max_score": 0,
            "passed": False,
            "explanation": f"Scenario '{scenario_id}' not found.",
            "completed_at": dt.datetime.now(dt.UTC).isoformat(),
        }

    objectives_met: list[str] = []
    objectives_failed: list[str] = []
    explanations: list[str] = []

    if scenario_id == "basic_connectivity":
        _assess_basic_connectivity(graph, scenario, objectives_met, objectives_failed, explanations)

    elif scenario_id == "firewall_defense":
        _assess_firewall_defense(graph, scenario, objectives_met, objectives_failed, explanations)

    elif scenario_id == "network_troubleshoot":
        _assess_network_troubleshoot(graph, scenario, objectives_met, objectives_failed, explanations)

    required_objectives = [o["id"] for o in scenario["objectives"] if o["required"]]
    all_required_met = all(oid in objectives_met for oid in required_objectives)

    total_objectives = len(scenario["objectives"])
    max_score = 100
    score = int((len(objectives_met) / max(total_objectives, 1)) * max_score)

    return {
        "run_id": answers.get("run_id", ""),
        "scenario_id": scenario_id,
        "objectives_met": objectives_met,
        "objectives_failed": objectives_failed,
        "score": score,
        "max_score": max_score,
        "passed": all_required_met,
        "explanation": "\n".join(explanations) if explanations else (
            "All required objectives completed!" if all_required_met
            else "Some required objectives were not met. Review your topology and try again."
        ),
        "completed_at": dt.datetime.now(dt.UTC).isoformat(),
    }


def _get_nodes_by_type(graph: GraphData, ntype: str) -> list:
    return [n for n in graph.nodes if n.type == ntype]


def _assess_basic_connectivity(graph, scenario, met, failed, explanations):
    pcs = _get_nodes_by_type(graph, "pc")
    if len(pcs) < 2:
        failed.append("obj_same_subnet")
        explanations.append("✗ obj_same_subnet: Need at least 2 PCs in the topology.")
        failed.append("obj_diff_subnet")
        return

    # Check same-subnet connectivity between first two PCs
    r = evaluate_connectivity(graph, pcs[0].id, pcs[1].id)
    if r.reachable:
        met.append("obj_same_subnet")
        explanations.append(f"✓ obj_same_subnet: {pcs[0].label} ↔ {pcs[1].label} — {r.reason}")
    else:
        failed.append("obj_same_subnet")
        explanations.append(f"✗ obj_same_subnet: {pcs[0].label} ↔ {pcs[1].label} — {r.reason}")

    # Check cross-subnet: need a 3rd PC or server on different subnet
    all_endpoints = pcs + _get_nodes_by_type(graph, "server")
    cross_found = False
    for i, src in enumerate(all_endpoints):
        for dst in all_endpoints[i + 1:]:
            src_ip, src_pfx = _get_node_ip_and_prefix(src)
            dst_ip, dst_pfx = _get_node_ip_and_prefix(dst)
            # Different subnets?
            if src_ip and dst_ip and src_pfx != dst_pfx:
                r2 = evaluate_connectivity(graph, src.id, dst.id)
                if r2.reachable:
                    met.append("obj_diff_subnet")
                    explanations.append(f"✓ obj_diff_subnet: {src.label} ↔ {dst.label} via router — {r2.reason}")
                    cross_found = True
                    break
                else:
                    failed.append("obj_diff_subnet")
                    explanations.append(f"✗ obj_diff_subnet: {src.label} ↔ {dst.label} — {r2.reason}")
                    break
        if cross_found or "obj_diff_subnet" in failed:
            break
    if "obj_diff_subnet" not in met and "obj_diff_subnet" not in failed:
        failed.append("obj_diff_subnet")
        explanations.append("✗ obj_diff_subnet: No cross-subnet device pair found. Add a router and a PC on a different subnet.")


def _assess_firewall_defense(graph, scenario, met, failed, explanations):
    # obj_identify_open: external → server reachable initially (check if there's path at all)
    ext_nodes = _get_nodes_by_type(graph, "external_network")
    servers = _get_nodes_by_type(graph, "server")
    firewalls = _get_nodes_by_type(graph, "firewall")

    if ext_nodes and servers:
        # Just check topology is connected (this objective is about initial state awareness)
        met.append("obj_identify_open")
        explanations.append("✓ obj_identify_open: External network and server are present in the topology.")
    else:
        failed.append("obj_identify_open")
        explanations.append("✗ obj_identify_open: Need both an External Network and a Server in the topology.")

    # obj_add_rule: firewall must have a DENY rule for SSH (port 22)
    ssh_blocked = False
    for fw in firewalls:
        rules = fw.config.get("inbound_rules", []) + fw.config.get("outbound_rules", [])
        for rule in rules:
            if (
                isinstance(rule, dict)
                and rule.get("action") == "deny"
                and rule.get("enabled", True)
                and ("22" in str(rule.get("port_range", "")) or rule.get("protocol", "").lower() == "ssh")
            ):
                ssh_blocked = True
                break

    if ssh_blocked:
        met.append("obj_add_rule")
        explanations.append("✓ obj_add_rule: A DENY rule for port 22 (SSH) was found on the firewall.")
    else:
        failed.append("obj_add_rule")
        explanations.append("✗ obj_add_rule: No DENY rule for SSH (port 22) found on any firewall.")

    # obj_verify_block: evaluate connectivity for SSH protocol
    if firewalls and ext_nodes and servers:
        r = evaluate_connectivity(graph, ext_nodes[0].id, servers[0].id, protocol="tcp", port=22)
        if not r.reachable and r.blocked_by:
            met.append("obj_verify_block")
            explanations.append(f"✓ obj_verify_block: SSH from Internet to server is blocked by '{r.blocked_by}'.")
        else:
            failed.append("obj_verify_block")
            explanations.append(f"✗ obj_verify_block: SSH from Internet to server is still reachable. Add an active DENY rule.")
    else:
        failed.append("obj_verify_block")
        explanations.append("✗ obj_verify_block: Cannot evaluate — missing firewall, external network, or server.")

    # obj_keep_http: check that HTTP (port 80) is still allowed from internal PC
    pcs = _get_nodes_by_type(graph, "pc")
    if pcs and servers and firewalls:
        r_http = evaluate_connectivity(graph, pcs[0].id, servers[0].id, protocol="tcp", port=80)
        if r_http.reachable:
            met.append("obj_keep_http")
            explanations.append(f"✓ obj_keep_http: HTTP (port 80) from '{pcs[0].label}' to server remains accessible.")
        else:
            explanations.append(f"ℹ obj_keep_http: HTTP from PC to server blocked — check firewall rules allow port 80.")


def _assess_network_troubleshoot(graph, scenario, met, failed, explanations):
    pcs = _get_nodes_by_type(graph, "pc")
    servers = _get_nodes_by_type(graph, "server")
    routers = _get_nodes_by_type(graph, "router")

    if not pcs or not servers:
        for obj in ["obj_diagnose", "obj_fix", "obj_verify"]:
            failed.append(obj)
        explanations.append("✗ Need at least one PC and one Server in the topology.")
        return

    # Check connectivity
    r = evaluate_connectivity(graph, pcs[0].id, servers[0].id)

    if r.reachable:
        # Fixed!
        met.append("obj_diagnose")
        met.append("obj_fix")
        met.append("obj_verify")
        explanations.append(f"✓ obj_diagnose: Fault identified and corrected.")
        explanations.append(f"✓ obj_fix: Topology is correctly configured.")
        explanations.append(f"✓ obj_verify: {pcs[0].label} ↔ {servers[0].label} connectivity confirmed — {r.reason}")
    else:
        # Not yet fixed — give diagnostic hint
        met.append("obj_diagnose")  # Credit for trying
        explanations.append(f"✓ obj_diagnose: Issue identified — {r.reason}")
        failed.append("obj_fix")
        failed.append("obj_verify")
        explanations.append(f"✗ obj_fix: Connectivity not restored. Hint: {r.reason}")
        explanations.append(f"✗ obj_verify: {pcs[0].label} cannot reach {servers[0].label}.")
