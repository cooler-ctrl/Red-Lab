// Resource types
export type ResourceType = 'vpc' | 'subnet' | 'ec2' | 's3' | 'rds' | 'security_group' | 'iam_role' | 'internet_gateway';

export interface VPCConfig {
  name: string;
  cidr_block: string;
  region: string;
}

export interface SubnetConfig {
  name: string;
  cidr_block: string;
  vpc_id: string;
  is_public: boolean;
}

export interface EC2Config {
  name: string;
  instance_type: string;
  subnet_id: string;
  security_group_ids: string[];
  public_ip: boolean;
  iam_role_id: string;
}

export interface SGRule {
  protocol: string;
  port_range: string;
  source: string;
  description: string;
}

export interface SecurityGroupConfig {
  name: string;
  inbound_rules: SGRule[];
  outbound_rules: SGRule[];
}

export interface S3Config {
  name: string;
  public_access: boolean;
  block_public_access: boolean;
  encryption: boolean;
  versioning: boolean;
}

export interface IAMPolicy {
  name: string;
  actions: string[];
  resources: string[];
}

export interface IAMRoleConfig {
  name: string;
  policies: IAMPolicy[];
}

export interface RDSConfig {
  name: string;
  subnet_id: string;
  publicly_accessible: boolean;
  encryption: boolean;
  security_group_ids: string[];
  engine: string;
}

export interface InternetGatewayConfig {
  name: string;
  vpc_id: string;
}

export type ResourceConfig =
  | VPCConfig
  | SubnetConfig
  | EC2Config
  | SecurityGroupConfig
  | S3Config
  | IAMRoleConfig
  | RDSConfig
  | InternetGatewayConfig;

export interface GraphNode {
  id: string;
  type: ResourceType;
  position: { x: number; y: number };
  label: string;
  config: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship_type: string;
  metadata: Record<string, unknown>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Lab {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  graph_data: GraphData;
  schema_version: string;
  node_count: number;
  last_scan_status: string | null;
}

export interface Finding {
  rule_id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  affected_resource_id: string;
  affected_resource_name: string;
  explanation: string;
  impact: string;
  remediation: string;
  references: string[];
}

export interface AttackPathStep {
  resource_id: string;
  label: string;
  action: string;
}

export interface AttackPath {
  id: string;
  title: string;
  description: string;
  severity: string;
  steps: AttackPathStep[];
  assumptions: string[];
}

export interface ScanResult {
  id: string;
  lab_id: string;
  timestamp: string;
  total_rules: number;
  passed: number;
  failed: number;
  findings: Finding[];
  findings_by_severity: Record<string, number>;
  risk_score: number;
  summary: string;
  attack_paths: AttackPath[];
}
