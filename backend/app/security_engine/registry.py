from __future__ import annotations

from abc import ABC, abstractmethod

from ..schemas.lab import GraphData, Finding


class SecurityRule(ABC):
    """Base class for all security rules."""

    rule_id: str
    title: str
    severity: str  # critical, high, medium, low
    category: str

    @abstractmethod
    def evaluate(self, graph: GraphData) -> list[Finding]:
        """Evaluate this rule against the infrastructure graph.

        Returns a list of Finding objects for each violation detected.
        """
        ...


class RuleRegistry:
    """Registry of all security rules."""

    def __init__(self) -> None:
        self._rules: list[SecurityRule] = []

    def register(self, rule: SecurityRule) -> None:
        self._rules.append(rule)

    def get_rules(self) -> list[SecurityRule]:
        return list(self._rules)

    def get_rule(self, rule_id: str) -> SecurityRule | None:
        for r in self._rules:
            if r.rule_id == rule_id:
                return r
        return None


# Global registry instance
registry = RuleRegistry()
