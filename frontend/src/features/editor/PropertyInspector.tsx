import { AlertTriangle, Trash2, X, Plus, Shield, Lock, ShieldCheck } from 'lucide-react';
import { useEditorStore, type ResourceNodeData } from '../../stores/editorStore';
import type { ResourceType } from '../../types';

interface PropertyInspectorProps {
  collapsed?: boolean;
}

export function PropertyInspector({ collapsed = false }: PropertyInspectorProps) {
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const selectNode = useEditorStore((s) => s.selectNode);
  const nodes = useEditorStore((s) => s.nodes);
  const updateNodeConfig = useEditorStore((s) => s.updateNodeConfig);
  const deleteNode = useEditorStore((s) => s.deleteNode);
  const getNodeFindings = useEditorStore((s) => s.getNodeFindings);
  const appMode = useEditorStore((s) => s.appMode);

  if (collapsed || !selectedNodeId) return null;

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const nodeData = (node.data as ResourceNodeData) || {};
  const resourceType = (nodeData.resourceType as ResourceType) || 'pc';
  const config = (nodeData.config || {}) as Record<string, any>;
  const findings = getNodeFindings(selectedNodeId);

  const isDefensiveResource =
    resourceType === 'firewall' ||
    resourceType === 'ids_ips' ||
    resourceType === 'web_server';

  const handleFieldChange = (field: string, value: any) => {
    updateNodeConfig(selectedNodeId, { ...config, [field]: value });
  };

  return (
    <div className="w-80 bg-[#11151D] border-l border-[#293140] flex flex-col h-full select-none">
      {/* Header */}
      <div className="p-3 border-b border-[#293140] flex items-center justify-between">
        <div>
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              appMode === 'attack' ? 'text-[#FF3B4E]' : 'text-[#3B82F6]'
            }`}
          >
            {resourceType.replace('_', ' ')} Inspector
          </span>
          <h3 className="text-sm font-semibold text-[#F3F5F8] truncate max-w-[200px]">
            {config.name || nodeData.label || node.id}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => selectNode(null)}
          className="text-[#9BA5B5] hover:text-[#F3F5F8] p-1 rounded hover:bg-[#171C26] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Mode notice banner for defensive resources */}
      {appMode === 'attack' && isDefensiveResource && (
        <div className="p-2.5 bg-[#FF3B4E]/10 border-b border-[#FF3B4E]/30 flex items-start gap-2">
          <Lock size={15} className="text-[#FF3B4E] mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-[#FF3B4E]">Defensive Policy Locked</span>
            <p className="text-[11px] text-[#9BA5B5] mt-0.5">
              Switch to <strong className="text-blue-400">DEFEND MODE</strong> on the top toolbar to modify firewall rules, WAF, or IPS protections.
            </p>
          </div>
        </div>
      )}

      {/* Defend Mode active notice */}
      {appMode === 'defend' && isDefensiveResource && (
        <div className="p-2.5 bg-[#3B82F6]/10 border-b border-[#3B82F6]/30 flex items-start gap-2">
          <ShieldCheck size={15} className="text-[#3B82F6] mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-[#3B82F6]">Defensive Configuration Active</span>
            <p className="text-[11px] text-[#9BA5B5] mt-0.5">
              Apply access rules or filters, then click <strong>Verify Defense</strong> in the bottom panel.
            </p>
          </div>
        </div>
      )}

      {/* Security Findings alert if any */}
      {findings.length > 0 && (
        <div className="p-2.5 bg-[#FF3B4E]/10 border-b border-[#FF3B4E]/30 flex items-start gap-2">
          <AlertTriangle size={15} className="text-[#FF3B4E] mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-[#FF3B4E]">
              {findings.length} Security Issue{findings.length > 1 ? 's' : ''} Detected
            </span>
            <p className="text-[11px] text-[#9BA5B5] mt-0.5">
              Review findings and attack paths in the Simulation Panel below.
            </p>
          </div>
        </div>
      )}

      {/* Form content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Name input (common for all) */}
        <div>
          <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Device Name / Label</label>
          <input
            type="text"
            value={config.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none"
          />
        </div>

        {/* PC / Workstation Config */}
        {resourceType === 'pc' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">IP Address (eth0)</label>
              <input
                type="text"
                placeholder="192.168.1.10"
                value={(config.interfaces?.[0]?.ip_address as string) || ''}
                onChange={(e) => {
                  const ifaces = [...(config.interfaces || [{ id: 'eth0', name: 'eth0', enabled: true }])];
                  ifaces[0] = { ...ifaces[0], ip_address: e.target.value };
                  handleFieldChange('interfaces', ifaces);
                }}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#10B981] focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Subnet Prefix (CIDR)</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9BA5B5]">/</span>
                <input
                  type="text"
                  placeholder="24"
                  value={(config.interfaces?.[0]?.cidr_prefix as string) || '24'}
                  onChange={(e) => {
                    const ifaces = [...(config.interfaces || [{ id: 'eth0', name: 'eth0', enabled: true }])];
                    ifaces[0] = { ...ifaces[0], cidr_prefix: e.target.value };
                    handleFieldChange('interfaces', ifaces);
                  }}
                  className="w-20 bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#10B981] focus:outline-none font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Default Gateway</label>
              <input
                type="text"
                placeholder="192.168.1.1"
                value={(config.default_gateway as string) || ''}
                onChange={(e) => handleFieldChange('default_gateway', e.target.value)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#10B981] focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">DNS Server</label>
              <input
                type="text"
                placeholder="8.8.8.8"
                value={(config.dns_servers?.[0] as string) || ''}
                onChange={(e) => handleFieldChange('dns_servers', [e.target.value])}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#10B981] focus:outline-none font-mono"
              />
            </div>
          </div>
        )}

        {/* Router Config */}
        {resourceType === 'router' && (
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!config.nat_enabled}
                onChange={(e) => handleFieldChange('nat_enabled', e.target.checked)}
                className="accent-[#3B82F6] w-4 h-4"
              />
              <span className="text-xs text-[#F3F5F8]">Enable NAT (Network Address Translation)</span>
            </label>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-[#9BA5B5]">Interfaces</label>
                <button
                  type="button"
                  onClick={() => {
                    const ifaces = [...(config.interfaces || [])];
                    const nextIdx = ifaces.length;
                    ifaces.push({
                      id: `eth${nextIdx}`,
                      name: `eth${nextIdx}`,
                      ip_address: `192.168.${nextIdx + 1}.1`,
                      cidr_prefix: '24',
                      enabled: true,
                    });
                    handleFieldChange('interfaces', ifaces);
                  }}
                  className="flex items-center gap-1 text-[11px] text-[#3B82F6] hover:text-[#60A5FA]"
                >
                  <Plus size={12} />
                  Add Interface
                </button>
              </div>

              <div className="space-y-2">
                {(config.interfaces || []).map((iface: any, idx: number) => (
                  <div key={idx} className="bg-[#171C26] p-2.5 rounded border border-[#293140] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#3B82F6] font-mono">{iface.name || `eth${idx}`}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const ifaces = config.interfaces.filter((_: any, i: number) => i !== idx);
                          handleFieldChange('interfaces', ifaces);
                        }}
                        className="text-[11px] text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="IP (e.g. 192.168.1.1)"
                        value={iface.ip_address || ''}
                        onChange={(e) => {
                          const ifaces = [...config.interfaces];
                          ifaces[idx] = { ...ifaces[idx], ip_address: e.target.value };
                          handleFieldChange('interfaces', ifaces);
                        }}
                        className="flex-1 bg-[#11151D] border border-[#293140] rounded px-2 py-1 text-xs text-[#F3F5F8] font-mono focus:outline-none"
                      />
                      <span className="text-xs text-[#9BA5B5]">/</span>
                      <input
                        type="text"
                        placeholder="24"
                        value={iface.cidr_prefix || '24'}
                        onChange={(e) => {
                          const ifaces = [...config.interfaces];
                          ifaces[idx] = { ...ifaces[idx], cidr_prefix: e.target.value };
                          handleFieldChange('interfaces', ifaces);
                        }}
                        className="w-12 bg-[#11151D] border border-[#293140] rounded px-2 py-1 text-xs text-[#F3F5F8] font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Switch Config */}
        {resourceType === 'switch' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Default VLAN ID</label>
              <input
                type="number"
                value={config.default_vlan ?? 1}
                onChange={(e) => handleFieldChange('default_vlan', parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#8B5CF6] focus:outline-none font-mono"
              />
            </div>
            <div className="text-[11px] text-[#9BA5B5] bg-[#171C26] p-2.5 rounded border border-[#293140]">
              Switch provides Layer 2 broadcast domain forwarding. Connect PCs, servers, and routers to switch ports.
            </div>
          </div>
        )}

        {/* Server Config */}
        {resourceType === 'server' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">IP Address</label>
              <input
                type="text"
                placeholder="10.0.0.10"
                value={(config.ip_address as string) || ''}
                onChange={(e) => handleFieldChange('ip_address', e.target.value)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#EC4899] focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Subnet Prefix (CIDR)</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9BA5B5]">/</span>
                <input
                  type="text"
                  placeholder="24"
                  value={(config.cidr_prefix as string) || '24'}
                  onChange={(e) => handleFieldChange('cidr_prefix', e.target.value)}
                  className="w-20 bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#EC4899] focus:outline-none font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Default Gateway</label>
              <input
                type="text"
                placeholder="10.0.0.1"
                value={(config.default_gateway as string) || ''}
                onChange={(e) => handleFieldChange('default_gateway', e.target.value)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#EC4899] focus:outline-none font-mono"
              />
            </div>

            {/* Services Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-[#9BA5B5]">Running Network Services</label>
                <button
                  type="button"
                  onClick={() => {
                    const services = [...(config.services || [])];
                    services.push({ name: 'Custom App', port: 8080, protocol: 'tcp', enabled: true });
                    handleFieldChange('services', services);
                  }}
                  className="flex items-center gap-1 text-[11px] text-[#EC4899] hover:text-pink-300"
                >
                  <Plus size={12} />
                  Add Service
                </button>
              </div>

              <div className="space-y-2">
                {(config.services || []).map((svc: any, idx: number) => (
                  <div key={idx} className="bg-[#171C26] p-2.5 rounded border border-[#293140] space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={svc.name || ''}
                        onChange={(e) => {
                          const services = [...config.services];
                          services[idx] = { ...services[idx], name: e.target.value };
                          handleFieldChange('services', services);
                        }}
                        className="bg-[#11151D] border border-[#293140] rounded px-2 py-0.5 text-xs text-[#F3F5F8] font-medium w-28"
                        placeholder="Service name"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const services = config.services.filter((_: any, i: number) => i !== idx);
                          handleFieldChange('services', services);
                        }}
                        className="text-[11px] text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#9BA5B5]">Port:</span>
                      <input
                        type="number"
                        value={svc.port || 80}
                        onChange={(e) => {
                          const services = [...config.services];
                          services[idx] = { ...services[idx], port: parseInt(e.target.value, 10) || 1 };
                          handleFieldChange('services', services);
                        }}
                        className="w-20 bg-[#11151D] border border-[#293140] rounded px-2 py-1 text-xs text-[#F3F5F8] font-mono"
                      />
                      <label className="flex items-center gap-1 text-[11px] text-[#9BA5B5] ml-auto">
                        <input
                          type="checkbox"
                          checked={svc.enabled !== false}
                          onChange={(e) => {
                            const services = [...config.services];
                            services[idx] = { ...services[idx], enabled: e.target.checked };
                            handleFieldChange('services', services);
                          }}
                          className="accent-[#EC4899]"
                        />
                        <span>Enabled</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Firewall Config */}
        {resourceType === 'firewall' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Firewall IP Address</label>
              <input
                type="text"
                placeholder="10.0.0.1"
                value={(config.ip_address as string) || ''}
                onChange={(e) => handleFieldChange('ip_address', e.target.value)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#EF4444] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Default Inbound Action</label>
              <select
                value={config.default_inbound_action || 'deny'}
                onChange={(e) => handleFieldChange('default_inbound_action', e.target.value)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#EF4444] focus:outline-none"
              >
                <option value="deny">DENY (Drop incoming by default)</option>
                <option value="allow">ALLOW (Permit incoming by default - Insecure)</option>
              </select>
            </div>

            {/* Inbound Rules Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-[#9BA5B5]">Inbound ACL Rules</label>
                <button
                  type="button"
                  onClick={() => {
                    const rules = [...(config.inbound_rules || [])];
                    rules.push({
                      id: `rule-${rules.length + 1}`,
                      priority: (rules.length + 1) * 10,
                      action: 'allow',
                      protocol: 'tcp',
                      source: 'any',
                      destination: 'any',
                      port_range: '443',
                      description: 'Allow HTTPS',
                      enabled: true,
                    });
                    handleFieldChange('inbound_rules', rules);
                  }}
                  className="flex items-center gap-1 text-[11px] text-[#EF4444] hover:text-red-300"
                >
                  <Plus size={12} />
                  Add Rule
                </button>
              </div>

              <div className="space-y-2">
                {(config.inbound_rules || []).map((rule: any, idx: number) => (
                  <div key={idx} className="bg-[#171C26] p-2.5 rounded border border-[#293140] space-y-2">
                    <div className="flex items-center justify-between">
                      <select
                        value={rule.action || 'allow'}
                        onChange={(e) => {
                          const rules = [...config.inbound_rules];
                          rules[idx] = { ...rules[idx], action: e.target.value };
                          handleFieldChange('inbound_rules', rules);
                        }}
                        className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                          rule.action === 'allow' ? 'bg-emerald-950/60 text-emerald-400' : 'bg-red-950/60 text-red-400'
                        }`}
                      >
                        <option value="allow">ALLOW</option>
                        <option value="deny">DENY</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const rules = config.inbound_rules.filter((_: any, i: number) => i !== idx);
                          handleFieldChange('inbound_rules', rules);
                        }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-[#9BA5B5] block">Protocol</span>
                        <select
                          value={rule.protocol || 'tcp'}
                          onChange={(e) => {
                            const rules = [...config.inbound_rules];
                            rules[idx] = { ...rules[idx], protocol: e.target.value };
                            handleFieldChange('inbound_rules', rules);
                          }}
                          className="w-full bg-[#11151D] border border-[#293140] rounded px-1.5 py-1 text-xs text-[#F3F5F8]"
                        >
                          <option value="tcp">TCP</option>
                          <option value="udp">UDP</option>
                          <option value="icmp">ICMP (Ping)</option>
                          <option value="any">ANY</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#9BA5B5] block">Port</span>
                        <input
                          type="text"
                          placeholder="e.g. 22 or any"
                          value={rule.port_range ?? 'any'}
                          onChange={(e) => {
                            const rules = [...config.inbound_rules];
                            rules[idx] = { ...rules[idx], port_range: e.target.value };
                            handleFieldChange('inbound_rules', rules);
                          }}
                          className="w-full bg-[#11151D] border border-[#293140] rounded px-1.5 py-1 text-xs text-[#F3F5F8] font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* External Network Config */}
        {resourceType === 'external_network' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Network CIDR Block</label>
              <input
                type="text"
                value={(config.cidr_block as string) || '0.0.0.0/0'}
                onChange={(e) => handleFieldChange('cidr_block', e.target.value)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#06B6D4] focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Description</label>
              <input
                type="text"
                placeholder="External Internet / Attacker WAN"
                value={(config.description as string) || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#06B6D4] focus:outline-none"
              />
            </div>
            <div className="text-[11px] text-[#9BA5B5] bg-[#171C26] p-2.5 rounded border border-[#293140]">
              Represents untrusted external networks (e.g. Attacker network, Internet). Connect to edge interfaces.
            </div>
          </div>
        )}

        {/* Linux Server Config */}
        {resourceType === 'linux_server' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">IP Address (eth0)</label>
              <input
                type="text"
                placeholder="10.0.0.15"
                value={(config.interfaces?.[0]?.ip_address as string) || ''}
                onChange={(e) => {
                  const ifaces = [...(config.interfaces || [{ id: 'eth0', name: 'eth0', enabled: true }])];
                  ifaces[0] = { ...ifaces[0], ip_address: e.target.value };
                  handleFieldChange('interfaces', ifaces);
                }}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#F59E0B] focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Default Gateway</label>
              <input
                type="text"
                placeholder="10.0.0.1"
                value={(config.default_gateway as string) || ''}
                onChange={(e) => handleFieldChange('default_gateway', e.target.value)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#F59E0B] focus:outline-none font-mono"
              />
            </div>

            {/* Defensive Mitigations */}
            <div className="pt-2 border-t border-[#293140] space-y-2">
              <span className="text-[11px] font-semibold text-[#3B82F6] uppercase tracking-wider block">
                Defensive Hardening Controls
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={appMode === 'attack'}
                  checked={!!config.fail2ban_enabled}
                  onChange={(e) => handleFieldChange('fail2ban_enabled', e.target.checked)}
                  className="accent-[#3B82F6] w-4 h-4 disabled:opacity-50"
                />
                <span className={`text-xs ${appMode === 'attack' ? 'text-[#9BA5B5]' : 'text-[#F3F5F8]'}`}>
                  Enable Fail2ban (Brute-force auto-ban)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={appMode === 'attack'}
                  checked={!!config.rate_limiting}
                  onChange={(e) => handleFieldChange('rate_limiting', e.target.checked)}
                  className="accent-[#3B82F6] w-4 h-4 disabled:opacity-50"
                />
                <span className={`text-xs ${appMode === 'attack' ? 'text-[#9BA5B5]' : 'text-[#F3F5F8]'}`}>
                  Enable SSH Rate Limiting (5 auth attempts/min)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={appMode === 'attack'}
                  checked={!config.weak_credentials}
                  onChange={(e) => handleFieldChange('weak_credentials', !e.target.checked)}
                  className="accent-[#3B82F6] w-4 h-4 disabled:opacity-50"
                />
                <span className={`text-xs ${appMode === 'attack' ? 'text-[#9BA5B5]' : 'text-[#F3F5F8]'}`}>
                  Enforce Strong SSH Key Auth (Disables default password)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Web Application Server Config */}
        {resourceType === 'web_server' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">IP Address (eth0)</label>
              <input
                type="text"
                placeholder="10.0.0.20"
                value={(config.interfaces?.[0]?.ip_address as string) || ''}
                onChange={(e) => {
                  const ifaces = [...(config.interfaces || [{ id: 'eth0', name: 'eth0', enabled: true }])];
                  ifaces[0] = { ...ifaces[0], ip_address: e.target.value };
                  handleFieldChange('interfaces', ifaces);
                }}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#3B82F6] focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Default Gateway</label>
              <input
                type="text"
                placeholder="10.0.0.1"
                value={(config.default_gateway as string) || ''}
                onChange={(e) => handleFieldChange('default_gateway', e.target.value)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#3B82F6] focus:outline-none font-mono"
              />
            </div>

            {/* Defensive Web Mitigations */}
            <div className="pt-2 border-t border-[#293140] space-y-2">
              <span className="text-[11px] font-semibold text-[#3B82F6] uppercase tracking-wider block">
                Web Defense & WAF Controls
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={appMode === 'attack'}
                  checked={!!config.waf_enabled}
                  onChange={(e) => handleFieldChange('waf_enabled', e.target.checked)}
                  className="accent-[#3B82F6] w-4 h-4 disabled:opacity-50"
                />
                <span className={`text-xs ${appMode === 'attack' ? 'text-[#9BA5B5]' : 'text-[#F3F5F8]'}`}>
                  Web Application Firewall (WAF filter for SQLi & XSS)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={appMode === 'attack'}
                  checked={!!config.input_sanitization}
                  onChange={(e) => handleFieldChange('input_sanitization', e.target.checked)}
                  className="accent-[#3B82F6] w-4 h-4 disabled:opacity-50"
                />
                <span className={`text-xs ${appMode === 'attack' ? 'text-[#9BA5B5]' : 'text-[#F3F5F8]'}`}>
                  Parameterized DB Queries & HTML Output Encoding
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={appMode === 'attack'}
                  checked={!!config.tls_enabled}
                  onChange={(e) => handleFieldChange('tls_enabled', e.target.checked)}
                  className="accent-[#3B82F6] w-4 h-4 disabled:opacity-50"
                />
                <span className={`text-xs ${appMode === 'attack' ? 'text-[#9BA5B5]' : 'text-[#F3F5F8]'}`}>
                  Enforce HTTPS / TLS 1.3 (Prevents cleartext sniffing)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* DNS Server Config */}
        {resourceType === 'dns_server' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">IP Address</label>
              <input
                type="text"
                placeholder="10.0.0.53"
                value={(config.interfaces?.[0]?.ip_address as string) || ''}
                onChange={(e) => {
                  const ifaces = [...(config.interfaces || [{ id: 'eth0', name: 'eth0', enabled: true }])];
                  ifaces[0] = { ...ifaces[0], ip_address: e.target.value };
                  handleFieldChange('interfaces', ifaces);
                }}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#A855F7] focus:outline-none font-mono"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={appMode === 'attack'}
                checked={!!config.dnssec_enabled}
                onChange={(e) => handleFieldChange('dnssec_enabled', e.target.checked)}
                className="accent-[#3B82F6] w-4 h-4 disabled:opacity-50"
              />
              <span className={`text-xs ${appMode === 'attack' ? 'text-[#9BA5B5]' : 'text-[#F3F5F8]'}`}>
                Enable DNSSEC (Cryptographic Zone Signing)
              </span>
            </label>
            <div className="text-[11px] text-[#9BA5B5] bg-[#171C26] p-2.5 rounded border border-[#293140]">
              Authoritative DNS server answering queries for lab hostnames (e.g. redlab.local).
            </div>
          </div>
        )}

        {/* IDS / IPS Sensor Config */}
        {resourceType === 'ids_ips' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Operating Mode</label>
              <select
                disabled={appMode === 'attack'}
                value={config.mode || 'ips'}
                onChange={(e) => handleFieldChange('mode', e.target.value)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#F43F5E] focus:outline-none disabled:opacity-50"
              >
                <option value="ips">IPS (Inline Prevention - Drops malicious packets)</option>
                <option value="ids">IDS (Passive Detection - Logs alerts only)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={appMode === 'attack'}
                checked={!!config.alert_on_scan}
                onChange={(e) => handleFieldChange('alert_on_scan', e.target.checked)}
                className="accent-[#3B82F6] w-4 h-4 disabled:opacity-50"
              />
              <span className={`text-xs ${appMode === 'attack' ? 'text-[#9BA5B5]' : 'text-[#F3F5F8]'}`}>
                Alert on Port Scanning (TCP SYN / FIN thresholds)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={appMode === 'attack'}
                checked={!!config.drop_on_attack}
                onChange={(e) => handleFieldChange('drop_on_attack', e.target.checked)}
                className="accent-[#3B82F6] w-4 h-4 disabled:opacity-50"
              />
              <span className={`text-xs ${appMode === 'attack' ? 'text-[#9BA5B5]' : 'text-[#F3F5F8]'}`}>
                Drop Packets Matching Attack Signatures (IPS only)
              </span>
            </label>
          </div>
        )}

        {/* Layer 3 Switch Config */}
        {resourceType === 'layer3_switch' && (
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!config.inter_vlan_routing}
                onChange={(e) => handleFieldChange('inter_vlan_routing', e.target.checked)}
                className="accent-[#6366F1] w-4 h-4"
              />
              <span className="text-xs text-[#F3F5F8]">Enable Hardware Inter-VLAN Routing</span>
            </label>
            <div className="text-[11px] text-[#9BA5B5] bg-[#171C26] p-2.5 rounded border border-[#293140]">
              Switch Virtual Interfaces (SVIs) forward routed packets between VLAN subnets with hardware line-rate speed.
            </div>
          </div>
        )}

        {/* Generic Endpoint Config */}
        {resourceType === 'endpoint' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Device Category</label>
              <input
                type="text"
                placeholder="IoT / Camera / Printer"
                value={(config.device_category as string) || 'IoT Endpoint'}
                onChange={(e) => handleFieldChange('device_category', e.target.value)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#14B8A6] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">IP Address</label>
              <input
                type="text"
                placeholder="192.168.1.50"
                value={(config.interfaces?.[0]?.ip_address as string) || ''}
                onChange={(e) => {
                  const ifaces = [...(config.interfaces || [{ id: 'eth0', name: 'eth0', enabled: true }])];
                  ifaces[0] = { ...ifaces[0], ip_address: e.target.value };
                  handleFieldChange('interfaces', ifaces);
                }}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#14B8A6] focus:outline-none font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Delete button footer */}
      <div className="p-3 border-t border-[#293140]">
        <button
          type="button"
          onClick={() => deleteNode(selectedNodeId)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-[#FF3B4E] border border-[#FF3B4E]/30 rounded text-xs font-medium transition-colors"
        >
          <Trash2 size={14} />
          <span>Delete Device</span>
        </button>
      </div>
    </div>
  );
}

export default PropertyInspector;
