from __future__ import annotations

from ..registry import SecurityRule
from ...schemas.lab import GraphData, Finding
from .sg_rules import _is_unrestricted, SENSITIVE_PORTS, _parse_port_range


class PublicEC2Rule(SecurityRule):
    rule_id = "EC2_PUBLIC_EXPOSURE"
    title = "EC2 Instance with Public Exposure"
    severity = "high"
    category = "Compute"

    def evaluate(self, graph: GraphData) -> list[Finding]:
        findings: list[Finding] = []
        # Build SG config lookup
        sg_configs = {}
        for node in graph.nodes:
            if node.type == "security_group":
                sg_configs[node.id] = node.config

        for node in graph.nodes:
            if node.type != "ec2":
                continue
            cfg = node.config
            if not cfg.get("public_ip", False):
                continue

            # Find attached security groups
            sg_ids = cfg.get("security_group_ids", [])
            # Also check edges for SG attachments
            for edge in graph.edges:
                if edge.relationship_type == "attaches" and edge.target == node.id:
                    src_node = next(
                        (n for n in graph.nodes if n.id == edge.source), None
                    )
                    if src_node and src_node.type == "security_group":
                        if src_node.id not in sg_ids:
                            sg_ids.append(src_node.id)

            dangerous_ports = []
            for sg_id in sg_ids:
                sg_cfg = sg_configs.get(sg_id, {})
                for rule in sg_cfg.get("inbound_rules", []):
                    source = rule.get("source", "")
                    if not _is_unrestricted(source):
                        continue
                    port_range = rule.get("port_range", "")
                    ports = _parse_port_range(port_range)
                    for port in ports:
                        if str(port) in SENSITIVE_PORTS:
                            dangerous_ports.append((port, SENSITIVE_PORTS[str(port)][0]))

            if not dangerous_ports:
                continue

            port_list = ", ".join(
                f"{name} (port {port})" for port, name in dangerous_ports[:5]
            )
            findings.append(
                Finding(
                    rule_id=self.rule_id,
                    title=self.title,
                    severity="high",
                    category=self.category,
                    affected_resource_id=node.id,
                    affected_resource_name=node.label,
                    explanation=(
                        f"The EC2 instance \"{node.label}\" has a public IP enabled "
                        f"and its security group(s) allow unrestricted inbound access "
                        f"on sensitive ports: {port_list}."
                    ),
                    impact=(
                        "This instance is directly reachable from the internet on "
                        "sensitive ports. Attackers can perform port scanning, brute-force "
                        "attacks, and exploit known vulnerabilities to gain unauthorized access."
                    ),
                    remediation=(
                        "1. Remove the public IP if the instance doesn't need internet-facing access.\n"
                        "2. Restrict security group rules to specific trusted IP ranges.\n"
                        "3. Use a bastion host or VPN for administrative access.\n"
                        "4. Place the instance in a private subnet behind a load balancer."
                    ),
                    references=[
                        "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-security-groups.html"
                    ],
                )
            )
        return findings


class MissingIAMRoleRule(SecurityRule):
    rule_id = "EC2_MISSING_IAM_ROLE"
    title = "EC2 Instance Missing IAM Role"
    severity = "low"
    category = "Compute"

    def evaluate(self, graph: GraphData) -> list[Finding]:
        findings: list[Finding] = []
        for node in graph.nodes:
            if node.type != "ec2":
                continue
            cfg = node.config
            iam_role_id = cfg.get("iam_role_id", "")
            if not iam_role_id:
                findings.append(
                    Finding(
                        rule_id=self.rule_id,
                        title=self.title,
                        severity="low",
                        category=self.category,
                        affected_resource_id=node.id,
                        affected_resource_name=node.label,
                        explanation=(
                            f"The EC2 instance \"{node.label}\" does not have an IAM role "
                            f"attached. Without an IAM role, applications on this instance "
                            f"cannot securely access other AWS services using temporary credentials."
                        ),
                        impact=(
                            "Without an IAM role, developers may embed long-lived access "
                            "keys in the application code or configuration files, which is "
                            "a security anti-pattern that increases the risk of credential leaks."
                        ),
                        remediation=(
                            "1. Create an IAM role with the minimum required permissions.\n"
                            "2. Attach the role to the EC2 instance.\n"
                            "3. Use the instance metadata service to obtain temporary credentials.\n"
                            "4. Remove any hardcoded access keys from the application."
                        ),
                        references=[
                            "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html"
                        ],
                    )
                )
        return findings
