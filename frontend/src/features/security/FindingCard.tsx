import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, ShieldAlert, Wrench, AlertTriangle } from 'lucide-react';
import type { Finding } from '../../types';

interface FindingCardProps {
  finding: Finding;
  onSelectResource?: (resourceId: string) => void;
}

const SEVERITY_CONFIG: Record<
  Finding['severity'],
  { label: string; bg: string; text: string; border: string }
> = {
  critical: {
    label: 'CRITICAL',
    bg: 'bg-[#FF3B4E]/15',
    text: 'text-[#FF3B4E]',
    border: 'border-[#FF3B4E]/40',
  },
  high: {
    label: 'HIGH',
    bg: 'bg-[#FF8A4C]/15',
    text: 'text-[#FF8A4C]',
    border: 'border-[#FF8A4C]/40',
  },
  medium: {
    label: 'MEDIUM',
    bg: 'bg-[#F5C451]/15',
    text: 'text-[#F5C451]',
    border: 'border-[#F5C451]/40',
  },
  low: {
    label: 'LOW',
    bg: 'bg-[#60A5FA]/15',
    text: 'text-[#60A5FA]',
    border: 'border-[#60A5FA]/40',
  },
};

export function FindingCard({ finding, onSelectResource }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.medium;

  return (
    <div className="bg-[#171C26] border border-[#293140] rounded-lg transition-all hover:border-[#3d4a5c]">
      <div
        className="p-3 flex items-start gap-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="mt-0.5 text-[#9BA5B5]">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${sev.bg} ${sev.text} ${sev.border}`}
            >
              {sev.label}
            </span>
            <span className="text-[10px] text-[#9BA5B5] bg-[#11151D] px-2 py-0.5 rounded border border-[#293140]">
              {finding.category}
            </span>
            <span className="text-[10px] font-mono text-[#9BA5B5]">
              {finding.rule_id}
            </span>
          </div>

          <h4 className="text-xs font-semibold text-[#F3F5F8] leading-tight mb-1">
            {finding.title}
          </h4>

          <div className="flex items-center gap-2 text-[11px] text-[#9BA5B5]">
            <span>Affected:</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectResource?.(finding.affected_resource_id);
              }}
              className="text-[#60A5FA] hover:text-[#93c5fd] font-medium underline underline-offset-2 flex items-center gap-1"
            >
              <span>{finding.affected_resource_name || finding.affected_resource_id}</span>
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-[#293140]/60 space-y-3 text-xs">
          <div>
            <div className="flex items-center gap-1.5 text-[#F3F5F8] font-medium mb-1">
              <ShieldAlert size={14} className="text-[#FF8A4C]" />
              <span>Explanation</span>
            </div>
            <p className="text-[#9BA5B5] leading-relaxed bg-[#11151D] p-2.5 rounded border border-[#293140]">
              {finding.explanation}
            </p>
          </div>

          {finding.impact && (
            <div>
              <div className="flex items-center gap-1.5 text-[#F3F5F8] font-medium mb-1">
                <AlertTriangle size={14} className="text-[#FF3B4E]" />
                <span>Security Impact</span>
              </div>
              <p className="text-[#9BA5B5] leading-relaxed bg-[#11151D] p-2.5 rounded border border-[#293140]">
                {finding.impact}
              </p>
            </div>
          )}

          {finding.remediation && (
            <div>
              <div className="flex items-center gap-1.5 text-[#F3F5F8] font-medium mb-1">
                <Wrench size={14} className="text-[#34D399]" />
                <span>Recommended Remediation</span>
              </div>
              <p className="text-[#9BA5B5] leading-relaxed bg-[#11151D] p-2.5 rounded border border-[#293140]">
                {finding.remediation}
              </p>
            </div>
          )}

          {finding.references && finding.references.length > 0 && (
            <div>
              <span className="text-[11px] font-medium text-[#9BA5B5] block mb-1">
                References & Documentation:
              </span>
              <div className="flex flex-wrap gap-2">
                {finding.references.map((ref, idx) => (
                  <a
                    key={idx}
                    href={ref}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-[#60A5FA] hover:text-[#93c5fd] bg-[#11151D] px-2 py-1 rounded border border-[#293140] hover:border-[#60A5FA]/40 transition-colors"
                  >
                    <ExternalLink size={11} />
                    <span className="truncate max-w-[200px]">{ref}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FindingCard;
