// Resource types — RedLab Network Attack & Defense Simulation Platform
export type ResourceType =
  | 'pc'
  | 'router'
  | 'switch'
  | 'server'
  | 'firewall'
  | 'external_network'
  | 'linux_server'
  | 'web_server'
  | 'dns_server'
  | 'layer3_switch'
  | 'ids_ips'
  | 'endpoint';

export type AppMode = 'attack' | 'defend';

// ---- Network device config types ----

export interface NetworkInterface {
  id: string;
  name: string;
  ip_address: string;
  cidr_prefix: string;
  enabled: boolean;
}

export interface PCConfig {
  name: string;
  interfaces: NetworkInterface[];
  default_gateway: string;
  dns_servers: string[];
  os?: string;
}

export interface RouterInterface {
  id: string;
  name: string;
  ip_address: string;
  cidr_prefix: string;
  enabled: boolean;
}

export interface StaticRoute {
  destination: string;
  prefix: string;
  next_hop: string;
  metric: number;
}

export interface RouterConfig {
  name: string;
  interfaces: RouterInterface[];
  static_routes: StaticRoute[];
  nat_enabled: boolean;
}

export interface SwitchPort {
  id: string;
  name: string;
  vlan: number;
  enabled: boolean;
}

export interface SwitchConfig {
  name: string;
  ports: SwitchPort[];
  default_vlan: number;
}

export interface ServiceEntry {
  name: string;
  port: number;
  protocol: 'tcp' | 'udp';
  enabled: boolean;
}

export interface ServerConfig {
  name: string;
  ip_address: string;
  cidr_prefix: string;
  default_gateway: string;
  services: ServiceEntry[];
  os?: string;
}

export interface FirewallRule {
  id: string;
  priority: number;
  action: 'allow' | 'deny';
  protocol: 'tcp' | 'udp' | 'icmp' | 'any';
  source: string;
  destination: string;
  port_range: string;
  description: string;
  enabled: boolean;
}

export interface FirewallConfig {
  name: string;
  ip_address: string;
  cidr_prefix: string;
  default_gateway: string;
  inbound_rules: FirewallRule[];
  outbound_rules: FirewallRule[];
  default_inbound_action: 'allow' | 'deny';
  default_outbound_action: 'allow' | 'deny';
}

export interface ExternalNetworkConfig {
  name: string;
  description: string;
  cidr_block: string;
}

export type ResourceConfig =
  | PCConfig
  | RouterConfig
  | SwitchConfig
  | ServerConfig
  | FirewallConfig
  | ExternalNetworkConfig;

// ---- Graph primitives ----

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

// ---- Lab ----

export interface Lab {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  graph_data: GraphData;
  schema_version: string;
  node_count: number;
  last_scan_status?: string | null;
}

export interface LabCreateInput {
  name: string;
  description?: string;
  graph_data?: GraphData;
}

export interface LabUpdateInput {
  name?: string;
  description?: string;
  graph_data?: GraphData;
}

// ---- Security scan findings ----

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Finding {
  rule_id: string;
  title: string;
  severity: Severity;
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
  severity: Severity;
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
  findings_by_severity: Record<Severity, number>;
  risk_score: number;
  summary: string;
  attack_paths: AttackPath[];
}

export interface ScanSummary {
  id: string;
  lab_id: string;
  created_at: string;
  total_rules: number;
  passed: number;
  failed: number;
}

// ---- Network Simulation & Attacks ----

export type RunStatus = 'queued' | 'starting' | 'validating' | 'running' | 'completed' | 'failed' | 'stopped';
export type ExecutionMode = 'simulator' | 'real_lab';

export type NetworkEventType =
  | 'icmp_request'
  | 'icmp_reply'
  | 'icmp_unreachable'
  | 'arp_request'
  | 'arp_reply'
  | 'dns_query'
  | 'dns_response'
  | 'tcp_connect'
  | 'tcp_reject'
  | 'udp_send'
  | 'firewall_allow'
  | 'firewall_deny'
  | 'routing_lookup'
  | 'topology_error'
  | 'simulation_start'
  | 'simulation_end'
  | 'port_scan_start'
  | 'port_scan_open'
  | 'port_scan_closed'
  | 'port_scan_filtered'
  | 'port_scan_unreachable'
  | 'port_scan_complete';

export interface NetworkEvent {
  id: string;
  run_id: string;
  timestamp: string;
  event_type: NetworkEventType;
  source_device_id: string | null;
  source_device_name: string | null;
  dest_device_id: string | null;
  dest_device_name: string | null;
  protocol: string | null;
  interface_name: string | null;
  summary: string;
  detail: Record<string, unknown>;
  provenance: 'simulated' | 'real';
}

export interface TopologyValidationError {
  code: string;
  message: string;
  affected_node_id?: string;
  affected_edge_id?: string;
}

export interface TopologyValidationResult {
  valid: boolean;
  errors: TopologyValidationError[];
  warnings: TopologyValidationError[];
}

export interface LabRun {
  id: string;
  lab_id: string;
  mode: ExecutionMode;
  status: RunStatus;
  scenario_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  validation: TopologyValidationResult | null;
  events: NetworkEvent[];
  result_summary: Record<string, unknown> | null;
}

// ---- Scenarios ----

export type ScenarioDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ScenarioCategory = 'networking' | 'security' | 'troubleshooting' | 'defense';

export interface ScenarioObjective {
  id: string;
  description: string;
  required: boolean;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  objectives: ScenarioObjective[];
  supported_modes: ExecutionMode[];
  estimated_minutes: number;
  tags: string[];
}

export interface ScenarioAssessment {
  run_id: string;
  scenario_id: string;
  objectives_met: string[];
  objectives_failed: string[];
  score: number;
  max_score: number;
  passed: boolean;
  explanation: string;
  completed_at: string;
}

// ---- RedLab 1.1 Attack & Defend Mode ----

export interface AttackExecutionRequest {
  scenario_id: string;
  target_id: string;
  attacker_id?: string;
  parameters?: Record<string, unknown>;
  app_mode?: AppMode;
}

export interface VerifyDefenseRequest {
  scenario_id: string;
  target_id: string;
  attacker_id?: string;
  applied_defense?: string;
  parameters?: Record<string, unknown>;
}

export interface BeforeAfterComparison {
  scenario_id: string;
  target_id: string;
  target_name: string;
  defense_applied: string;
  before_status: string;
  before_summary: string;
  before_events_count: number;
  after_status: string;
  after_summary: string;
  after_events_count: number;
  defense_effective: boolean;
  explanation: string;
}

export interface AttackExecutionResponse {
  run_id: string;
  scenario_id: string;
  scenario_title: string;
  target_id: string;
  target_name: string;
  attacker_id?: string;
  status: string;
  outcome: 'compromised' | 'blocked' | 'discovered' | 'detected' | string;
  events: NetworkEvent[];
  evidence: Record<string, unknown>;
  educational_takeaway: string;
  remediation_hint: string;
  comparison?: BeforeAfterComparison | null;
}

