"""
RedLab Network Engine — Topology Validation

Validates a network topology graph before simulation:
- Checks for duplicate node IDs
- Validates IP addresses and CIDR prefixes
- Checks link connectivity (referenced nodes exist)
- Validates device-specific config requirements
"""
from __future__ import annotations

import ipaddress
import re
from dataclasses import dataclass, field

from ..schemas.lab import GraphData, GraphNode, TopologyValidationError, TopologyValidationResult


# Device categories
HOST_DEVICE_TYPES = {"pc", "server", "linux_server", "web_server", "dns_server", "endpoint"}
ROUTER_DEVICE_TYPES = {"router", "layer3_switch"}
SWITCH_DEVICE_TYPES = {"switch", "layer3_switch"}
SECURITY_DEVICE_TYPES = {"firewall", "ids_ips"}
WAN_DEVICE_TYPES = {"external_network"}

NETWORK_DEVICE_TYPES = (
    HOST_DEVICE_TYPES
    | ROUTER_DEVICE_TYPES
    | SWITCH_DEVICE_TYPES
    | SECURITY_DEVICE_TYPES
    | WAN_DEVICE_TYPES
)
ALL_VALID_TYPES = NETWORK_DEVICE_TYPES

# Valid link relationships for network devices
VALID_NETWORK_LINKS: set[frozenset[str]] = {
    frozenset([h, s]) for h in HOST_DEVICE_TYPES for s in SWITCH_DEVICE_TYPES
} | {
    frozenset([h, r]) for h in HOST_DEVICE_TYPES for r in ROUTER_DEVICE_TYPES
} | {
    frozenset([h, sec]) for h in HOST_DEVICE_TYPES for sec in SECURITY_DEVICE_TYPES
} | {
    frozenset([s, r]) for s in SWITCH_DEVICE_TYPES for r in ROUTER_DEVICE_TYPES
} | {
    frozenset([s, sec]) for s in SWITCH_DEVICE_TYPES for sec in SECURITY_DEVICE_TYPES
} | {
    frozenset([s1, s2]) for s1 in SWITCH_DEVICE_TYPES for s2 in SWITCH_DEVICE_TYPES
} | {
    frozenset([r1, r2]) for r1 in ROUTER_DEVICE_TYPES for r2 in ROUTER_DEVICE_TYPES
} | {
    frozenset([r, sec]) for r in ROUTER_DEVICE_TYPES for sec in SECURITY_DEVICE_TYPES
} | {
    frozenset([r, "external_network"]) for r in ROUTER_DEVICE_TYPES
} | {
    frozenset([sec, "external_network"]) for sec in SECURITY_DEVICE_TYPES
} | {
    frozenset([s, "external_network"]) for s in SWITCH_DEVICE_TYPES
} | {
    frozenset([h1, h2]) for h1 in HOST_DEVICE_TYPES for h2 in HOST_DEVICE_TYPES
} | {
    frozenset([h, "external_network"]) for h in HOST_DEVICE_TYPES
} | {
    frozenset([sec1, sec2]) for sec1 in SECURITY_DEVICE_TYPES for sec2 in SECURITY_DEVICE_TYPES
}



def _is_valid_ip(ip: str) -> bool:
    if not ip:
        return False
    try:
        ipaddress.ip_address(ip)
        return True
    except ValueError:
        return False


def _is_valid_cidr(cidr: str) -> bool:
    if not cidr:
        return False
    try:
        ipaddress.ip_network(cidr, strict=False)
        return True
    except ValueError:
        return False


def _is_valid_prefix(prefix: str) -> bool:
    """Validate a CIDR prefix like '24' or '/24'."""
    p = prefix.lstrip("/")
    try:
        v = int(p)
        return 0 <= v <= 32
    except (ValueError, AttributeError):
        return False


def _validate_ip_field(node: GraphNode, field_name: str, errors: list[TopologyValidationError]) -> None:
    val = node.config.get(field_name, "")
    if val and not _is_valid_ip(str(val)):
        errors.append(TopologyValidationError(
            code="INVALID_IP_ADDRESS",
            message=f"Node '{node.label}' has invalid IP address in field '{field_name}': '{val}'",
            affected_node_id=node.id,
        ))




