import { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Laptop,
  Flame,
  Shield,
  Layers,
  Check,
  Send,
} from 'lucide-react';
import { useEditorStore, type ResourceNodeData } from '../../stores/editorStore';
import { useSimulationStore } from '../../stores/simulationStore';
import type { NetworkEvent } from '../../types';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info';
  content: string;
  timestamp?: string;
}

export function LinuxTerminal() {
  const lab = useEditorStore((s) => s.lab);
  const nodes = useEditorStore((s) => s.nodes);
  const executeAttack = useSimulationStore((s) => s.executeAttack);
  const runPing = useSimulationStore((s) => s.runPing);
  const runPortScan = useSimulationStore((s) => s.runPortScan);
  const attackResponse = useSimulationStore((s) => s.attackResponse);

  const getNodeConfig = (node?: any): Record<string, any> => {
    return ((node?.data as ResourceNodeData)?.config || {}) as Record<string, any>;
  };

  // Active terminal device (defaults to external attacker node or first PC)
  const defaultDevice =
    nodes.find((n) => {
      const rType = (n.data as ResourceNodeData)?.resourceType;
      const cfg = getNodeConfig(n);
      const name = String(cfg.name || '').toLowerCase();
      return (
        rType === 'external_network' ||
        name.includes('attacker') ||
        name.includes('wan')
      );
    }) ||
    nodes.find((n) => (n.data as ResourceNodeData)?.resourceType === 'pc') ||
    nodes[0];

  const [activeDeviceId, setActiveDeviceId] = useState<string>(defaultDevice?.id || '');
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState(false);

  const activeNode = nodes.find((n) => n.id === activeDeviceId) || defaultDevice;
  const activeCfg = getNodeConfig(activeNode);

  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 'welcome-1',
      type: 'info',
      content: '╔══════════════════════════════════════════════════════════════════════╗',
    },
    {
      id: 'welcome-2',
      type: 'info',
      content: '║  RedLab v1.1.1 — Interactive Linux Attack & Network Terminal        ║',
    },
    {
      id: 'welcome-3',
      type: 'info',
      content: '║  Type "help" for a list of attack commands, recon tools & syntax.    ║',
    },
    {
      id: 'welcome-4',
      type: 'info',
      content: '╚══════════════════════════════════════════════════════════════════════╝',
    },
    {
      id: 'welcome-5',
      type: 'output',
      content: `Current host: ${String(activeCfg.name || 'Kali Linux')} (${String(activeCfg.ip_address || '10.0.0.1')}) • Session: bash 5.2.21`,
    },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  // Focus input on click
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  // Resolve prompt prefix
  const getPrompt = () => {
    const name = String(activeCfg.name || 'kali')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .slice(0, 15);
    return `root@${name}:~# `;
  };

  // Helper to add lines
  const appendLine = (type: TerminalLine['type'], content: string) => {
    setLines((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type,
        content,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // Find a target node in the lab by IP, ID, or name
  const resolveTarget = (token: string): any => {
    if (!token) return undefined;
    const clean = token.trim().toLowerCase().replace(/^http:\/\//, '').replace(/\/.*$/, '');
    return nodes.find((n) => {
      const cfg = getNodeConfig(n);
      const ip = String(cfg.ip_address || '').toLowerCase();
      const name = String(cfg.name || '').toLowerCase();
      const id = n.id.toLowerCase();
      return ip === clean || name.includes(clean) || id === clean;
    });
  };

  // Execute typed command
  const handleCommandSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawCmd = commandInput.trim();
    if (!rawCmd) return;

    appendLine('input', `${getPrompt()}${rawCmd}`);
    setCommandHistory((prev) => [...prev, rawCmd]);
    setHistoryIndex(-1);
    setCommandInput('');
    setIsExecuting(true);

    const parts = rawCmd.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      switch (cmd) {
        case 'help':
        case '?': {
          appendLine('info', '━━━━━━━━━━━━━━━━ AVAILABLE REDLAB TERMINAL COMMANDS ━━━━━━━━━━━━━━━━');
          appendLine('info', '  [Reconnaissance & Scanning]');
          appendLine('output', '    nmap <target_ip>              - TCP SYN port scan & service fingerprinting');
          appendLine('output', '    nmap -p 22,80 <target_ip>     - Scan specific ports on target');
          appendLine('output', '    ping <target_ip>              - Test ICMP reachability & round-trip time');
          appendLine('info', '  [Cyber Attack & Exploit Tools]');
          appendLine('output', '    hping3 -S --flood -p 80 <ip>  - Launch TCP SYN Flood Denial of Service (DoS)');
          appendLine('output', '    hydra -l root ssh://<ip>      - Perform SSH dictionary brute-force attack');
          appendLine('output', '    curl "http://<ip>/?id=1\'OR\'1" - Test OWASP SQL injection auth bypass');
          appendLine('output', '    arpspoof -t <target> <gw>     - Man-in-the-Middle ARP cache poisoning');
          appendLine('info', '  [System & Network Diagnostics]');
          appendLine('output', '    ip a  | ifconfig             - Show device network interfaces, IP & MAC');
          appendLine('output', '    ip route | route -n           - Show routing table and default gateway');
          appendLine('output', '    iptables -L -n                - Display active firewall filter rules');
          appendLine('output', '    netstat -tuln | ss -tuln      - Display open listening ports on host');
          appendLine('output', '    hosts | cat /etc/hosts        - Show all known devices and IPs in lab');
          appendLine('info', '  [Educational Forensics & Monitor]');
          appendLine('output', '    forensics | ports             - Learn why ports got closed/filtered & who decided');
          appendLine('output', '    screen | victim | monitor     - Inspect simulated victim hacked screen & outage');
          appendLine('output', '    clear                         - Clear terminal screen');
          appendLine('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          break;
        }

        case 'clear': {
          setLines([]);
          break;
        }

        case 'whoami': {
          appendLine('output', 'root');
          break;
        }

        case 'uname':
        case 'uname -a': {
          appendLine('output', 'Linux redlab-sim 6.8.0-kali-amd64 #1 SMP PREEMPT x86_64 GNU/Linux');
          break;
        }

        case 'date': {
          appendLine('output', new Date().toUTCString());
          break;
        }

        case 'hosts':
        case 'cat /etc/hosts': {
          appendLine('info', '# RedLab Simulated Network Hosts (DNS Local Resolution):');
          nodes.forEach((n) => {
            const cfg = getNodeConfig(n);
            const ip = String(cfg.ip_address || 'Unassigned');
            const name = String(cfg.name || n.id).toLowerCase().replace(/\s+/g, '-');
            appendLine('output', `${ip.padEnd(16)} ${name}.lab  ${n.id}`);
          });
          break;
        }

        case 'ip':
        case 'ifconfig': {
          const sub = args[0]?.toLowerCase();
          if (cmd === 'ifconfig' || sub === 'a' || sub === 'addr' || !sub) {
            const cfg = getNodeConfig(activeNode);
            const ip = String(cfg.ip_address || '10.0.0.10');
            appendLine('output', `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500`);
            appendLine('output', `        inet ${ip}  netmask 255.255.255.0  broadcast ${ip.replace(/\.\d+$/, '.255')}`);
            appendLine('output', `        inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>`);
            appendLine('output', `        ether 02:42:0a:00:00:${activeNode?.id.slice(-2).padStart(2, '1')}  txqueuelen 1000  (Ethernet)`);
            appendLine('output', `        RX packets 14208  bytes 1840292 (1.8 MB)`);
            appendLine('output', `        TX packets 9831   bytes 1120489 (1.1 MB)`);
          } else if (sub === 'route') {
            const cfg = getNodeConfig(activeNode);
            const gw = String(cfg.default_gateway || '10.0.0.1');
            const ip = String(cfg.ip_address || '10.0.0.10');
            appendLine('output', `default via ${gw} dev eth0 proto static metric 100`);
            appendLine('output', `10.0.0.0/24 dev eth0 proto kernel scope link src ${ip}`);
          }
          break;
        }

        case 'route': {
          const cfg = getNodeConfig(activeNode);
          const gw = String(cfg.default_gateway || '10.0.0.1');
          appendLine('output', 'Kernel IP routing table');
          appendLine('output', 'Destination     Gateway         Genmask         Flags Metric Ref    Use Iface');
          appendLine('output', `0.0.0.0         ${gw.padEnd(15)} 0.0.0.0         UG    100    0        0 eth0`);
          appendLine('output', `10.0.0.0        0.0.0.0         255.255.255.0   U     0      0        0 eth0`);
          break;
        }

        case 'netstat':
        case 'ss': {
          const cfg = getNodeConfig(activeNode);
          const srvs = Array.isArray(cfg.services) ? cfg.services : [];
          appendLine('output', 'Active Internet connections (only servers)');
          appendLine('output', 'Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program');
          if (srvs.length === 0) {
            appendLine('output', 'tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      822/sshd');
          } else {
            srvs.forEach((s: any) => {
              if (s.enabled !== false) {
                appendLine('output', `tcp        0      0 0.0.0.0:${String(s.port).padEnd(15)} 0.0.0.0:*               LISTEN      ${s.port * 10}/${s.name || 'service'}`);
              }
            });
          }
          break;
        }

        case 'iptables': {
          const cfg = getNodeConfig(activeNode);
          const rules = Array.isArray(cfg.inbound_rules) ? cfg.inbound_rules : [];
          const defIn = String(cfg.default_inbound_action || 'deny');
          appendLine('output', `Chain INPUT (policy ${defIn.toUpperCase()} 0 packets, 0 bytes)`);
          appendLine('output', ' pkts bytes target     prot opt in     out     source               destination');
          if (rules.length === 0) {
            appendLine('output', `    0     0 ${defIn.toUpperCase()}        all  --  *      *       0.0.0.0/0            0.0.0.0/0`);
          } else {
            rules.forEach((r: any, i: number) => {
              appendLine(
                'output',
                ` ${String(i + 1).padStart(4)}     0 ${String(r.action || 'DENY').toUpperCase().padEnd(10)} ${String(r.protocol || 'TCP').padEnd(4)} --  eth0   *       ${String(r.source || '0.0.0.0/0').padEnd(20)} port ${String(r.port_range || 'all')}`
              );
            });
          }
          break;
        }

        // PING COMMAND
        case 'ping': {
          const targetStr = args[args.length - 1];
          if (!targetStr) {
            appendLine('error', 'Usage: ping <target_ip or host_name>');
            break;
          }
          const targetNode = resolveTarget(targetStr);
          const targetCfg = getNodeConfig(targetNode);
          const targetIp = String(targetCfg.ip_address || targetStr);

          // Check if target is overwhelmed by active SYN flood / DDoS
          const isDdosDown =
            attackResponse?.scenario_id === 'syn_flood_dos' &&
            attackResponse?.outcome === 'compromised' &&
            (targetNode?.id === attackResponse.target_id ||
              targetIp === attackResponse.target_id ||
              (targetNode && attackResponse.target_id.includes(targetNode.id)));

          if (isDdosDown) {
            appendLine('output', `PING ${targetIp} (${targetIp}) 56(84) bytes of data.`);
            appendLine('error', `Request timeout for icmp_seq 1 (Host unresponsive: TCP SYN backlog queue 100% full)`);
            appendLine('error', `Request timeout for icmp_seq 2 (OS kernel dropping ingress packets under DoS flood)`);
            appendLine('error', `Request timeout for icmp_seq 3 (Socket allocation table exhausted - kernel packet queue full)`);
            appendLine('error', `Request timeout for icmp_seq 4 (HTTP 504 Gateway Timeout / No route to host)`);
            appendLine('info', `--- ${targetIp} ping statistics ---`);
            appendLine('error', `4 packets transmitted, 0 received, 100% packet loss!`);
            appendLine('error', `[ALERT: TARGET SERVICE DOWN] Web service overwhelmed by Denial-of-Service.`);
            appendLine('info', `💡 Learning: Under SYN Flood, legitimate packets and ping ICMP are dropped. Switch to DEFENSE mode to deploy SYN cookies or rate limiting.`);
            break;
          }

          appendLine('output', `PING ${targetIp} (${targetIp}) 56(84) bytes of data.`);
          if (lab && targetNode) {
            try {
              const evts = await runPing(lab.id, activeNode?.id || '', targetNode.id);
              const replEvt = evts.find((e) => e.event_type === 'icmp_reply');
              if (replEvt) {
                appendLine('success', `64 bytes from ${targetIp}: icmp_seq=1 ttl=64 time=0.384 ms`);
                appendLine('success', `64 bytes from ${targetIp}: icmp_seq=2 ttl=64 time=0.412 ms`);
                appendLine('success', `64 bytes from ${targetIp}: icmp_seq=3 ttl=64 time=0.355 ms`);
                appendLine('success', `64 bytes from ${targetIp}: icmp_seq=4 ttl=64 time=0.390 ms`);
                appendLine('info', `--- ${targetIp} ping statistics ---`);
                appendLine('output', '4 packets transmitted, 4 received, 0% packet loss, time 3004ms');
              } else {
                const gw = String(activeCfg.default_gateway || '10.0.0.1');
                appendLine('error', `From ${gw} icmp_seq=1 Destination Host Unreachable`);
                appendLine('error', `From ${gw} icmp_seq=2 Packet Dropped by Firewall Rule`);
                appendLine('info', `--- ${targetIp} ping statistics ---`);
                appendLine('error', '4 packets transmitted, 0 received, 100% packet loss');
              }
            } catch {
              appendLine('error', `ping: connect: Network is unreachable`);
            }
          } else {
            appendLine('error', `ping: unknown host ${targetStr} (host not found in topology)`);
          }
          break;
        }

        // NMAP SCAN COMMAND
        case 'nmap': {
          const targetStr = args[args.length - 1];
          if (!targetStr || targetStr.startsWith('-')) {
            appendLine('error', 'Usage: nmap [options] <target_ip>');
            break;
          }
          const targetNode = resolveTarget(targetStr);
          if (!targetNode) {
            appendLine('error', `Failed to resolve "${targetStr}". Host does not exist in lab topology.`);
            break;
          }
          const targetCfg = getNodeConfig(targetNode);
          const targetIp = String(targetCfg.ip_address || targetStr);
          const targetName = String(targetCfg.name || targetNode.id);

          appendLine('info', `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toLocaleTimeString()} UTC`);
          appendLine('output', `Initiating SYN Stealth Scan against ${targetName} (${targetIp})`);
          appendLine('output', `Scanning ${targetIp} [1000 ports]`);

          if (lab) {
            try {
              const evts = await runPortScan(lab.id, activeNode?.id || '', targetNode.id, [21, 22, 23, 80, 443, 3306, 8080]);
              const openEvts = evts.filter((e) => e.event_type === 'port_scan_open');
              const filteredEvts = evts.filter((e) => e.event_type === 'port_scan_filtered');

              appendLine('info', `Nmap scan report for ${targetName}.lab (${targetIp})`);
              appendLine('output', `Host is up (0.00038s latency).`);
              appendLine('output', 'PORT     STATE    SERVICE       VERSION');

              if (openEvts.length === 0 && filteredEvts.length === 0) {
                appendLine('error', 'All 1000 scanned ports on host are closed or host is offline.');
              } else {
                openEvts.forEach((oe) => {
                  const port = oe.detail?.port || 80;
                  const srv = oe.detail?.service || (port === 22 ? 'ssh' : port === 80 ? 'http' : 'unknown');
                  appendLine('success', `${String(port + '/tcp').padEnd(9)} open     ${String(srv).padEnd(13)} (Verified Live)`);
                });
                filteredEvts.forEach((fe) => {
                  const port = fe.detail?.port || 22;
                  appendLine('error', `${String(port + '/tcp').padEnd(9)} filtered ${String(fe.detail?.service || 'tcp').padEnd(13)} (Blocked by ACL)`);
                });
              }
              appendLine('info', `Nmap done: 1 IP address (1 host up) scanned in 0.42 seconds`);
              appendLine('info', `💡 Forensics Note: Closed ports returned TCP RST (Kernel); Filtered ports were dropped by Firewall.`);
              appendLine('output', `   Type "forensics" to learn who closed each port, packet flow, and how to defend.`);
            } catch (err) {
              appendLine('error', `Nmap execution error: ${(err as Error).message}`);
            }
          }
          break;
        }

        // EDUCATIONAL PORT FORENSICS COMMAND
        case 'forensics':
        case 'ports':
        case 'portinfo': {
          appendLine('info', '━━━━━━━━━━━━━━━━━━━ PORT STATE & FORENSICS KNOWLEDGE BASE ━━━━━━━━━━━━━━━━━━━');
          appendLine('output', 'Educational explanation of why ports are Open, Closed, or Filtered:');
          appendLine('output', '');
          appendLine('success', '● OPEN (TCP SYN-ACK received):');
          appendLine('output', '  • Decided by: Active application daemon (e.g. Apache/Nginx on 80, OpenSSH on 22)');
          appendLine('output', '  • Packet Exchange: Client sends SYN -> Server responds SYN-ACK -> Port is live.');
          appendLine('output', '  • Defender Action: If unintended, stop the service daemon or restrict access with ACLs.');
          appendLine('output', '');
          appendLine('error', '● CLOSED (TCP RST packet received):');
          appendLine('output', '  • Decided by: Target Operating System Kernel TCP/IP stack.');
          appendLine('output', '  • Packet Exchange: Client sends SYN -> Kernel has NO listening process -> Sends TCP RST/ACK.');
          appendLine('output', '  • Attacker Takeaway: Host is ALIVE & reachable, but this specific application is not running.');
          appendLine('output', '  • Defender Action: Perfectly normal if the service is not needed. To conceal host presence, drop packets instead.');
          appendLine('output', '');
          appendLine('info', '● FILTERED (No response / Timeout or ICMP Admin Prohibited):');
          appendLine('output', '  • Decided by: Perimeter Firewall or Host iptables filter rule.');
          appendLine('output', '  • Packet Exchange: Client sends SYN -> Firewall DROP rule silently discards packet -> Client times out.');
          appendLine('output', '  • Attacker Takeaway: Cannot tell whether the port or even the host is online.');
          appendLine('output', '  • Defender Action: Best security practice for non-public management ports (SSH, MySQL).');
          appendLine('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          break;
        }

        // SIMULATED VICTIM SCREEN COMMAND
        case 'screen':
        case 'victim':
        case 'monitor': {
          if (!attackResponse) {
            appendLine('info', 'Target victim screen is currently in NORMAL operating state.');
            appendLine('output', 'Run an attack scenario or click "🖥️ View Target Victim Screen" on the Attack Studio panel.');
          } else {
            const victimState = String(attackResponse.evidence?.victim_screen_state || 'normal');
            appendLine('info', `Target Device Screen State: [${victimState.toUpperCase()}]`);
            appendLine('output', `Target ID: ${attackResponse.target_id} | Outcome: ${attackResponse.outcome}`);
            if (victimState === 'ddos_outage') {
              appendLine('error', `Monitor shows: "504 GATEWAY TIMEOUT — Service Unavailable (DDoS Outage)"`);
              appendLine('output', `HTTP Traffic: 0 replies received, SYN backlog queue saturated at 100%.`);
            } else if (victimState === 'defaced_sqli') {
              appendLine('error', `Monitor shows: "HACKED BY REDLAB TEAM — DATABASE EXPOSED (admin table dumped)"`);
              appendLine('output', `Exposed: Users database with 25 plaintext hashes leaked.`);
            } else if (victimState === 'hacked_root_terminal') {
              appendLine('error', `Monitor shows: "UNAUTHORIZED ROOT TTY1 SESSION ESTABLISHED — /etc/shadow leaked"`);
              appendLine('output', `Compromise: Reverse shell active on port 4444.`);
            } else {
              appendLine('success', `Monitor shows: Normal healthy system monitor (200 OK / Secure).`);
            }
            appendLine('info', 'Click "🖥️ View Target Victim Screen" on the Attack Studio panel to inspect the visual hacked screen.');
          }
          break;
        }

        // HPING3 / SYN FLOOD ATTACK
        case 'hping3':
        case 'synflood': {
          let targetStr = args.find((a) => !a.startsWith('-') && !/^\d+$/.test(a));
          if (!targetStr) targetStr = args[args.length - 1];
          const targetNode = resolveTarget(targetStr || '');
          if (!targetNode || !lab) {
            appendLine('error', 'Usage: hping3 -S --flood -p <port> <target_ip>');
            break;
          }
          const targetCfg = getNodeConfig(targetNode);
          const targetIp = String(targetCfg.ip_address || '10.0.0.10');

          appendLine('info', `HPING ${targetIp} (eth0 ${targetIp}): S set, 40 headers + 0 data bytes`);
          appendLine('info', `hping in flood mode, sending 15,000 TCP SYN pkts/sec...`);

          try {
            const res = await executeAttack(lab.id, {
              scenario_id: 'syn_flood_dos',
              target_id: targetNode.id,
              attacker_id: activeNode?.id,
              parameters: { port: 80 },
              app_mode: 'attack',
            });

            if (res.outcome === 'compromised') {
              appendLine('error', `[EXPLOIT CONFIRMED] TCP SYN Backlog on ${targetIp}:80 saturated (100% exhaustion)!`);
              appendLine('error', `Service Status: UNRESPONSIVE (HTTP 504 / RST packets returned to legitimate clients).`);
              appendLine('output', `Transmitted: 15,000 packets. Outcome: TARGET COMPROMISED.`);
            } else {
              appendLine('success', `[DEFENSE ACTIVE] Perimeter firewall / SYN cookies intercepted flood.`);
              appendLine('success', `Spurious SYN packets dropped. Service remains 100% operational.`);
            }
          } catch (err) {
            appendLine('error', `Attack execution failed: ${(err as Error).message}`);
          }
          break;
        }

        // HYDRA / SSH BRUTE FORCE ATTACK
        case 'hydra': {
          const targetStr = args.find((a) => !a.startsWith('-') && a.includes('.'));
          const targetNode = resolveTarget(targetStr || args[args.length - 1] || '');
          if (!targetNode || !lab) {
            appendLine('error', 'Usage: hydra -l root -P wordlist.txt ssh://<target_ip>');
            break;
          }
          const targetCfg = getNodeConfig(targetNode);
          const targetIp = String(targetCfg.ip_address || '10.0.0.10');

          appendLine('info', `Hydra v9.5 (c) 2026 by van Hauser / THC & RedLab Team`);
          appendLine('output', `[DATA] max 16 tasks per 1 server, total 16 targets, 5 login tries`);
          appendLine('output', `[ATTEMPT] Connecting to ${targetIp}:22 (ssh)...`);

          try {
            const res = await executeAttack(lab.id, {
              scenario_id: 'auth_brute_force',
              target_id: targetNode.id,
              attacker_id: activeNode?.id,
              parameters: { port: 22, username: 'root' },
              app_mode: 'attack',
            });

            if (res.outcome === 'compromised') {
              appendLine('success', `[22][ssh] host: ${targetIp}   login: root   password: password`);
              appendLine('success', `1 of 1 target successfully completed, 1 valid password found!`);
              appendLine('error', `[EXPLOIT CONFIRMED] Target SSH administrative console compromised.`);
            } else {
              appendLine('error', `[ERROR] Connection refused or SSH port blocked by perimeter firewall ACL.`);
              appendLine('output', `0 of 1 target completed. Attack blocked.`);
            }
          } catch (err) {
            appendLine('error', `Hydra error: ${(err as Error).message}`);
          }
          break;
        }

        // SQL INJECTION / CURL EXPLOIT
        case 'curl':
        case 'sqlmap': {
          const targetStr = args.find((a) => a.includes('http') || a.includes('.')) || '';
          const targetNode = resolveTarget(targetStr);
          if (!targetNode || !lab) {
            appendLine('error', `Usage: curl "http://<target_ip>/?id=1' OR '1'='1"`);
            break;
          }
          const targetCfg = getNodeConfig(targetNode);
          const targetIp = String(targetCfg.ip_address || '10.0.0.10');

          appendLine('info', `Sending HTTP GET with SQL injection payload to http://${targetIp}/login...`);
          try {
            const res = await executeAttack(lab.id, {
              scenario_id: 'web_security_injection',
              target_id: targetNode.id,
              attacker_id: activeNode?.id,
              parameters: { attack_type: 'sqli', payload: "' OR '1'='1' --" },
              app_mode: 'attack',
            });

            if (res.outcome === 'compromised') {
              appendLine('success', `HTTP/1.1 200 OK (Auth Bypass Confirmed)`);
              appendLine('error', `[DATABASE EXPLOIT] 25 User credential records leaked in HTTP response body!`);
              appendLine('output', `Record 1: id=1, user='admin', role='administrator', hash='$2a$12$...'`);
            } else {
              appendLine('error', `HTTP/1.1 403 Forbidden (Blocked by Web Application Firewall / Prepared Statements)`);
              appendLine('success', `[DEFENSE ACTIVE] Injection payload neutralized cleanly.`);
            }
          } catch (err) {
            appendLine('error', `Exploit error: ${(err as Error).message}`);
          }
          break;
        }

        // ARPSPOOF COMMAND
        case 'arpspoof': {
          const targetStr = args.find((a) => !a.startsWith('-')) || '';
          const targetNode = resolveTarget(targetStr);
          if (!targetNode || !lab) {
            appendLine('error', 'Usage: arpspoof -t <target_ip> <gateway_ip>');
            break;
          }
          const targetCfg = getNodeConfig(targetNode);
          const targetIp = String(targetCfg.ip_address || '10.0.0.10');

          appendLine('info', `Intercepting Layer 2 ARP packets for ${targetIp}...`);
          try {
            const res = await executeAttack(lab.id, {
              scenario_id: 'arp_cache_poisoning',
              target_id: targetNode.id,
              attacker_id: activeNode?.id,
              parameters: {},
              app_mode: 'attack',
            });

            if (res.outcome === 'compromised') {
              appendLine('error', `[EXPLOIT CONFIRMED] ARP cache poisoned! Rogue MAC 02:42:AC:11:00:99 broadcast.`);
              appendLine('error', `Man-in-the-Middle active: LAN egress traffic successfully redirected to attacker.`);
              appendLine('output', `Poisoned cache of target: Gateway IP resolved to Attacker MAC.`);
            } else {
              appendLine('success', `[DEFENSE ACTIVE] Dynamic ARP Inspection (DAI) rejected spoofed ARP replies.`);
              appendLine('success', `Switch port security bound to static MAC address. Attack dropped.`);
            }
          } catch (err) {
            appendLine('error', `ARPSPOOF error: ${(err as Error).message}`);
          }
          break;
        }

        default: {
          appendLine('error', `bash: ${cmd}: command not found. Type "help" for a list of attack & network commands.`);
          break;
        }
      }
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle keyboard navigation for history
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setCommandInput(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIndex(-1);
        setCommandInput('');
      } else {
        setHistoryIndex(nextIdx);
        setCommandInput(commandHistory[nextIdx]);
      }
    }
  };

  // Quick command preset handler
  const handleQuickCommand = (template: string) => {
    // Find target host IP if available
    const target = nodes.find((n) => n.id !== activeDeviceId);
    const targetCfg = getNodeConfig(target);
    const targetIp = String(targetCfg.ip_address || '10.0.0.10');
    const filled = template.replace('<target>', targetIp);
    setCommandInput(filled);
    inputRef.current?.focus();
  };

  return (
    <div
      className="flex-1 flex flex-col bg-[#080B10] text-[#F3F5F8] font-mono text-xs select-text overflow-hidden"
      onClick={handleTerminalClick}
    >
      {/* Terminal Device Selector & Toolbar */}
      <div className="px-3 py-2 bg-[#11151D] border-b border-[#293140] flex items-center justify-between gap-3 select-none flex-wrap">
        <div className="flex items-center gap-2">
          <TerminalIcon size={14} className="text-[#34D399]" />
          <span className="text-[11px] font-bold text-[#9BA5B5] uppercase">Device Terminal:</span>

          <select
            value={activeDeviceId}
            onChange={(e) => {
              setActiveDeviceId(e.target.value);
              const node = nodes.find((n) => n.id === e.target.value);
              const cfg = getNodeConfig(node);
              const name = String(cfg.name || node?.id || 'host');
              appendLine('info', `Switched active terminal console to: ${name}`);
            }}
            className="bg-[#171C26] border border-[#293140] rounded px-2.5 py-1 text-xs text-[#34D399] font-bold focus:border-[#34D399] focus:outline-none"
          >
            {nodes.map((n) => {
              const cfg = getNodeConfig(n);
              const name = String(cfg.name || n.id);
              const ip = cfg.ip_address ? ` (${String(cfg.ip_address)})` : '';
              return (
                <option key={n.id} value={n.id}>
                  {name} {ip}
                </option>
              );
            })}
          </select>
        </div>

        {/* Quick Command Cheatsheet Pills (Click to run / populate) */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-[#9BA5B5] text-[10px] font-bold uppercase hidden xl:inline">Quick Attacks:</span>
          <button
            type="button"
            onClick={() => handleQuickCommand('nmap <target>')}
            className="px-2 py-0.5 rounded bg-[#171C26] hover:bg-[#202736] border border-[#293140] hover:border-[#FF3B4E] text-[#FF8A4C] transition-colors"
            title="Scan target ports"
          >
            nmap -sV
          </button>
          <button
            type="button"
            onClick={() => handleQuickCommand('hping3 -S --flood -p 80 <target>')}
            className="px-2 py-0.5 rounded bg-[#171C26] hover:bg-[#202736] border border-[#293140] hover:border-[#FF3B4E] text-[#FF3B4E] transition-colors"
            title="SYN Flood DoS attack"
          >
            hping3 DoS
          </button>
          <button
            type="button"
            onClick={() => handleQuickCommand('hydra -l root ssh://<target>')}
            className="px-2 py-0.5 rounded bg-[#171C26] hover:bg-[#202736] border border-[#293140] hover:border-[#FF3B4E] text-[#F5C451] transition-colors"
            title="SSH Brute Force"
          >
            hydra SSH
          </button>
          <button
            type="button"
            onClick={() => handleQuickCommand('curl "http://<target>/?id=1\'OR\'1"')}
            className="px-2 py-0.5 rounded bg-[#171C26] hover:bg-[#202736] border border-[#293140] hover:border-[#FF3B4E] text-[#EC4899] transition-colors"
            title="SQL Injection Auth Bypass"
          >
            SQLi Exploit
          </button>
          <button
            type="button"
            onClick={() => handleQuickCommand('ping -c 4 <target>')}
            className="px-2 py-0.5 rounded bg-[#171C26] hover:bg-[#202736] border border-[#293140] hover:border-[#3B82F6] text-[#60A5FA] transition-colors"
            title="Ping reachability"
          >
            ping
          </button>
          <button
            type="button"
            onClick={() => {
              setCommandInput('ip a');
              inputRef.current?.focus();
            }}
            className="px-2 py-0.5 rounded bg-[#171C26] hover:bg-[#202736] border border-[#293140] hover:border-[#34D399] text-[#34D399] transition-colors"
            title="Check host interface & IP"
          >
            ip a
          </button>
          <button
            type="button"
            onClick={() => {
              setCommandInput('iptables -L -n');
              inputRef.current?.focus();
            }}
            className="px-2 py-0.5 rounded bg-[#171C26] hover:bg-[#202736] border border-[#293140] hover:border-[#A78BFA] text-[#A78BFA] transition-colors"
            title="Inspect firewall rules"
          >
            iptables
          </button>
        </div>

        {/* Clear Screen */}
        <button
          type="button"
          onClick={() => setLines([])}
          className="p-1 rounded text-[#9BA5B5] hover:text-[#F3F5F8] hover:bg-[#171C26] transition-colors"
          title="Clear screen"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1">
        {lines.map((line) => (
          <div key={line.id} className="leading-relaxed">
            {line.type === 'input' && (
              <div className="text-[#F3F5F8] font-bold">
                <span className="text-[#34D399]">{line.content.slice(0, line.content.indexOf('~# ') + 3)}</span>
                <span>{line.content.slice(line.content.indexOf('~# ') + 3)}</span>
              </div>
            )}
            {line.type === 'output' && <div className="text-[#9BA5B5] whitespace-pre-wrap">{line.content}</div>}
            {line.type === 'info' && <div className="text-[#60A5FA] font-semibold whitespace-pre-wrap">{line.content}</div>}
            {line.type === 'success' && <div className="text-[#34D399] font-semibold whitespace-pre-wrap">{line.content}</div>}
            {line.type === 'error' && <div className="text-[#FF3B4E] font-medium whitespace-pre-wrap">{line.content}</div>}
          </div>
        ))}
        {isExecuting && (
          <div className="text-[#F5C451] flex items-center gap-1.5 animate-pulse py-0.5">
            <span>[executing packet transmission...]</span>
          </div>
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Interactive Command Input Line */}
      <form
        onSubmit={handleCommandSubmit}
        className="px-3 py-2 bg-[#0B0D12] border-t border-[#293140] flex items-center gap-2"
      >
        <span className="text-[#34D399] font-bold select-none">{getPrompt()}</span>
        <input
          ref={inputRef}
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          placeholder="type 'help' or enter attack command (e.g. nmap 10.0.0.10)..."
          className="flex-1 bg-transparent text-[#F3F5F8] focus:outline-none text-xs font-mono placeholder:text-[#9BA5B5]/50"
        />
        <button
          type="submit"
          disabled={!commandInput.trim() || isExecuting}
          className="p-1 text-[#9BA5B5] hover:text-[#34D399] disabled:opacity-30 transition-colors"
          title="Send command"
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}

export default LinuxTerminal;
