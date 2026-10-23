import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Cloud,
  FileCode,
  Flame,
  HelpCircle,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Zap,
  Network,
} from 'lucide-react';
import { useLabStore } from '../../stores/labStore';
import { LabCard } from './LabCard';
import { CreateLabModal } from './CreateLabModal';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { createExampleNetworkLab } from '../../services/exampleNetworkLab';
import type { Lab } from '../../types';

export function DashboardPage() {
  const navigate = useNavigate();
  const { labs, loading, error, fetchLabs, createLab, deleteLab, updateLab } = useLabStore();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [loadingNetworkExample, setLoadingNetworkExample] = useState(false);

  useEffect(() => {
    fetchLabs();
  }, [fetchLabs]);

  const handleCreateLab = async (name: string, description: string) => {
    try {
      const newLab = await createLab(name, description);
      toastSuccess(`Lab "${newLab.name}" created`);
      navigate(`/lab/${newLab.id}`);
    } catch (err) {
      toastError(`Failed to create lab: ${(err as Error).message}`);
    }
  };

  const handleLoadNetworkExample = async () => {
    setLoadingNetworkExample(true);
    try {
      const exampleGraph = createExampleNetworkLab();
      const lab = await createLab(
        'Enterprise Network Attack Lab (Demo)',
        'Perimeter network topology with External Attacker, Edge Firewall, DMZ Web Server with HTTP/SSH, Core Router, Office LAN, and Internal Hosts.',
        exampleGraph
      );
      toastSuccess('Network Attack simulation environment loaded!');
      navigate(`/lab/${lab.id}`);
    } catch (err) {
      toastError(`Failed to load network lab: ${(err as Error).message}`);
    } finally {
      setLoadingNetworkExample(false);
    }
  };

  const handleDuplicateLab = async (lab: Lab) => {
    try {
      const copy = await createLab(
        `${lab.name} (Copy)`,
        lab.description,
        lab.graph_data
      );
      toastSuccess(`Duplicated "${lab.name}"`);
    } catch (err) {
      toastError(`Failed to duplicate lab: ${(err as Error).message}`);
    }
  };

  const handleRenameLab = async (id: string, newName: string) => {
    try {
      await updateLab(id, { name: newName });
      toastSuccess('Lab renamed');
    } catch (err) {
      toastError(`Failed to rename lab: ${(err as Error).message}`);
    }
  };

  const handleDeleteLab = async (id: string) => {
    try {
      await deleteLab(id);
      toastSuccess('Lab deleted');
    } catch (err) {
      toastError(`Failed to delete lab: ${(err as Error).message}`);
    }
  };

  const filteredLabs = labs.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.description && l.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#0B0D12] text-[#F3F5F8] flex flex-col">
      {/* Navbar Header */}
      <header className="border-b border-[#293140] bg-[#11151D]/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-red-500/20 flex items-center justify-center border border-[#FF3B4E]/30 bg-[#0B0D12]">
            <img src="/icon.png" alt="RedLab" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-[#F3F5F8]">RedLab</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#FF3B4E]/15 text-[#FF3B4E] border border-[#FF3B4E]/30 font-mono">
                v1.1.0
              </span>
              <span className="hidden sm:inline text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30">
                Hybrid Network & Cloud Security
              </span>
            </div>
            <p className="text-[11px] text-[#9BA5B5]">Packet-Level Network Simulation & Threat Modeling Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Link to Guided Training Scenarios */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/scenarios')}
            icon={<Zap size={14} className="text-[#FF3B4E]" />}
          >
            Training Scenarios
          </Button>

          {/* Load Example Network */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLoadNetworkExample}
            loading={loadingNetworkExample}
            icon={<Network size={14} className="text-[#34D399]" />}
          >
            Load Attack Lab Demo
          </Button>

          {/* Create New Lab */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            icon={<Plus size={15} />}
          >
            Create Lab
          </Button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Getting Started Banner (Collapsible) */}
        <section className="bg-[#11151D] border border-[#293140] rounded-xl overflow-hidden shadow-sm">
          <div
            className="px-5 py-3.5 flex items-center justify-between cursor-pointer select-none bg-[#171C26]/50 hover:bg-[#171C26] transition-colors"
            onClick={() => setGuideOpen(!guideOpen)}
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle size={16} className="text-[#FF3B4E]" />
              <h2 className="text-xs font-semibold text-[#F3F5F8]">
                Getting Started with RedLab Network Attack Simulation
              </h2>
            </div>
            <div className="text-[#9BA5B5]">
              {guideOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {guideOpen && (
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs border-t border-[#293140]/60">
              <div className="space-y-1.5 p-3.5 rounded-lg bg-[#171C26] border border-[#293140]">
                <div className="w-7 h-7 rounded-md bg-[#60A5FA]/15 border border-[#60A5FA]/30 flex items-center justify-center text-[#60A5FA] mb-2">
                  <Network size={16} />
                </div>
                <h3 className="font-semibold text-[#F3F5F8]">1. Visual Network Topologies</h3>
                <p className="text-[#9BA5B5] leading-relaxed">
                  Drag and drop network devices (PCs, Servers, Routers, Switches, Perimeter Firewalls, External WAN)
                  onto the canvas and link them to build subnets and routed domains.
                </p>
              </div>

              <div className="space-y-1.5 p-3.5 rounded-lg bg-[#171C26] border border-[#293140]">
                <div className="w-7 h-7 rounded-md bg-[#FF8A4C]/15 border border-[#FF8A4C]/30 flex items-center justify-center text-[#FF8A4C] mb-2">
                  <Shield size={16} />
                </div>
                <h3 className="font-semibold text-[#F3F5F8]">2. Configure Services & Firewalls</h3>
                <p className="text-[#9BA5B5] leading-relaxed">
                  Configure listening services (HTTP, SSH, Telnet), IP addressing, static routes, and
                  inbound/outbound firewall ACL rules directly in the Property Inspector.
                </p>
              </div>

              <div className="space-y-1.5 p-3.5 rounded-lg bg-[#171C26] border border-[#293140]">
                <div className="w-7 h-7 rounded-md bg-[#FF3B4E]/15 border border-[#FF3B4E]/30 flex items-center justify-center text-[#FF3B4E] mb-2">
                  <ShieldAlert size={16} />
                </div>
                <h3 className="font-semibold text-[#F3F5F8]">3. Scan & Simulate Attacks</h3>
                <p className="text-[#9BA5B5] leading-relaxed">
                  Execute TCP SYN port scans, discover open services, evaluate firewall filtering, and
                  trace multi-hop network kill chains and lateral attack paths.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Labs Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#F3F5F8]">Simulation Labs</h2>
            <p className="text-xs text-[#9BA5B5] mt-0.5">
              Manage your network architecture models and attack simulation labs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-[#9BA5B5]" />
              <input
                type="text"
                placeholder="Search labs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#11151D] border border-[#293140] rounded-lg px-3 py-1.5 pl-9 text-xs text-[#F3F5F8] placeholder-[#9BA5B5]/60 focus:border-[#FF3B4E] focus:outline-none w-56 transition-colors"
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchLabs()}
              icon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
              title="Refresh labs"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Lab List Grid */}
        {loading && labs.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw size={28} className="animate-spin text-[#FF3B4E] mx-auto" />
            <p className="text-xs text-[#9BA5B5]">Loading your simulation labs...</p>
          </div>
        ) : error && labs.length === 0 ? (
          <div className="p-8 text-center bg-[#171C26] border border-[#FF3B4E]/40 rounded-xl space-y-3">
            <p className="text-sm font-semibold text-[#FF3B4E]">Error connecting to RedLab API</p>
            <p className="text-xs text-[#9BA5B5]">{error}</p>
            <Button size="sm" variant="secondary" onClick={() => fetchLabs()}>
              Retry
            </Button>
          </div>
        ) : filteredLabs.length === 0 ? (
          <div className="py-20 text-center bg-[#11151D] border border-dashed border-[#293140] rounded-2xl p-8 space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#171C26] border border-[#293140] flex items-center justify-center mx-auto text-[#FF3B4E]">
              <Cloud size={28} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#F3F5F8]">
                {search ? 'No matching labs found' : 'No Simulation Labs Created'}
              </h3>
              <p className="text-xs text-[#9BA5B5] max-w-sm mx-auto mt-1">
                {search
                  ? `No labs matched your search "${search}". Try clearing the filter.`
                  : 'Get started by creating your first empty network lab or loading an attack simulation demo architecture.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={() => setCreateModalOpen(true)}
                icon={<Plus size={14} />}
              >
                Create Your First Lab
              </Button>
              <Button
                variant="secondary"
                onClick={handleLoadNetworkExample}
                loading={loadingNetworkExample}
                icon={<Zap size={14} className="text-[#34D399]" />}
              >
                Load Attack Lab Demo
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLabs.map((lab) => (
              <LabCard
                key={lab.id}
                lab={lab}
                onOpen={(id) => navigate(`/lab/${id}`)}
                onRename={handleRenameLab}
                onDuplicate={handleDuplicateLab}
                onDelete={handleDeleteLab}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#293140] py-4 px-6 text-center text-[11px] text-[#9BA5B5]">
        RedLab Cloud Security Simulator &bull; Interactive AWS Infrastructure Modeling
      </footer>

      {/* Create Lab Modal */}
      <CreateLabModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateLab}
      />
    </div>
  );
}

export default DashboardPage;
