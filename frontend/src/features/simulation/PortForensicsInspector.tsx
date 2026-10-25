import { useState } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Info,
  Lock,
  Radio,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  XCircle,
} from 'lucide-react';
import type { PortForensicsEntry } from '../../types';

interface PortForensicsInspectorProps {
  entries?: PortForensicsEntry[];
  targetName?: string;
  targetIp?: string;
  onOpenDefend?: () => void;
}

export function PortForensicsInspector({
  entries,
  targetName = 'Target Server',
  targetIp = '10.0.0.10',
  onOpenDefend,
}: PortForensicsInspectorProps) {
  const [expandedPort, setExpandedPort] = useState<number | null>(null);
  const [filterState, setFilterState] = useState<'all' | 'open' | 'closed' | 'filtered'>('all');

  // Fallback default educational forensics if none passed yet
  const defaultEntries: PortForensicsEntry[] = [
    {
      port: 80,
      service: 'HTTP',
      state: 'open',
      who_closed: 'Nobody (Port is OPEN)',
      how_it_closed: `Active web server daemon is bound to 0.0.0.0:80 on ${targetName}. Returned TCP SYN-ACK handshake response.`,
      attacker_takeaway: 'Vulnerable entrypoint: Attacker can probe HTTP web server for SQL injection, XSS, or directory traversal.',
      defender_advice: 'Enforce Web Application Firewall (WAF) query inspection and redirect all plaintext HTTP traffic to HTTPS (port 443).',
      remediation: 'To secure this port, deploy WAF rules or add a firewall DROP rule in Property Inspector.',
    },
    {
      port: 22,
      service: 'SSH',
      state: 'filtered',
      who_closed: 'Perimeter Firewall / ACL',
      how_it_closed: 'Firewall intercepted TCP SYN packet and dropped it according to policy: Default Inbound DROP. No packet was returned to scanner.',
      attacker_takeaway: 'Firewall detected: Scanner timed out with zero response. Attacker cannot confirm if SSH daemon exists behind the perimeter.',
      defender_advice: 'Industry gold standard (Stealth mode). Defends against automated brute-force scripts and network port mapping.',
      remediation: 'If SSH access is required for administration, add an explicit ALLOW rule in Firewall ACL for your specific management IP.',
    },
    {
      port: 23,
      service: 'Telnet',
      state: 'closed',
      who_closed: `Target Host Kernel (${targetName} OS)`,
      how_it_closed: `Packet reached ${targetName}, but no process was listening on port 23. Linux TCP/IP stack returned TCP RST (Reset).`,
      attacker_takeaway: 'Host is ALIVE: The packet reached the target successfully, confirming network route is open, but socket is inactive.',
      defender_advice: 'Good security posture. Telnet transmits in cleartext and should always remain disabled across production networks.',
      remediation: 'To open this port, go to Property Inspector for target server and add the Telnet service under Services.',
    },
    {
      port: 21,
      service: 'FTP',
      state: 'closed',
      who_closed: `Target Host Kernel (${targetName} OS)`,
      how_it_closed: `Packet reached host, but no FTP service is listening. Linux kernel returned TCP RST packet.`,
      attacker_takeaway: 'Host responded with RST. No active FTP credentials to attack.',
      defender_advice: 'Keep unneeded legacy file transfer protocols disabled.',
      remediation: 'Add FTP service in Property Inspector if file transfer simulation is needed.',
    },
    {
      port: 3306,
      service: 'MySQL',
      state: 'filtered',
      who_closed: 'Internal Firewall Boundary',
      how_it_closed: 'Inter-subnet firewall rule dropped database connection request from untrusted network segment.',
      attacker_takeaway: 'Database socket is isolated behind internal segment boundary.',
      defender_advice: 'Database ports should never be exposed to public subnets. Keep filtered.',
      remediation: 'Configure inter-VLAN routing and ACLs in Property Inspector.',
    },
  ];

  const forensicList = entries && entries.length > 0 ? entries : defaultEntries;

  const filtered = forensicList.filter((f) => {
    if (filterState === 'all') return true;
    return f.state === filterState;
  });

  const counts = {
    open: forensicList.filter((f) => f.state === 'open').length,
    closed: forensicList.filter((f) => f.state === 'closed').length,
    filtered: forensicList.filter((f) => f.state === 'filtered').length,
  };

  return (
    <div className="bg-[#11151D] border border-[#293140] rounded-lg overflow-hidden flex flex-col text-xs">
      {/* Header bar */}
      <div className="px-3.5 py-2.5 bg-[#171C26] border-b border-[#293140] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Search size={14} className="text-[#60A5FA]" />
          <div>
            <h4 className="font-bold text-[#F3F5F8] text-xs flex items-center gap-1.5">
              <span>Port Forensics & Educational Analyzer</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-[#60A5FA] border border-blue-800 font-mono">
                {targetName} ({targetIp})
              </span>
            </h4>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => setFilterState('all')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filterState === 'all'
                ? 'bg-[#293140] text-[#F3F5F8] font-bold'
                : 'text-[#9BA5B5] hover:text-[#F3F5F8]'
            }`}
          >
            All ({forensicList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterState('open')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filterState === 'open'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold'
                : 'text-[#9BA5B5] hover:text-emerald-400'
            }`}
          >
            Open ({counts.open})
          </button>
          <button
            type="button"
            onClick={() => setFilterState('closed')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filterState === 'closed'
                ? 'bg-red-950 text-red-400 border border-red-800 font-bold'
                : 'text-[#9BA5B5] hover:text-red-400'
            }`}
          >
            Closed ({counts.closed})
          </button>
          <button
            type="button"
            onClick={() => setFilterState('filtered')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filterState === 'filtered'
                ? 'bg-amber-950 text-amber-400 border border-amber-800 font-bold'
                : 'text-[#9BA5B5] hover:text-amber-400'
            }`}
          >
            Filtered ({counts.filtered})
          </button>
        </div>
      </div>

      {/* Explanatory Banner for Beginners */}
      <div className="px-3.5 py-2 bg-[#0B0D12] border-b border-[#293140] text-[11px] text-[#9BA5B5] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle size={13} className="text-[#F5C451] flex-shrink-0" />
          <span>
            Click any port row below to learn <strong className="text-[#F3F5F8]">who closed it</strong>, <strong className="text-[#F3F5F8]">why</strong>, and <strong className="text-[#F3F5F8]">what to do</strong> in this situation.
          </span>
        </div>
        <span className="text-[10px] text-[#60A5FA] font-mono hidden md:inline">RFC 793 TCP Standard</span>
      </div>

      {/* Port Rows List */}
      <div className="divide-y divide-[#293140]/60 max-h-64 overflow-y-auto">
        {filtered.map((item) => {
          const isExpanded = expandedPort === item.port;

          return (
            <div key={item.port} className="transition-colors hover:bg-[#171C26]/40">
              {/* Summary Row */}
              <div
                onClick={() => setExpandedPort(isExpanded ? null : item.port)}
                className="px-3.5 py-2 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="text-[#9BA5B5]">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#F3F5F8] w-14">
                      {item.port}/tcp
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-[#171C26] border border-[#293140] text-[10px] font-mono text-[#60A5FA]">
                      {item.service}
                    </span>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border font-mono ${
                      item.state === 'open'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : item.state === 'filtered'
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : 'bg-red-950 text-red-400 border-red-800'
                    }`}
                  >
                    {item.state}
                  </span>

                  <span className="text-[11px] text-[#9BA5B5] hidden sm:inline truncate max-w-sm">
                    {item.who_closed}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#60A5FA] hover:underline">
                    {isExpanded ? 'Hide Details' : 'Inspect Forensics →'}
                  </span>
                </div>
              </div>

              {/* Expanded Educational Forensics Panel */}
              {isExpanded && (
                <div className="px-4 py-3 bg-[#080B10] border-t border-b border-[#293140] space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Who Closed It & How */}
                    <div className="p-3 rounded-lg bg-[#11151D] border border-[#293140] space-y-1.5">
                      <span className="text-[10px] font-bold text-[#FF8A4C] uppercase tracking-wider block flex items-center gap-1.5">
                        <ShieldAlert size={12} />
                        Who Decided & What Happened?
                      </span>
                      <div className="text-[11px] text-[#F3F5F8] font-semibold">
                        {item.who_closed}
                      </div>
                      <p className="text-[11px] text-[#9BA5B5] leading-relaxed">
                        {item.how_it_closed}
                      </p>
                    </div>

                    {/* Attacker Takeaway */}
                    <div className="p-3 rounded-lg bg-[#11151D] border border-[#293140] space-y-1.5">
                      <span className="text-[10px] font-bold text-[#FF3B4E] uppercase tracking-wider block flex items-center gap-1.5">
                        <Terminal size={12} />
                        What an Attacker Learns from This:
                      </span>
                      <p className="text-[11px] text-[#9BA5B5] leading-relaxed">
                        {item.attacker_takeaway}
                      </p>
                    </div>
                  </div>

                  {/* Defender Advice & Remediation */}
                  <div className="p-3 rounded-lg bg-[#11151D] border border-[#293140] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#34D399] uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={12} />
                        Defender Best Practice & How to Change It in RedLab:
                      </span>
                      {onOpenDefend && (
                        <button
                          type="button"
                          onClick={onOpenDefend}
                          className="text-[10px] text-[#60A5FA] hover:underline font-semibold"
                        >
                          Open Defend Mode →
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#F3F5F8] leading-relaxed">
                      {item.defender_advice}
                    </p>
                    <div className="p-2 rounded bg-[#0B0D12] border border-[#293140] text-[11px] font-mono text-[#60A5FA]">
                      💡 <strong className="text-[#F3F5F8]">Step-by-Step: </strong>{item.remediation}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PortForensicsInspector;
