import { Plus, Trash2 } from 'lucide-react';
import type { IAMPolicy } from '../../types';

interface IAMPolicyEditorProps {
  policies: IAMPolicy[];
  onChange: (policies: IAMPolicy[]) => void;
}

export function IAMPolicyEditor({ policies = [], onChange }: IAMPolicyEditorProps) {
  const handleAddPolicy = () => {
    const newPolicy: IAMPolicy = {
      name: `Policy-${policies.length + 1}`,
      actions: ['s3:GetObject'],
      resources: ['*'],
    };
    onChange([...policies, newPolicy]);
  };

  const handleUpdatePolicy = (index: number, updated: Partial<IAMPolicy>) => {
    const next = policies.map((p, i) => (i === index ? { ...p, ...updated } : p));
    onChange(next);
  };

  const handleDeletePolicy = (index: number) => {
    onChange(policies.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#F3F5F8]">IAM Policies</span>
        <button
          type="button"
          onClick={handleAddPolicy}
          className="flex items-center gap-1 text-[11px] font-medium text-[#FF3B4E] hover:text-[#ff6170] px-2 py-0.5 rounded hover:bg-[#171C26] transition-colors"
        >
          <Plus size={12} />
          <span>Add Policy</span>
        </button>
      </div>

      {policies.length === 0 ? (
        <div className="p-2.5 rounded border border-dashed border-[#293140] text-center text-xs text-[#9BA5B5]">
          No policies attached
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {policies.map((policy, idx) => (
            <div
              key={idx}
              className="p-2 bg-[#171C26] border border-[#293140] rounded text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={policy.name}
                  onChange={(e) => handleUpdatePolicy(idx, { name: e.target.value })}
                  placeholder="Policy Name"
                  className="bg-[#11151D] border border-[#293140] rounded px-2 py-1 text-xs text-[#F3F5F8] font-medium focus:border-[#FF3B4E] focus:outline-none flex-1 mr-2"
                />
                <button
                  type="button"
                  onClick={() => handleDeletePolicy(idx)}
                  className="text-[#9BA5B5] hover:text-[#FF3B4E] transition-colors"
                  title="Remove policy"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div>
                <label className="text-[10px] text-[#9BA5B5] block mb-0.5">
                  Allowed Actions (comma-separated, e.g. * or s3:*, iam:PassRole)
                </label>
                <input
                  type="text"
                  value={policy.actions.join(', ')}
                  onChange={(e) =>
                    handleUpdatePolicy(idx, {
                      actions: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="*"
                  className="w-full bg-[#11151D] border border-[#293140] rounded px-2 py-1 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#9BA5B5] block mb-0.5">
                  Resources (comma-separated, e.g. * or arn:aws:s3:::bucket/*)
                </label>
                <input
                  type="text"
                  value={policy.resources.join(', ')}
                  onChange={(e) =>
                    handleUpdatePolicy(idx, {
                      resources: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="*"
                  className="w-full bg-[#11151D] border border-[#293140] rounded px-2 py-1 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
