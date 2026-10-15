from __future__ import annotations

from ..registry import SecurityRule
from ...schemas.lab import GraphData, Finding


class OverlyPermissiveIAMRule(SecurityRule):
    rule_id = "IAM_OVERLY_PERMISSIVE"
    title = "Overly Permissive IAM Role"
    severity = "high"
    category = "Identity"

    def evaluate(self, graph: GraphData) -> list[Finding]:
        findings: list[Finding] = []
        for node in graph.nodes:
            if node.type != "iam_role":
                continue
            cfg = node.config
            policies = cfg.get("policies", [])

            for policy in policies:
                actions = policy.get("actions", [])
                resources = policy.get("resources", [])
                policy_name = policy.get("name", "Unnamed Policy")

                has_wildcard_action = "*" in actions
                has_wildcard_resource = "*" in resources
                has_admin = any(
                    a.lower() in ("*", "iam:*", "administratoraccess")
                    for a in actions
                )

                if has_wildcard_action and has_wildcard_resource:
                    severity = "critical"
                    explanation = (
                        f"The IAM role \"{node.label}\" has the policy "
                        f"\"{policy_name}\" granting wildcard actions (*) on all "
                        f"resources (*). This is equivalent to full administrative "
                        f"access to the AWS account."
                    )
                elif has_admin:
                    severity = "high"
                    explanation = (
                        f"The IAM role \"{node.label}\" has the policy "
                        f"\"{policy_name}\" with broad administrative permissions. "
                        f"This grants more access than most workloads require."
                    )
                else:
                    continue

                findings.append(
                    Finding(
                        rule_id=self.rule_id,
                        title=self.title,
                        severity=severity,
                        category=self.category,
                        affected_resource_id=node.id,
                        affected_resource_name=node.label,
                        explanation=explanation,
                        impact=(
                            "An overly permissive IAM role can be exploited through "
                            "privilege escalation. If an attacker compromises the "
                            "resource using this role, they gain the ability to access, "
                            "modify, or delete any resource in the account — including "
                            "creating new users, modifying security settings, and "
                            "exfiltrating data."
                        ),
                        remediation=(
                            "1. Apply the principle of least privilege.\n"
                            "2. Replace wildcard permissions with specific actions.\n"
                            "3. Scope resources to specific ARNs.\n"
                            "4. Use IAM Access Analyzer to identify unused permissions.\n"
                            "5. Consider using AWS managed policies with narrower scope."
                        ),
                        references=[
                            "https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html"
                        ],
                    )
                )
        return findings
