import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Cloud, Database, Globe, HardDrive, Key, Network, Server, Shield } from 'lucide-react';
import type { ResourceType } from '../../types';

const RESOURCE_ICONS: Record<ResourceType | string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  vpc: Network,
  subnet: Network,
  ec2: Server,
  s3: HardDrive,
  rds: Database,
  security_group: Shield,
  iam_role: Key,
  internet_gateway: Globe,
};

const RESOURCE_COLORS: Record<ResourceType | string, string> = {
  vpc: '#60A5FA',
  subnet: '#818CF8',
  ec2: '#F59E0B',
  s3: '#34D399',
  rds: '#A78BFA',
  security_group: '#F472B6',
  iam_role: '#FB923C',
  internet_gateway: '#22D3EE',
};

function ResourceNode({ data, selected }: NodeProps) {
  const resourceType = (data.resourceType as string) || 'ec2';
  const Icon = RESOURCE_ICONS[resourceType] || Cloud;
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
            {(data.label as string) || 'Resource'}
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
