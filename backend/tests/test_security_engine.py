import pytest
from app.schemas.lab import GraphData, GraphNode, GraphEdge
from app.security_engine.registry import registry
from app.security_engine.analyzer import SecurityAnalyzer
import app.security_engine.rules  # noqa: F401


@pytest.fixture
def analyzer():
    return SecurityAnalyzer(registry)


def test_registry_has_all_network_rules():
    rules = registry.get_rules()
    rule_ids = {r.rule_id for r in rules}
    expected_rule_ids = {
        "FIREWALL_DEFAULT_ALLOW",
        "SERVER_UNPROTECTED_DIRECT_WAN",
        "SERVER_PLAINTEXT_PORT",
        "FIREWALL_PERMISSIVE_ANY_PORT",
        "HOST_EXPOSED_MANAGEMENT_PORT",
        "ROUTER_INSECURE_DIRECT_ROUTE",
        "SWITCH_DEFAULT_VLAN_EXPOSURE",
        "HOST_MISSING_DEFAULT_GATEWAY",
    }
    assert expected_rule_ids.issubset(rule_ids)


# 1. Firewall Default Inbound Allow Tests
def test_firewall_default_allow_detected(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="fw-1",
                type="firewall",
                label="Perimeter FW",
                config={"default_inbound_action": "allow", "inbound_rules": []},
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln = [f for f in result["findings"] if f.rule_id == "FIREWALL_DEFAULT_ALLOW"]
    assert len(vuln) == 1
    assert vuln[0].severity == "critical"
    assert vuln[0].affected_resource_id == "fw-1"


def test_firewall_default_deny_passes(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="fw-safe",
                type="firewall",
                label="Hardened FW",
                config={"default_inbound_action": "deny", "inbound_rules": []},
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln = [f for f in result["findings"] if f.rule_id == "FIREWALL_DEFAULT_ALLOW"]
    assert len(vuln) == 0


# 2. Unprotected Direct WAN Exposure Tests
def test_server_direct_wan_exposure_detected(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(id="wan", type="external_network", label="Internet", config={}),
            GraphNode(id="srv", type="server", label="DB Server", config={"ip_address": "203.0.113.5", "default_gateway": "203.0.113.1"}),
        ],
        edges=[
            GraphEdge(id="e1", source="wan", target="srv", relationship_type="connects")
        ]
    )
    result = analyzer.analyze(graph)
    vuln = [f for f in result["findings"] if f.rule_id == "SERVER_UNPROTECTED_DIRECT_WAN"]
    assert len(vuln) == 1
    assert vuln[0].severity == "critical"


def test_server_behind_firewall_passes_wan_exposure(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(id="wan", type="external_network", label="Internet", config={}),
            GraphNode(id="fw", type="firewall", label="Edge FW", config={"default_inbound_action": "deny"}),
            GraphNode(id="srv", type="server", label="Internal Server", config={"ip_address": "10.0.0.10", "default_gateway": "10.0.0.1"}),
        ],
        edges=[
            GraphEdge(id="e1", source="wan", target="fw", relationship_type="connects"),
            GraphEdge(id="e2", source="fw", target="srv", relationship_type="connects"),
        ]
    )
    result = analyzer.analyze(graph)
    vuln = [f for f in result["findings"] if f.rule_id == "SERVER_UNPROTECTED_DIRECT_WAN"]
    assert len(vuln) == 0


