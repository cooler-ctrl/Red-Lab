"""
RedLab Network Engine — Connectivity Evaluator

Evaluates network reachability between devices in a topology.
Supports:
- Same-subnet direct connectivity
- Cross-subnet routing via router
- Firewall rule evaluation
- Gateway requirement checks
"""
from __future__ import annotations

import ipaddress
from dataclasses import dataclass, field
from typing import Optional

from ..schemas.lab import GraphData, GraphNode


@dataclass
class ReachabilityResult:
    reachable: bool
    path: list[str]  # List of node IDs traversed
    path_labels: list[str]
    reason: str
    blocked_by: Optional[str] = None  # node ID that blocked traffic
    firewall_rule_hit: Optional[dict] = None


def _get_node_by_id(graph: GraphData, node_id: str) -> Optional[GraphNode]:
    for n in graph.nodes:
        if n.id == node_id:
            return n
    return None


def _get_neighbors(graph: GraphData, node_id: str) -> list[GraphNode]:
    """Return all directly connected nodes via graph edges."""
    neighbor_ids: set[str] = set()
    for edge in graph.edges:
        if edge.source == node_id:
            neighbor_ids.add(edge.target)
        elif edge.target == node_id:
            neighbor_ids.add(edge.source)
    return [_get_node_by_id(graph, nid) for nid in neighbor_ids if _get_node_by_id(graph, nid)]


def _get_pc_ip_prefix(node: GraphNode) -> tuple[str, str]:
    """Get primary IP and prefix for a PC node."""
    interfaces = node.config.get("interfaces", [])
    for iface in interfaces:
        if isinstance(iface, dict) and iface.get("enabled", True):
            return iface.get("ip_address", ""), iface.get("cidr_prefix", "24")
    return "", "24"


def _get_server_ip_prefix(node: GraphNode) -> tuple[str, str]:
    return (
        str(node.config.get("ip_address", "")),
        str(node.config.get("cidr_prefix", "24")),
    )


def _get_router_interface_ips(node: GraphNode) -> list[tuple[str, str]]:
    """Return list of (ip, prefix) for all router interfaces."""
    result = []
    for iface in node.config.get("interfaces", []):
        if isinstance(iface, dict) and iface.get("enabled", True):
            ip = iface.get("ip_address", "")
            prefix = iface.get("cidr_prefix", "24")
            if ip:
                result.append((str(ip), str(prefix)))
    return result


def _get_firewall_ip_prefix(node: GraphNode) -> tuple[str, str]:
    return (
        str(node.config.get("ip_address", "")),
        str(node.config.get("cidr_prefix", "24")),
    )


def _ips_in_same_subnet(ip1: str, prefix1: str, ip2: str, prefix2: str) -> bool:
    """Check if two IPs are in the same subnet."""
    try:
        prefix1 = prefix1.lstrip("/")
        prefix2 = prefix2.lstrip("/")
        net1 = ipaddress.ip_network(f"{ip1}/{prefix1}", strict=False)
        net2 = ipaddress.ip_network(f"{ip2}/{prefix2}", strict=False)
        # They must have the same prefix length and network address
        if int(prefix1) != int(prefix2):
            # Check if either contains the other
            return net1.overlaps(net2) and str(net1.network_address) == str(net2.network_address)
        return str(net1.network_address) == str(net2.network_address)
    except (ValueError, AttributeError):
        return False


def _ip_in_network(ip: str, network_cidr: str) -> bool:
    try:
        return ipaddress.ip_address(ip) in ipaddress.ip_network(network_cidr, strict=False)
    except ValueError:
        return False


def _get_node_ip_and_prefix(node: GraphNode) -> tuple[str, str]:
    """Unified IP/prefix getter for any device type."""
    t = node.type
    if t == "pc":
        return _get_pc_ip_prefix(node)
    elif t in ("server", "linux_server", "web_server", "dns_server", "endpoint"):
        return _get_server_ip_prefix(node)
    elif t in ("firewall", "ids_ips"):
        return _get_firewall_ip_prefix(node)
    elif t in ("router", "layer3_switch"):
        # Use first interface
        ips = _get_router_interface_ips(node)
        if ips:
            return ips[0]
    elif t == "external_network":
        cidr = str(node.config.get("cidr_block", "0.0.0.0/0"))
        parts = cidr.split("/")
        return parts[0], parts[1] if len(parts) > 1 else "0"
    return "", "24"


