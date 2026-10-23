from __future__ import annotations

from ..registry import SecurityRule
from ...schemas.lab import GraphData, Finding


class FirewallPermissiveDefaultRule(SecurityRule):
    rule_id = "FIREWALL_DEFAULT_ALLOW"
    title = "Firewall Inbound Policy Set to Default Allow"
    severity = "critical"
    category = "Network Security"

    def evaluate(self, graph: GraphData) -> list[Finding]:
        findings: list[Finding] = []
        for node in graph.nodes:
            if node.type != "firewall":
                continue
            cfg = node.config
            inbound_default = cfg.get("default_inbound_action", "allow")
            if inbound_default.lower() == "allow":
                findings.append(
                    Finding(
                        rule_id=self.rule_id,
                        title=self.title,
                        severity=self.severity,
                        category=self.category,
                        affected_resource_id=node.id,
                        affected_resource_name=node.label,
                        explanation=(
                            f"Firewall '{node.label}' has default inbound action set to 'allow'. "
                            "Unfiltered traffic traverses the perimeter, enabling port scanning "
                            "and arbitrary ingress access."
                        ),
                        impact=(
                            "External actors can probe and reach all internal network interfaces, "
                            "bypassing defense-in-depth perimeter filtering."
                        ),
                        remediation="Set 'default_inbound_action' to 'deny' and configure explicit allow rules.",
                        references=["NIST SP 800-41: Guidelines on Firewalls and Firewall Policy"],
                    )
                )
        return findings


class UnprotectedWANExposureRule(SecurityRule):
    rule_id = "SERVER_UNPROTECTED_DIRECT_WAN"
    title = "Internal Host Directly Exposed to External Network"
    severity = "critical"
    category = "Perimeter Security"

    def evaluate(self, graph: GraphData) -> list[Finding]:
        findings: list[Finding] = []
        external_node_ids = {n.id for n in graph.nodes if n.type == "external_network"}
        if not external_node_ids:
            return findings

        for node in graph.nodes:
            if node.type not in ("server", "pc"):
                continue

            for edge in graph.edges:
                connected_ext = (
                    (edge.source == node.id and edge.target in external_node_ids)
                    or (edge.target == node.id and edge.source in external_node_ids)
                )
                if connected_ext:
                    findings.append(
                        Finding(
                            rule_id=self.rule_id,
                            title=self.title,
                            severity=self.severity,
                            category=self.category,
                            affected_resource_id=node.id,
                            affected_resource_name=node.label,
                            explanation=(
                                f"Host '{node.label}' is directly connected to the external network (WAN) "
                                "without an intervening firewall or gateway."
                            ),
                            impact=(
                                "Host is completely exposed to internet-wide attacks, port scanning, "
                                "and brute-force exploitation."
                            ),
                            remediation="Disconnect direct link to external network. Place host behind a firewall.",
                            references=["CIS Critical Security Controls: Boundary Defense"],
                        )
                    )
                    break
        return findings


class PlaintextProtocolRule(SecurityRule):
    rule_id = "SERVER_PLAINTEXT_PORT"
    title = "Insecure Plaintext Network Service Enabled"
    severity = "high"
    category = "Service Security"

    def evaluate(self, graph: GraphData) -> list[Finding]:
        findings: list[Finding] = []
        insecure_ports = {
            23: "Telnet",
            21: "FTP",
            80: "HTTP (unencrypted)",
        }
        for node in graph.nodes:
            if node.type != "server":
                continue
            services = node.config.get("services", [])
            for svc in services:
                if not isinstance(svc, dict) or not svc.get("enabled", True):
                    continue
                port = int(svc.get("port", 0))
                if port in insecure_ports:
                    svc_name = insecure_ports[port]
                    findings.append(
                        Finding(
                            rule_id=self.rule_id,
                            title=f"Insecure Plaintext Service ({svc_name}) on Port {port}",
                            severity=self.severity,
                            category=self.category,
                            affected_resource_id=node.id,
                            affected_resource_name=node.label,
                            explanation=(
                                f"Server '{node.label}' is running {svc_name} on port {port}. "
                                "Plaintext protocols transmit credentials and data without encryption."
                            ),
                            impact="Attackers on adjacent networks or compromised routers can sniff credentials via MITM.",
                            remediation=f"Disable {svc_name} on port {port} or migrate to SSH/HTTPS with TLS.",
                            references=["NIST SP 800-52: Guidelines for the Selection and Use of TLS"],
                        )
                    )
        return findings


