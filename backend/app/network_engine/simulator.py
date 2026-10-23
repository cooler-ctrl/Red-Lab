"""
RedLab Network Engine — Simulator

Runs a deterministic network simulation against a validated topology.
Generates NetworkEvent records describing what happens during the simulation.
"""
from __future__ import annotations

import datetime
import uuid
from typing import Optional

from ..schemas.lab import GraphData, GraphNode, NetworkEvent, TopologyValidationResult
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
    NETWORK_TYPES = {"pc", "server", "router", "firewall"}

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
    endpoint_types = {"pc", "server"}
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