# 3. Plaintext Protocol Tests
def test_plaintext_service_detected(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="srv-telnet",
                type="server",
                label="Legacy Server",
                config={
                    "ip_address": "10.0.0.5",
                    "default_gateway": "10.0.0.1",
                    "services": [
                        {"name": "Telnet", "port": 23, "protocol": "tcp", "enabled": True}
                    ]
                },
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln = [f for f in result["findings"] if f.rule_id == "SERVER_PLAINTEXT_PORT"]
    assert len(vuln) == 1
    assert vuln[0].severity == "high"


def test_secure_encrypted_service_passes(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="srv-secure",
                type="server",
                label="Secure Server",
                config={
                    "ip_address": "10.0.0.5",
                    "default_gateway": "10.0.0.1",
                    "services": [
                        {"name": "HTTPS", "port": 443, "protocol": "tcp", "enabled": True}
                    ]
                },
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln = [f for f in result["findings"] if f.rule_id == "SERVER_PLAINTEXT_PORT"]
    assert len(vuln) == 0


# 4. Permissive Any-Port Firewall Rule Tests
def test_permissive_firewall_rule_detected(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="fw-open",
                type="firewall",
                label="Perimeter FW",
                config={
                    "default_inbound_action": "deny",
                    "inbound_rules": [
                        {
                            "id": "r1",
                            "action": "allow",
                            "source": "0.0.0.0/0",
                            "port_range": "0-65535",
                            "protocol": "any",
                            "enabled": True,
                        }
                    ]
                },
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln = [f for f in result["findings"] if f.rule_id == "FIREWALL_PERMISSIVE_ANY_PORT"]
    assert len(vuln) == 1
    assert vuln[0].severity == "high"


def test_restricted_firewall_rule_passes(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="fw-scoped",
                type="firewall",
                label="Scoped FW",
                config={
                    "default_inbound_action": "deny",
                    "inbound_rules": [
                        {
                            "id": "r1",
                            "action": "allow",
                            "source": "192.168.1.0/24",
                            "port_range": "443",
                            "protocol": "tcp",
                            "enabled": True,
                        }
                    ]
                },
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln = [f for f in result["findings"] if f.rule_id == "FIREWALL_PERMISSIVE_ANY_PORT"]
    assert len(vuln) == 0


# 5. Exposed Management Port Tests
def test_exposed_management_port_detected(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="srv-mgmt",
                type="server",
                label="Host with SSH",
                config={
                    "ip_address": "10.0.0.2",
                    "default_gateway": "10.0.0.1",
                    "services": [
                        {"name": "SSH", "port": 22, "protocol": "tcp", "enabled": True}
                    ]
                },
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln = [f for f in result["findings"] if f.rule_id == "HOST_EXPOSED_MANAGEMENT_PORT"]
    assert len(vuln) == 1
    assert vuln[0].severity == "medium"


# 6. Edge Router Without NAT Tests
def test_router_wan_without_nat_detected(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(id="wan", type="external_network", label="WAN", config={}),
            GraphNode(id="rt", type="router", label="Edge Router", config={"nat_enabled": False}),
        ],
        edges=[
            GraphEdge(id="e1", source="wan", target="rt", relationship_type="connects")
        ]
    )
    result = analyzer.analyze(graph)
    vuln = [f for f in result["findings"] if f.rule_id == "ROUTER_INSECURE_DIRECT_ROUTE"]
    assert len(vuln) == 1


def test_router_wan_with_nat_passes(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(id="wan", type="external_network", label="WAN", config={}),
            GraphNode(id="rt", type="router", label="Edge Router", config={"nat_enabled": True}),
        ],
        edges=[
            GraphEdge(id="e1", source="wan", target="rt", relationship_type="connects")
        ]
    )
    result = analyzer.analyze(graph)
    vuln = [f for f in result["findings"] if f.rule_id == "ROUTER_INSECURE_DIRECT_ROUTE"]
    assert len(vuln) == 0


# 7. Switch Default VLAN Tests
def test_switch_unsegmented_vlan_detected(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="sw-1",
                type="switch",
                label="Switch 1",
                config={"default_vlan": 1, "ports": [{"id": "p1", "vlan": 1}]},
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln = [f for f in result["findings"] if f.rule_id == "SWITCH_DEFAULT_VLAN_EXPOSURE"]
    assert len(vuln) == 1


# 8. Host Missing Default Gateway Tests
def test_host_missing_gateway_detected(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="srv-nogw",
                type="server",
                label="Server No GW",
                config={"ip_address": "192.168.1.50", "default_gateway": ""},
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln = [f for f in result["findings"] if f.rule_id == "HOST_MISSING_DEFAULT_GATEWAY"]
    assert len(vuln) == 1


# 9. Attack Path Generation Test
def test_attack_path_generation(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(id="attacker-wan", type="external_network", label="Attacker WAN", config={}),
            GraphNode(id="edge-router", type="router", label="Edge Router", config={"nat_enabled": True}),
            GraphNode(id="firewall-dmz", type="firewall", label="DMZ Firewall", config={"default_inbound_action": "allow"}),
            GraphNode(
                id="target-srv",
                type="server",
                label="Target Web Server",
                config={
                    "ip_address": "10.0.0.10",
                    "default_gateway": "10.0.0.1",
                    "services": [{"name": "HTTP", "port": 80, "protocol": "tcp", "enabled": True}]
                },
            ),
        ],
        edges=[
            GraphEdge(id="e1", source="attacker-wan", target="edge-router", relationship_type="connects"),
            GraphEdge(id="e2", source="edge-router", target="firewall-dmz", relationship_type="connects"),
            GraphEdge(id="e3", source="firewall-dmz", target="target-srv", relationship_type="connects"),
        ]
    )
    result = analyzer.analyze(graph)
    assert len(result["attack_paths"]) > 0
    path = result["attack_paths"][0]
    assert "attacker-wan" in [s.resource_id for s in path.steps]
    assert "target-srv" in [s.resource_id for s in path.steps]
    assert path.severity in ("critical", "high")


# 10. Full Remediation Cycle Test
def test_full_remediation_cycle(analyzer):
    # Step 1: Insecure network topology
    insecure_graph = GraphData(
        nodes=[
            GraphNode(
                id="fw",
                type="firewall",
                label="Border Firewall",
                config={"default_inbound_action": "allow"},
            ),
            GraphNode(
                id="srv",
                type="server",
                label="App Server",
                config={
                    "ip_address": "10.0.0.10",
                    "default_gateway": "",
                    "services": [{"name": "Telnet", "port": 23, "protocol": "tcp", "enabled": True}]
                },
            ),
        ]
    )
    result_insecure = analyzer.analyze(insecure_graph)
    assert result_insecure["failed"] >= 2
    assert result_insecure["risk_score"] > 0

    # Step 2: Remediate all issues
    remediated_graph = GraphData(
        nodes=[
            GraphNode(
                id="fw",
                type="firewall",
                label="Border Firewall",
                config={
                    "default_inbound_action": "deny",
                    "inbound_rules": [
                        {
                            "id": "r1",
                            "action": "allow",
                            "source": "10.0.0.0/24",
                            "port_range": "443",
                            "protocol": "tcp",
                            "enabled": True,
                        }
                    ]
                },
            ),
            GraphNode(
                id="srv",
                type="server",
                label="App Server",
                config={
                    "ip_address": "10.0.0.10",
                    "default_gateway": "10.0.0.1",
                    "services": [{"name": "HTTPS", "port": 443, "protocol": "tcp", "enabled": True}]
                },
            ),
        ]
    )
    result_remediated = analyzer.analyze(remediated_graph)
    assert result_remediated["failed"] == 0
    assert result_remediated["risk_score"] == 0.0
