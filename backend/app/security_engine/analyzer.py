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
        """Network attack-path analysis:
        Find chains from external/attacker entry points through routers/firewalls
        to vulnerable internal hosts and servers.
        """
        paths: list[AttackPath] = []
        nodes_by_id = {n.id: n for n in graph.nodes}
        finding_resource_ids = {f.affected_resource_id for f in findings}

        # Identify entry nodes: external networks or attacker nodes
        entry_nodes = [
            n for n in graph.nodes
            if n.type == "external_network" or "attacker" in n.label.lower()
        ]
        # If no explicit external/attacker, use any PC
        if not entry_nodes:
            entry_nodes = [n for n in graph.nodes if n.type == "pc"]

        # Target nodes: servers with findings or services
        target_servers = [
            n for n in graph.nodes
            if n.type == "server" and (n.id in finding_resource_ids or n.config.get("services"))
        ]

        # Intermediary firewalls and routers
        firewalls = [n for n in graph.nodes if n.type == "firewall"]
        routers = [n for n in graph.nodes if n.type == "router"]

        for entry in entry_nodes[:2]:
            for target in target_servers[:3]:
                if entry.id == target.id:
                    continue

                steps = [
                    AttackPathStep(
                        resource_id=entry.id,
                        label=entry.label,
                        action=f"Initial network ingress from {entry.label} ({entry.type})",
                    ),
                ]

                # Check for intermediary router
                if routers:
                    r = routers[0]
                    steps.append(
                        AttackPathStep(
                            resource_id=r.id,
                            label=r.label,
                            action=f"Route packets across subnets via {r.label}",
                        )
                    )

                # Check for intermediary firewall
                if firewalls:
                    fw = firewalls[0]
                    fw_has_issues = fw.id in finding_resource_ids
                    action_msg = (
                        f"Bypass permissive rules or default-allow policy on {fw.label}"
                        if fw_has_issues
                        else f"Traverse permitted ports on {fw.label}"
                    )
                    steps.append(
                        AttackPathStep(
                            resource_id=fw.id,
                            label=fw.label,
                            action=action_msg,
                        )
                    )

                # Target server attack step
                target_services = target.config.get("services", [])
                service_names = [s.get("name", "service") for s in target_services if isinstance(s, dict)]
                svc_desc = ", ".join(service_names) if service_names else "exposed ports"

                steps.append(
                    AttackPathStep(
                        resource_id=target.id,
                        label=target.label,
                        action=f"Execute port scan and exploit exposed service ({svc_desc}) on {target.label}",
                    )
                )

                paths.append(
                    AttackPath(
                        id=f"attack-path-{entry.id}-{target.id}",
                        title=f"Network Ingress & Lateral Attack to {target.label}",
                        description=(
                            f"An attacker originating from '{entry.label}' can pivot across the network "
                            f"infrastructure to reach '{target.label}', probe open services ({svc_desc}), "
                            f"and compromise the host."
                        ),
                        severity="critical" if target.id in finding_resource_ids else "high",
                        steps=steps,
                        assumptions=[
                            "Attacker has network reachability to the entry boundary or local segment",
                            "Network path forwards packets to target subnet",
                            "Host runs unhardened services or permissive firewall rules permit ingress",
                        ],
                    )
                )

        return paths
