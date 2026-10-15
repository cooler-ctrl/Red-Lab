from __future__ import annotations

from ..registry import SecurityRule
from ...schemas.lab import GraphData, Finding


class PublicRDSRule(SecurityRule):
    rule_id = "RDS_PUBLIC_ACCESS"
    title = "Publicly Accessible Database"
    severity = "high"
    category = "Database"

    def evaluate(self, graph: GraphData) -> list[Finding]:
        findings: list[Finding] = []
        # Build a map of security group configs for cross-referencing
        sg_configs = {}
        for node in graph.nodes:
            if node.type == "security_group":
                sg_configs[node.id] = node.config

        for node in graph.nodes:
            if node.type != "rds":
                continue
            cfg = node.config
            if not cfg.get("publicly_accessible", False):
                continue

            # Check if any attached SG is also overly permissive
            sg_ids = cfg.get("security_group_ids", [])
            has_permissive_sg = False
            for sg_id in sg_ids:
                sg_cfg = sg_configs.get(sg_id, {})
                for rule in sg_cfg.get("inbound_rules", []):
                    source = rule.get("source", "")
                    if source.strip() in ("0.0.0.0/0", "::/0", "*"):
                        has_permissive_sg = True
                        break

            severity = "critical" if has_permissive_sg else "high"

            findings.append(
                Finding(
                    rule_id=self.rule_id,
                    title=self.title,
                    severity=severity,
                    category=self.category,
                    affected_resource_id=node.id,
                    affected_resource_name=node.label,
                    explanation=(
                        f"The RDS database \"{node.label}\" has public accessibility "
                        f"enabled. "
                        + (
                            "Combined with an overly permissive security group, "
                            "the database is directly reachable from the internet."
                            if has_permissive_sg
                            else "While security group rules may still restrict access, "
                            "enabling public accessibility increases the attack surface."
                        )
                    ),
                    impact=(
                        "A publicly accessible database can be targeted by brute-force "
                        "attacks, SQL injection, and known vulnerability exploits. "
                        "Successful exploitation could lead to complete data exfiltration, "
                        "data manipulation, or data destruction."
                    ),
                    remediation=(
                        "1. Disable public accessibility on the RDS instance.\n"
                        "2. Place the database in a private subnet.\n"
                        "3. Use a bastion host or VPN for database administration.\n"
                        "4. Restrict security group rules to application-tier IPs only."
                    ),
                    references=[
                        "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_VPC.WorkingWithRDSInstanceinaVPC.html"
                    ],
                )
            )
        return findings


class UnencryptedRDSRule(SecurityRule):
    rule_id = "RDS_UNENCRYPTED"
    title = "Unencrypted Database"
    severity = "medium"
    category = "Database"

    def evaluate(self, graph: GraphData) -> list[Finding]:
        findings: list[Finding] = []
        for node in graph.nodes:
            if node.type != "rds":
                continue
            cfg = node.config
            if not cfg.get("encryption", True):
                findings.append(
                    Finding(
                        rule_id=self.rule_id,
                        title=self.title,
                        severity="medium",
                        category=self.category,
                        affected_resource_id=node.id,
                        affected_resource_name=node.label,
                        explanation=(
                            f"The RDS database \"{node.label}\" does not have encryption "
                            f"at rest enabled. Data stored in this database is not "
                            f"encrypted on the underlying storage."
                        ),
                        impact=(
                            "Without encryption at rest, database data is vulnerable if "
                            "the underlying storage infrastructure is compromised. This "
                            "also violates common compliance frameworks including HIPAA, "
                            "PCI-DSS, SOC 2, and GDPR."
                        ),
                        remediation=(
                            "1. Enable encryption at rest using AWS KMS.\n"
                            "2. Note: encryption cannot be enabled on an existing unencrypted "
                            "instance — you must create an encrypted snapshot and restore from it.\n"
                            "3. Enable encryption in transit (SSL/TLS) for database connections."
                        ),
                        references=[
                            "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.Encryption.html"
                        ],
                    )
                )
        return findings