def _evaluate_firewall_rules(
    firewall: GraphNode,
    src_ip: str,
    dst_ip: str,
    protocol: str = "icmp",
    port: int = 0,
) -> tuple[bool, Optional[dict]]:
    """
    Evaluate firewall rules for a packet.
    Returns (allowed, matching_rule_or_None).
    Rules are evaluated in priority order (lower number = higher priority).
    """
    rules = firewall.config.get("inbound_rules", []) + firewall.config.get("outbound_rules", [])
    rules = sorted(
        [r for r in rules if isinstance(r, dict) and r.get("enabled", True)],
        key=lambda r: int(r.get("priority", 100))
    )

    for rule in rules:
        action = rule.get("action", "allow")
        rule_protocol = rule.get("protocol", "any").lower()
        rule_src = rule.get("source", "any")
        rule_dst = rule.get("destination", "any")
        port_range = str(rule.get("port_range", "any"))

        # Match protocol
        if rule_protocol not in ("any", "all", "*", protocol.lower(), ""):
            continue

        # Match source
        if rule_src not in ("any", "all", "*", "", "0.0.0.0/0"):
            try:
                if src_ip and not _ip_in_network(src_ip, rule_src if "/" in rule_src else f"{rule_src}/32"):
                    continue
            except ValueError:
                continue

        # Match destination
        if rule_dst not in ("any", "all", "*", "", "0.0.0.0/0"):
            try:
                if dst_ip and not _ip_in_network(dst_ip, rule_dst if "/" in rule_dst else f"{rule_dst}/32"):
                    continue
            except ValueError:
                continue

        # Match port
        if port > 0 and port_range not in ("any", "all", "*", "", "0-65535"):
            parts = port_range.split("-")
            try:
                if len(parts) == 2:
                    if not (int(parts[0]) <= port <= int(parts[1])):
                        continue
                elif len(parts) == 1 and int(parts[0]) != port:
                    continue
            except ValueError:
                pass  # Port range parsing failed, skip this check

        # Rule matched
        return action == "allow", rule

    # Default action
    default = firewall.config.get("default_inbound_action", "allow")
    return default == "allow", None


def _find_firewall_between(graph: GraphData, src_node: GraphNode, dst_node: GraphNode) -> Optional[GraphNode]:
    """Find a firewall connected between source and destination (direct or via switches)."""
    def get_reachable_via_switches(start_node: GraphNode) -> set[str]:
        visited = set()
        queue = [start_node]
        while queue:
            current = queue.pop(0)
            if current.id in visited:
                continue
            visited.add(current.id)
            for neighbor in _get_neighbors(graph, current.id):
                if neighbor.type == "switch" and neighbor.id not in visited:
                    queue.append(neighbor)
        return visited

    src_reachable = get_reachable_via_switches(src_node)
    dst_reachable = get_reachable_via_switches(dst_node)

    for node in graph.nodes:
        if node.type in ("firewall", "ids_ips"):
            fw_neighbors = {n.id for n in _get_neighbors(graph, node.id)}
            touches_src = bool(fw_neighbors & src_reachable)
            touches_dst = bool(fw_neighbors & dst_reachable)
            if touches_src and touches_dst:
                return node
    return None


def _find_router_between(graph: GraphData, src_node: GraphNode, dst_node: GraphNode) -> Optional[GraphNode]:
    """Find a router that is connected to BOTH source and destination sides."""
    src_neighbors = _get_neighbors(graph, src_node.id)
    dst_neighbors = _get_neighbors(graph, dst_node.id)

    # Look for a switch → router path
    def get_reachable_via_switches(start_node: GraphNode) -> set[str]:
        visited = set()
        queue = [start_node]
        while queue:
            current = queue.pop(0)
            if current.id in visited:
                continue
            visited.add(current.id)
            for neighbor in _get_neighbors(graph, current.id):
                if neighbor.type not in ("router", "external_network") and neighbor.id not in visited:
                    queue.append(neighbor)
        return visited

    src_reachable = get_reachable_via_switches(src_node)
    dst_reachable = get_reachable_via_switches(dst_node)

    # Find a router reachable from both sides
    for node in graph.nodes:
        if node.type in ("router", "layer3_switch"):
            router_neighbors = {n.id for n in _get_neighbors(graph, node.id)}
            # Check if router is adjacent to something in src_reachable and dst_reachable
            touches_src = bool(router_neighbors & src_reachable)
            touches_dst = bool(router_neighbors & dst_reachable)
            if touches_src and touches_dst:
                return node

    return None