def _validate_pc_node(node: GraphNode, errors: list[TopologyValidationError], warnings: list[TopologyValidationError]) -> None:
    interfaces = node.config.get("interfaces", [])
    if not interfaces:
        warnings.append(TopologyValidationError(
            code="NO_INTERFACES",
            message=f"PC '{node.label}' has no network interfaces configured.",
            affected_node_id=node.id,
        ))
    else:
        for iface in interfaces:
            if isinstance(iface, dict):
                ip = iface.get("ip_address", "")
                prefix = iface.get("cidr_prefix", "")
                if ip and not _is_valid_ip(str(ip)):
                    errors.append(TopologyValidationError(
                        code="INVALID_IP_ADDRESS",
                        message=f"PC '{node.label}' interface '{iface.get('name', '?')}' has invalid IP: '{ip}'",
                        affected_node_id=node.id,
                    ))
                if prefix and not _is_valid_prefix(str(prefix)):
                    errors.append(TopologyValidationError(
                        code="INVALID_PREFIX",
                        message=f"PC '{node.label}' interface '{iface.get('name', '?')}' has invalid prefix: '{prefix}'",
                        affected_node_id=node.id,
                    ))
    gw = node.config.get("default_gateway", "")
    if gw and not _is_valid_ip(str(gw)):
        errors.append(TopologyValidationError(
            code="INVALID_GATEWAY",
            message=f"PC '{node.label}' has invalid default gateway: '{gw}'",
            affected_node_id=node.id,
        ))


def _validate_router_node(node: GraphNode, errors: list[TopologyValidationError], warnings: list[TopologyValidationError]) -> None:
    interfaces = node.config.get("interfaces", [])
    if not interfaces:
        warnings.append(TopologyValidationError(
            code="NO_INTERFACES",
            message=f"Router '{node.label}' has no interfaces configured.",
            affected_node_id=node.id,
        ))
    else:
        for iface in interfaces:
            if isinstance(iface, dict):
                ip = iface.get("ip_address", "")
                prefix = iface.get("cidr_prefix", "")
                if ip and not _is_valid_ip(str(ip)):
                    errors.append(TopologyValidationError(
                        code="INVALID_IP_ADDRESS",
                        message=f"Router '{node.label}' interface '{iface.get('name', '?')}' has invalid IP: '{ip}'",
                        affected_node_id=node.id,
                    ))
                if prefix and not _is_valid_prefix(str(prefix)):
                    errors.append(TopologyValidationError(
                        code="INVALID_PREFIX",
                        message=f"Router '{node.label}' interface '{iface.get('name', '?')}' has invalid prefix: '{prefix}'",
                        affected_node_id=node.id,
                    ))


def _validate_server_node(node: GraphNode, errors: list[TopologyValidationError], warnings: list[TopologyValidationError]) -> None:
    ip = node.config.get("ip_address", "")
    if ip and not _is_valid_ip(str(ip)):
        errors.append(TopologyValidationError(
            code="INVALID_IP_ADDRESS",
            message=f"Server '{node.label}' has invalid IP address: '{ip}'",
            affected_node_id=node.id,
        ))
    services = node.config.get("services", [])
    for svc in services:
        if isinstance(svc, dict):
            port = svc.get("port", None)
            if port is not None:
                try:
                    p = int(port)
                    if not (0 <= p <= 65535):
                        errors.append(TopologyValidationError(
                            code="INVALID_PORT",
                            message=f"Server '{node.label}' service '{svc.get('name', '?')}' has invalid port: {port}",
                            affected_node_id=node.id,
                        ))
                except (ValueError, TypeError):
                    errors.append(TopologyValidationError(
                        code="INVALID_PORT",
                        message=f"Server '{node.label}' service '{svc.get('name', '?')}' has non-numeric port: {port}",
                        affected_node_id=node.id,
                    ))


