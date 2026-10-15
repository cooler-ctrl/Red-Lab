import { ArrowRight, Crosshair, HelpCircle, ShieldAlert } from 'lucide-react';
import type { AttackPath } from '../../types';

interface AttackPathViewProps {
  attackPaths: AttackPath[];
  onSelectResource?: (resourceId: string) => void;
}

export function AttackPathView({ attackPaths = [], onSelectResource }: AttackPathViewProps) {
  if (attackPaths.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-[#9BA5B5] bg-[#11151D] rounded-lg border border-[#293140]">
        No attack paths detected in this environment.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {attackPaths.map((path) => (
        <div
          key={path.id}
          className="p-3.5 bg-[#171C26] border border-[#FF3B4E]/30 rounded-lg space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-[#FF3B4E]/15 text-[#FF3B4E] border border-[#FF3B4E]/40 flex items-center gap-1">
                  <Crosshair size={12} />
                  <span>{path.severity || 'CRITICAL'} ATTACK CHAIN</span>
                </span>
              </div>
              <h4 className="text-xs font-semibold text-[#F3F5F8]">{path.title}</h4>
              <p className="text-[11px] text-[#9BA5B5] mt-0.5">{path.description}</p>
            </div>
          </div>

          {/* Stepped sequence */}
          <div className="bg-[#11151D] p-3 rounded border border-[#293140] overflow-x-auto">
            <span className="text-[10px] uppercase font-semibold text-[#9BA5B5] block mb-2 tracking-wider">
              Attack Progression Flow
            </span>
            <div className="flex items-center gap-2 min-w-max">
              {path.steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    onClick={() => onSelectResource?.(step.resource_id)}
                    className="flex flex-col bg-[#171C26] border border-[#293140] hover:border-[#FF3B4E] px-3 py-2 rounded-lg cursor-pointer transition-all max-w-[200px]"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#FF3B4E]">
                      <span className="w-4 h-4 rounded-full bg-[#FF3B4E]/20 flex items-center justify-center text-[9px]">
                        {idx + 1}
                      </span>
                      <span className="truncate">{step.label}</span>
                    </div>
                    <div className="text-[11px] text-[#F3F5F8] font-medium mt-1 truncate">
                      {step.action}
                    </div>
                    <span className="text-[9px] text-[#9BA5B5] font-mono truncate mt-0.5">
                      id: {step.resource_id}
                    </span>
                  </div>

                  {idx < path.steps.length - 1 && (
                    <ArrowRight size={16} className="text-[#FF3B4E] flex-shrink-0 animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Assumptions */}
          {path.assumptions && path.assumptions.length > 0 && (
            <div className="text-[11px] space-y-1">
              <span className="text-[#9BA5B5] font-medium flex items-center gap-1">
                <HelpCircle size={12} className="text-[#60A5FA]" />
                <span>Assumptions:</span>
              </span>
              <ul className="list-disc list-inside text-[#9BA5B5] space-y-0.5 pl-1">
                {path.assumptions.map((asm, i) => (
                  <li key={i}>{asm}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default AttackPathView;
