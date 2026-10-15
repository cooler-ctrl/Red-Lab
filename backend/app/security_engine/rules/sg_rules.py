from __future__ import annotations

from ..registry import SecurityRule
from ...schemas.lab import GraphData, Finding


# Ports considered sensitive when exposed to 0.0.0.0/0
SENSITIVE_PORTS = {
    "22": ("SSH", "high"),
    "3389": ("RDP", "high"),
    "3306": ("MySQL", "critical"),
    "5432": ("PostgreSQL", "critical"),
    "1433": ("MSSQL", "critical"),
    "27017": ("MongoDB", "critical"),
    "6379": ("Redis", "high"),
}


def _parse_port_range(port_range: str) -> list[int]:
    """Parse a port range string like '22', '80-443', or '0-65535'."""
    port_range = port_range.strip()
    if port_range in ("-1", "*", "all"):
        return list(range(0, 65536))  # represents all ports
    if "-" in port_range:
        parts = port_range.split("-")
        try:
            start, end = int(parts[0]), int(parts[1])
            return list(range(start, end + 1))
        except (ValueError, IndexError):
            return []
    try:
        return [int(port_range)]
    except ValueError:
        return []


def _is_unrestricted(source: str) -> bool:
    return source.strip() in ("0.0.0.0/0", "::/0", "*")


class OverlyPermissiveSGRule(SecurityRule):
    rule_id = "SG_OVERLY_PERMISSIVE"
    title = "Overly Permissive Security Group"
    severity = "high"
    category = "Networking"

    def evaluate(self, graph: GraphData) -> list[Finding]:
        findings: list[Finding] = []
        for node in graph.nodes:
            if node.type != "security_group":
                continue
            cfg = node.config
            inbound_rules = cfg.get("inbound_rules", [])

            for rule in inbound_rules:
                source = rule.get("source", "")
                if not _is_unrestricted(source):
                    continue

                port_range = rule.get("port_range", "")
                ports = _parse_port_range(port_range)

                # Check for all-ports open
                if len(ports) > 1000:
                    findings.append(
                        Finding(
                            rule_id=self.rule_id,
                            title="Security Group Allows All Inbound Traffic",
                            severity="critical",
                            category=self.category,
                            affected_resource_id=node.id,
                            affected_resource_name=node.label,
                            explanation=(
                                f"The security group \"{node.label}\" allows inbound "
                                f"traffic on all ports from {source}. This is equivalent "
                                f"to having no firewall protection."
                            ),
                            impact=(
                                "All services running on associated resources are "
                                "exposed to the internet. Attackers can probe all ports, "
                                "exploit any vulnerable service, and potentially gain "
                                "full access to the system."
                            ),
                            remediation=(
                                "1. Restrict inbound rules to only required ports.\n"
                                "2. Use specific source IP ranges or security group references.\n"
                                "3. Follow the principle of least privilege for network access."
                            ),
                            references=[
                                "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html"
                            ],
                        )
                    )
                    continue

                # Check individual sensitive ports
                for port in ports:
                    port_str = str(port)
                    if port_str in SENSITIVE_PORTS:
                        service_name, sev = SENSITIVE_PORTS[port_str]
                        findings.append(
                            Finding(
                                rule_id=self.rule_id,
                                title=f"{service_name} (port {port}) Open to Internet",
                                severity=sev,
                                category=self.category,
                                affected_resource_id=node.id,
                                affected_resource_name=node.label,
                                explanation=(
                                    f"The security group \"{node.label}\" allows inbound "
                                    f"{service_name} traffic (port {port}) from {source}. "
                                    f"This exposes the {service_name} service to the entire internet."
                                ),
                                impact=(
                                    f"Attackers can attempt brute-force attacks, exploit known "
                                    f"vulnerabilities, or perform credential stuffing against the "
                                    f"{service_name} service. Database ports are especially critical "
                                    f"as they may expose sensitive data."
                                    if sev == "critical"
                                    else f"Attackers can attempt brute-force attacks or exploit "
                                    f"known vulnerabilities in the {service_name} service."
                                ),
                                remediation=(
                                    f"1. Restrict port {port} access to specific trusted IP ranges.\n"
                                    f"2. Use a VPN or bastion host for {service_name} access.\n"
                                    f"3. Consider using AWS Systems Manager Session Manager instead of direct SSH."
                                    if port_str == "22"
                                    else f"1. Restrict port {port} access to specific trusted IP ranges.\n"
                                    f"2. Place the {service_name} service in a private subnet.\n"
                                    f"3. Use a VPN or SSH tunnel for administrative access."
                                ),
                                references=[
                                    "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html"
                                ],
                            )
                        )
        return findings
