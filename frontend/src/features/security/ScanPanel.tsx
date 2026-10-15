import { useState } from 'react';
import {
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Loader2,
  Play,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { FindingCard } from './FindingCard';
import { AttackPathView } from './AttackPathView';
import { Button } from '../../components/Button';

export function ScanPanel() {
  const scanResult = useEditorStore((s) => s.scanResult);
  const scanning = useEditorStore((s) => s.scanning);
  const runScan = useEditorStore((s) => s.runScan);
  const selectNode = useEditorStore((s) => s.selectNode);
  const isOpen = useEditorStore((s) => s.scanPanelOpen);
  const setIsOpen = useEditorStore((s) => s.setScanPanelOpen);

  const [activeTab, setActiveTab] = useState<'findings' | 'attack_paths'>('findings');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

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

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-[#FF3B4E] border-[#FF3B4E]/40 bg-[#FF3B4E]/10';
    if (score >= 40) return 'text-[#FF8A4C] border-[#FF8A4C]/40 bg-[#FF8A4C]/10';
    if (score > 0) return 'text-[#F5C451] border-[#F5C451]/40 bg-[#F5C451]/10';
    return 'text-[#34D399] border-[#34D399]/40 bg-[#34D399]/10';
  };

  return (
    <div className="bg-[#11151D] border-t border-[#293140] flex flex-col transition-all duration-200 select-none">
      {/* Header Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#293140] bg-[#171C26]">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-xs font-semibold text-[#F3F5F8] hover:text-white transition-colors"
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            <span className="flex items-center gap-1.5">
              <ShieldAlert size={15} className="text-[#FF3B4E]" />
              Security Scan Results
            </span>
          </button>

          {scanResult && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#9BA5B5]">Findings:</span>
              <button
                type="button"
                onClick={() => setSeverityFilter(severityFilter === 'critical' ? 'all' : 'critical')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                  severityCounts.critical > 0
                    ? 'bg-[#FF3B4E]/20 text-[#FF3B4E] border-[#FF3B4E]/40'
                    : 'bg-[#171C26] text-[#9BA5B5] border-[#293140]'
                } ${severityFilter === 'critical' ? 'ring-1 ring-[#FF3B4E]' : ''}`}
              >
                {severityCounts.critical} Critical
              </button>
              <button
                type="button"
                onClick={() => setSeverityFilter(severityFilter === 'high' ? 'all' : 'high')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                  severityCounts.high > 0
                    ? 'bg-[#FF8A4C]/20 text-[#FF8A4C] border-[#FF8A4C]/40'
                    : 'bg-[#171C26] text-[#9BA5B5] border-[#293140]'
                } ${severityFilter === 'high' ? 'ring-1 ring-[#FF8A4C]' : ''}`}
              >
                {severityCounts.high} High
              </button>
              <button
                type="button"
                onClick={() => setSeverityFilter(severityFilter === 'medium' ? 'all' : 'medium')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                  severityCounts.medium > 0
                    ? 'bg-[#F5C451]/20 text-[#F5C451] border-[#F5C451]/40'
                    : 'bg-[#171C26] text-[#9BA5B5] border-[#293140]'
                } ${severityFilter === 'medium' ? 'ring-1 ring-[#F5C451]' : ''}`}
              >
                {severityCounts.medium} Med
              </button>
              <button
                type="button"
                onClick={() => setSeverityFilter(severityFilter === 'low' ? 'all' : 'low')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                  severityCounts.low > 0
                    ? 'bg-[#60A5FA]/20 text-[#60A5FA] border-[#60A5FA]/40'
                    : 'bg-[#171C26] text-[#9BA5B5] border-[#293140]'
                } ${severityFilter === 'low' ? 'ring-1 ring-[#60A5FA]' : ''}`}
              >
                {severityCounts.low} Low
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {scanResult && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#9BA5B5]">Risk Score:</span>
              <span
                className={`px-2 py-0.5 rounded border text-xs font-bold ${getRiskScoreColor(
                  scanResult.risk_score || 0
                )}`}
              >
                {scanResult.risk_score || 0}/100
              </span>
            </div>
          )}

          <Button
            size="sm"
            variant="primary"
            onClick={runScan}
            loading={scanning}
            icon={<Play size={13} />}
          >
            {scanning ? 'Scanning...' : 'Run Scan'}
          </Button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="h-72 flex flex-col bg-[#11151D]">
          {scanning ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-6">
              <Loader2 size={32} className="animate-spin text-[#FF3B4E]" />
              <div>
                <p className="text-sm font-semibold text-[#F3F5F8]">Evaluating Security Policies</p>
                <p className="text-xs text-[#9BA5B5] mt-1">
                  Analyzing architecture graph, firewalls, IAM permissions, and attack surfaces...
                </p>
              </div>
            </div>
          ) : !scanResult ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-6">
              <ShieldCheck size={36} className="text-[#9BA5B5]/60" />
              <div>
                <p className="text-sm font-semibold text-[#F3F5F8]">No Scan Executed Yet</p>
                <p className="text-xs text-[#9BA5B5] mt-1 max-w-sm">
                  Run a security scan to evaluate CIS cloud benchmarks, IAM privilege escalation risks, and potential attack vectors.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={runScan}
                icon={<Play size={13} />}
                className="mt-2"
              >
                Run Security Scan
              </Button>
            </div>
          ) : (
            <>
              {/* Tab navigation */}
              <div className="flex items-center gap-4 px-4 border-b border-[#293140] bg-[#11151D] text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('findings')}
                  className={`py-2 px-1 font-semibold border-b-2 transition-colors ${
                    activeTab === 'findings'
                      ? 'border-[#FF3B4E] text-[#F3F5F8]'
                      : 'border-transparent text-[#9BA5B5] hover:text-[#F3F5F8]'
                  }`}
                >
                  Security Findings ({findings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('attack_paths')}
                  className={`py-2 px-1 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'attack_paths'
                      ? 'border-[#FF3B4E] text-[#F3F5F8]'
                      : 'border-transparent text-[#9BA5B5] hover:text-[#F3F5F8]'
                  }`}
                >
                  <Crosshair size={13} className="text-[#FF3B4E]" />
                  Attack Paths ({attackPaths.length})
                </button>
                {severityFilter !== 'all' && activeTab === 'findings' && (
                  <button
                    type="button"
                    onClick={() => setSeverityFilter('all')}
                    className="ml-auto text-[11px] text-[#60A5FA] hover:underline"
                  >
                    Clear Filter ({severityFilter})
                  </button>
                )}
              </div>

              {/* Tab views */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeTab === 'findings' ? (
                  filteredFindings.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#9BA5B5]">
                      {severityFilter !== 'all'
                        ? `No ${severityFilter} findings detected.`
                        : 'No security issues found! Environment conforms to security checks.'}
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
                  <AttackPathView
                    attackPaths={attackPaths}
                    onSelectResource={(id) => selectNode(id)}
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ScanPanel;
