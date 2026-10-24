import { useState } from 'react';
import {
  Calendar,
  Copy,
  Edit2,
  ExternalLink,
  Flame,
  Layers,
  MoreVertical,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import type { Lab } from '../../types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

interface LabCardProps {
  lab: Lab;
  onOpen: (id: string) => void;
  onRename: (id: string, newName: string) => Promise<void>;
  onDuplicate: (lab: Lab) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function LabCard({ lab, onOpen, onRename, onDuplicate, onDelete }: LabCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [newName, setNewName] = useState(lab.name);
  const [busy, setBusy] = useState(false);

  const formattedDate = new Date(lab.updated_at || lab.created_at || Date.now()).toLocaleDateString(
    undefined,
    { month: 'short', day: 'numeric', year: 'numeric' }
  );

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await onRename(lab.id, newName.trim());
      setRenameModalOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setBusy(true);
    try {
      await onDelete(lab.id);
      setDeleteModalOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-[#171C26] border border-[#293140] hover:border-[#3d4a5c] rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-black/40 group relative">
      <div>
        {/* Top meta & Menu */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#11151D] border border-[#293140] text-[#9BA5B5]">
              <Layers size={11} className="text-[#FF3B4E]" />
              <span>{lab.node_count || lab.graph_data?.nodes?.length || 0} nodes</span>
            </span>

            <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FF3B4E]/10 text-[#FF3B4E] border border-[#FF3B4E]/30">
              <Flame size={11} />
              <span>Attack & Defend Lab</span>
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-[#9BA5B5] hover:text-[#F3F5F8] p-1 rounded hover:bg-[#11151D] transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-7 w-36 bg-[#11151D] border border-[#293140] rounded-lg shadow-2xl py-1 z-30 text-xs text-[#F3F5F8]">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setNewName(lab.name);
                      setRenameModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#171C26] flex items-center gap-2"
                  >
                    <Edit2 size={13} className="text-[#9BA5B5]" />
                    <span>Rename</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDuplicate(lab);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#171C26] flex items-center gap-2"
                  >
                    <Copy size={13} className="text-[#9BA5B5]" />
                    <span>Duplicate</span>
                  </button>
                  <div className="my-1 border-t border-[#293140]" />
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-950/40 text-[#FF3B4E] flex items-center gap-2"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h3
          onClick={() => onOpen(lab.id)}
          className="text-base font-semibold text-[#F3F5F8] group-hover:text-[#FF3B4E] cursor-pointer transition-colors leading-snug line-clamp-1"
        >
          {lab.name}
        </h3>
        <p className="text-xs text-[#9BA5B5] mt-1 line-clamp-2 min-h-[32px]">
          {lab.description || 'No description provided.'}
        </p>
      </div>

      {/* Footer Date & Open CTA */}
      <div className="pt-4 mt-3 border-t border-[#293140]/60 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] text-[#9BA5B5]">
          <Calendar size={12} />
          <span>{formattedDate}</span>
        </span>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => onOpen(lab.id)}
          className="group-hover:bg-[#FF3B4E] group-hover:border-[#FF3B4E] group-hover:text-white transition-all"
          icon={<ExternalLink size={13} />}
        >
          Open Lab
        </Button>
      </div>

      {/* Rename Modal */}
      <Modal
        isOpen={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        title="Rename Simulation Lab"
      >
        <form onSubmit={handleRenameSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#F3F5F8] block mb-1">New Lab Name</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-[#171C26] border border-[#293140] rounded px-3 py-2 text-xs text-[#F3F5F8] focus:border-[#FF3B4E] focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#293140]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRenameModalOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={busy}>
              Update
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#9BA5B5] leading-relaxed">
            Are you sure you want to delete <strong className="text-[#F3F5F8]">{lab.name}</strong>?
            This action cannot be undone and will permanently remove all associated graph nodes and scan history.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#293140]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteModalOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={busy}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default LabCard;
