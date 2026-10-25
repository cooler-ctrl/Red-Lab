import { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Flame,
  Globe,
  Key,
  Laptop,
  Lock,
  Radio,
  RefreshCw,
  Send,
  Server,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '../../components/Button';
import type { ResourceNodeData } from '../../stores/editorStore';

interface CompromisedScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetNode?: { id: string; data?: any } | null;
  attackResponse?: any;
  onSwitchToDefend: () => void;
}

export function CompromisedScreenModal({
  isOpen,
  onClose,
  targetNode,
  attackResponse,
  onSwitchToDefend,
}: CompromisedScreenModalProps) {
  if (!isOpen || !targetNode) return null;

  const targetData = targetNode.data as ResourceNodeData | undefined;
  const targetName = String(targetData?.config?.name || targetNode.id);
  const targetIp = String(targetData?.config?.ip_address || '10.0.0.10');
  const targetType = targetData?.resourceType || 'server';

  // Attack state & outcome
  const outcome = attackResponse?.outcome || 'compromised';
  const scenarioId = attackResponse?.scenario_id || 'syn_flood_dos';
  const evidence = attackResponse?.evidence || {};
  const screenState = evidence?.victim_screen_state || (
    scenarioId === 'syn_flood_dos' ? 'ddos_outage' :
    scenarioId === 'web_security_injection' ? 'defaced_sqli' :
    scenarioId === 'auth_brute_force' ? 'hacked_root_terminal' :
    scenarioId === 'arp_cache_poisoning' ? 'arp_mitm_hijacked' :
    'normal'
  );

  const [activeTab, setActiveTab] = useState<'screen' | 'explanation'>('screen');
  const [pingTesting, setPingTesting] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const isCompromised = outcome === 'compromised';

  const handleTestPing = () => {
    setPingTesting(true);
    setPingResult(null);
    setTimeout(() => {
      setPingTesting(false);
      if (screenState === 'ddos_outage') {
        setPingResult(
          `PING ${targetIp} (${targetIp}): 56 data bytes\n` +
          `Request timeout for icmp_seq 0\n` +
          `Request timeout for icmp_seq 1\n` +
          `Request timeout for icmp_seq 2\n` +
          `--- ${targetIp} ping statistics ---\n` +
          `3 packets transmitted, 0 packets received, 100.0% packet loss\n` +
          `[FAIL]: Host is completely unresponsive due to TCP SYN backlog starvation.`
        );
      } else {
        setPingResult(
          `PING ${targetIp} (${targetIp}): 56 data bytes\n` +
          `64 bytes from ${targetIp}: icmp_seq=0 ttl=64 time=0.384 ms\n` +
          `64 bytes from ${targetIp}: icmp_seq=1 ttl=64 time=0.412 ms\n` +
          `--- ${targetIp} ping statistics ---\n` +
          `2 packets transmitted, 2 packets received, 0.0% packet loss\n` +
          `[OK]: Target host replied normally.`
        );
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#0B0D12] border border-[#293140] rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Top Window Titlebar (Simulated macOS/Cyber Window) */}
        <div className="px-4 py-3 bg-[#171C26] border-b border-[#293140] flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            {/* Window dot controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-[#FF3B4E] hover:opacity-80 transition-opacity"
                title="Close"
              />
              <div className="w-3 h-3 rounded-full bg-[#F5C451]" />
              <div className="w-3 h-3 rounded-full bg-[#34D399]" />
            </div>

            <div className="h-4 w-px bg-[#293140]" />

            <div className="flex items-center gap-2 text-xs font-bold text-[#F3F5F8]">
              {targetType === 'web_server' ? (
                <Globe size={15} className="text-[#60A5FA]" />
              ) : (
                <Server size={15} className="text-[#34D399]" />
              )}
              <span>Target Victim Monitor — {targetName} ({targetIp})</span>
            </div>

            {/* Status Pill */}
            {isCompromised ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-950/80 text-[#FF3B4E] border border-red-800 animate-pulse">
                <AlertOctagon size={11} />
                COMPROMISED / BREACHED
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                <CheckCircle2 size={11} />
                DEFENDED / SECURE
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'screen' ? 'explanation' : 'screen')}
              className="text-xs px-2.5 py-1 rounded bg-[#11151D] border border-[#293140] hover:border-[#60A5FA] text-[#60A5FA] font-semibold transition-colors flex items-center gap-1.5"
            >
              {activeTab === 'screen' ? '📖 Educational Guide' : '🖥️ Back to Screen'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-[#9BA5B5] hover:text-[#F3F5F8] hover:bg-[#11151D] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {activeTab === 'screen' ? (
            <>
              {/* ==================== WEB SERVER SCREEN SIMULATION ==================== */}
              {targetType === 'web_server' || scenarioId === 'web_security_injection' || scenarioId === 'syn_flood_dos' ? (
                <div className="flex-1 flex flex-col bg-[#11151D] border border-[#293140] rounded-lg overflow-hidden shadow-inner">
                  {/* Browser Address Bar */}
                  <div className="px-3 py-2 bg-[#171C26] border-b border-[#293140] flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 text-[#9BA5B5]">
                      <button type="button" className="p-1 rounded hover:bg-[#11151D]">←</button>
                      <button type="button" className="p-1 rounded hover:bg-[#11151D]">→</button>
                      <button type="button" onClick={handleTestPing} className="p-1 rounded hover:bg-[#11151D]" title="Reload">
                        <RefreshCw size={12} className={pingTesting ? 'animate-spin' : ''} />
                      </button>
                    </div>

                    <div className="flex-1 flex items-center gap-2 px-3 py-1 bg-[#0B0D12] border border-[#293140] rounded text-xs font-mono text-[#F3F5F8]">
                      {isCompromised && screenState === 'ddos_outage' ? (
                        <span className="text-[#FF3B4E]">⚠️ Not Secure — http://{targetIp}:80/</span>
                      ) : isCompromised ? (
                        <span className="text-[#FF8A4C]">🔓 http://{targetIp}/admin/login?bypass=true</span>
                      ) : (
                        <span className="text-[#34D399]">🔒 https://{targetIp}/ (WAF Protected)</span>
                      )}
                    </div>
                  </div>

                  {/* Browser Viewport */}
                  <div className="p-6 flex-1 min-h-[320px] flex flex-col justify-center items-center">
                    {/* SUB-STATE: DDoS OUTAGE */}
                    {screenState === 'ddos_outage' && (
                      <div className="max-w-md w-full text-center space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-red-950/50 border border-red-700/60 flex items-center justify-center text-[#FF3B4E] animate-bounce">
                          <Flame size={32} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-[#F3F5F8] tracking-tight">
                            This site can’t be reached
                          </h2>
                          <p className="text-xs text-[#9BA5B5] mt-1 font-mono">
                            {targetIp} took too long to respond. HTTP 504 Gateway Timeout.
                          </p>
                        </div>

                        {/* Live Telemetry Box */}
                        <div className="p-3 rounded-lg bg-[#0B0D12] border border-[#293140] text-left text-xs font-mono space-y-1.5">
                          <div className="flex justify-between text-[#9BA5B5]">
                            <span>Attack Vector:</span>
                            <span className="text-[#FF3B4E] font-bold">TCP SYN Flood (DoS)</span>
                          </div>
                          <div className="flex justify-between text-[#9BA5B5]">
                            <span>Flooding Rate:</span>
                            <span className="text-[#FF8A4C]">15,000 SYN packets / sec</span>
                          </div>
                          <div className="flex justify-between text-[#9BA5B5]">
                            <span>TCP Socket Backlog:</span>
                            <span className="text-[#FF3B4E] font-bold">128 / 128 (100% EXHAUSTED)</span>
                          </div>
                          <div className="flex justify-between text-[#9BA5B5]">
                            <span>Legitimate User Drops:</span>
                            <span className="text-[#FF3B4E] font-bold">100% of incoming connections dropped</span>
                          </div>
                        </div>

                        {/* Interactive Ping Tester */}
                        <div className="pt-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleTestPing}
                            loading={pingTesting}
                            icon={<Send size={13} />}
                          >
                            {pingTesting ? 'Testing Ping...' : 'Transmit ICMP Ping to Website'}
                          </Button>
                        </div>

                        {pingResult && (
                          <div className="p-2.5 rounded bg-[#080B10] border border-red-900/60 font-mono text-[11px] text-left text-red-400 whitespace-pre-wrap">
                            {pingResult}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-STATE: SQL INJECTION DEFACED */}
                    {screenState === 'defaced_sqli' && (
                      <div className="w-full max-w-xl bg-[#0B0D12] border border-[#FF3B4E] rounded-lg p-5 shadow-2xl space-y-4">
                        <div className="border-b border-[#293140] pb-3 text-center space-y-1">
                          <span className="px-2.5 py-1 rounded bg-red-950 text-[#FF3B4E] border border-red-800 text-[10px] font-mono font-extrabold uppercase tracking-widest animate-pulse">
                            🚨 CRITICAL BREACH: OWASP TOP 10 🚨
                          </span>
                          <h2 className="text-lg font-extrabold text-[#F3F5F8] tracking-wider mt-2">
                            SYSTEM DEFACED BY REDLAB RED TEAM
                          </h2>
                          <p className="text-xs text-red-400 font-mono">
                            Payload Injected: <span className="bg-[#171C26] px-2 py-0.5 rounded text-white font-bold">' OR '1'='1' --</span>
                          </p>
                        </div>

                        {/* Leaked Database Records Table */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-[#FF8A4C] uppercase tracking-wider block flex items-center gap-1.5">
                            <Key size={13} />
                            DUMPED SENSITIVE TABLE: `users_credentials` (3 Leaked Records)
                          </span>
                          <div className="border border-[#293140] rounded overflow-hidden text-xs font-mono">
                            <div className="bg-[#171C26] px-3 py-1.5 text-[10px] font-bold text-[#9BA5B5] grid grid-cols-4">
                              <span>UID</span>
                              <span>USERNAME</span>
                              <span>ROLE</span>
                              <span>PASSWORD HASH</span>
                            </div>
                            <div className="divide-y divide-[#293140] bg-[#080B10]">
                              <div className="px-3 py-1.5 grid grid-cols-4 text-[#F3F5F8]">
                                <span className="text-[#9BA5B5]">1</span>
                                <span className="text-[#FF3B4E] font-bold">admin</span>
                                <span className="text-emerald-400">SuperAdmin</span>
                                <span className="truncate text-amber-300">$2a$12$e9Xh48a...</span>
                              </div>
                              <div className="px-3 py-1.5 grid grid-cols-4 text-[#F3F5F8]">
                                <span className="text-[#9BA5B5]">2</span>
                                <span className="text-[#60A5FA]">db_operator</span>
                                <span className="text-blue-400">DatabaseOp</span>
                                <span className="truncate text-amber-300">$2a$12$K82b19c...</span>
                              </div>
                              <div className="px-3 py-1.5 grid grid-cols-4 text-[#F3F5F8]">
                                <span className="text-[#9BA5B5]">3</span>
                                <span className="text-[#60A5FA]">cfo_exec</span>
                                <span className="text-purple-400">Finance</span>
                                <span className="truncate text-amber-300">$2a$12$P91d84f...</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded bg-[#171C26] border border-[#293140] text-[11px] text-[#9BA5B5]">
                          <span className="font-bold text-[#F3F5F8]">Educational Takeaway: </span>
                          Authentication form executed unchecked query concatenation without parameterized queries. The attacker achieved instantaneous admin login and database extraction.
                        </div>
                      </div>
                    )}

                    {/* SUB-STATE: NORMAL / RESTORED */}
                    {(screenState === 'normal' || screenState === 'ddos_mitigated_healthy' || screenState === 'waf_blocked_screen') && (
                      <div className="w-full max-w-md bg-[#171C26] border border-emerald-800/60 rounded-lg p-6 text-center space-y-4">
                        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-950/60 border border-emerald-600 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 size={30} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-[#F3F5F8]">
                            Apex Cloud Gateway — Online & Protected
                          </h3>
                          <p className="text-xs text-emerald-400 mt-1">
                            HTTP 200 OK • Defense Controls Active • WAF & Rate Limiting Enforced
                          </p>
                        </div>
                        <div className="p-3 rounded bg-[#0B0D12] border border-[#293140] text-xs font-mono text-left space-y-1 text-[#9BA5B5]">
                          <div>Status: <span className="text-emerald-400 font-bold">HEALTHY</span></div>
                          <div>SYN Cookies: <span className="text-emerald-400">ENABLED (0 backlog drops)</span></div>
                          <div>WAF Filtering: <span className="text-emerald-400">ACTIVE (Query Sanitization)</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ==================== LINUX SERVER / SSH SCREEN SIMULATION ==================== */
                <div className="flex-1 flex flex-col bg-[#080B10] border border-[#293140] rounded-lg overflow-hidden font-mono text-xs shadow-inner min-h-[340px]">
                  {/* CRT / Terminal Topbar */}
                  <div className="px-3 py-1.5 bg-[#171C26] border-b border-[#293140] flex items-center justify-between text-[#9BA5B5] text-[11px]">
                    <div className="flex items-center gap-2">
                      <Terminal size={13} className="text-[#34D399]" />
                      <span>tty1 — {targetName} console</span>
                    </div>
                    <span>Linux 6.8.0-generic (x86_64)</span>
                  </div>

                  {/* Terminal Display */}
                  <div className="p-4 flex-1 space-y-2 leading-relaxed">
                    {screenState === 'hacked_root_terminal' ? (
                      <>
                        <div className="text-[#FF3B4E] font-bold animate-pulse">
                          [CRITICAL SECURITY ALERT]: UNAUTHORIZED ROOT LOGIN DETECTED FROM REMOTE IP 192.168.1.100
                        </div>
                        <div className="text-[#9BA5B5]">
                          Ubuntu 24.04 LTS {targetName} tty1
                        </div>
                        <div className="text-[#F3F5F8]">
                          {targetName} login: root
                        </div>
                        <div className="text-[#F3F5F8]">
                          Password: <span className="text-[#FF3B4E] font-bold">[CRACKED VIA HYDRA: password]</span>
                        </div>
                        <div className="text-[#9BA5B5]">
                          Last login: {new Date().toUTCString()} from 192.168.1.100 (SSH)
                        </div>
                        <div className="text-[#34D399] font-bold pt-2">
                          root@{targetName.toLowerCase()}:~# whoami
                        </div>
                        <div className="text-[#F3F5F8]">
                          root (uid=0 gid=0 groups=0(root))
                        </div>
                        <div className="text-[#34D399] font-bold pt-1">
                          root@{targetName.toLowerCase()}:~# cat /etc/shadow | head -n 2
                        </div>
                        <div className="text-amber-300">
                          root:$6$rounds=656000$salt$kH98f2XQY...:19700:0:99999:7:::
                        </div>
                        <div className="text-amber-300">
                          daemon:*:19700:0:99999:7:::
                        </div>
                        <div className="text-[#FF3B4E] font-bold pt-2">
                          [COMPROMISE CONFIRMED]: Attacker gained persistent interactive root shell on host.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[#34D399]">
                          Ubuntu 24.04 LTS {targetName} tty1
                        </div>
                        <div className="text-[#9BA5B5]">
                          {targetName} login: _
                        </div>
                        <div className="text-[#60A5FA] pt-4">
                          [DEFENSE STATUS]: Fail2ban active (maxretry=3, bantime=3600s).
                        </div>
                        <div className="text-[#60A5FA]">
                          [DEFENSE STATUS]: Password authentication disabled. Key-based authentication required.
                        </div>
                        <div className="text-emerald-400 font-bold pt-2">
                          ✓ Host is secured against credential brute-forcing.
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ==================== EDUCATIONAL GUIDE TAB ==================== */
            <div className="space-y-4 text-xs text-[#F3F5F8] p-2">
              <div className="p-3.5 rounded-lg bg-[#171C26] border border-[#293140] space-y-2">
                <h3 className="text-sm font-bold text-[#FF8A4C] flex items-center gap-2">
                  <ShieldAlert size={16} />
                  What Just Happened in this Attack Simulation?
                </h3>
                <p className="text-[#9BA5B5] leading-relaxed">
                  {attackResponse?.educational_takeaway ||
                    'The attack scenario tested your network device for exposed services, missing access control lists (ACLs), or unpatched software configurations.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#171C26] border border-[#293140] space-y-1.5">
                  <span className="text-[11px] font-bold text-[#FF3B4E] uppercase tracking-wider block">
                    Attacker Perspective
                  </span>
                  <p className="text-[11px] text-[#9BA5B5] leading-relaxed">
                    The adversary scanned for listening services or injected payloads through open network channels. Because no filtering dropped the packets, the exploit succeeded deterministically.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#171C26] border border-[#293140] space-y-1.5">
                  <span className="text-[11px] font-bold text-[#3B82F6] uppercase tracking-wider block">
                    Defender Solution
                  </span>
                  <p className="text-[11px] text-[#9BA5B5] leading-relaxed">
                    {attackResponse?.remediation_hint ||
                      'Switch to Defend Mode to enforce perimeter firewall ACLs, default-deny ingress filtering, and host-level protections.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 py-3 bg-[#171C26] border-t border-[#293140] flex items-center justify-between">
          <div className="text-xs text-[#9BA5B5]">
            Target Device: <span className="text-[#F3F5F8] font-bold">{targetName}</span> • Mode: <span className="text-[#FF3B4E] font-bold">Attack Simulation</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Dismiss
            </Button>

            {isCompromised && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onSwitchToDefend();
                }}
                icon={<ShieldCheck size={14} />}
              >
                Switch to DEFEND MODE to Restore Target →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompromisedScreenModal;
