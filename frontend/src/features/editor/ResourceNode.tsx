import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Globe,
  Monitor,
  Network,
  Router,
  Server,
  ShieldAlert,
} from 'lucide-react';
import type { ResourceType } from '../../types';

const RESOURCE_ICONS: Record<ResourceType, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  pc: Monitor,
  router: Router,
  switch: Network,
  server: Server,
  firewall: ShieldAlert,
  external_network: Globe,
};

const RESOURCE_COLORS: Record<ResourceType, string> = {
  pc: '#10B981',
  router: '#3B82F6',
  switch: '#8B5CF6',
  server: '#EC4899',
  firewall: '#EF4444',
  external_network: '#06B6D4',
};

function ResourceNode({ data, selected }: NodeProps) {
  const resourceType = (data.resourceType as ResourceType) || 'pc';
  const Icon = RESOURCE_ICONS[resourceType] || Server;
  const color = RESOURCE_COLORS[resourceType] || '#9BA5B5';
  const findingCount = (data.findingCount as number) || 0;
  const hasFindings = findingCount > 0;

  return (
    <div
      className={`relative px-4 py-3 rounded-lg border-2 min-w-[170px] transition-all select-none shadow-md ${
        selected
          ? 'border-[#FF3B4E] shadow-lg shadow-red-500/20 ring-1 ring-[#FF3B4E]'
          : hasFindings
          ? 'border-[#FF8A4C] shadow-md shadow-orange-500/10'
          : 'border-[#293140] hover:border-[#3d4a5c]'
      }`}
      style={{ backgroundColor: '#171C26' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[#293140] !border-[#3d4a5c] !w-3 !h-3 hover:!bg-[#FF3B4E]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#293140] !border-[#3d4a5c] !w-3 !h-3 hover:!bg-[#FF3B4E]"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[#293140] !border-[#3d4a5c] !w-3 !h-3 hover:!bg-[#FF3B4E]"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[#293140] !border-[#3d4a5c] !w-3 !h-3 hover:!bg-[#FF3B4E]"
      />

      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-md flex-shrink-0"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider truncate" style={{ color }}>
            {resourceType.replace('_', ' ')}
          </div>
          <div className="text-sm font-medium text-[#F3F5F8] mt-0.5 truncate max-w-[130px]" title={data.label as string}>
            {(data.label as string) || 'Device'}
          </div>
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