def _validate_firewall_node(node: GraphNode, errors: list[TopologyValidationError], warnings: list[TopologyValidationError]) -> None:
    ip = node.config.get("ip_address", "")
    if ip and not _is_valid_ip(str(ip)):
        errors.append(TopologyValidationError(
            code="INVALID_IP_ADDRESS",
            message=f"Firewall '{node.label}' has invalid IP address: '{ip}'",
            affected_node_id=node.id,
        ))
    for rule_set in ["inbound_rules", "outbound_rules"]:
        for rule in node.config.get(rule_set, []):
            if not isinstance(rule, dict):
                continue
            port_range = rule.get("port_range", "any")
            if port_range and port_range not in ("any", "all", "*", ""):
                # validate port/range format
                parts = str(port_range).split("-")
                for p in parts:
                    if p.strip():
                        try:
                            v = int(p.strip())
                            if not (0 <= v <= 65535):
                                errors.append(TopologyValidationError(
                                    code="INVALID_PORT",
                                    message=f"Firewall '{node.label}' rule has invalid port in range '{port_range}'",
                                    affected_node_id=node.id,
                                ))
                        except ValueError:
                            pass  # non-numeric port ranges like "http" are OK


def validate_topology(graph: GraphData) -> TopologyValidationResult:
    """
    Validate a network topology graph.

    Returns a TopologyValidationResult with any errors or warnings found.
    Errors will prevent simulation from starting; warnings are informational.
    """
    errors: list[TopologyValidationError] = []
    warnings: list[TopologyValidationError] = []
    node_ids: set[str] = set()

    # 1. Check for duplicate node IDs
    for node in graph.nodes:
        if node.id in node_ids:
            errors.append(TopologyValidationError(
                code="DUPLICATE_NODE_ID",
                message=f"Duplicate node ID: '{node.id}'",
                affected_node_id=node.id,
            ))
        node_ids.add(node.id)

    # 2. Validate all node types
    for node in graph.nodes:
        if node.type not in ALL_VALID_TYPES:
            errors.append(TopologyValidationError(
                code="UNSUPPORTED_DEVICE_TYPE",
                message=f"Unsupported device type '{node.type}' on node '{node.label}'",
                affected_node_id=node.id,
            ))

    # 3. Validate all edge references
    edge_ids: set[str] = set()
    for edge in graph.edges:
        if edge.id in edge_ids:
            errors.append(TopologyValidationError(
                code="DUPLICATE_EDGE_ID",
                message=f"Duplicate edge ID: '{edge.id}'",
                affected_edge_id=edge.id,
            ))
        edge_ids.add(edge.id)

        if edge.source not in node_ids:
            errors.append(TopologyValidationError(
                code="MISSING_EDGE_SOURCE",
                message=f"Edge '{edge.id}' references nonexistent source node '{edge.source}'",
                affected_edge_id=edge.id,
            ))
        if edge.target not in node_ids:
            errors.append(TopologyValidationError(
                code="MISSING_EDGE_TARGET",
                message=f"Edge '{edge.id}' references nonexistent target node '{edge.target}'",
                affected_edge_id=edge.id,
            ))

    # 4. Device-type-specific validation
    for node in graph.nodes:
        if node.type == "pc":
            _validate_pc_node(node, errors, warnings)
        elif node.type in ("router", "layer3_switch"):
            _validate_router_node(node, errors, warnings)
        elif node.type in ("server", "linux_server", "web_server", "dns_server", "endpoint"):
            _validate_server_node(node, errors, warnings)
        elif node.type in ("firewall", "ids_ips"):
            _validate_firewall_node(node, errors, warnings)


    # 5. Warn if canvas has network devices but no connections at all
    network_nodes = [n for n in graph.nodes if n.type in NETWORK_DEVICE_TYPES]
    if len(network_nodes) > 1:
        connected_ids = set()
        for edge in graph.edges:
            connected_ids.add(edge.source)
            connected_ids.add(edge.target)
        isolated = [n for n in network_nodes if n.id not in connected_ids]
        for n in isolated:
            warnings.append(TopologyValidationError(
                code="ISOLATED_DEVICE",
                message=f"Device '{n.label}' ({n.type}) is not connected to any other device.",
                affected_node_id=n.id,
            ))

    return TopologyValidationResult(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
    )
