import { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Database,
  Flame,
  Globe,
  Key,
  Laptop,
  Loader2,
  Lock,
  Play,
  Radio,
  Search,
  Send,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEditorStore, type ResourceNodeData } from '../../stores/editorStore';
import { useSimulationStore, type BottomTab } from '../../stores/simulationStore';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { LinuxTerminal } from '../terminal/LinuxTerminal';
import type { NetworkEvent } from '../../types';

const ATTACK_SCENARIOS = [
  {
    id: 'attack_port_scan',
    title: 'Nmap Port Recon',
    category: 'Reconnaissance',
    badgeColor: 'border-purple-500/40 bg-purple-950/40 text-purple-300',
    icon: Search,
    description: 'Probes TCP ports (80, 22, 443, 3306) to identify running services & exposed sockets.',
  },
  {
    id: 'syn_flood_dos',
    title: 'TCP SYN Flood DoS',
    category: 'Denial of Service',
    badgeColor: 'border-red-500/40 bg-red-950/40 text-red-400',
    icon: Flame,
    description: 'Floods target device with high-volume SYN packets to exhaust TCP connection backlogs.',
  },
  {
    id: 'auth_brute_force',
    title: 'SSH Brute Force',
    category: 'Credential Access',
    badgeColor: 'border-amber-500/40 bg-amber-950/40 text-amber-300',
    icon: Key,
    description: 'Automated dictionary attack against SSH service using wordlist credentials (e.g. rockyou).',
  },
  {
    id: 'web_security_injection',
    title: 'Web SQL Injection',
    category: 'OWASP Exploit',
    badgeColor: 'border-pink-500/40 bg-pink-950/40 text-pink-300',
    icon: Database,
    description: "Injects ' OR '1'='1' into web forms to bypass authentication and dump database tables.",
  },
  {
    id: 'arp_cache_poisoning',
    title: 'ARP Cache Poisoning',
    category: 'L2 Man-in-the-Middle',
    badgeColor: 'border-yellow-500/40 bg-yellow-950/40 text-yellow-300',
    icon: Zap,
    description: 'Broadcasts forged ARP replies claiming default gateway IP to intercept subnet packets.',
  },
  {
    id: 'traffic_analysis',
    title: 'Cleartext Sniffer',
    category: 'Traffic Analysis',
    badgeColor: 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300',
    icon: Radio,
    description: 'Passively sniffs network packets to extract unencrypted HTTP authentication tokens & DNS queries.',
  },
];

