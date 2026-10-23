import { AlertTriangle, Trash2, X, Plus } from 'lucide-react';
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

  if (collapsed || !selectedNodeId) return null;

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const nodeData = (node.data as ResourceNodeData) || {};
  const resourceType = (nodeData.resourceType as ResourceType) || 'pc';
  const config = (nodeData.config || {}) as Record<string, any>;
  const findings = getNodeFindings(selectedNodeId);

  const handleFieldChange = (field: string, value: any) => {
    updateNodeConfig(selectedNodeId, { ...config, [field]: value });
  };

  return (
    <div className="w-80 bg-[#11151D] border-l border-[#293140] flex flex-col h-full select-none">
      {/* Header */}
      <div className="p-3 border-b border-[#293140] flex items-center justify-between">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FF3B4E]">
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
