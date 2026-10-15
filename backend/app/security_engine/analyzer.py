from __future__ import annotations

from ..schemas.lab import GraphData, Finding, AttackPath, AttackPathStep
from .registry import RuleRegistry


class SecurityAnalyzer:
    """Runs all registered security rules against an infrastructure graph."""

    def __init__(self, registry: RuleRegistry) -> None:
        self.registry = registry

    def analyze(self, graph: GraphData) -> dict:
        all_findings: list[Finding] = []
        total_rules = len(self.registry.get_rules())

        for rule in self.registry.get_rules():
            findings = rule.evaluate(graph)
            all_findings.extend(findings)

        # Count unique rules that produced findings
        triggered_rule_ids = set(f.rule_id for f in all_findings)
        failed = len(triggered_rule_ids)
        passed = total_rules - failed

        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for f in all_findings:
            severity_counts[f.severity] = severity_counts.get(f.severity, 0) + 1

        risk_score = self._calculate_risk_score(all_findings, total_rules)
        attack_paths = self._find_attack_paths(graph, all_findings)

        return {
            "total_rules": total_rules,
            "passed": passed,
            "failed": failed,
            "findings": all_findings,
            "findings_by_severity": severity_counts,
            "risk_score": risk_score,
            "attack_paths": attack_paths,
            "summary": self._generate_summary(all_findings, total_rules),
        }

    def _calculate_risk_score(self, findings: list[Finding], total_rules: int) -> float:
        """Deterministic risk score: weighted sum of findings capped at 100.

        Weights: critical=10, high=7, medium=4, low=1.
        Score = min(100, (weighted_sum / (total_rules * 10)) * 100).
        """
        if total_rules == 0:
            return 0.0
        weights = {"critical": 10, "high": 7, "medium": 4, "low": 1}
        max_possible = total_rules * 10
        weighted_sum = sum(weights.get(f.severity, 1) for f in findings)
        score = min(100.0, (weighted_sum / max_possible) * 100)
        return round(score, 1)

    def _generate_summary(self, findings: list[Finding], total_rules: int) -> str:
        if not findings:
            return f"All {total_rules} security checks passed. No issues found."
        critical = sum(1 for f in findings if f.severity == "critical")
        high = sum(1 for f in findings if f.severity == "high")
        medium = sum(1 for f in findings if f.severity == "medium")
        low = sum(1 for f in findings if f.severity == "low")
        parts = []
        if critical:
            parts.append(f"{critical} critical")
        if high:
            parts.append(f"{high} high")
        if medium:
            parts.append(f"{medium} medium")
        if low:
            parts.append(f"{low} low")
        breakdown = ", ".join(parts)
        return (
            f"Found {len(findings)} security issue(s) ({breakdown}) "
            f"across {total_rules} rules evaluated."
        )

    def _find_attack_paths(
        self, graph: GraphData, findings: list[Finding]
    ) -> list[AttackPath]:
        """Simple attack-path analysis: find chains of
        internet → public EC2 → overpermissive IAM → sensitive resource.
        """
        paths: list[AttackPath] = []
        nodes_by_id = {n.id: n for n in graph.nodes}
        finding_resource_ids = {f.affected_resource_id for f in findings}

        ec2_nodes = [n for n in graph.nodes if n.type == "ec2"]
        for ec2 in ec2_nodes:
            cfg = ec2.config
            if not cfg.get("public_ip", False):
                continue
            if ec2.id not in finding_resource_ids:
                continue

            iam_role_id = cfg.get("iam_role_id", "")
            if not iam_role_id or iam_role_id not in finding_resource_ids:
                continue

            iam_node = nodes_by_id.get(iam_role_id)
            if not iam_node:
                continue

            # Find sensitive resources (S3, RDS) that also have findings
            targets = [
                n
                for n in graph.nodes
                if n.type in ("s3", "rds") and n.id in finding_resource_ids
            ]
            if not targets:
                continue

            steps = [
                AttackPathStep(
                    resource_id=ec2.id,
                    label=ec2.label,
                    action="Initial access via public IP and open security group",
                ),
                AttackPathStep(
                    resource_id=iam_role_id,
                    label=iam_node.label,
                    action="Leverage overly permissive IAM role to escalate privileges",
                ),
            ]
            for t in targets[:3]:
                steps.append(
                    AttackPathStep(
                        resource_id=t.id,
                        label=t.label,
                        action=f"Access {t.type.upper()} resource with escalated privileges",
                    )
                )

            paths.append(
                AttackPath(
                    id=f"attack-path-{ec2.id}",
                    title="External Access to Sensitive Resources",
                    description=(
                        f"An attacker could access the EC2 instance \"{ec2.label}\" "
                        f"via its public IP, exploit the overly permissive IAM role "
                        f"\"{iam_node.label}\" to reach sensitive resources."
                    ),
                    severity="critical",
                    steps=steps,
                    assumptions=[
                        "Attacker has network access to the public IP",
                        "EC2 instance has an exploitable vulnerability or misconfiguration",
                        "IAM role credentials are accessible from the instance metadata service",
                    ],
                )
            )

        return paths
