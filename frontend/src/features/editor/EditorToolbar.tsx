import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Check,
  CheckCircle2,
  Crosshair,
  Flame,
  Layers,
  Loader2,
  Save,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useSimulationStore } from '../../stores/simulationStore';
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
  const appMode = useEditorStore((s) => s.appMode);
  const setAppMode = useEditorStore((s) => s.setAppMode);

  const validateTopology = useSimulationStore((s) => s.validateTopology);
  const startSimulation = useSimulationStore((s) => s.startSimulation);
  const validating = useSimulationStore((s) => s.validating);
  const runLoading = useSimulationStore((s) => s.runLoading);
  const setBottomTab = useSimulationStore((s) => s.setBottomTab);

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

  const handleValidate = async () => {
    if (!lab) return;
    try {
      await saveLab();
      const res = await validateTopology(lab.id);
      if (res.valid) {
        toastSuccess('Topology is valid! No errors found.');
      } else {
        toastError(`Validation found ${res.errors.length} error(s). Check bottom panel.`);
      }
    } catch {
      toastError('Failed to validate topology');
    }
  };

  const handleSimulate = async () => {
    if (!lab) return;
    try {
      await saveLab();
      const run = await startSimulation(lab.id);
      toastSuccess(`Simulation complete: ${run.events?.length || 0} packet events generated.`);
    } catch {
      toastError('Simulation run failed');
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
          <div className="w-7 h-7 rounded-md overflow-hidden border border-[#FF3B4E]/30 flex items-center justify-center bg-[#0B0D12]">
            <img src="/icon.png" alt="RedLab" className="w-full h-full object-contain" />
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

      {/* Center: Global Mode Switch (Attack RED vs Defend BLUE) */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-[#0B0D12] p-1 rounded-lg border border-[#293140] shadow-inner">
          {/* Attack Mode Button */}
          <button
            type="button"
            onClick={() => {
              setAppMode('attack');
              setBottomTab('attack');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
              appMode === 'attack'
                ? 'bg-[#FF3B4E] text-white shadow-lg shadow-[#FF3B4E]/30'
                : 'text-[#9BA5B5] hover:text-[#F3F5F8] hover:bg-[#171C26]'
            }`}
          >
            <Flame size={13} className={appMode === 'attack' ? 'text-white' : 'text-[#FF3B4E]'} />
            <span>ATTACK MODE</span>
          </button>

          {/* Defend Mode Button */}
          <button
            type="button"
            onClick={() => {
              setAppMode('defend');
              setBottomTab('defense_verify');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
              appMode === 'defend'
                ? 'bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/30'
                : 'text-[#9BA5B5] hover:text-[#F3F5F8] hover:bg-[#171C26]'
            }`}
          >
            <ShieldCheck size={13} className={appMode === 'defend' ? 'text-white' : 'text-[#3B82F6]'} />
            <span>DEFEND MODE</span>
          </button>
        </div>

        {/* Engine status indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#171C26] border border-[#293140] text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[#9BA5B5]">Engine:</span>
          <span className="font-medium text-emerald-400">Deterministic Sim</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mode Specific Action Button */}
        {appMode === 'attack' ? (
          <Button
            size="sm"
            variant="danger"
            onClick={() => setBottomTab('attack')}
            icon={<Crosshair size={13} />}
            title="Open Attack Scenario Launcher"
          >
            Attack Launcher
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setBottomTab('defense_verify')}
            icon={<Shield size={13} className="text-[#3B82F6]" />}
            title="Open Defense Verification & Remediation"
          >
            Verify Defense
          </Button>
        )}

        {/* Validate Button */}
        <Button
          size="sm"
          variant="secondary"
          onClick={handleValidate}
          loading={validating}
          icon={<CheckCircle2 size={13} className="text-[#60A5FA]" />}
          title="Validate IP addresses, gateways, and link connections"
        >
          Validate
        </Button>

        {/* Simulate Button */}
        <Button
          size="sm"
          variant="secondary"
          onClick={handleSimulate}
          loading={runLoading}
          icon={<Activity size={13} className="text-[#34D399]" />}
          title="Run packet simulation across network topology"
        >
          Simulate
        </Button>

        {/* Quick Ping Tool */}
        <button
          type="button"
          onClick={() => setBottomTab('ping')}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#171C26] hover:bg-[#202736] border border-[#293140] hover:border-[#10B981] text-xs text-[#9BA5B5] hover:text-[#34D399] rounded transition-colors"
          title="Open Ping Diagnostic Tool"
        >
          <Send size={13} />
          <span className="hidden sm:inline">Ping</span>
        </button>

        <div className="h-4 w-px bg-[#293140] mx-0.5" />

        {/* Save status */}
        <div className="hidden md:flex items-center gap-1.5 text-xs">
          {saving ? (
            <span className="flex items-center gap-1 text-[#9BA5B5]">
              <Loader2 size={13} className="animate-spin text-[#60A5FA]" />
              Saving...
            </span>
          ) : hasUnsavedChanges ? (
            <span className="flex items-center gap-1 text-[#FF8A4C]">
              <span className="w-2 h-2 rounded-full bg-[#FF8A4C] animate-pulse" />
              Unsaved
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[#34D399]">
              <Check size={13} />
              Saved
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

        {/* Scan Button (in Defend Mode, or overall) */}
        <Button
          size="sm"
          variant={appMode === 'attack' ? 'secondary' : 'primary'}
          onClick={handleRunScan}
          loading={scanning}
          icon={<ShieldAlert size={14} />}
        >
          {scanning ? 'Scanning...' : 'Security Scan'}
        </Button>
      </div>
    </header>
  );
}

export default EditorToolbar;