class FirewallPermissiveAnyPortRule(SecurityRule):
    rule_id = "FIREWALL_PERMISSIVE_ANY_PORT"
    title = "Firewall Rule Allows Unrestricted Any-Port Ingress"
    severity = "high"
    category = "Network Security"

    def evaluate(self, graph: GraphData) -> list[Finding]:
        findings: list[Finding] = []
        for node in graph.nodes:
            if node.type != "firewall":
                continue
            rules = node.config.get("inbound_rules", [])
            for r in rules:
                if not isinstance(r, dict) or not r.get("enabled", True):
                    continue
                if r.get("action") != "allow":
                    continue
                src = str(r.get("source", "")).strip()
                port = str(r.get("port_range", "")).strip()
                proto = str(r.get("protocol", "")).strip().lower()

                is_any_source = src in ("0.0.0.0/0", "*", "any", "")
                is_any_port = port in ("0-65535", "any", "*", "")
                is_any_proto = proto in ("any", "*", "-1")

                if is_any_source and (is_any_port or is_any_proto):
                    findings.append(
                        Finding(
                            rule_id=self.rule_id,
                            title=self.title,
                            severity=self.severity,
                            category=self.category,
                            affected_resource_id=node.id,
                            affected_resource_name=node.label,
                            explanation=(
                                f"Firewall '{node.label}' has rule '{r.get('description') or r.get('id', 'rule')}' "
                                f"allowing unrestricted ingress from any source ({src or 'all'}) on port {port or 'all'}."
                            ),
                            impact="Permits unauthorized network port scanning and exposes all backend listening services.",
                            remediation="Scope down firewall rules to specific source CIDRs and destination ports.",
                            references=["PCI DSS Requirement 1: Install and Maintain Network Security Controls"],
                        )
                    )
        return findings


class ExposedManagementPortRule(SecurityRule):
    rule_id = "HOST_EXPOSED_MANAGEMENT_PORT"
    title = "Remote Management Port Exposed to Broad Network"
    severity = "medium"
    category = "Access Control"

    def evaluate(self, graph: GraphData) -> list[Finding]:
        findings: list[Finding] = []
        mgmt_ports = {22: "SSH", 3389: "RDP", 23: "Telnet"}
        for node in graph.nodes:
            if node.type != "server":
                continue
            services = node.config.get("services", [])
            for svc in services:
                if not isinstance(svc, dict) or not svc.get("enabled", True):
                    continue
                port = int(svc.get("port", 0))
                if port in mgmt_ports:
                    findings.append(
                        Finding(
                            rule_id=self.rule_id,
                            title=f"Management Interface ({mgmt_ports[port]}) Exposed on Port {port}",
                            severity=self.severity,
                            category=self.category,
                            affected_resource_id=node.id,
                            affected_resource_name=node.label,
                            explanation=(
                                f"Server '{node.label}' exposes management service {mgmt_ports[port]} on port {port}. "
                                "Unrestricted management access is vulnerable to credential stuffing and brute-force."
                            ),
                            impact="Unauthorized attackers who reach this port can attempt brute-force login attacks.",
                            remediation=f"Isolate port {port} behind an encrypted jump host or dedicated management subnet.",
                            references=["NIST SP 800-123: Guide to General Server Security"],
                        )
                    )
        return findings


