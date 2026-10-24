import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Compass,
  Cpu,
  Eye,
  Globe,
  Layers,
  Monitor,
  Network,
  Router,
  Server,
  ShieldAlert,
  Terminal,
} from 'lucide-react';
import type { ResourceType } from '../../types';
import { useEditorStore } from '../../stores/editorStore';

const RESOURCE_ICONS: Record<ResourceType, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  pc: Monitor,
  linux_server: Terminal,
  web_server: Globe,
  dns_server: Compass,
  server: Server,
  endpoint: Cpu,
  router: Router,
  switch: Network,
  layer3_switch: Layers,
  firewall: ShieldAlert,
  ids_ips: Eye,
  external_network: Globe,
};

const RESOURCE_COLORS: Record<ResourceType, string> = {
  pc: '#10B981',
  linux_server: '#A855F7',
  web_server: '#38BDF8',
  dns_server: '#F59E0B',
  server: '#EC4899',
  endpoint: '#6B7280',
  router: '#3B82F6',
  switch: '#8B5CF6',
  layer3_switch: '#6366F1',
  firewall: '#EF4444',
  ids_ips: '#F97316',
  external_network: '#06B6D4',
};

function ResourceNode({ data, selected }: NodeProps) {
  const appMode = useEditorStore((s) => s.appMode);
  const resourceType = (data.resourceType as ResourceType) || 'pc';
  const Icon = RESOURCE_ICONS[resourceType] || Server;
  const color = RESOURCE_COLORS[resourceType] || '#9BA5B5';
  const findingCount = (data.findingCount as number) || 0;
  const hasFindings = findingCount > 0;
  const config = (data.config as Record<string, unknown>) || {};

  // Extract display IP
  let displayIp = '';
  if (config.ip_address) {
    displayIp = String(config.ip_address);
  } else if (Array.isArray(config.interfaces) && config.interfaces[0]?.ip_address) {
    displayIp = String(config.interfaces[0].ip_address);
  } else if (config.cidr_block) {
    displayIp = String(config.cidr_block);
  }

  const isAttackMode = appMode === 'attack';
  const selectedBorder = isAttackMode
    ? 'border-[#FF3B4E] shadow-lg shadow-red-500/20 ring-1 ring-[#FF3B4E]'
    : 'border-[#3B82F6] shadow-lg shadow-blue-500/20 ring-1 ring-[#3B82F6]';

  return (
    <div
      className={`relative px-4 py-3 rounded-lg border-2 min-w-[180px] transition-all select-none shadow-md ${
        selected
          ? selectedBorder
          : hasFindings
          ? 'border-[#FF8A4C] shadow-md shadow-orange-500/10'
          : 'border-[#293140] hover:border-[#3d4a5c]'
      }`}
      style={{ backgroundColor: '#171C26' }}
    >
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        isConnectableStart={true}
        isConnectableEnd={true}
        className="!bg-[#293140] !border-[#3d4a5c] !w-3 !h-3 hover:!bg-[#3B82F6]"
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        isConnectableStart={true}
        isConnectableEnd={true}
        className="!bg-[#293140] !border-[#3d4a5c] !w-3 !h-3 hover:!bg-[#3B82F6]"
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        isConnectableStart={true}
        isConnectableEnd={true}
        className="!bg-[#293140] !border-[#3d4a5c] !w-3 !h-3 hover:!bg-[#3B82F6]"
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        isConnectableStart={true}
        isConnectableEnd={true}
        className="!bg-[#293140] !border-[#3d4a5c] !w-3 !h-3 hover:!bg-[#3B82F6]"
      />

      <div className="flex items-center gap-3">
        <div
          className="p-2.5 rounded-md flex-shrink-0"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}35` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider truncate" style={{ color }}>
              {resourceType.replace('_', ' ')}
            </span>
          </div>
          <div className="text-sm font-medium text-[#F3F5F8] mt-0.5 truncate max-w-[140px]" title={data.label as string}>
            {(data.label as string) || 'Device'}
          </div>
          {displayIp && (
            <div className="text-[10px] font-mono text-[#9BA5B5] mt-0.5 truncate">
              {displayIp}
            </div>
          )}
        </div>
      </div>

      {hasFindings && (
        <div
          className="absolute -top-2.5 -right-2.5 min-w-[20px] h-5 px-1 rounded-full bg-[#FF3B4E] text-white text-xs flex items-center justify-center font-bold shadow-md animate-pulse"
          title={`${findingCount} security finding${findingCount > 1 ? 's' : ''}`}
        >
          {findingCount}
        </div>
      )}
    </div>
  );
}

export default memo(ResourceNode);
