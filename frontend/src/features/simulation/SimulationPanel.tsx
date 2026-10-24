import { useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Filter,
  Flame,
  Loader2,
  Lock,
  Play,
  Radio,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  StopCircle,
  Terminal,
  XCircle,
} from 'lucide-react';
import { useEditorStore, type ResourceNodeData } from '../../stores/editorStore';
import { useSimulationStore, type BottomTab } from '../../stores/simulationStore';
import { FindingCard } from '../security/FindingCard';
import { AttackPathView } from '../security/AttackPathView';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import type { NetworkEvent } from '../../types';

export function SimulationPanel() {
  const { toast, success: toastSuccess, error: toastError } = useToast();

  // Editor Store
  const lab = useEditorStore((s) => s.lab);
  const nodes = useEditorStore((s) => s.nodes);
  const scanResult = useEditorStore((s) => s.scanResult);
  const scanning = useEditorStore((s) => s.scanning);
  const runScan = useEditorStore((s) => s.runScan);
  const selectNode = useEditorStore((s) => s.selectNode);
  const appMode = useEditorStore((s) => s.appMode);
  const setAppMode = useEditorStore((s) => s.setAppMode);

  // Simulation Store
  const bottomTab = useSimulationStore((s) => s.bottomTab);
  const setBottomTab = useSimulationStore((s) => s.setBottomTab);
  const panelOpen = useSimulationStore((s) => s.panelOpen);
  const setPanelOpen = useSimulationStore((s) => s.setPanelOpen);
  const currentRun = useSimulationStore((s) => s.currentRun);
  const runLoading = useSimulationStore((s) => s.runLoading);
  const runEvents = useSimulationStore((s) => s.runEvents);
  const validationResult = useSimulationStore((s) => s.validationResult);
  const validating = useSimulationStore((s) => s.validating);
  const pingLoading = useSimulationStore((s) => s.pingLoading);
  const pingEvents = useSimulationStore((s) => s.pingEvents);
  const portScanLoading = useSimulationStore((s) => s.portScanLoading);
  const portScanEvents = useSimulationStore((s) => s.portScanEvents);
  const validateTopology = useSimulationStore((s) => s.validateTopology);
  const startSimulation = useSimulationStore((s) => s.startSimulation);
  const stopSimulation = useSimulationStore((s) => s.stopSimulation);
  const runPing = useSimulationStore((s) => s.runPing);
  const runPortScan = useSimulationStore((s) => s.runPortScan);

  // Attack & Defend Store Methods
  const executeAttack = useSimulationStore((s) => s.executeAttack);
  const runVerifyDefense = useSimulationStore((s) => s.runVerifyDefense);
  const attackLoading = useSimulationStore((s) => s.attackLoading);
  const attackResponse = useSimulationStore((s) => s.attackResponse);
  const verifyLoading = useSimulationStore((s) => s.verifyLoading);
  const comparisonResult = useSimulationStore((s) => s.comparisonResult);

  // Local state
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [securitySubTab, setSecuritySubTab] = useState<'findings' | 'attack_paths'>('findings');
  const [pingSource, setPingSource] = useState<string>('');
  const [pingDest, setPingDest] = useState<string>('');
  const [portScanSource, setPortScanSource] = useState<string>('');
  const [portScanDest, setPortScanDest] = useState<string>('');
  const [portScanPorts, setPortScanPorts] = useState<string>('21, 22, 23, 80, 443, 3306, 8080');
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

  const findings = scanResult?.findings || [];
  const attackPaths = scanResult?.attack_paths || [];

  const filteredFindings = findings.filter((f) => {
    if (severityFilter === 'all') return true;
    return f.severity === severityFilter;
  });

  const severityCounts = {
    critical: findings.filter((f) => f.severity === 'critical').length,
    high: findings.filter((f) => f.severity === 'high').length,
    medium: findings.filter((f) => f.severity === 'medium').length,
    low: findings.filter((f) => f.severity === 'low').length,
  };

  // Endpoint nodes eligible for ping and scan
  const pingableNodes = nodes.filter((n) => {
    const rType = (n.data as ResourceNodeData)?.resourceType;
    return [
      'pc',
      'server',
      'linux_server',
      'web_server',
      'dns_server',
      'endpoint',
      'firewall',
      'router',
      'external_network',
    ].includes(rType);
  });

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

  const handleExecuteAttack = async () => {
    if (!lab) return;
    if (!attackTarget) {
      toastError('Please select a target host for the attack scenario');
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

  const handleValidate = async () => {
    if (!lab) return;
    try {
      const res = await validateTopology(lab.id);
      if (res.valid) {
        toastSuccess('Topology is valid! No configuration errors detected.');
      } else {
        toastError(`Topology validation found ${res.errors.length} error(s).`);
      }
    } catch {
      toastError('Failed to validate topology');
    }
  };

  const handleStartSim = async () => {
    if (!lab) return;
    try {
      const run = await startSimulation(lab.id);
      toastSuccess(`Simulation completed: ${run.events?.length || 0} network events generated.`);
    } catch {
      toastError('Simulation run failed');
    }
  };

  const handleExecutePing = async () => {
    if (!lab) return;
    if (!pingSource || !pingDest) {
      toastError('Select both a source and destination node for ping test');
      return;
    }
    if (pingSource === pingDest) {
      toastError('Source and destination cannot be the same device');
      return;
    }
    try {
      const events = await runPing(lab.id, pingSource, pingDest);
      const replies = events.filter((e) => e.event_type === 'icmp_reply');
      const unreachables = events.filter((e) => e.event_type === 'icmp_unreachable' || e.event_type === 'firewall_deny');
      if (replies.length > 0) {
        toastSuccess(`Ping successful: Host replied with ICMP echo-reply (${replies.length} reply received).`);
      } else if (unreachables.length > 0) {
        toastError(`Ping failed: Destination unreachable (${unreachables[0]?.summary || 'traffic blocked'}).`);
      } else {
        toastSuccess('Ping simulation complete.');
      }
    } catch (err) {
      toastError(`Ping failed: ${(err as Error).message}`);
    }
  };

  const handleExecutePortScan = async () => {
    if (!lab) return;
    if (!portScanSource || !portScanDest) {
      toastError('Select both a scanner host and target device for port scan');
      return;
    }
    if (portScanSource === portScanDest) {
      toastError('Source and destination cannot be the same device');
      return;
    }
    try {
      const parsedPorts = portScanPorts
        .split(',')
        .map((p) => parseInt(p.trim(), 10))
        .filter((p) => !isNaN(p) && p > 0 && p <= 65535);
      const events = await runPortScan(lab.id, portScanSource, portScanDest, parsedPorts.length > 0 ? parsedPorts : undefined);
      const summaryEvt = events.find((e) => e.event_type === 'port_scan_complete');
      if (summaryEvt) {
        toastSuccess(summaryEvt.summary);
      } else {
        toastSuccess('Port scan attack simulation complete.');
      }
    } catch (err) {
      toastError(`Port scan failed: ${(err as Error).message}`);
    }
  };

  const allDisplayEvents = runEvents.length > 0 ? runEvents : portScanEvents.length > 0 ? portScanEvents : pingEvents;
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
      {/* Top Header / Mode & Tabs Bar */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-[#293140] bg-[#171C26]">
        {/* Left: Tab Selectors & Panel Toggle */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setPanelOpen(!panelOpen)}
            className="p-1 rounded text-[#9BA5B5] hover:text-[#F3F5F8] hover:bg-[#11151D] transition-colors"
            title={panelOpen ? 'Collapse Bottom Panel' : 'Expand Bottom Panel'}
          >
            {panelOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>

          {/* Mode Pill Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 text-[11px] font-semibold mr-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Simulator Mode</span>
          </div>

          {/* Tab 0: Attack Launcher */}
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

          {/* Tab 0.5: Verify Defense */}
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

          {/* Tab 1: Security Scan */}
          <button
            type="button"
            onClick={() => setBottomTab('security')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              bottomTab === 'security' && panelOpen
                ? 'bg-[#FF3B4E]/15 text-[#FF3B4E] border border-[#FF3B4E]/30 font-semibold'
                : 'text-[#9BA5B5] hover:text-[#F3F5F8] hover:bg-[#11151D]'
            }`}
          >
            <ShieldAlert size={14} className={bottomTab === 'security' && panelOpen ? 'text-[#FF3B4E]' : ''} />
            <span>Security Scan</span>
            {findings.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#FF3B4E] text-white text-[10px] font-bold">
                {findings.length}
              </span>
            )}
          </button>

          {/* Tab 2: Network Simulation */}
          <button
            type="button"
            onClick={() => setBottomTab('simulation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              bottomTab === 'simulation' && panelOpen
                ? 'bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30 font-semibold'
                : 'text-[#9BA5B5] hover:text-[#F3F5F8] hover:bg-[#11151D]'
            }`}
          >
            <Activity size={14} className={bottomTab === 'simulation' && panelOpen ? 'text-[#60A5FA]' : ''} />
            <span>Network Simulation</span>
            {validationResult && !validationResult.valid && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-bold">
                {validationResult.errors.length}
              </span>
            )}
          </button>

          {/* Tab 3: Traffic / Events */}
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

          {/* Tab 4: Ping Diagnostic */}
          <button
            type="button"
            onClick={() => setBottomTab('ping')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              bottomTab === 'ping' && panelOpen
                ? 'bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 font-semibold'
                : 'text-[#9BA5B5] hover:text-[#F3F5F8] hover:bg-[#11151D]'
            }`}
          >
            <Send size={13} className={bottomTab === 'ping' && panelOpen ? 'text-[#34D399]' : ''} />
            <span>Ping Tool</span>
          </button>

          {/* Tab 5: Port Scanner (Attack Simulation) */}
          <button
            type="button"
            onClick={() => setBottomTab('portscan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              bottomTab === 'portscan' && panelOpen
                ? 'bg-[#EC4899]/15 text-[#F472B6] border border-[#EC4899]/30 font-semibold'
                : 'text-[#9BA5B5] hover:text-[#F3F5F8] hover:bg-[#11151D]'
            }`}
          >
            <Crosshair size={13} className={bottomTab === 'portscan' && panelOpen ? 'text-[#F472B6]' : ''} />
            <span>Port Scanner</span>
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

          {bottomTab === 'security' && (
            <Button
              size="sm"
              variant="primary"
              onClick={runScan}
              loading={scanning}
              icon={<Play size={13} />}
            >
              {scanning ? 'Scanning...' : 'Run Scan'}
            </Button>
          )}

          {bottomTab === 'simulation' && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleValidate}
                loading={validating}
                icon={<CheckCircle2 size={13} />}
              >
                Validate
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleStartSim}
                loading={runLoading}
                icon={<Play size={13} />}
              >
                {runLoading ? 'Simulating...' : 'Run Simulation'}
              </Button>
            </div>
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
        <div className="h-72 flex flex-col bg-[#11151D] overflow-hidden">
          {/* ----------------- TAB 0: ATTACK SCENARIO LAUNCHER ----------------- */}
          {bottomTab === 'attack' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Attack Scenario Configuration */}
              <div className="w-80 border-r border-[#293140] p-3 flex flex-col gap-2.5 overflow-y-auto bg-[#11151D]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF3B4E] flex items-center gap-1.5">
                    <Flame size={14} className="text-[#FF3B4E]" />
                    Attack Scenario Launcher
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/60 text-[#FF3B4E] border border-red-800/50 font-bold font-mono">
                    ATTACK MODE
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#9BA5B5] block mb-1">Select Attack Scenario</label>
                  <select
                    value={selectedScenario}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none"
                  >
                    <option value="attack_port_scan">Network Recon: TCP Port Scan & Fingerprinting</option>
                    <option value="auth_brute_force">Authentication: SSH Dictionary Brute Force</option>
                    <option value="traffic_analysis">Traffic Sniffing: Cleartext Tokens & PCAP Capture</option>
                    <option value="web_security_injection">Web Security: OWASP SQLi / XSS Attack</option>
                    <option value="firewall_segmentation">Segmentation: Cross-VLAN Lateral Movement</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#9BA5B5] block mb-1">Target Victim Device</label>
                  <select
                    value={attackTarget}
                    onChange={(e) => setAttackTarget(e.target.value)}
                    className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none"
                  >
                    <option value="">-- Choose Target in Lab --</option>
                    {attackableNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {((n.data as ResourceNodeData).config?.name as string) || n.id} ({((n.data as ResourceNodeData).resourceType).replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Scenario specific parameters */}
                {selectedScenario === 'attack_port_scan' && (
                  <div>
                    <label className="text-[11px] font-medium text-[#9BA5B5] block mb-1">Probed TCP Ports</label>
                    <input
                      type="text"
                      value={attackPorts}
                      onChange={(e) => setAttackPorts(e.target.value)}
                      className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1 text-xs text-[#F3F5F8] font-mono focus:border-[#FF3B4E] focus:outline-none"
                    />
                  </div>
                )}

                {selectedScenario === 'auth_brute_force' && (
                  <div className="space-y-1.5">
                    <div>
                      <label className="text-[11px] font-medium text-[#9BA5B5] block mb-0.5">Target Username</label>
                      <input
                        type="text"
                        value={attackUsername}
                        onChange={(e) => setAttackUsername(e.target.value)}
                        className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1 text-xs text-[#F3F5F8] font-mono focus:border-[#FF3B4E] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[#9BA5B5] block mb-0.5">Password Wordlist</label>
                      <input
                        type="text"
                        value={attackWordlist}
                        onChange={(e) => setAttackWordlist(e.target.value)}
                        className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1 text-xs text-[#F3F5F8] font-mono focus:border-[#FF3B4E] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {selectedScenario === 'web_security_injection' && (
                  <div>
                    <label className="text-[11px] font-medium text-[#9BA5B5] block mb-1">SQLi / XSS Injection Vector</label>
                    <input
                      type="text"
                      value={attackPayload}
                      onChange={(e) => setAttackPayload(e.target.value)}
                      className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1 text-xs text-[#F3F5F8] font-mono focus:border-[#FF3B4E] focus:outline-none"
                    />
                  </div>
                )}

                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleExecuteAttack}
                  loading={attackLoading}
                  disabled={!attackTarget}
                  icon={<Flame size={13} />}
                  className="mt-1 shadow-md shadow-red-900/30"
                >
                  {attackLoading ? 'Simulating Attack...' : 'Launch Attack Run'}
                </Button>
              </div>

              {/* Right Column: Execution Console & Evidence */}
              <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3">
                {!attackResponse ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-[#9BA5B5] gap-2">
                    <Flame size={36} className="text-[#FF3B4E]/40" />
                    <p className="text-sm font-semibold text-[#F3F5F8]">Ready for Attack Simulation</p>
                    <p className="max-w-md">
                      Select an authorized target device from your lab and trigger an offensive simulation to test security posture.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Status Header */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#171C26] border border-[#293140]">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#9BA5B5] block">Scenario Execution Result</span>
                        <h3 className="text-sm font-bold text-[#F3F5F8]">{attackResponse.scenario_title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider border ${
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
                    </div>

                    {/* Evidence and Telemetry */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {/* Left: Evidence Loot */}
                      <div className="p-3 rounded-lg bg-[#171C26] border border-[#293140] space-y-2">
                        <span className="text-[11px] font-semibold text-[#FF8A4C] uppercase tracking-wider block flex items-center gap-1.5">
                          <Lock size={12} />
                          Captured Evidence & Artifacts
                        </span>
                        <div className="bg-[#0B0D12] p-2 rounded border border-[#293140] font-mono text-[11px] space-y-1 text-[#F3F5F8]">
                          {Object.entries(attackResponse.evidence).map(([key, val]) => (
                            <div key={key} className="flex justify-between border-b border-[#171C26] pb-0.5">
                              <span className="text-[#9BA5B5]">{key}:</span>
                              <span className="text-[#FF3B4E] font-semibold">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Educational Exploit Analysis & Next Step */}
                      <div className="p-3 rounded-lg bg-[#171C26] border border-[#293140] space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[11px] font-semibold text-[#60A5FA] uppercase tracking-wider block flex items-center gap-1.5">
                            <Terminal size={12} />
                            Educational Assessment & Remediation
                          </span>
                          <p className="text-[11px] text-[#9BA5B5] mt-1 leading-relaxed">
                            {attackResponse.educational_takeaway}
                          </p>
                        </div>

                        {attackResponse.outcome === 'compromised' && (
                          <div className="pt-2 border-t border-[#293140]">
                            <button
                              type="button"
                              onClick={() => {
                                setAppMode('defend');
                                setBottomTab('defense_verify');
                              }}
                              className="w-full py-1.5 px-2 bg-[#3B82F6]/20 hover:bg-[#3B82F6]/30 text-[#60A5FA] border border-[#3B82F6]/40 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <ShieldCheck size={13} />
                              <span>Switch to DEFEND MODE to Remediate →</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Packet Events Table */}
                    {attackResponse.events && attackResponse.events.length > 0 && (
                      <div className="border border-[#293140] rounded overflow-hidden">
                        <div className="px-3 py-1.5 bg-[#171C26] text-[10px] font-semibold text-[#9BA5B5] uppercase">
                          Observed Packet Telemetry ({attackResponse.events.length} events)
                        </div>
                        <div className="max-h-28 overflow-y-auto text-xs font-mono">
                          {attackResponse.events.map((evt, i) => (
                            <div key={i} className="px-3 py-1 border-b border-[#293140]/60 flex items-center justify-between hover:bg-[#171C26]/40">
                              <span className="text-[#9BA5B5]">{evt.event_type}</span>
                              <span className="text-[#F3F5F8] max-w-sm truncate">{evt.summary}</span>
                              <span className="text-emerald-400 text-[10px]">{evt.provenance}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----------------- TAB 0.5: DEFENSE VERIFICATION (BEFORE/AFTER) ----------------- */}
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
                  <label className="text-[11px] font-semibold text-[#9BA5B5] block mb-1">Select Scenario to Verify</label>
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
                  <label className="text-[11px] font-semibold text-[#9BA5B5] block mb-1">Target Host Under Defense</label>
                  <select
                    value={attackTarget}
                    onChange={(e) => setAttackTarget(e.target.value)}
                    className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#3B82F6] focus:outline-none"
                  >
                    <option value="">-- Select Protected Host --</option>
                    {attackableNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {((n.data as ResourceNodeData).config?.name as string) || n.id} ({((n.data as ResourceNodeData).resourceType).replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#9BA5B5] block mb-1">Applied Defense Summary</label>
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
                    <p className="text-sm font-semibold text-[#F3F5F8]">Verify Defense Effectiveness</p>
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

          {/* ----------------- TAB 1: SECURITY SCAN ----------------- */}
          {bottomTab === 'security' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {scanning ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-6">
                  <Loader2 size={32} className="animate-spin text-[#FF3B4E]" />
                  <div>
                    <p className="text-sm font-semibold text-[#F3F5F8]">Evaluating Security Policies</p>
                    <p className="text-xs text-[#9BA5B5] mt-1">
                      Analyzing network topology, firewalls, exposed ports, and attack paths...
                    </p>
                  </div>
                </div>
              ) : !scanResult ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-6">
                  <ShieldCheck size={36} className="text-[#9BA5B5]/60" />
                  <div>
                    <p className="text-sm font-semibold text-[#F3F5F8]">No Scan Executed Yet</p>
                    <p className="text-xs text-[#9BA5B5] mt-1 max-w-sm">
                      Run a network security scan to evaluate open services, firewall filtering, and attack paths.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={runScan} icon={<Play size={13} />}>
                    Run Security Scan
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 px-4 border-b border-[#293140] bg-[#11151D] text-xs">
                    <button
                      type="button"
                      onClick={() => setSecuritySubTab('findings')}
                      className={`py-2 px-1 font-semibold border-b-2 transition-colors ${
                        securitySubTab === 'findings'
                          ? 'border-[#FF3B4E] text-[#F3F5F8]'
                          : 'border-transparent text-[#9BA5B5] hover:text-[#F3F5F8]'
                      }`}
                    >
                      Security Findings ({findings.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSecuritySubTab('attack_paths')}
                      className={`py-2 px-1 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                        securitySubTab === 'attack_paths'
                          ? 'border-[#FF3B4E] text-[#F3F5F8]'
                          : 'border-transparent text-[#9BA5B5] hover:text-[#F3F5F8]'
                      }`}
                    >
                      <Crosshair size={13} className="text-[#FF3B4E]" />
                      Attack Paths ({attackPaths.length})
                    </button>

                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[11px] text-[#9BA5B5]">Severity:</span>
                      {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setSeverityFilter(sev)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            severityFilter === sev
                              ? 'bg-[#FF3B4E]/20 text-[#FF3B4E] border-[#FF3B4E]'
                              : 'bg-[#171C26] text-[#9BA5B5] border-[#293140]'
                          }`}
                        >
                          {sev.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {securitySubTab === 'findings' ? (
                      filteredFindings.length === 0 ? (
                        <div className="text-center py-8 text-xs text-[#9BA5B5]">
                          No security issues matching the selected filters.
                        </div>
                      ) : (
                        filteredFindings.map((finding, idx) => (
                          <FindingCard
                            key={`${finding.rule_id}-${finding.affected_resource_id}-${idx}`}
                            finding={finding}
                            onSelectResource={(id) => selectNode(id)}
                          />
                        ))
                      )
                    ) : (
                      <AttackPathView attackPaths={attackPaths} onSelectResource={(id) => selectNode(id)} />
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ----------------- TAB 2: NETWORK SIMULATION ----------------- */}
          {bottomTab === 'simulation' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left pane: Topology validation report */}
              <div className="w-1/2 border-r border-[#293140] flex flex-col p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9BA5B5] flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#60A5FA]" />
                    Topology Validation
                  </h4>
                  {validationResult && (
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                        validationResult.valid
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-red-950 text-red-400 border-red-800'
                      }`}
                    >
                      {validationResult.valid ? 'VALID' : 'INVALID'}
                    </span>
                  )}
                </div>

                {!validationResult ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-[#9BA5B5] gap-2">
                    <p>No topology validation performed yet.</p>
                    <Button size="sm" variant="secondary" onClick={handleValidate} loading={validating}>
                      Validate Topology
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {validationResult.errors.length === 0 && validationResult.warnings.length === 0 && (
                      <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded text-emerald-400">
                        ✓ All devices have valid IP configuration, gateways, and link integrity.
                      </div>
                    )}

                    {validationResult.errors.map((err, idx) => (
                      <div key={idx} className="p-2.5 bg-red-950/40 border border-red-800/50 rounded flex items-start gap-2">
                        <XCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-red-300 font-mono text-[11px]">{err.code}</div>
                          <div className="text-red-200 mt-0.5">{err.message}</div>
                        </div>
                      </div>
                    ))}

                    {validationResult.warnings.map((warn, idx) => (
                      <div key={idx} className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded flex items-start gap-2">
                        <AlertCircle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-amber-300 font-mono text-[11px]">{warn.code}</div>
                          <div className="text-amber-200 mt-0.5">{warn.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right pane: Run Summary */}
              <div className="w-1/2 flex flex-col p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9BA5B5] flex items-center gap-1.5">
                    <Activity size={14} className="text-[#60A5FA]" />
                    Simulation Run Status
                  </h4>
                  {currentRun && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-950 text-blue-400 border border-blue-800 font-mono">
                      {currentRun.status.toUpperCase()}
                    </span>
                  )}
                </div>

                {!currentRun ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-[#9BA5B5] gap-2">
                    <p>Click "Run Simulation" to execute automated deterministic reachability tests across all device pairs.</p>
                    <Button size="sm" variant="primary" onClick={handleStartSim} loading={runLoading}>
                      Run Simulation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-[#171C26] border border-[#293140] rounded">
                        <span className="text-[10px] text-[#9BA5B5] block uppercase">Tested Pairs</span>
                        <span className="text-base font-bold text-[#F3F5F8]">
                          {String(currentRun.result_summary?.pairs_tested ?? 0)}
                        </span>
                      </div>
                      <div className="p-3 bg-[#171C26] border border-[#293140] rounded">
                        <span className="text-[10px] text-[#9BA5B5] block uppercase">Reachable Pairs</span>
                        <span className="text-base font-bold text-emerald-400">
                          {String(currentRun.result_summary?.reachable_pairs ?? 0)}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#171C26] border border-[#293140] rounded space-y-1">
                      <div className="flex justify-between text-[#9BA5B5] text-[11px]">
                        <span>Mode:</span>
                        <span className="text-[#F3F5F8] font-mono">{currentRun.mode}</span>
                      </div>
                      <div className="flex justify-between text-[#9BA5B5] text-[11px]">
                        <span>Run ID:</span>
                        <span className="text-[#F3F5F8] font-mono truncate max-w-[200px]">{currentRun.id}</span>
                      </div>
                      <div className="flex justify-between text-[#9BA5B5] text-[11px]">
                        <span>Events Generated:</span>
                        <span className="text-[#60A5FA] font-bold">{currentRun.events?.length || 0}</span>
                      </div>
                    </div>

                    <Button size="sm" variant="secondary" onClick={() => setBottomTab('traffic')} className="w-full">
                      View Generated Network Packets in Traffic Inspector →
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----------------- TAB 3: TRAFFIC / PACKET INSPECTOR ----------------- */}
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
                    No network events recorded yet. Run a simulation or send an ICMP Ping from the Ping Tool.
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
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getEventBadge(evt.event_type)}`}>
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

          {/* ----------------- TAB 4: INTERACTIVE PING TOOL ----------------- */}
          {bottomTab === 'ping' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Ping Controls */}
              <div className="w-80 border-r border-[#293140] p-4 flex flex-col gap-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9BA5B5] flex items-center gap-1.5">
                  <Send size={14} className="text-[#10B981]" />
                  Interactive Ping Diagnostic
                </h4>

                <div>
                  <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Source Host</label>
                  <select
                    value={pingSource}
                    onChange={(e) => setPingSource(e.target.value)}
                    className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#10B981] focus:outline-none"
                  >
                    <option value="">-- Select Source Node --</option>
                    {pingableNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {((n.data as ResourceNodeData).config?.name as string) || n.id} ({(n.data as ResourceNodeData).resourceType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Destination Host</label>
                  <select
                    value={pingDest}
                    onChange={(e) => setPingDest(e.target.value)}
                    className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#10B981] focus:outline-none"
                  >
                    <option value="">-- Select Destination Node --</option>
                    {pingableNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {((n.data as ResourceNodeData).config?.name as string) || n.id} ({(n.data as ResourceNodeData).resourceType})
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleExecutePing}
                  loading={pingLoading}
                  disabled={!pingSource || !pingDest}
                  icon={<Send size={13} />}
                  className="mt-2"
                >
                  {pingLoading ? 'Transmitting ICMP...' : 'Send ICMP Echo (Ping)'}
                </Button>

                <p className="text-[11px] text-[#9BA5B5] mt-1">
                  Tests Layer 3 IP reachability, subnet masks, default gateways, and evaluates intermediate firewalls.
                </p>
              </div>

              {/* Right Ping Results Stream */}
              <div className="flex-1 p-4 overflow-y-auto">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9BA5B5] mb-3">
                  Live ICMP Packet Sequence
                </h4>

                {pingEvents.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center text-xs text-[#9BA5B5]">
                    Select a source and destination above and click "Send ICMP Echo" to view packet exchange.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pingEvents.map((pe, idx) => (
                      <div
                        key={pe.id || idx}
                        className="p-3 bg-[#171C26] border border-[#293140] rounded flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getEventBadge(pe.event_type)}`}>
                            {pe.event_type.toUpperCase()}
                          </span>
                          <span className="font-semibold text-[#F3F5F8]">{pe.source_device_name || pe.source_device_id}</span>
                          <ArrowRight size={13} className="text-[#9BA5B5]" />
                          <span className="font-semibold text-[#F3F5F8]">{pe.dest_device_name || pe.dest_device_id}</span>
                        </div>
                        <div className="text-[#9BA5B5] max-w-sm truncate text-[11px]">{pe.summary}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----------------- TAB 5: PORT SCANNER ATTACK TOOL ----------------- */}
          {bottomTab === 'portscan' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Controls */}
              <div className="w-80 border-r border-[#293140] p-4 flex flex-col gap-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9BA5B5] flex items-center gap-1.5">
                  <Crosshair size={14} className="text-[#EC4899]" />
                  TCP Port Scanner & Attack Recon
                </h4>

                <div>
                  <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Attacker / Scanner Host</label>
                  <select
                    value={portScanSource}
                    onChange={(e) => setPortScanSource(e.target.value)}
                    className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#EC4899] focus:outline-none"
                  >
                    <option value="">-- Select Scanner Node --</option>
                    {pingableNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {((n.data as ResourceNodeData).config?.name as string) || n.id} ({(n.data as ResourceNodeData).resourceType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Target Victim Device</label>
                  <select
                    value={portScanDest}
                    onChange={(e) => setPortScanDest(e.target.value)}
                    className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#EC4899] focus:outline-none"
                  >
                    <option value="">-- Select Target Node --</option>
                    {pingableNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {((n.data as ResourceNodeData).config?.name as string) || n.id} ({(n.data as ResourceNodeData).resourceType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#9BA5B5] block mb-1">Target Ports (comma-separated)</label>
                  <input
                    type="text"
                    value={portScanPorts}
                    onChange={(e) => setPortScanPorts(e.target.value)}
                    placeholder="21, 22, 23, 80, 443, 3306, 8080"
                    className="w-full bg-[#171C26] border border-[#293140] rounded px-2.5 py-1.5 text-xs text-[#F3F5F8] focus:border-[#EC4899] focus:outline-none font-mono"
                  />
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleExecutePortScan}
                  loading={portScanLoading}
                  disabled={!portScanSource || !portScanDest}
                  icon={<Crosshair size={13} />}
                  className="mt-2"
                >
                  {portScanLoading ? 'Scanning Ports...' : 'Execute Port Scan Attack'}
                </Button>

                <p className="text-[11px] text-[#9BA5B5] mt-1">
                  Probes TCP ports across routers and perimeter firewalls. Detects open services, firewall-filtered ports, and closed sockets.
                </p>
              </div>

              {/* Right Results Stream */}
              <div className="flex-1 p-4 overflow-y-auto">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9BA5B5] mb-3">
                  Service Discovery & Fingerprint Stream
                </h4>

                {portScanEvents.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center text-xs text-[#9BA5B5]">
                    Select an attacker node and victim server on the left, then click "Execute Port Scan Attack".
                  </div>
                ) : (
                  <div className="space-y-2">
                    {portScanEvents.map((pe, idx) => (
                      <div
                        key={pe.id || idx}
                        className="p-3 bg-[#171C26] border border-[#293140] rounded flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getEventBadge(pe.event_type)}`}>
                            {pe.event_type.replace('port_scan_', '').toUpperCase()}
                          </span>
                          <span className="font-semibold text-[#F3F5F8]">{pe.source_device_name || pe.source_device_id}</span>
                          <ArrowRight size={13} className="text-[#9BA5B5]" />
                          <span className="font-semibold text-[#F3F5F8]">{pe.dest_device_name || pe.dest_device_id}</span>
                        </div>
                        <div className="text-[#9BA5B5] max-w-sm truncate text-[11px]">{pe.summary}</div>
                      </div>
                    ))}
                  </div>
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