export function SimulationPanel() {
  const { toast, success: toastSuccess, error: toastError } = useToast();

  // Editor Store
  const lab = useEditorStore((s) => s.lab);
  const nodes = useEditorStore((s) => s.nodes);
  const selectNode = useEditorStore((s) => s.selectNode);
  const appMode = useEditorStore((s) => s.appMode);
  const setAppMode = useEditorStore((s) => s.setAppMode);

  // Simulation Store
  const bottomTab = useSimulationStore((s) => s.bottomTab);
  const setBottomTab = useSimulationStore((s) => s.setBottomTab);
  const panelOpen = useSimulationStore((s) => s.panelOpen);
  const setPanelOpen = useSimulationStore((s) => s.setPanelOpen);
  const runEvents = useSimulationStore((s) => s.runEvents);
  const pingEvents = useSimulationStore((s) => s.pingEvents);
  const portScanEvents = useSimulationStore((s) => s.portScanEvents);

  // Attack & Defend Store Methods
  const executeAttack = useSimulationStore((s) => s.executeAttack);
  const runVerifyDefense = useSimulationStore((s) => s.runVerifyDefense);
  const attackLoading = useSimulationStore((s) => s.attackLoading);
  const attackResponse = useSimulationStore((s) => s.attackResponse);
  const verifyLoading = useSimulationStore((s) => s.verifyLoading);
  const comparisonResult = useSimulationStore((s) => s.comparisonResult);

  // Search & Filter State
  const [eventSearch, setEventSearch] = useState<string>('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  // Attack & Defend Local State
  const [selectedScenario, setSelectedScenario] = useState<string>('attack_port_scan');
  const [attackTarget, setAttackTarget] = useState<string>('');
  const [attackPorts, setAttackPorts] = useState<string>('21, 22, 23, 80, 443, 3306');
  const [attackUsername, setAttackUsername] = useState<string>('root');
  const [attackWordlist, setAttackWordlist] = useState<string>('admin, password, 123456, root, letmein');
  const [attackPayload, setAttackPayload] = useState<string>("' OR '1'='1' --");
  const [defenseActionSummary, setDefenseActionSummary] = useState<string>(
    'Enforce default-deny firewall ACL & WAF query parameterization'
  );

  // Targetable nodes in the lab
  const attackableNodes = nodes.filter((n) => {
    const rType = (n.data as ResourceNodeData)?.resourceType;
    return [
      'server',
      'linux_server',
      'web_server',
      'dns_server',
      'pc',
      'endpoint',
      'firewall',
      'router',
    ].includes(rType);
  });

  // Auto-select first target node if none selected
  useEffect(() => {
    if (!attackTarget && attackableNodes.length > 0) {
      // Prioritize web_server or server
      const preferred =
        attackableNodes.find((n) =>
          ['web_server', 'linux_server', 'server'].includes(
            (n.data as ResourceNodeData)?.resourceType
          )
        ) || attackableNodes[0];
      setAttackTarget(preferred.id);
    }
  }, [attackableNodes, attackTarget]);

  const activeTargetNode = nodes.find((n) => n.id === attackTarget);
  const activeTargetData = activeTargetNode?.data as ResourceNodeData | undefined;

  const getNodeIcon = (type?: string) => {
    switch (type) {
      case 'web_server':
        return Globe;
      case 'linux_server':
      case 'server':
      case 'dns_server':
        return Server;
      case 'firewall':
        return Shield;
      case 'router':
        return Radio;
      case 'pc':
      case 'endpoint':
      default:
        return Laptop;
    }
  };

  const getTargetServices = (nodeData?: ResourceNodeData): string[] => {
    const rType = nodeData?.resourceType;
    if (rType === 'web_server') return ['HTTP:80', 'HTTPS:443'];
    if (rType === 'linux_server' || rType === 'server') return ['SSH:22', 'HTTP:80'];
    if (rType === 'dns_server') return ['DNS:53'];
    if (rType === 'firewall') return ['Firewall:ACL'];
    if (rType === 'router') return ['Router:OSPF'];
    return ['DHCP:Client'];
  };

  const handleExecuteAttack = async () => {
    if (!lab) return;
    if (!attackTarget) {
      toastError('Please select a target host for the attack simulation');
      return;
    }
    let parameters: Record<string, any> = {};
    if (selectedScenario === 'attack_port_scan') {
      parameters = {
        ports: attackPorts
          .split(',')
          .map((p) => parseInt(p.trim(), 10))
          .filter((p) => !isNaN(p) && p > 0),
      };
    } else if (selectedScenario === 'auth_brute_force') {
      parameters = {
        username: attackUsername,
        wordlist: attackWordlist
          .split(',')
          .map((w) => w.trim())
          .filter(Boolean),
      };
    } else if (selectedScenario === 'web_security_injection') {
      parameters = {
        payload: attackPayload,
        attack_type: 'sqli',
      };
    } else if (selectedScenario === 'traffic_analysis') {
      parameters = {
        protocols: ['dns', 'http', 'tcp'],
      };
    } else if (selectedScenario === 'firewall_segmentation') {
      parameters = {
        source_vlan: 10,
        target_vlan: 20,
      };
    } else if (selectedScenario === 'syn_flood_dos') {
      parameters = {
        port: parseInt(attackPorts.split(',')[0]?.trim() || '80', 10) || 80,
      };
    } else if (selectedScenario === 'arp_cache_poisoning') {
      parameters = {};
    }

    try {
      const res = await executeAttack(lab.id, {
        scenario_id: selectedScenario,
        target_id: attackTarget,
        parameters,
        app_mode: 'attack',
      });
      if (res.outcome === 'compromised') {
        toastError(
          `Attack Succeeded! Target compromised. Status: ${res.outcome.toUpperCase()}. Evidence captured.`
        );
      } else if (res.outcome === 'blocked') {
        toastSuccess(`Attack Blocked! Defensive security controls prevented exploitation.`);
      } else {
        toastSuccess(`Reconnaissance Complete: Target status ${res.outcome.toUpperCase()}.`);
      }
    } catch (err) {
      toastError(`Attack execution failed: ${(err as Error).message}`);
    }
  };

  const handleRunVerifyDefense = async () => {
    if (!lab) return;
    const targetId =
      attackTarget ||
      nodes.find((n) =>
        ['server', 'linux_server', 'web_server'].includes(
          (n.data as ResourceNodeData)?.resourceType
        )
      )?.id;
    if (!targetId) {
      toastError('Please select a target host to verify defense against');
      return;
    }

    try {
      const res = await runVerifyDefense(lab.id, {
        scenario_id: selectedScenario,
        target_id: targetId,
        applied_defense: defenseActionSummary,
      });
      if (res.comparison?.defense_effective) {
        toastSuccess(
          `Defense Verified! Attack neutralized. Before: ${res.comparison.before_status.toUpperCase()} → After: ${res.comparison.after_status.toUpperCase()}`
        );
      } else {
        toastError(
          `Defense Verification: ${res.comparison?.explanation || 'Vulnerability is still exploitable.'}`
        );
      }
    } catch (err) {
      toastError(`Defense verification failed: ${(err as Error).message}`);
    }
  };

  const allDisplayEvents =
    attackResponse?.events && attackResponse.events.length > 0
      ? attackResponse.events
      : runEvents.length > 0
      ? runEvents
      : portScanEvents.length > 0
      ? portScanEvents
      : pingEvents;

  const filteredEvents = allDisplayEvents.filter((e) => {
    if (eventTypeFilter !== 'all' && e.event_type !== eventTypeFilter) return false;
    if (eventSearch) {
      const q = eventSearch.toLowerCase();
      return (
        e.summary.toLowerCase().includes(q) ||
        (e.source_device_name || '').toLowerCase().includes(q) ||
        (e.dest_device_name || '').toLowerCase().includes(q) ||
        e.event_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'port_scan_open':
      case 'icmp_reply':
      case 'firewall_allow':
      case 'tcp_connect':
        return 'bg-emerald-950/70 text-emerald-400 border-emerald-800';
      case 'port_scan_filtered':
        return 'bg-amber-950/70 text-amber-400 border-amber-800';
      case 'port_scan_closed':
      case 'port_scan_unreachable':
      case 'icmp_unreachable':
      case 'firewall_deny':
      case 'tcp_reject':
      case 'topology_error':
        return 'bg-red-950/70 text-red-400 border-red-800';
      case 'port_scan_start':
      case 'port_scan_complete':
        return 'bg-pink-950/70 text-pink-400 border-pink-800';
      case 'icmp_request':
        return 'bg-blue-950/70 text-blue-400 border-blue-800';
      case 'arp_request':
      case 'arp_reply':
        return 'bg-purple-950/70 text-purple-400 border-purple-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-[#11151D] border-t border-[#293140] flex flex-col transition-all duration-200 select-none z-10">
      {/* Top Header / Mode & Streamlined 4 Tabs Bar */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-[#293140] bg-[#171C26]">
        {/* Left: Tab Selectors & Panel Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setPanelOpen(!panelOpen)}
            className="p-1 rounded text-[#9BA5B5] hover:text-[#F3F5F8] hover:bg-[#11151D] transition-colors"
            title={panelOpen ? 'Collapse Bottom Panel' : 'Expand Bottom Panel'}
          >
            {panelOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>

          {/* Mode Pill Indicator */}
          {appMode === 'attack' ? (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/70 border border-[#FF3B4E]/40 text-[#FF3B4E] text-[11px] font-bold mr-1 shadow-sm">
              <Flame size={12} className="animate-pulse" />
              <span>OFFENSIVE MODE</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-950/70 border border-[#3B82F6]/40 text-[#60A5FA] text-[11px] font-bold mr-1 shadow-sm">
              <ShieldCheck size={12} />
              <span>DEFENSIVE MODE</span>
            </div>
          )}

          {/* Tab 1: Attack Launcher (Visual Beginner Studio) */}
          <button
            type="button"
            onClick={() => setBottomTab('attack')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              bottomTab === 'attack' && panelOpen
                ? 'bg-[#FF3B4E]/25 text-[#FF3B4E] border border-[#FF3B4E]/50 shadow-md shadow-[#FF3B4E]/20'
                : 'text-[#9BA5B5] hover:text-[#F3F5F8] hover:bg-[#11151D]'
            }`}
          >
            <Flame size={14} className={bottomTab === 'attack' && panelOpen ? 'text-[#FF3B4E]' : 'text-red-400'} />
            <span>Attack Launcher</span>
            {attackResponse && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                  attackResponse.outcome === 'compromised'
                    ? 'bg-[#FF3B4E] text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {attackResponse.outcome.toUpperCase()}
              </span>
            )}
          </button>

          {/* Tab 2: Linux Terminal (Interactive Kali & Target Consoles) */}
          <button
            type="button"
            onClick={() => setBottomTab('terminal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              bottomTab === 'terminal' && panelOpen
                ? 'bg-emerald-950/40 text-[#34D399] border border-emerald-600/50 shadow-md shadow-emerald-950/30'
                : 'text-[#9BA5B5] hover:text-[#F3F5F8] hover:bg-[#11151D]'
            }`}
          >
            <Terminal size={14} className={bottomTab === 'terminal' && panelOpen ? 'text-[#34D399]' : 'text-emerald-400'} />
            <span>Linux Terminal</span>
            <span className="hidden md:inline px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-mono">
              CLI
            </span>
          </button>

          {/* Tab 3: Verify Defense */}
          <button
            type="button"
            onClick={() => setBottomTab('defense_verify')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              bottomTab === 'defense_verify' && panelOpen
                ? 'bg-[#3B82F6]/25 text-[#60A5FA] border border-[#3B82F6]/50 shadow-md shadow-[#3B82F6]/20'
                : 'text-[#9BA5B5] hover:text-[#F3F5F8] hover:bg-[#11151D]'
            }`}
          >
            <ShieldCheck size={14} className={bottomTab === 'defense_verify' && panelOpen ? 'text-[#60A5FA]' : 'text-blue-400'} />
            <span>Verify Defense</span>
            {comparisonResult && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                  comparisonResult.defense_effective
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}
              >
                {comparisonResult.defense_effective ? 'DEFENDED' : 'VULNERABLE'}
              </span>
            )}
          </button>

          {/* Tab 4: Traffic Inspector */}
          <button
            type="button"
            onClick={() => setBottomTab('traffic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              bottomTab === 'traffic' && panelOpen
                ? 'bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30 font-semibold'
                : 'text-[#9BA5B5] hover:text-[#F3F5F8] hover:bg-[#11151D]'
            }`}
          >
            <Radio size={14} className={bottomTab === 'traffic' && panelOpen ? 'text-[#A78BFA]' : ''} />
            <span>Traffic Inspector</span>
            {allDisplayEvents.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#8B5CF6]/40 text-[#D8B4FE] text-[10px] font-bold">
                {allDisplayEvents.length}
              </span>
            )}
          </button>
        </div>

        {/* Right: Quick Action Buttons based on active tab */}
        <div className="flex items-center gap-2">
          {bottomTab === 'attack' && (
            <Button
              size="sm"
              variant="danger"
              onClick={handleExecuteAttack}
              loading={attackLoading}
              disabled={!attackTarget}
              icon={<Flame size={13} />}
            >
              {attackLoading ? 'Attacking...' : 'Launch Attack'}
            </Button>
          )}

          {bottomTab === 'defense_verify' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRunVerifyDefense}
              loading={verifyLoading}
              icon={<ShieldCheck size={13} className="text-[#3B82F6]" />}
            >
              {verifyLoading ? 'Verifying...' : 'Verify Defense'}
            </Button>
          )}

          {bottomTab === 'traffic' && (
            <div className="flex items-center gap-2">
              <div className="relative w-40 sm:w-56">
                <Search size={12} className="absolute left-2.5 top-2 text-[#9BA5B5]" />
                <input
                  type="text"
                  placeholder="Filter packets..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="w-full bg-[#11151D] border border-[#293140] rounded px-2 py-1 pl-7 text-[11px] text-[#F3F5F8] focus:border-[#8B5CF6] focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Panel Content (collapsible) */}
      {panelOpen && (
        <div className="h-80 md:h-[350px] flex flex-col bg-[#11151D] overflow-hidden">
          {/* ----------------- TAB 1: VISUAL ATTACK LAUNCHER ----------------- */}
          {bottomTab === 'attack' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Step 1: Target Victim Selection Ribbon */}
              <div className="bg-[#171C26]/80 border-b border-[#293140] px-3 py-2 flex items-center justify-between gap-3 overflow-x-auto">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-5 h-5 rounded-full bg-red-950/70 border border-[#FF3B4E]/60 flex items-center justify-center text-[#FF3B4E] font-bold text-[10px]">
                    1
                  </div>
                  <span className="text-xs font-bold text-[#F3F5F8] uppercase tracking-wider flex items-center gap-1.5">
                    <Crosshair size={13} className="text-[#FF3B4E]" />
                    Victim Target:
                  </span>
                </div>

                {/* Device Cards Strip */}
                <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                  {attackableNodes.length === 0 ? (
                    <span className="text-xs text-[#9BA5B5] italic">
                      No network devices found on canvas. Drag a server or PC from the library.
                    </span>
                  ) : (
                    attackableNodes.map((n) => {
                      const data = n.data as ResourceNodeData;
                      const Icon = getNodeIcon(data?.resourceType);
                      const isSelected = attackTarget === n.id;
                      const services = getTargetServices(data);

                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setAttackTarget(n.id)}
                          className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-left transition-all flex-shrink-0 ${
                            isSelected
                              ? 'bg-red-950/50 border-[#FF3B4E] shadow-sm shadow-[#FF3B4E]/30 ring-1 ring-[#FF3B4E]'
                              : 'bg-[#11151D] border-[#293140] hover:border-[#FF3B4E]/40 hover:bg-[#171C26]'
                          }`}
                        >
                          <div
                            className={`p-1 rounded ${
                              isSelected ? 'bg-[#FF3B4E]/20 text-[#FF3B4E]' : 'bg-[#171C26] text-[#9BA5B5]'
                            }`}
                          >
                            <Icon size={14} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-xs font-bold ${
                                  isSelected ? 'text-[#FF3B4E]' : 'text-[#F3F5F8]'
                                }`}
                              >
                                {String(data?.config?.name || n.id)}
                              </span>
                              {isSelected && (
                                <span className="px-1 py-0.2 rounded bg-[#FF3B4E] text-white text-[9px] font-extrabold uppercase">
                                  LOCKED
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#9BA5B5] font-mono">
                              <span>{String(data?.config?.ip_address || '10.0.0.x')}</span>
                              <span>•</span>
                              <span className="text-emerald-400">{services[0]}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Step 2 & 3: Attack Vectors and Execution Results */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left: Visual Attack Vector Grid */}
                <div className="w-1/2 md:w-3/5 border-r border-[#293140] p-3 flex flex-col gap-2.5 overflow-y-auto bg-[#11151D]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-red-950/70 border border-[#FF3B4E]/60 flex items-center justify-center text-[#FF3B4E] font-bold text-[10px]">
                        2
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#F3F5F8]">
                        Choose Attack Vector
                      </span>
                    </div>
                    <span className="text-[10px] text-[#9BA5B5]">
                      Click card to select attack method
                    </span>
                  </div>

                  {/* 6 Visual Attack Scenario Cards Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {ATTACK_SCENARIOS.map((sc) => {
                      const Icon = sc.icon;
                      const isSelected = selectedScenario === sc.id;

                      return (
                        <div
                          key={sc.id}
                          onClick={() => setSelectedScenario(sc.id)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-red-950/30 border-[#FF3B4E] shadow-md shadow-[#FF3B4E]/20 ring-1 ring-[#FF3B4E]'
                              : 'bg-[#171C26] border-[#293140] hover:border-[#FF3B4E]/40 hover:bg-[#1a202c]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <Icon
                                  size={14}
                                  className={isSelected ? 'text-[#FF3B4E]' : 'text-[#9BA5B5]'}
                                />
                                <span
                                  className={`text-xs font-bold ${
                                    isSelected ? 'text-[#FF3B4E]' : 'text-[#F3F5F8]'
                                  }`}
                                >
                                  {sc.title}
                                </span>
                              </div>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${sc.badgeColor}`}
                              >
                                {sc.category}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#9BA5B5] leading-relaxed line-clamp-2">
                              {sc.description}
                            </p>
                          </div>

                          <div className="mt-2 pt-1 border-t border-[#293140]/60 flex items-center justify-between text-[9px]">
                            <span className="text-[#60A5FA] font-mono">
                              Target: {String(activeTargetData?.config?.name || 'Device')}
                            </span>
                            <span
                              className={`font-bold ${
                                isSelected ? 'text-[#FF3B4E]' : 'text-[#9BA5B5]'
                              }`}
                            >
                              {isSelected ? '✓ Selected' : 'Select →'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Compact Parameters & Big Attack Launch Button */}
                  <div className="mt-1 p-2.5 rounded-lg bg-[#171C26] border border-[#293140] flex items-center justify-between gap-3">
                    <div className="flex-1 text-xs">
                      {selectedScenario === 'attack_port_scan' && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#9BA5B5] flex-shrink-0">Scan Ports:</span>
                          <input
                            type="text"
                            value={attackPorts}
                            onChange={(e) => setAttackPorts(e.target.value)}
                            className="w-full bg-[#11151D] border border-[#293140] rounded px-2 py-1 text-xs text-[#F3F5F8] font-mono focus:border-[#FF3B4E] focus:outline-none"
                            placeholder="21, 22, 23, 80, 443"
                          />
                        </div>
                      )}
                      {selectedScenario === 'syn_flood_dos' && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#9BA5B5] flex-shrink-0">Target Port:</span>
                          <input
                            type="text"
                            value={attackPorts}
                            onChange={(e) => setAttackPorts(e.target.value)}
                            className="w-full bg-[#11151D] border border-[#293140] rounded px-2 py-1 text-xs text-[#F3F5F8] font-mono focus:border-[#FF3B4E] focus:outline-none"
                            placeholder="80"
                          />
                        </div>
                      )}
                      {selectedScenario === 'auth_brute_force' && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#9BA5B5] flex-shrink-0">User:</span>
                          <input
                            type="text"
                            value={attackUsername}
                            onChange={(e) => setAttackUsername(e.target.value)}
                            className="w-20 bg-[#11151D] border border-[#293140] rounded px-2 py-1 text-xs text-[#F3F5F8] font-mono focus:border-[#FF3B4E] focus:outline-none"
                          />
                          <span className="text-[11px] text-[#9BA5B5] flex-shrink-0">Wordlist:</span>
                          <input
                            type="text"
                            value={attackWordlist}
                            onChange={(e) => setAttackWordlist(e.target.value)}
                            className="w-full bg-[#11151D] border border-[#293140] rounded px-2 py-1 text-xs text-[#F3F5F8] font-mono focus:border-[#FF3B4E] focus:outline-none"
                          />
                        </div>
                      )}
                      {selectedScenario === 'web_security_injection' && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#9BA5B5] flex-shrink-0">Payload:</span>
                          <input
                            type="text"
                            value={attackPayload}
                            onChange={(e) => setAttackPayload(e.target.value)}
                            className="w-full bg-[#11151D] border border-[#293140] rounded px-2 py-1 text-xs text-[#F3F5F8] font-mono focus:border-[#FF3B4E] focus:outline-none"
                          />
                        </div>
                      )}
                      {(selectedScenario === 'arp_cache_poisoning' ||
                        selectedScenario === 'traffic_analysis') && (
                        <span className="text-[11px] text-[#9BA5B5]">
                          Ready to simulate Layer 2 attack against {String(activeTargetData?.config?.name || 'target')}.
                        </span>
                      )}
                    </div>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleExecuteAttack}
                      loading={attackLoading}
                      disabled={!attackTarget}
                      icon={<Flame size={14} />}
                      className="px-4 py-2 font-bold shadow-lg shadow-red-950/40"
                    >
                      {attackLoading ? 'Simulating...' : 'Launch Attack'}
                    </Button>
                  </div>
                </div>

                {/* Right: Attack Execution Results & Lootbox */}
                <div className="w-1/2 md:w-2/5 p-3 overflow-y-auto flex flex-col gap-2.5 bg-[#0B0D12]">
                  {!attackResponse ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-[#9BA5B5] gap-2 border border-dashed border-[#293140] rounded-lg">
                      <Flame size={32} className="text-[#FF3B4E]/30" />
                      <p className="text-sm font-bold text-[#F3F5F8]">Attack Console Ready</p>
                      <p className="max-w-xs text-[11px]">
                        1. Select target device above<br />
                        2. Pick an attack vector card<br />
                        3. Click "Launch Attack" to simulate exploit!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Status Banner */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#171C26] border border-[#293140]">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#9BA5B5] block">
                            Scenario Result
                          </span>
                          <h4 className="text-xs font-bold text-[#F3F5F8]">
                            {attackResponse.scenario_title}
                          </h4>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded text-xs font-extrabold uppercase tracking-wider border ${
                            attackResponse.outcome === 'compromised'
                              ? 'bg-red-950/80 text-[#FF3B4E] border-[#FF3B4E]/60 shadow-lg shadow-red-900/40'
                              : attackResponse.outcome === 'blocked'
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800 shadow-lg shadow-emerald-900/40'
                              : 'bg-amber-950/80 text-amber-400 border-amber-800'
                          }`}
                        >
                          {attackResponse.outcome}
                        </span>
                      </div>

                      {/* Captured Evidence & Loot Box */}
                      <div className="p-2.5 rounded-lg bg-[#171C26] border border-[#293140] space-y-1.5">
                        <span className="text-[10px] font-bold text-[#FF8A4C] uppercase tracking-wider block flex items-center gap-1.5">
                          <Lock size={12} />
                          Captured Evidence & Exploit Loot
                        </span>
                        <div className="bg-[#0B0D12] p-2 rounded border border-[#293140] font-mono text-[10px] space-y-1 text-[#F3F5F8]">
                          {Object.entries(attackResponse.evidence).map(([key, val]) => (
                            <div
                              key={key}
                              className="flex justify-between border-b border-[#171C26] pb-0.5"
                            >
                              <span className="text-[#9BA5B5]">{key}:</span>
                              <span className="text-[#FF3B4E] font-semibold">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Educational Takeaway & Remediation Button */}
                      <div className="p-2.5 rounded-lg bg-[#171C26] border border-[#293140] space-y-2">
                        <p className="text-[10px] text-[#9BA5B5] leading-relaxed">
                          {attackResponse.educational_takeaway}
                        </p>

                        {attackResponse.outcome === 'compromised' && (
                          <button
                            type="button"
                            onClick={() => {
                              setAppMode('defend');
                              setBottomTab('defense_verify');
                            }}
                            className="w-full py-1.5 px-2 bg-[#3B82F6]/20 hover:bg-[#3B82F6]/30 text-[#60A5FA] border border-[#3B82F6]/40 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <ShieldCheck size={13} />
                            <span>Switch to DEFEND MODE to Fix →</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 2: INTERACTIVE LINUX TERMINAL ----------------- */}
          {bottomTab === 'terminal' && (
            <div className="flex-1 flex overflow-hidden">
              <LinuxTerminal />
            </div>
          )}

          {/* ----------------- TAB 3: DEFENSE VERIFICATION (BEFORE/AFTER) ----------------- */}
          {bottomTab === 'defense_verify' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Verification Controls */}
              <div className="w-80 border-r border-[#293140] p-3 flex flex-col gap-2.5 overflow-y-auto bg-[#11151D]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#3B82F6] flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#3B82F6]" />
                    Verify Defense System
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/60 text-[#3B82F6] border border-blue-800/50 font-bold font-mono">
                    DEFEND MODE
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#9BA5B5] block mb-1">
                    Select Scenario to Verify
                  </label>
                  <select
                    value={selectedScenario}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#3B82F6] focus:outline-none"
                  >
                    <option value="attack_port_scan">Network Recon: TCP Port Scan Filtering</option>
                    <option value="auth_brute_force">Authentication: Fail2ban & Rate Limiting</option>
                    <option value="traffic_analysis">Traffic Encryption: TLS 1.3 Handshake</option>
                    <option value="web_security_injection">Web Defense: WAF & Parameterized Queries</option>
                    <option value="firewall_segmentation">Network Segmentation: Inter-VLAN Firewall ACL</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#9BA5B5] block mb-1">
                    Target Host Under Defense
                  </label>
                  <select
                    value={attackTarget}
                    onChange={(e) => setAttackTarget(e.target.value)}
                    className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#3B82F6] focus:outline-none"
                  >
                    <option value="">-- Select Protected Host --</option>
                    {attackableNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {((n.data as ResourceNodeData).config?.name as string) || n.id} (
                        {((n.data as ResourceNodeData).resourceType).replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#9BA5B5] block mb-1">
                    Applied Defense Summary
                  </label>
                  <input
                    type="text"
                    value={defenseActionSummary}
                    onChange={(e) => setDefenseActionSummary(e.target.value)}
                    placeholder="e.g. Enforce default-deny firewall ACL & WAF"
                    className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1 text-xs text-[#F3F5F8] focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRunVerifyDefense}
                  loading={verifyLoading}
                  icon={<ShieldCheck size={13} className="text-[#3B82F6]" />}
                  className="mt-1"
                >
                  {verifyLoading ? 'Verifying Defense...' : 'Run Verification Test'}
                </Button>

                <div className="p-2.5 rounded bg-[#171C26] border border-[#293140] text-[11px] text-[#9BA5B5] space-y-1">
                  <p className="font-semibold text-[#F3F5F8]">How Verification Works:</p>
                  <p>1. Apply security policies (firewall rules, WAF, SSH keys) in Property Inspector.</p>
                  <p>2. Rerun the approved test deterministically against the lab without leaving Defend Mode.</p>
                  <p>3. Review Before & After side-by-side evidence.</p>
                </div>
              </div>

              {/* Right Column: Before & After Side-by-Side Comparison */}
              <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3">
                {!comparisonResult ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-[#9BA5B5] gap-2">
                    <ShieldCheck size={36} className="text-[#3B82F6]/40" />
                    <p className="text-sm font-semibold text-[#F3F5F8]">
                      Verify Defense Effectiveness
                    </p>
                    <p className="max-w-md">
                      Click "Run Verification Test" to compare your current hardened configuration against the baseline attack outcome.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Comparison Verdict Banner */}
                    <div
                      className={`p-3 rounded-lg border flex items-center justify-between ${
                        comparisonResult.defense_effective
                          ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                          : 'bg-amber-950/40 border-amber-800 text-amber-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {comparisonResult.defense_effective ? (
                          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                        ) : (
                          <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
                        )}
                        <div>
                          <span className="text-xs font-bold block uppercase tracking-wide">
                            {comparisonResult.defense_effective
                              ? 'DEFENSE EFFECTIVE: VULNERABILITY NEUTRALIZED'
                              : 'DEFENSE INCOMPLETE: TARGET STILL VULNERABLE'}
                          </span>
                          <span className="text-[11px] text-[#9BA5B5]">
                            Status Progression: {comparisonResult.before_status.toUpperCase()} (Before) →{' '}
                            {comparisonResult.after_status.toUpperCase()} (After)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Side-by-Side Cards */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {/* Before (Initial Attack) */}
                      <div className="p-3 rounded-lg bg-[#171C26] border border-[#293140] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#FF3B4E] uppercase tracking-wider">
                            BEFORE (Initial Attack)
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-950 text-[#FF3B4E] border border-red-800">
                            {comparisonResult.before_status}
                          </span>
                        </div>
                        <div className="bg-[#0B0D12] p-2.5 rounded border border-[#293140] font-mono text-[11px] space-y-1">
                          <div className="text-[#9BA5B5]">
                            Status:{' '}
                            <span className="text-[#FF3B4E] font-semibold">
                              {comparisonResult.before_status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-[#9BA5B5]">
                            Events Observed:{' '}
                            <span className="text-[#F3F5F8]">
                              {comparisonResult.before_events_count} packet events
                            </span>
                          </div>
                          <div className="text-[#9BA5B5] truncate">
                            Summary: <span className="text-amber-300">{comparisonResult.before_summary}</span>
                          </div>
                        </div>
                      </div>

                      {/* After (Defended Verification) */}
                      <div className="p-3 rounded-lg bg-[#171C26] border border-[#293140] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#3B82F6] uppercase tracking-wider">
                            AFTER (With Defenses Applied)
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                            {comparisonResult.after_status}
                          </span>
                        </div>
                        <div className="bg-[#0B0D12] p-2.5 rounded border border-[#293140] font-mono text-[11px] space-y-1">
                          <div className="text-[#9BA5B5]">
                            Status:{' '}
                            <span className="text-emerald-400 font-semibold">
                              {comparisonResult.after_status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-[#9BA5B5]">
                            Defense Enforced:{' '}
                            <span className="text-emerald-400">
                              {comparisonResult.defense_effective ? 'ACTIVE & EFFECTIVE' : 'INSUFFICIENT'}
                            </span>
                          </div>
                          <div className="text-[#9BA5B5] truncate">
                            Defense Applied:{' '}
                            <span className="text-blue-300">{comparisonResult.defense_applied}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Educational Verdict & Root Cause Analysis */}
                    <div className="p-3 rounded-lg bg-[#171C26] border border-[#293140] space-y-1 text-xs">
                      <span className="text-[11px] font-bold text-[#60A5FA] uppercase tracking-wider block">
                        Educational Verdict & Takeaway
                      </span>
                      <p className="text-[11px] text-[#F3F5F8] leading-relaxed">
                        {comparisonResult.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----------------- TAB 4: TRAFFIC / PACKET INSPECTOR ----------------- */}
          {bottomTab === 'traffic' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-2 bg-[#171C26] border-b border-[#293140] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#9BA5B5]">Filter Protocol / Type:</span>
                  <select
                    value={eventTypeFilter}
                    onChange={(e) => setEventTypeFilter(e.target.value)}
                    className="bg-[#11151D] border border-[#293140] rounded px-2 py-1 text-xs text-[#F3F5F8]"
                  >
                    <option value="all">All Events</option>
                    <option value="icmp_request">ICMP Request (Ping)</option>
                    <option value="icmp_reply">ICMP Reply</option>
                    <option value="icmp_unreachable">ICMP Unreachable</option>
                    <option value="firewall_deny">Firewall Deny</option>
                    <option value="firewall_allow">Firewall Allow</option>
                    <option value="routing_lookup">Routing Lookup</option>
                    <option value="arp_request">ARP Request</option>
                  </select>
                </div>
                <span className="text-[#9BA5B5] text-[11px]">
                  Showing {filteredEvents.length} of {allDisplayEvents.length} events
                </span>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-10 text-xs text-[#9BA5B5]">
                    No network events recorded yet. Launch an attack or run terminal commands to generate packet telemetry.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs text-[#F3F5F8]">
                    <thead className="bg-[#171C26] text-[#9BA5B5] text-[11px] uppercase tracking-wider sticky top-0 border-b border-[#293140]">
                      <tr>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Source</th>
                        <th className="py-2 px-3">Destination</th>
                        <th className="py-2 px-3">Protocol</th>
                        <th className="py-2 px-3">Summary</th>
                        <th className="py-2 px-3">Provenance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#293140]">
                      {filteredEvents.map((evt, idx) => (
                        <tr key={evt.id || idx} className="hover:bg-[#171C26]/60 transition-colors">
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getEventBadge(
                                evt.event_type
                              )}`}
                            >
                              {evt.event_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-medium text-[#F3F5F8]">
                            {evt.source_device_name || evt.source_device_id || '—'}
                          </td>
                          <td className="py-2 px-3 text-[#9BA5B5]">
                            {evt.dest_device_name || evt.dest_device_id || '—'}
                          </td>
                          <td className="py-2 px-3 uppercase text-[#60A5FA] font-mono text-[11px]">
                            {evt.protocol || '—'}
                          </td>
                          <td className="py-2 px-3 text-[#F3F5F8] max-w-md truncate" title={evt.summary}>
                            {evt.summary}
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                              {evt.provenance}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SimulationPanel;