class RouterInsecureDirectWANRule(SecurityRule):
    rule_id = "ROUTER_INSECURE_DIRECT_ROUTE"
    title = "Edge Router Connected to WAN Without NAT"
    severity = "medium"
    category = "Routing Security"

    def evaluate(self, graph: GraphData) -> list[Finding]:
        findings: list[Finding] = []
        external_node_ids = {n.id for n in graph.nodes if n.type == "external_network"}
        if not external_node_ids:
            return findings

        for node in graph.nodes:
            if node.type != "router":
                continue
            cfg = node.config
            touches_external = any(
                (edge.source == node.id and edge.target in external_node_ids)
                or (edge.target == node.id and edge.source in external_node_ids)
                for edge in graph.edges
            )
            if touches_external and not cfg.get("nat_enabled", False):
                findings.append(
                    Finding(
                        rule_id=self.rule_id,
                        title=self.title,
                        severity=self.severity,
                        category=self.category,
                        affected_resource_id=node.id,
                        affected_resource_name=node.label,
                        explanation=(
                            f"Router '{node.label}' connects directly to an external network "
                            "but has NAT (Network Address Translation) disabled."
                        ),
                        impact=(
                            "Internal private IP addresses and hosts are directly exposed to the external network, "
                            "leaking internal topology details."
                        ),
                        remediation="Enable NAT on router interfaces facing external networks.",
                        references=["RFC 1918: Address Allocation for Private Internets"],
                    )
                )
        return findings


class SwitchDefaultVlanExposureRule(SecurityRule):
    rule_id = "SWITCH_DEFAULT_VLAN_EXPOSURE"
    title = "Switch Unsegmented on Default VLAN 1"
    severity = "low"
    category = "Layer 2 Security"

    def evaluate(self, graph: GraphData) -> list[Finding]:
        findings: list[Finding] = []
        for node in graph.nodes:
            if node.type != "switch":
                continue
            cfg = node.config
            ports = cfg.get("ports", [])
            default_vlan = cfg.get("default_vlan", 1)
            all_vlan_1 = default_vlan == 1 and all(
                isinstance(p, dict) and p.get("vlan", 1) == 1 for p in ports
            )
            if all_vlan_1:
                findings.append(
                    Finding(
                        rule_id=self.rule_id,
                        title=self.title,
                        severity=self.severity,
                        category=self.category,
                        affected_resource_id=node.id,
                        affected_resource_name=node.label,
                        explanation=(
                            f"Switch '{node.label}' has all interfaces assigned to default VLAN 1. "
                            "All connected devices share the same broadcast domain without segmentation."
                        ),
                        impact="Facilitates broadcast storm propagation, ARP spoofing, and lateral movement.",
                        remediation="Segment connected endpoints into dedicated VLANs (e.g. VLAN 10 for Servers, VLAN 20 for Workstations).",
                        references=["Cisco Layer 2 Security Guidelines: VLAN Segmentation"],
                    )
                )
        return findings


class MissingGatewayRule(SecurityRule):
    rule_id = "HOST_MISSING_DEFAULT_GATEWAY"
    title = "Network Host Missing Default Gateway"
    severity = "low"
    category = "Host Configuration"

    def evaluate(self, graph: GraphData) -> list[Finding]:
        findings: list[Finding] = []
        for node in graph.nodes:
            if node.type not in ("pc", "server"):
                continue
            cfg = node.config
            gw = str(cfg.get("default_gateway", "")).strip()

            has_ip = False
            if node.type == "server" and cfg.get("ip_address"):
                has_ip = True
            elif node.type == "pc":
                for iface in cfg.get("interfaces", []):
                    if isinstance(iface, dict) and iface.get("ip_address"):
                        has_ip = True
                        break

            if has_ip and not gw:
                findings.append(
                    Finding(
                        rule_id=self.rule_id,
                        title=self.title,
                        severity=self.severity,
                        category=self.category,
                        affected_resource_id=node.id,
                        affected_resource_name=node.label,
                        explanation=(
                            f"Host '{node.label}' has an IP address assigned but has no default gateway configured."
                        ),
                        impact="Host is isolated to its local subnet and cannot communicate across routers or receive security patches.",
                        remediation="Configure the default gateway IP to point to the local router interface.",
                        references=["RFC 1122: Requirements for Internet Hosts"],
                    )
                )
        return findings