def evaluate_connectivity(
    graph: GraphData,
    source_id: str,
    dest_id: str,
    protocol: str = "icmp",
    port: int = 0,
) -> ReachabilityResult:
    """
    Evaluate whether source can reach destination in the given topology.

    Returns a ReachabilityResult describing the outcome.
    """
    src = _get_node_by_id(graph, source_id)
    dst = _get_node_by_id(graph, dest_id)

    if not src:
        return ReachabilityResult(
            reachable=False,
            path=[],
            path_labels=[],
            reason=f"Source node '{source_id}' not found in topology.",
        )

    if not dst:
        return ReachabilityResult(
            reachable=False,
            path=[],
            path_labels=[],
            reason=f"Destination node '{dest_id}' not found in topology.",
        )

    # Get IPs for source and dest
    src_ip, src_prefix = _get_node_ip_and_prefix(src)
    dst_ip, dst_prefix = _get_node_ip_and_prefix(dst)

    if not src_ip:
        return ReachabilityResult(
            reachable=False,
            path=[src.id],
            path_labels=[src.label],
            reason=f"Source '{src.label}' has no IP address configured.",
        )

    if not dst_ip:
        return ReachabilityResult(
            reachable=False,
            path=[src.id],
            path_labels=[src.label],
            reason=f"Destination '{dst.label}' has no IP address configured.",
        )

    # Check if directly connected (physically adjacent)
    direct_neighbors = _get_neighbors(graph, src.id)
    direct_neighbor_ids = {n.id for n in direct_neighbors}

    # Case 1: Direct physical link
    if dst.id in direct_neighbor_ids:
        # They're directly connected — check if same subnet
        same_subnet = _ips_in_same_subnet(src_ip, src_prefix, dst_ip, dst_prefix)
        if same_subnet:
            # Check for firewall in the path
            for n in direct_neighbors:
                if n.type == "firewall" and n.id == dst.id:
                    allowed, rule = _evaluate_firewall_rules(n, src_ip, dst_ip, protocol, port)
                    if not allowed:
                        return ReachabilityResult(
                            reachable=False,
                            path=[src.id, dst.id],
                            path_labels=[src.label, dst.label],
                            reason=f"Firewall '{dst.label}' blocked the connection.",
                            blocked_by=dst.id,
                            firewall_rule_hit=rule,
                        )
            return ReachabilityResult(
                reachable=True,
                path=[src.id, dst.id],
                path_labels=[src.label, dst.label],
                reason=f"Direct connection: both devices are in the same subnet ({src_ip}/{src_prefix}).",
            )
        else:
            return ReachabilityResult(
                reachable=False,
                path=[src.id, dst.id],
                path_labels=[src.label, dst.label],
                reason=(
                    f"Devices are physically connected but on different subnets "
                    f"({src_ip}/{src_prefix} vs {dst_ip}/{dst_prefix}). "
                    f"They cannot communicate without a router."
                ),
            )

    # Case 2: Via switch (same logical segment)
    src_switches = [n for n in direct_neighbors if n.type == "switch"]
    for sw in src_switches:
        sw_neighbors = _get_neighbors(graph, sw.id)
        for sw_neighbor in sw_neighbors:
            if sw_neighbor.id == dst.id:
                # Same switch segment — check same subnet
                same_subnet = _ips_in_same_subnet(src_ip, src_prefix, dst_ip, dst_prefix)
                if same_subnet:
                    return ReachabilityResult(
                        reachable=True,
                        path=[src.id, sw.id, dst.id],
                        path_labels=[src.label, sw.label, dst.label],
                        reason=f"Routed through switch '{sw.label}'; both devices in subnet {src_ip}/{src_prefix}.",
                    )
                else:
                    return ReachabilityResult(
                        reachable=False,
                        path=[src.id, sw.id, dst.id],
                        path_labels=[src.label, sw.label, dst.label],
                        reason=(
                            f"Connected via switch '{sw.label}' but devices are on different subnets "
                            f"({src_ip}/{src_prefix} vs {dst_ip}/{dst_prefix}). A router is required."
                        ),
                    )

    # Case 2b: Via firewall (inline inspection / filtering)
    firewall = _find_firewall_between(graph, src, dst)
    if firewall:
        allowed, rule = _evaluate_firewall_rules(firewall, src_ip, dst_ip, protocol, port)
        if not allowed:
            return ReachabilityResult(
                reachable=False,
                path=[src.id, firewall.id, dst.id],
                path_labels=[src.label, firewall.label, dst.label],
                reason=f"Firewall '{firewall.label}' blocked the connection from '{src.label}' to '{dst.label}'.",
                blocked_by=firewall.id,
                firewall_rule_hit=rule,
            )
        # Firewall allowed it — check if devices are on compatible subnets or external
        is_ext = (src.type == "external_network" or dst.type == "external_network")
        same_subnet = _ips_in_same_subnet(src_ip, src_prefix, dst_ip, dst_prefix)
        fw_ip, _ = _get_firewall_ip_prefix(firewall)
        src_gw = str(src.config.get("default_gateway", ""))
        dst_gw = str(dst.config.get("default_gateway", ""))
        is_gw = (src_gw == fw_ip or dst_gw == fw_ip or not src_gw)

        if is_ext or same_subnet or is_gw:
            return ReachabilityResult(
                reachable=True,
                path=[src.id, firewall.id, dst.id],
                path_labels=[src.label, firewall.label, dst.label],
                reason=f"Permitted through firewall '{firewall.label}'.",
            )
        else:
            return ReachabilityResult(
                reachable=False,
                path=[src.id, firewall.id, dst.id],
                path_labels=[src.label, firewall.label, dst.label],
                reason=f"Permitted by firewall '{firewall.label}', but devices are on different subnets without a matching gateway.",
            )

    # Case 3: Via router
    router = _find_router_between(graph, src, dst)
    if router:
        # Check gateway config on source
        src_gw = src.config.get("default_gateway", "")
        if src_gw:
            # Check if gateway IP belongs to one of the router's interfaces
            router_ips = [ip for ip, _ in _get_router_interface_ips(router)]
            if str(src_gw) not in router_ips:
                return ReachabilityResult(
                    reachable=False,
                    path=[src.id, router.id],
                    path_labels=[src.label, router.label],
                    reason=(
                        f"Source '{src.label}' has gateway '{src_gw}' configured, but this does not "
                        f"match any router interface ({', '.join(router_ips) or 'none configured'}). "
                        f"Fix the default gateway setting."
                    ),
                )
        else:
            return ReachabilityResult(
                reachable=False,
                path=[src.id, router.id],
                path_labels=[src.label, router.label],
                reason=(
                    f"Source '{src.label}' has no default gateway configured. "
                    f"A gateway is required to reach '{dst.label}' on a different subnet. "
                    f"Configure a default gateway pointing to '{router.label}'."
                ),
            )

        # Check for firewall between router and dest
        router_neighbors = _get_neighbors(graph, router.id)
        for n in router_neighbors:
            if n.type == "firewall":
                allowed, rule = _evaluate_firewall_rules(n, src_ip, dst_ip, protocol, port)
                if not allowed:
                    return ReachabilityResult(
                        reachable=False,
                        path=[src.id, router.id, n.id, dst.id],
                        path_labels=[src.label, router.label, n.label, dst.label],
                        reason=f"Firewall '{n.label}' blocked the connection from '{src.label}' to '{dst.label}'.",
                        blocked_by=n.id,
                        firewall_rule_hit=rule,
                    )

        return ReachabilityResult(
            reachable=True,
            path=[src.id, router.id, dst.id],
            path_labels=[src.label, router.label, dst.label],
            reason=(
                f"Routed via '{router.label}' from {src_ip}/{src_prefix} to {dst_ip}/{dst_prefix}."
            ),
        )

    # Case 4: No path found
    src_gw = src.config.get("default_gateway", "")
    if not src_gw:
        reason = (
            f"No route to '{dst.label}'. Source '{src.label}' has no default gateway configured "
            f"and no direct connection to destination."
        )
    else:
        reason = (
            f"No route to '{dst.label}' ({dst_ip}/{dst_prefix}). "
            f"Check that a router connects the '{src.label}' network to the destination network."
        )

    return ReachabilityResult(
        reachable=False,
        path=[src.id],
        path_labels=[src.label],
        reason=reason,
    )
