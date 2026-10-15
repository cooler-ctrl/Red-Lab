import pytest
from app.schemas.lab import GraphData, GraphNode, GraphEdge
from app.security_engine.registry import registry
from app.security_engine.analyzer import SecurityAnalyzer
import app.security_engine.rules  # noqa: F401


@pytest.fixture
def analyzer():
    return SecurityAnalyzer(registry)


def test_registry_has_all_rules():
    rules = registry.get_rules()
    rule_ids = {r.rule_id for r in rules}
    expected_rule_ids = {
        "S3_PUBLIC_ACCESS",
        "S3_UNENCRYPTED",
        "SG_OVERLY_PERMISSIVE",
        "RDS_PUBLIC_ACCESS",
        "RDS_UNENCRYPTED",
        "IAM_OVERLY_PERMISSIVE",
        "EC2_PUBLIC_EXPOSURE",
        "EC2_MISSING_IAM_ROLE",
        "SUBNET_PUBLIC_ROUTING",
        "RESOURCE_MISSING_SG",
    }
    assert expected_rule_ids.issubset(rule_ids)


# 1. S3 Tests (Positive and Negative)
def test_s3_public_access_detected(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="s3-vuln",
                type="s3",
                label="Public Bucket",
                config={"public_access": True, "block_public_access": False, "encryption": True},
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln_findings = [f for f in result["findings"] if f.rule_id == "S3_PUBLIC_ACCESS"]
    assert len(vuln_findings) == 1
    assert vuln_findings[0].severity == "high"
    assert vuln_findings[0].affected_resource_id == "s3-vuln"


def test_s3_block_public_access_enabled_passes(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="s3-safe",
                type="s3",
                label="Secure Bucket",
                config={"public_access": True, "block_public_access": True, "encryption": True},
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln_findings = [f for f in result["findings"] if f.rule_id == "S3_PUBLIC_ACCESS"]
    assert len(vuln_findings) == 0


def test_s3_unencrypted_detected(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="s3-no-enc",
                type="s3",
                label="Unencrypted Bucket",
                config={"public_access": False, "block_public_access": True, "encryption": False},
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln_findings = [f for f in result["findings"] if f.rule_id == "S3_UNENCRYPTED"]
    assert len(vuln_findings) == 1
    assert vuln_findings[0].severity == "medium"


def test_s3_encrypted_passes(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="s3-enc",
                type="s3",
                label="Encrypted Bucket",
                config={"public_access": False, "block_public_access": True, "encryption": True},
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln_findings = [f for f in result["findings"] if f.rule_id == "S3_UNENCRYPTED"]
    assert len(vuln_findings) == 0


# 2. Security Group Tests (Positive and Negative)
def test_sg_overly_permissive_ssh_detected(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="sg-ssh",
                type="security_group",
                label="Open SSH SG",
                config={
                    "inbound_rules": [
                        {"protocol": "tcp", "port_range": "22", "source": "0.0.0.0/0", "description": "SSH"}
                    ]
                },
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln_findings = [f for f in result["findings"] if f.rule_id == "SG_OVERLY_PERMISSIVE"]
    assert len(vuln_findings) == 1
    assert vuln_findings[0].severity == "high"


def test_sg_overly_permissive_database_port_is_critical(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="sg-db",
                type="security_group",
                label="Open DB SG",
                config={
                    "inbound_rules": [
                        {"protocol": "tcp", "port_range": "3306", "source": "0.0.0.0/0", "description": "MySQL"}
                    ]
                },
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln_findings = [f for f in result["findings"] if f.rule_id == "SG_OVERLY_PERMISSIVE"]
    assert len(vuln_findings) == 1
    assert vuln_findings[0].severity == "critical"


def test_sg_restricted_source_passes(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="sg-corp",
                type="security_group",
                label="Internal SG",
                config={
                    "inbound_rules": [
                        {"protocol": "tcp", "port_range": "22", "source": "10.0.0.0/16", "description": "SSH from VPC"},
                        {"protocol": "tcp", "port_range": "3306", "source": "10.0.1.0/24", "description": "DB from App Subnet"},
                    ]
                },
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln_findings = [f for f in result["findings"] if f.rule_id == "SG_OVERLY_PERMISSIVE"]
    assert len(vuln_findings) == 0


# 3. RDS Tests (Positive and Negative)
def test_rds_public_access_detected(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="rds-pub",
                type="rds",
                label="Public Postgres",
                config={
                    "publicly_accessible": True,
                    "encryption": True,
                    "security_group_ids": [],
                },
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln_findings = [f for f in result["findings"] if f.rule_id == "RDS_PUBLIC_ACCESS"]
    assert len(vuln_findings) == 1
    assert vuln_findings[0].severity in ("high", "critical")


def test_rds_private_passes(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="rds-priv",
                type="rds",
                label="Private Postgres",
                config={
                    "publicly_accessible": False,
                    "encryption": True,
                    "security_group_ids": ["sg-1"],
                },
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln_findings = [f for f in result["findings"] if f.rule_id == "RDS_PUBLIC_ACCESS"]
    assert len(vuln_findings) == 0


def test_rds_unencrypted_detected(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="rds-unenc",
                type="rds",
                label="Unencrypted DB",
                config={"publicly_accessible": False, "encryption": False, "security_group_ids": ["sg-1"]},
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln_findings = [f for f in result["findings"] if f.rule_id == "RDS_UNENCRYPTED"]
    assert len(vuln_findings) == 1
    assert vuln_findings[0].severity == "medium"


# 4. IAM Tests (Positive and Negative)
def test_iam_wildcard_detected(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="iam-admin",
                type="iam_role",
                label="Super Admin Role",
                config={
                    "policies": [
                        {"name": "AdminPolicy", "actions": ["*"], "resources": ["*"]}
                    ]
                },
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln_findings = [f for f in result["findings"] if f.rule_id == "IAM_OVERLY_PERMISSIVE"]
    assert len(vuln_findings) == 1
    assert vuln_findings[0].severity == "critical"


def test_iam_least_privilege_passes(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="iam-scoped",
                type="iam_role",
                label="App Role",
                config={
                    "policies": [
                        {"name": "AppS3Reader", "actions": ["s3:GetObject"], "resources": ["arn:aws:s3:::app-data/*"]}
                    ]
                },
            )
        ]
    )
    result = analyzer.analyze(graph)
    vuln_findings = [f for f in result["findings"] if f.rule_id == "IAM_OVERLY_PERMISSIVE"]
    assert len(vuln_findings) == 0


# 5. EC2 Tests (Positive and Negative)
def test_ec2_public_exposure_with_open_sg(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="ec2-web",
                type="ec2",
                label="Bastion Host",
                config={"public_ip": True, "security_group_ids": ["sg-open"], "iam_role_id": "iam-1"},
            ),
            GraphNode(
                id="sg-open",
                type="security_group",
                label="Open SG",
                config={
                    "inbound_rules": [
                        {"protocol": "tcp", "port_range": "22", "source": "0.0.0.0/0", "description": "SSH"}
                    ]
                },
            ),
        ]
    )
    result = analyzer.analyze(graph)
    ec2_findings = [f for f in result["findings"] if f.rule_id == "EC2_PUBLIC_EXPOSURE"]
    assert len(ec2_findings) == 1
    assert ec2_findings[0].affected_resource_id == "ec2-web"


def test_ec2_without_public_ip_passes_exposure(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="ec2-internal",
                type="ec2",
                label="Internal Worker",
                config={"public_ip": False, "security_group_ids": ["sg-open"], "iam_role_id": "iam-1"},
            ),
            GraphNode(
                id="sg-open",
                type="security_group",
                label="Open SG",
                config={
                    "inbound_rules": [
                        {"protocol": "tcp", "port_range": "22", "source": "0.0.0.0/0", "description": "SSH"}
                    ]
                },
            ),
        ]
    )
    result = analyzer.analyze(graph)
    ec2_findings = [f for f in result["findings"] if f.rule_id == "EC2_PUBLIC_EXPOSURE"]
    assert len(ec2_findings) == 0


def test_ec2_missing_iam_role(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="ec2-no-iam",
                type="ec2",
                label="Instance without Role",
                config={"public_ip": False, "security_group_ids": ["sg-1"], "iam_role_id": ""},
            )
        ]
    )
    result = analyzer.analyze(graph)
    iam_findings = [f for f in result["findings"] if f.rule_id == "EC2_MISSING_IAM_ROLE"]
    assert len(iam_findings) == 1


# 6. Missing SG Tests
def test_resource_missing_sg(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="ec2-no-sg",
                type="ec2",
                label="Unguarded EC2",
                config={"public_ip": False, "security_group_ids": [], "iam_role_id": "iam-1"},
            ),
            GraphNode(
                id="rds-no-sg",
                type="rds",
                label="Unguarded RDS",
                config={"publicly_accessible": False, "encryption": True, "security_group_ids": []},
            ),
        ]
    )
    result = analyzer.analyze(graph)
    missing_sg_findings = [f for f in result["findings"] if f.rule_id == "RESOURCE_MISSING_SG"]
    assert len(missing_sg_findings) == 2


# 7. Attack Path Analysis Test
def test_attack_path_generation(analyzer):
    graph = GraphData(
        nodes=[
            GraphNode(
                id="ec2-target",
                type="ec2",
                label="Public Web Server",
                config={"public_ip": True, "security_group_ids": ["sg-bad"], "iam_role_id": "iam-admin"},
            ),
            GraphNode(
                id="sg-bad",
                type="security_group",
                label="Open SG",
                config={
                    "inbound_rules": [
                        {"protocol": "tcp", "port_range": "22", "source": "0.0.0.0/0", "description": "SSH"}
                    ]
                },
            ),
            GraphNode(
                id="iam-admin",
                type="iam_role",
                label="AdministratorRole",
                config={
                    "policies": [
                        {"name": "AdminPolicy", "actions": ["*"], "resources": ["*"]}
                    ]
                },
            ),
            GraphNode(
                id="s3-critical",
                type="s3",
                label="Sensitive Customer Data",
                config={"public_access": True, "block_public_access": False, "encryption": False},
            ),
        ],
        edges=[],
    )
    result = analyzer.analyze(graph)
    assert len(result["attack_paths"]) >= 1
    path = result["attack_paths"][0]
    assert path.severity == "critical"
    assert len(path.steps) >= 3
    assert any(s.resource_id == "ec2-target" for s in path.steps)
    assert any(s.resource_id == "iam-admin" for s in path.steps)
    assert any(s.resource_id == "s3-critical" for s in path.steps)


# 8. Full Remediation Cycle Test
def test_full_remediation_cycle(analyzer):
    # Step A: Vulnerable state
    vulnerable_s3 = GraphNode(
        id="bucket-1",
        type="s3",
        label="Company Files",
        config={"public_access": True, "block_public_access": False, "encryption": False},
    )
    graph_initial = GraphData(nodes=[vulnerable_s3])
    res_initial = analyzer.analyze(graph_initial)
    initial_rule_ids = {f.rule_id for f in res_initial["findings"]}
    assert "S3_PUBLIC_ACCESS" in initial_rule_ids
    assert "S3_UNENCRYPTED" in initial_rule_ids
    assert res_initial["risk_score"] > 0

    # Step B: Remediation applied
    fixed_s3 = GraphNode(
        id="bucket-1",
        type="s3",
        label="Company Files",
        config={"public_access": False, "block_public_access": True, "encryption": True},
    )
    graph_fixed = GraphData(nodes=[fixed_s3])
    res_fixed = analyzer.analyze(graph_fixed)
    fixed_rule_ids = {f.rule_id for f in res_fixed["findings"]}
    assert "S3_PUBLIC_ACCESS" not in fixed_rule_ids
    assert "S3_UNENCRYPTED" not in fixed_rule_ids
    assert res_fixed["failed"] == 0
    assert res_fixed["risk_score"] == 0.0
