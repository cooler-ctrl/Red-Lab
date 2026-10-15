from __future__ import annotations

from ..registry import SecurityRule
from ...schemas.lab import GraphData, Finding


class PublicSubnetRule(SecurityRule):
    rule_id = "SUBNET_PUBLIC_ROUTING"
    title = "Public Subnet with Internet Routing"
    severity = "low"
    category = "Networking"

    def evaluate(self, graph: GraphData) -> list[Finding]:
        findings: list[Finding] = []

        # Find VPCs with internet gateways attached
        vpcs_with_igw: set[str] = set()
        for edge in graph.edges:
            src = next((n for n in graph.nodes if n.id == edge.source), None)
            tgt = next((n for n in graph.nodes if n.id == edge.target), None)
            if src and tgt:
                if src.type == "internet_gateway" and tgt.type == "vpc":
                    vpcs_with_igw.add(tgt.id)
                elif tgt.type == "internet_gateway" and src.type == "vpc":
                    vpcs_with_igw.add(src.id)

        for node in graph.nodes:
            if node.type != "subnet":
                continue
            cfg = node.config
            if not cfg.get("is_public", False):
                continue

            # Check if parent VPC has an internet gateway
            vpc_id = cfg.get("vpc_id", "")
            # Also check edges for containment
            for edge in graph.edges:
                if edge.source == node.id and edge.relationship_type == "contains":
                    target_node = next(
                        (n for n in graph.nodes if n.id == edge.target), None
                    )
                    if target_node and target_node.type == "vpc":
                        vpc_id = target_node.id

            if vpc_id in vpcs_with_igw:
                findings.append(
                    Finding(
                        rule_id=self.rule_id,
                        title=self.title,
                        severity="low",
                        category=self.category,
                        affected_resource_id=node.id,
                        affected_resource_name=node.label,
                        explanation=(
                            f"The subnet \"{node.label}\" is configured as a public "
                            f"subnet and its VPC has an internet gateway attached. "
                            f"Resources in this subnet can have public IP addresses "
                            f"and be directly reachable from the internet."
                        ),
                        impact=(
                            "Public subnets are a normal part of cloud architecture, "
                            "but resources placed in them should be intentionally "
                            "internet-facing. Misconfigured resources in public subnets "
                            "may be exposed unintentionally."
                        ),
                        remediation=(
                            "1. Verify that only intentionally public resources are in this subnet.\n"
                            "2. Place backend services, databases, and internal tools in private subnets.\n"
                            "3. Use Network ACLs as an additional layer of protection.\n"
                            "4. Monitor for unintended public IP assignments."
                        ),
                        references=[
                            "https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Scenario2.html"
                        ],
                    )
                )
        return findings


class MissingSGRule(SecurityRule):
    rule_id = "RESOURCE_MISSING_SG"
    title = "Resource Missing Security Group"
    severity = "medium"
    category = "Networking"

    def evaluate(self, graph: GraphData) -> list[Finding]:
        findings: list[Finding] = []

        # Build set of resources that have SG attachments via edges
        resources_with_sg: set[str] = set()
        for edge in graph.edges:
            if edge.relationship_type == "attaches":
                src = next((n for n in graph.nodes if n.id == edge.source), None)
                tgt = next((n for n in graph.nodes if n.id == edge.target), None)
                if src and src.type == "security_group":
                    resources_with_sg.add(edge.target)
                if tgt and tgt.type == "security_group":
                    resources_with_sg.add(edge.source)

        for node in graph.nodes:
            if node.type not in ("ec2", "rds"):
                continue

            cfg = node.config
            sg_ids = cfg.get("security_group_ids", [])
            has_sg = bool(sg_ids) or node.id in resources_with_sg

            if not has_sg:
                resource_label = "EC2 instance" if node.type == "ec2" else "RDS database"
                findings.append(
                    Finding(
                        rule_id=self.rule_id,
                        title=self.title,
                        severity="medium",
                        category=self.category,
                        affected_resource_id=node.id,
                        affected_resource_name=node.label,
                        explanation=(
                            f"The {resource_label} \"{node.label}\" does not have any "
                            f"security groups attached. Security groups act as virtual "
                            f"firewalls that control inbound and outbound traffic."
                        ),
                        impact=(
                            "Without explicit security group rules, the resource may use "
                            "default security group settings which could be overly permissive. "
                            "Explicit security groups ensure intentional network access control."
                        ),
                        remediation=(
                            "1. Create a security group with appropriate inbound and outbound rules.\n"
                            "2. Attach the security group to this resource.\n"
                            "3. Follow the principle of least privilege for network access.\n"
                            "4. Restrict inbound access to only required ports and sources."
                        ),
                        references=[
                            "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html"
                        ],
                    )
                )
        return findings
