import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Globe,
  Monitor,
  Network,
  Router,
  Search,
  Server,
  ShieldAlert,
} from 'lucide-react';
import type { ResourceType } from '../../types';

export const DEFAULT_CONFIGS: Record<ResourceType, Record<string, unknown>> = {
  pc: {
    name: 'PC-1',
    interfaces: [
      { id: 'eth0', name: 'eth0', ip_address: '192.168.1.10', cidr_prefix: '24', enabled: true },
    ],
    default_gateway: '192.168.1.1',
    dns_servers: ['8.8.8.8'],
    os: 'Linux',
  },
  router: {
    name: 'Router-1',
    interfaces: [
      { id: 'eth0', name: 'eth0', ip_address: '192.168.1.1', cidr_prefix: '24', enabled: true },
      { id: 'eth1', name: 'eth1', ip_address: '10.0.0.1', cidr_prefix: '24', enabled: true },
    ],
    static_routes: [],
    nat_enabled: false,
  },
  switch: {
    name: 'Switch-1',
    ports: [
      { id: 'p1', name: 'FastEthernet0/1', vlan: 1, enabled: true },
      { id: 'p2', name: 'FastEthernet0/2', vlan: 1, enabled: true },
      { id: 'p3', name: 'FastEthernet0/3', vlan: 1, enabled: true },
      { id: 'p4', name: 'FastEthernet0/4', vlan: 1, enabled: true },
    ],
    default_vlan: 1,
  },
  server: {
    name: 'Server-1',
    ip_address: '10.0.0.10',
    cidr_prefix: '24',
    default_gateway: '10.0.0.1',
    services: [
      { name: 'HTTP', port: 80, protocol: 'tcp', enabled: true },
      { name: 'SSH', port: 22, protocol: 'tcp', enabled: true },
    ],
    os: 'Ubuntu 24.04',
  },
  firewall: {
    name: 'Firewall-1',
    ip_address: '10.0.0.1',
    cidr_prefix: '24',
    default_gateway: '',
    inbound_rules: [
      {
        id: 'r1',
        priority: 10,
        action: 'allow',
        protocol: 'tcp',
        source: 'any',
        destination: 'any',
        port_range: '80',
        description: 'Allow HTTP',
        enabled: true,
      },
    ],
    outbound_rules: [],
    default_inbound_action: 'deny',
    default_outbound_action: 'allow',
  },
  external_network: {
    name: 'Internet',
    description: 'External Internet Network / Attacker WAN',
    cidr_block: '0.0.0.0/0',
  },
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
    name: 'Hosts & Endpoints',
    resources: [
      {
        type: 'pc',
        label: 'PC / Workstation',
        description: 'Host endpoint with IP & gateway',
        icon: Monitor,
        color: '#10B981',
      },
      {
        type: 'server',
        label: 'Server',
        description: 'Host running services (HTTP, SSH, DB)',
        icon: Server,
        color: '#EC4899',
      },
    ],
  },
  {
    name: 'Routing & Switching',
    resources: [
      {
        type: 'router',
        label: 'Router',
        description: 'Layer 3 packet routing & gateways',
        icon: Router,
        color: '#3B82F6',
      },
      {
        type: 'switch',
        label: 'Switch',
        description: 'Layer 2 ethernet bridge & VLANs',
        icon: Network,
        color: '#8B5CF6',
      },
    ],
  },
  {
    name: 'Perimeter & Security',
    resources: [
      {
        type: 'firewall',
        label: 'Firewall',
        description: 'Stateful packet filter & ACL rules',
        icon: ShieldAlert,
        color: '#EF4444',
      },
      {
        type: 'external_network',
        label: 'External Network',
        description: 'WAN / Internet boundary segment',
        icon: Globe,
        color: '#06B6D4',
      },
    ],
  },
];

interface ResourceLibraryProps {
  collapsed?: boolean;
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
        r.description.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.resources.length > 0);

  if (collapsed) return null;

  return (
    <div className="w-64 bg-[#11151D] border-r border-[#293140] flex flex-col h-full select-none">
      {/* Header */}
      <div className="p-3 border-b border-[#293140]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9BA5B5] mb-2">
          Network Device Library
        </h2>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 text-[#9BA5B5]" size={14} />
          <input
            type="text"
            placeholder="Search devices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 pl-8 text-xs text-[#F3F5F8] placeholder-[#9BA5B5] focus:outline-none focus:border-[#3B82F6]"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {filteredCategories.map((cat) => {
          const isCollapsed = collapsedCategories[cat.name];
          return (
            <div key={cat.name}>
              <button
                onClick={() => toggleCategory(cat.name)}
                className="flex items-center justify-between w-full text-left px-2 py-1 text-xs font-medium text-[#9BA5B5] hover:text-[#F3F5F8] transition-colors"
              >
                <span>{cat.name}</span>
                {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              </button>

              {!isCollapsed && (
                <div className="mt-1 space-y-1">
                  {cat.resources.map((res) => {
                    const Icon = res.icon;
                    return (
                      <div
                        key={res.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, res.type)}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-[#171C26]/50 hover:bg-[#171C26] border border-transparent hover:border-[#293140] cursor-grab active:cursor-grabbing transition-all group"
                      >
                        <div
                          className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${res.color}20`, color: res.color }}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-[#F3F5F8] group-hover:text-white truncate">
                            {res.label}
                          </div>
                          <div className="text-[10px] text-[#9BA5B5] truncate">
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
      </div>
    </div>
  );
}
