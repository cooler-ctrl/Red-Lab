import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useEditorStore, type ResourceNodeData } from '../../stores/editorStore';
import { SecurityGroupRuleEditor } from './SecurityGroupRuleEditor';
import { IAMPolicyEditor } from './IAMPolicyEditor';
import type {
  ResourceType,
  VPCConfig,
  SubnetConfig,
  EC2Config,
  SecurityGroupConfig,
  S3Config,
  IAMRoleConfig,
  RDSConfig,
  InternetGatewayConfig,
  SGRule,
  IAMPolicy,
} from '../../types';

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
  const resourceType = (nodeData.resourceType as ResourceType) || 'ec2';
  const config = (nodeData.config || {}) as Record<string, any>;
  const findings = getNodeFindings(selectedNodeId);

  // Available related resources from canvas
  const vpcNodes = nodes.filter((n) => (n.data as ResourceNodeData).resourceType === 'vpc');
  const subnetNodes = nodes.filter((n) => (n.data as ResourceNodeData).resourceType === 'subnet');
  const sgNodes = nodes.filter((n) => (n.data as ResourceNodeData).resourceType === 'security_group');
  const iamNodes = nodes.filter((n) => (n.data as ResourceNodeData).resourceType === 'iam_role');

  const handleFieldChange = (field: string, value: any) => {
    updateNodeConfig(selectedNodeId, { ...config, [field]: value });
  };

  const handleSGToggle = (sgId: string, currentSgIds: string[] = []) => {
    const exists = currentSgIds.includes(sgId);
    const updated = exists ? currentSgIds.filter((id) => id !== sgId) : [...currentSgIds, sgId];
    handleFieldChange('security_group_ids', updated);
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
              Review findings in the Scan Panel below.
            </p>
          </div>
        </div>
      )}

      {/* Form content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Name input (common for all) */}
        <div>
          <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Resource Name</label>
          <input
            type="text"
            value={config.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none"
          />
        </div>

        {/* VPC Config */}
        {resourceType === 'vpc' && (
          <>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">CIDR Block</label>
              <input
                type="text"
                value={(config as VPCConfig).cidr_block || ''}
                onChange={(e) => handleFieldChange('cidr_block', e.target.value)}
                placeholder="10.0.0.0/16"
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] font-mono focus:border-[#FF3B4E] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Region</label>
              <select
                value={(config as VPCConfig).region || 'us-east-1'}
                onChange={(e) => handleFieldChange('region', e.target.value)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none"
              >
                <option value="us-east-1">us-east-1 (N. Virginia)</option>
                <option value="us-west-2">us-west-2 (Oregon)</option>
                <option value="eu-west-1">eu-west-1 (Ireland)</option>
                <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
              </select>
            </div>
          </>
        )}

        {/* Subnet Config */}
        {resourceType === 'subnet' && (
          <>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">CIDR Block</label>
              <input
                type="text"
                value={(config as SubnetConfig).cidr_block || ''}
                onChange={(e) => handleFieldChange('cidr_block', e.target.value)}
                placeholder="10.0.1.0/24"
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] font-mono focus:border-[#FF3B4E] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Attached VPC</label>
              <select
                value={(config as SubnetConfig).vpc_id || ''}
                onChange={(e) => handleFieldChange('vpc_id', e.target.value)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none"
              >
                <option value="">-- None / Select VPC --</option>
                {vpcNodes.map((vpc) => (
                  <option key={vpc.id} value={vpc.id}>
                    {((vpc.data as ResourceNodeData).config?.name as string) || vpc.id} ({vpc.id})
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={!!(config as SubnetConfig).is_public}
                onChange={(e) => handleFieldChange('is_public', e.target.checked)}
                className="rounded border-[#293140] text-[#FF3B4E] focus:ring-0 bg-[#171C26] w-4 h-4 accent-[#FF3B4E]"
              />
              <span className="text-xs text-[#F3F5F8]">Public Subnet (Direct Route to IGW)</span>
            </label>
          </>
        )}

        {/* EC2 Config */}
        {resourceType === 'ec2' && (
          <>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Instance Type</label>
              <select
                value={(config as EC2Config).instance_type || 't3.micro'}
                onChange={(e) => handleFieldChange('instance_type', e.target.value)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none"
              >
                <option value="t3.nano">t3.nano</option>
                <option value="t3.micro">t3.micro</option>
                <option value="t3.small">t3.small</option>
                <option value="t3.medium">t3.medium</option>
                <option value="m5.large">m5.large</option>
                <option value="c5.large">c5.large</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Subnet</label>
              <select
                value={(config as EC2Config).subnet_id || ''}
                onChange={(e) => handleFieldChange('subnet_id', e.target.value)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none"
              >
                <option value="">-- None / Select Subnet --</option>
                {subnetNodes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {((s.data as ResourceNodeData).config?.name as string) || s.id} ({s.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Attached IAM Role</label>
              <select
                value={(config as EC2Config).iam_role_id || ''}
                onChange={(e) => handleFieldChange('iam_role_id', e.target.value)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none"
              >
                <option value="">-- None --</option>
                {iamNodes.map((role) => (
                  <option key={role.id} value={role.id}>
                    {((role.data as ResourceNodeData).config?.name as string) || role.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Security Groups</label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto bg-[#171C26] p-2 rounded border border-[#293140]">
                {sgNodes.length === 0 ? (
                  <span className="text-xs text-[#9BA5B5]">No security groups in canvas</span>
                ) : (
                  sgNodes.map((sg) => {
                    const sgIds = (config as EC2Config).security_group_ids || [];
                    const checked = sgIds.includes(sg.id);
                    return (
                      <label key={sg.id} className="flex items-center gap-2 text-xs text-[#F3F5F8] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleSGToggle(sg.id, sgIds)}
                          className="accent-[#FF3B4E]"
                        />
                        <span className="truncate">
                          {((sg.data as ResourceNodeData).config?.name as string) || sg.id}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={!!(config as EC2Config).public_ip}
                onChange={(e) => handleFieldChange('public_ip', e.target.checked)}
                className="accent-[#FF3B4E] w-4 h-4"
              />
              <span className="text-xs text-[#F3F5F8]">Assign Public IP</span>
            </label>
          </>
        )}

        {/* Security Group Config */}
        {resourceType === 'security_group' && (
          <div className="space-y-4">
            <SecurityGroupRuleEditor
              title="Inbound Rules (Ingress)"
              rules={(config as SecurityGroupConfig).inbound_rules || []}
              onChange={(rules: SGRule[]) => handleFieldChange('inbound_rules', rules)}
            />
            <SecurityGroupRuleEditor
              title="Outbound Rules (Egress)"
              rules={(config as SecurityGroupConfig).outbound_rules || []}
              onChange={(rules: SGRule[]) => handleFieldChange('outbound_rules', rules)}
            />
          </div>
        )}

        {/* S3 Config */}
        {resourceType === 's3' && (
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!(config as S3Config).public_access}
                onChange={(e) => handleFieldChange('public_access', e.target.checked)}
                className="accent-[#FF3B4E] w-4 h-4"
              />
              <span className="text-xs text-[#F3F5F8]">Public Read/Write Access</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!(config as S3Config).block_public_access}
                onChange={(e) => handleFieldChange('block_public_access', e.target.checked)}
                className="accent-[#FF3B4E] w-4 h-4"
              />
              <span className="text-xs text-[#F3F5F8]">Enable Block Public Access (BPA)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!(config as S3Config).encryption}
                onChange={(e) => handleFieldChange('encryption', e.target.checked)}
                className="accent-[#FF3B4E] w-4 h-4"
              />
              <span className="text-xs text-[#F3F5F8]">Server-Side Encryption (AES-256)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!(config as S3Config).versioning}
                onChange={(e) => handleFieldChange('versioning', e.target.checked)}
                className="accent-[#FF3B4E] w-4 h-4"
              />
              <span className="text-xs text-[#F3F5F8]">Bucket Versioning</span>
            </label>
          </div>
        )}

        {/* IAM Role Config */}
        {resourceType === 'iam_role' && (
          <IAMPolicyEditor
            policies={(config as IAMRoleConfig).policies || []}
            onChange={(policies: IAMPolicy[]) => handleFieldChange('policies', policies)}
          />
        )}

        {/* RDS Config */}
        {resourceType === 'rds' && (
          <>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Engine</label>
              <select
                value={(config as RDSConfig).engine || 'postgresql'}
                onChange={(e) => handleFieldChange('engine', e.target.value)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none"
              >
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="aurora-postgresql">Aurora PostgreSQL</option>
                <option value="mariadb">MariaDB</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Subnet</label>
              <select
                value={(config as RDSConfig).subnet_id || ''}
                onChange={(e) => handleFieldChange('subnet_id', e.target.value)}
                className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none"
              >
                <option value="">-- None / Select Subnet --</option>
                {subnetNodes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {((s.data as ResourceNodeData).config?.name as string) || s.id} ({s.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Security Groups</label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto bg-[#171C26] p-2 rounded border border-[#293140]">
                {sgNodes.length === 0 ? (
                  <span className="text-xs text-[#9BA5B5]">No security groups in canvas</span>
                ) : (
                  sgNodes.map((sg) => {
                    const sgIds = (config as RDSConfig).security_group_ids || [];
                    const checked = sgIds.includes(sg.id);
                    return (
                      <label key={sg.id} className="flex items-center gap-2 text-xs text-[#F3F5F8] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleSGToggle(sg.id, sgIds)}
                          className="accent-[#FF3B4E]"
                        />
                        <span className="truncate">
                          {((sg.data as ResourceNodeData).config?.name as string) || sg.id}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={!!(config as RDSConfig).publicly_accessible}
                onChange={(e) => handleFieldChange('publicly_accessible', e.target.checked)}
                className="accent-[#FF3B4E] w-4 h-4"
              />
              <span className="text-xs text-[#F3F5F8]">Publicly Accessible</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!(config as RDSConfig).encryption}
                onChange={(e) => handleFieldChange('encryption', e.target.checked)}
                className="accent-[#FF3B4E] w-4 h-4"
              />
              <span className="text-xs text-[#F3F5F8]">Storage Encryption (KMS)</span>
            </label>
          </>
        )}

        {/* Internet Gateway Config */}
        {resourceType === 'internet_gateway' && (
          <div>
            <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Attached VPC</label>
            <select
              value={(config as InternetGatewayConfig).vpc_id || ''}
              onChange={(e) => handleFieldChange('vpc_id', e.target.value)}
              className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none"
            >
              <option value="">-- None / Select VPC --</option>
              {vpcNodes.map((vpc) => (
                <option key={vpc.id} value={vpc.id}>
                  {((vpc.data as ResourceNodeData).config?.name as string) || vpc.id} ({vpc.id})
                </option>
              ))}
            </select>
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
          <span>Delete Resource</span>
        </button>
      </div>
    </div>
  );
}

export default PropertyInspector;
