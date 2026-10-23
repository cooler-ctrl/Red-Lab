"""Security rule registration.

All network security and attack rules are imported and registered when this module is loaded.
"""
from ..registry import registry
from .network_rules import (
    FirewallPermissiveDefaultRule,
    UnprotectedWANExposureRule,
    PlaintextProtocolRule,
    FirewallPermissiveAnyPortRule,
    ExposedManagementPortRule,
    RouterInsecureDirectWANRule,
    SwitchDefaultVlanExposureRule,
    MissingGatewayRule,
)

_RULE_CLASSES = [
    FirewallPermissiveDefaultRule,
    UnprotectedWANExposureRule,
    PlaintextProtocolRule,
    FirewallPermissiveAnyPortRule,
    ExposedManagementPortRule,
    RouterInsecureDirectWANRule,
    SwitchDefaultVlanExposureRule,
    MissingGatewayRule,
]

for _cls in _RULE_CLASSES:
    registry.register(_cls())
