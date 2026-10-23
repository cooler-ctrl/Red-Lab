import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Crosshair,
  Flame,
  Layers,
  Loader2,
  Network,
  Play,
  Shield,
  Tag,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import type { Scenario } from '../../types';

export function ScenariosPage() {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    api
      .listScenarios()
      .then((data) => {
        if (isMounted) setScenarios(data);
      })
      .catch((err) => {
        if (isMounted) toastError(`Failed to load scenarios: ${(err as Error).message}`);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [toastError]);

  const handleStartScenario = async (scenarioId: string) => {
    setStartingId(scenarioId);
    try {
      const res = await api.startScenario(scenarioId);
      toastSuccess(`Scenario environment created! Loading lab...`);
      navigate(`/lab/${res.lab_id}`);
    } catch (err) {
      toastError(`Failed to start scenario: ${(err as Error).message}`);
      setStartingId(null);
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'beginner':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80';
      case 'intermediate':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/80';
      case 'advanced':
        return 'bg-red-950/60 text-red-400 border-red-800/80';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D12] text-[#F3F5F8] select-none flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 border-b border-[#293140] bg-[#11151D] px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 rounded-lg text-[#9BA5B5] hover:text-[#F3F5F8] hover:bg-[#171C26] transition-colors"
            title="Back to Labs Dashboard"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF3B4E]/15 border border-[#FF3B4E]/30 flex items-center justify-center">
              <Zap size={18} className="text-[#FF3B4E]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#F3F5F8] tracking-tight">Guided Security & Network Scenarios</h1>
              <p className="text-xs text-[#9BA5B5]">Interactive challenge labs with automated deterministic assessment</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" variant="secondary" onClick={() => navigate('/')} icon={<Layers size={14} />}>
            My Labs
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {/* Intro Banner */}
        <div className="p-5 bg-gradient-to-r from-[#171C26] to-[#11151D] border border-[#293140] rounded-xl flex items-start justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <h2 className="text-sm font-semibold text-[#F3F5F8] flex items-center gap-2">
              <BookOpen size={16} className="text-[#60A5FA]" />
              Hands-On Cybersecurity & Network Engineering Labs
            </h2>
            <p className="text-xs text-[#9BA5B5] leading-relaxed">
              Launch pre-configured topology challenges. Inspect traffic, fix deliberate misconfigurations,
              and apply firewall rules. RedLab automatically validates your solution against the deterministic simulation engine.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end text-xs text-[#9BA5B5]">
            <span className="font-semibold text-[#F3F5F8]">{scenarios.length} Scenarios Available</span>
            <span className="text-emerald-400 font-mono text-[11px] mt-0.5">● 100% Local Simulation</span>
          </div>
        </div>

        {/* Scenarios Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 size={32} className="animate-spin text-[#FF3B4E]" />
            <p className="text-xs text-[#9BA5B5]">Loading training scenarios...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="bg-[#11151D] border border-[#293140] hover:border-[#3d4a5c] rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-lg space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getDifficultyBadge(
                        scenario.difficulty
                      )}`}
                    >
                      {scenario.difficulty}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-[#9BA5B5]">
                      <Clock size={12} />
                      <span>{scenario.estimated_minutes} min</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[#F3F5F8]">{scenario.title}</h3>
                    <p className="text-xs text-[#9BA5B5] mt-1.5 leading-relaxed line-clamp-3">
                      {scenario.description}
                    </p>
                  </div>

                  {/* Objectives Checklist */}
                  <div className="space-y-1.5 pt-2 border-t border-[#293140]/60">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9BA5B5] block">
                      Objectives ({scenario.objectives.length})
                    </span>
                    <ul className="space-y-1">
                      {scenario.objectives.map((obj) => (
                        <li key={obj.id} className="text-[11px] text-[#F3F5F8] flex items-start gap-1.5">
                          <CheckCircle2 size={12} className="text-[#3B82F6] mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{obj.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {scenario.tags.map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 rounded bg-[#171C26] border border-[#293140] text-[10px] text-[#9BA5B5]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleStartScenario(scenario.id)}
                  loading={startingId === scenario.id}
                  icon={<Play size={13} />}
                  className="w-full mt-2"
                >
                  {startingId === scenario.id ? 'Deploying...' : 'Launch Lab Scenario'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ScenariosPage;
