import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Database,
  Globe,
  HardDrive,
  Key,
  Network,
  Search,
  Server,
  Shield,
  Layers,
} from 'lucide-react';
import type { ResourceType } from '../../types';

export const DEFAULT_CONFIGS: Record<ResourceType, Record<string, unknown>> = {
  vpc: { name: 'My VPC', cidr_block: '10.0.0.0/16', region: 'us-east-1' },
  subnet: { name: 'My Subnet', cidr_block: '10.0.1.0/24', vpc_id: '', is_public: false },
  ec2: {
    name: 'My Instance',
    instance_type: 't3.micro',
    subnet_id: '',
    security_group_ids: [],
    public_ip: false,
    iam_role_id: '',
  },
  security_group: {
    name: 'My SG',
    inbound_rules: [],
    outbound_rules: [
      { protocol: '-1', port_range: '0-65535', source: '0.0.0.0/0', description: 'Allow all outbound' },
    ],
  },
  s3: { name: 'my-bucket', public_access: false, block_public_access: true, encryption: true, versioning: false },
  iam_role: { name: 'My Role', policies: [] },
  rds: {
    name: 'My Database',
    subnet_id: '',
    publicly_accessible: false,
    encryption: true,
    security_group_ids: [],
    engine: 'postgresql',
  },
  internet_gateway: { name: 'My IGW', vpc_id: '' },
};

interface ResourceDefinition {
  type: ResourceType;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  color: string;
}

interface CategoryDefinition {
  name: string;
  resources: ResourceDefinition[];
}

const CATEGORIES: CategoryDefinition[] = [
  {
    name: 'Networking',
    resources: [
      {
        type: 'vpc',
        label: 'VPC',
        description: 'Virtual Private Cloud network',
        icon: Network,
        color: '#60A5FA',
      },
      {
        type: 'subnet',
        label: 'Subnet',
        description: 'VPC IP subnet range',
        icon: Network,
        color: '#818CF8',
      },
      {
        type: 'internet_gateway',
        label: 'Internet Gateway',
        description: 'VPC internet route gateway',
        icon: Globe,
        color: '#22D3EE',
      },
      {
        type: 'security_group',
        label: 'Security Group',
        description: 'Virtual firewall for compute & DB',
        icon: Shield,
        color: '#F472B6',
      },
    ],
  },
  {
    name: 'Compute',
    resources: [
      {
        type: 'ec2',
        label: 'EC2 Instance',
        description: 'Virtual compute server',
        icon: Server,
        color: '#F59E0B',
      },
    ],
  },
  {
    name: 'Storage',
    resources: [
      {
        type: 's3',
        label: 'S3 Bucket',
        description: 'Scalable cloud object storage',
        icon: HardDrive,
        color: '#34D399',
      },
    ],
  },
  {
    name: 'Database',
    resources: [
      {
        type: 'rds',
        label: 'RDS Database',
        description: 'Relational database instance',
        icon: Database,
        color: '#A78BFA',
      },
    ],
  },
  {
    name: 'Identity',
    resources: [
      {
        type: 'iam_role',
        label: 'IAM Role',
        description: 'Identity with permission policies',
        icon: Key,
        color: '#FB923C',
      },
    ],
  },
];

interface ResourceLibraryProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ResourceLibrary({ collapsed = false }: ResourceLibraryProps) {
  const [search, setSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (name: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const onDragStart = (event: React.DragEvent, resourceType: ResourceType) => {
    event.dataTransfer.setData('application/reactflow/type', resourceType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    resources: cat.resources.filter(
      (r) =>
        r.label.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.type.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.resources.length > 0);

  if (collapsed) return null;

  return (
    <div className="w-64 bg-[#11151D] border-r border-[#293140] flex flex-col h-full select-none">
      <div className="p-3 border-b border-[#293140]">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9BA5B5] mb-2">
          <Layers size={14} className="text-[#FF3B4E]" />
          <span>Resource Library</span>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-[#9BA5B5]" />
          <input
            type="text"
            placeholder="Filter resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 pl-8 text-xs text-[#F3F5F8] placeholder-[#9BA5B5]/60 focus:outline-none focus:border-[#FF3B4E] transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {filteredCategories.map((category) => {
          const isCollapsed = !!collapsedCategories[category.name];
          return (
            <div key={category.name} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleCategory(category.name)}
                className="w-full flex items-center justify-between px-2 py-1 text-xs font-medium text-[#9BA5B5] hover:text-[#F3F5F8] hover:bg-[#171C26] rounded transition-colors"
              >
                <span>{category.name}</span>
                {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
              </button>

              {!isCollapsed && (
                <div className="space-y-1.5 pl-1">
                  {category.resources.map((res) => {
                    const Icon = res.icon;
                    return (
                      <div
                        key={res.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, res.type)}
                        className="group flex items-start gap-2.5 p-2 bg-[#171C26] border border-[#293140] hover:border-[#3d4a5c] hover:shadow-md rounded-lg cursor-grab active:cursor-grabbing transition-all"
                      >
                        <div
                          className="p-1.5 rounded-md mt-0.5 flex-shrink-0"
                          style={{
                            backgroundColor: `${res.color}15`,
                            border: `1px solid ${res.color}30`,
                          }}
                        >
                          <Icon size={16} style={{ color: res.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-[#F3F5F8] group-hover:text-white transition-colors truncate">
                            {res.label}
                          </div>
                          <div className="text-[11px] text-[#9BA5B5] truncate mt-0.5">
                            {res.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredCategories.length === 0 && (
          <div className="text-center py-6 text-xs text-[#9BA5B5]">No resources matching "{search}"</div>
        )}
      </div>

      <div className="p-2 border-t border-[#293140] text-[11px] text-[#9BA5B5] text-center">
        Drag resources onto canvas to build
      </div>
    </div>
  );
}

export default ResourceLibrary;
