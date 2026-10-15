import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Cloud,
  FileCheck,
  Layers,
  Loader2,
  Play,
  Save,
  ShieldAlert,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';

export function EditorToolbar() {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const lab = useEditorStore((s) => s.lab);
  const nodes = useEditorStore((s) => s.nodes);
  const saving = useEditorStore((s) => s.saving);
  const scanning = useEditorStore((s) => s.scanning);
  const hasUnsavedChanges = useEditorStore((s) => s.hasUnsavedChanges);
  const saveLab = useEditorStore((s) => s.saveLab);
  const runScan = useEditorStore((s) => s.runScan);

  const [isEditingName, setIsEditingName] = useState(false);
  const [labName, setLabName] = useState(lab?.name || 'Untitled Lab');

  const handleSave = async () => {
    try {
      await saveLab();
      toastSuccess('Lab changes saved successfully');
    } catch {
      toastError('Failed to save lab changes');
    }
  };

  const handleRunScan = async () => {
    try {
      await runScan();
      toastSuccess('Security scan completed');
    } catch {
      toastError('Security scan failed');
    }
  };

  return (
    <header className="h-14 bg-[#11151D] border-b border-[#293140] px-4 flex items-center justify-between select-none z-20">
      {/* Left: Back & Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-1.5 rounded-lg text-[#9BA5B5] hover:text-[#F3F5F8] hover:bg-[#171C26] transition-colors"
          title="Back to Dashboard"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#FF3B4E]/10 border border-[#FF3B4E]/30 flex items-center justify-center">
            <Cloud size={16} className="text-[#FF3B4E]" />
          </div>

          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input
                type="text"
                value={labName}
                autoFocus
                onBlur={() => setIsEditingName(false)}
                onChange={(e) => setLabName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingName(false);
                }}
                className="bg-[#171C26] border border-[#FF3B4E] rounded px-2 py-0.5 text-sm font-semibold text-[#F3F5F8] focus:outline-none"
              />
            ) : (
              <h1
                onClick={() => setIsEditingName(true)}
                className="text-sm font-semibold text-[#F3F5F8] hover:text-[#FF3B4E] cursor-pointer transition-colors flex items-center gap-1.5"
                title="Click to rename"
              >
                <span>{lab?.name || labName}</span>
              </h1>
            )}

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#171C26] border border-[#293140] text-[11px] text-[#9BA5B5]">
              <Layers size={11} />
              <span>{nodes.length} nodes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Save status */}
        <div className="flex items-center gap-1.5 text-xs">
          {saving ? (
            <span className="flex items-center gap-1 text-[#9BA5B5]">
              <Loader2 size={13} className="animate-spin text-[#60A5FA]" />
              Saving...
            </span>
          ) : hasUnsavedChanges ? (
            <span className="flex items-center gap-1 text-[#FF8A4C]">
              <span className="w-2 h-2 rounded-full bg-[#FF8A4C] animate-pulse" />
              Unsaved changes
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[#34D399]">
              <Check size={13} />
              All saved
            </span>
          )}
        </div>

        {/* Save Button */}
        <Button
          size="sm"
          variant="secondary"
          onClick={handleSave}
          loading={saving}
          disabled={!hasUnsavedChanges}
          icon={<Save size={14} />}
        >
          Save
        </Button>

        {/* Scan Button */}
        <Button
          size="sm"
          variant="primary"
          onClick={handleRunScan}
          loading={scanning}
          icon={<ShieldAlert size={14} />}
        >
          {scanning ? 'Scanning...' : 'Run Security Scan'}
        </Button>
      </div>
    </header>
  );
}

export default EditorToolbar;
