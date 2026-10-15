import { Plus, Trash2 } from 'lucide-react';
import type { SGRule } from '../../types';

interface SecurityGroupRuleEditorProps {
  title: string;
  rules: SGRule[];
  onChange: (rules: SGRule[]) => void;
}

export function SecurityGroupRuleEditor({ title, rules = [], onChange }: SecurityGroupRuleEditorProps) {
  const handleAddRule = () => {
    const newRule: SGRule = {
      protocol: 'tcp',
      port_range: '80',
      source: '0.0.0.0/0',
      description: 'Allow HTTP',
    };
    onChange([...rules, newRule]);
  };

  const handleUpdateRule = (index: number, field: keyof SGRule, value: string) => {
    const updated = rules.map((r, i) => {
      if (i === index) {
        return { ...r, [field]: value };
      }
      return r;
    });
    onChange(updated);
  };

  const handleDeleteRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#F3F5F8]">{title}</span>
        <button
          type="button"
          onClick={handleAddRule}
          className="flex items-center gap-1 text-[11px] font-medium text-[#FF3B4E] hover:text-[#ff6170] px-2 py-0.5 rounded hover:bg-[#171C26] transition-colors"
        >
          <Plus size={12} />
          <span>Add Rule</span>
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="p-2.5 rounded border border-dashed border-[#293140] text-center text-xs text-[#9BA5B5]">
          No rules configured
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {rules.map((rule, idx) => (
            <div
              key={idx}
              className="p-2 bg-[#171C26] border border-[#293140] rounded text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase font-semibold text-[#9BA5B5]">Rule #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteRule(idx)}
                  className="text-[#9BA5B5] hover:text-[#FF3B4E] transition-colors"
                  title="Remove rule"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="text-[10px] text-[#9BA5B5] block mb-0.5">Protocol</label>
                  <select
                    value={rule.protocol}
                    onChange={(e) => handleUpdateRule(idx, 'protocol', e.target.value)}
                    className="w-full bg-[#11151D] border border-[#293140] rounded px-1.5 py-1 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none"
                  >
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                    <option value="icmp">ICMP</option>
                    <option value="-1">All (-1)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#9BA5B5] block mb-0.5">Port(s)</label>
                  <input
                    type="text"
                    value={rule.port_range}
                    onChange={(e) => handleUpdateRule(idx, 'port_range', e.target.value)}
                    placeholder="80 or 0-65535"
                    className="w-full bg-[#11151D] border border-[#293140] rounded px-1.5 py-1 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#9BA5B5] block mb-0.5">Source CIDR</label>
                  <input
                    type="text"
                    value={rule.source}
                    onChange={(e) => handleUpdateRule(idx, 'source', e.target.value)}
                    placeholder="0.0.0.0/0"
                    className="w-full bg-[#11151D] border border-[#293140] rounded px-1.5 py-1 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#9BA5B5] block mb-0.5">Description</label>
                <input
                  type="text"
                  value={rule.description || ''}
                  onChange={(e) => handleUpdateRule(idx, 'description', e.target.value)}
                  placeholder="Optional description"
                  className="w-full bg-[#11151D] border border-[#293140] rounded px-1.5 py-1 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
