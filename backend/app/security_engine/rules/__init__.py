"""Security rule registration.

All rules are imported and registered when this module is loaded.
"""
from ..registry import registry
from .s3_rules import PublicS3BucketRule, UnencryptedS3Rule
from .sg_rules import OverlyPermissiveSGRule
from .rds_rules import PublicRDSRule, UnencryptedRDSRule
from .iam_rules import OverlyPermissiveIAMRule
from .ec2_rules import PublicEC2Rule, MissingIAMRoleRule
from .network_rules import PublicSubnetRule, MissingSGRule

_RULE_CLASSES = [
    PublicS3BucketRule,
    UnencryptedS3Rule,
    OverlyPermissiveSGRule,
    PublicRDSRule,
    UnencryptedRDSRule,
    OverlyPermissiveIAMRule,
    PublicEC2Rule,
    MissingIAMRoleRule,
    PublicSubnetRule,
    MissingSGRule,
]

for _cls in _RULE_CLASSES:
    registry.register(_cls())
