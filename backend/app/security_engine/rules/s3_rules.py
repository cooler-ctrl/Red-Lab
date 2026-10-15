from __future__ import annotations

from ..registry import SecurityRule
from ...schemas.lab import GraphData, Finding


class PublicS3BucketRule(SecurityRule):
    rule_id = "S3_PUBLIC_ACCESS"
    title = "Publicly Accessible S3 Bucket"
    severity = "high"
    category = "Storage"

    def evaluate(self, graph: GraphData) -> list[Finding]:
        findings: list[Finding] = []
        for node in graph.nodes:
            if node.type != "s3":
                continue
            cfg = node.config
            public_access = cfg.get("public_access", False)
            block_public = cfg.get("block_public_access", True)

            if public_access and not block_public:
                findings.append(
                    Finding(
                        rule_id=self.rule_id,
                        title=self.title,
                        severity="high",
                        category=self.category,
                        affected_resource_id=node.id,
                        affected_resource_name=node.label,
                        explanation=(
                            f"The S3 bucket \"{node.label}\" has public access enabled "
                            f"and Block Public Access is disabled. This means objects in "
                            f"this bucket may be accessible to anyone on the internet."
                        ),
                        impact=(
                            "Sensitive data stored in this bucket could be exposed to "
                            "unauthorized users. Attackers can enumerate and download "
                            "objects, potentially leading to data breaches, compliance "
                            "violations, and reputational damage."
                        ),
                        remediation=(
                            "1. Enable S3 Block Public Access at the bucket level.\n"
                            "2. Review and restrict bucket policies and ACLs.\n"
                            "3. Audit existing objects for sensitive data.\n"
                            "4. Enable access logging to monitor bucket access."
                        ),
                        references=[
                            "https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html"
                        ],
                    )
                )
        return findings


class UnencryptedS3Rule(SecurityRule):
    rule_id = "S3_UNENCRYPTED"
    title = "Unencrypted S3 Bucket"
    severity = "medium"
    category = "Storage"

    def evaluate(self, graph: GraphData) -> list[Finding]:
        findings: list[Finding] = []
        for node in graph.nodes:
            if node.type != "s3":
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
                            f"The S3 bucket \"{node.label}\" does not have server-side "
                            f"encryption enabled. Data stored in this bucket is not "
                            f"encrypted at rest."
                        ),
                        impact=(
                            "Without encryption at rest, data is vulnerable if the "
                            "underlying storage is compromised. This may also violate "
                            "compliance requirements such as HIPAA, PCI-DSS, or GDPR."
                        ),
                        remediation=(
                            "1. Enable default server-side encryption (SSE-S3 or SSE-KMS).\n"
                            "2. Consider using AWS KMS for key management.\n"
                            "3. Enable bucket policies that deny unencrypted uploads."
                        ),
                        references=[
                            "https://docs.aws.amazon.com/AmazonS3/latest/userguide/serv-side-encryption.html"
                        ],
                    )
                )
        return findings
