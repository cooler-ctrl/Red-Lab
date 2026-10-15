import { useState } from 'react';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';

interface CreateLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => Promise<void>;
}

export function CreateLabModal({ isOpen, onClose, onSubmit }: CreateLabModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Lab name is required');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(name.trim(), description.trim());
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to create lab');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Security Simulation Lab">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 bg-[#FF3B4E]/15 border border-[#FF3B4E]/40 rounded text-xs text-[#FF3B4E]">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-[#F3F5F8] block mb-1">
            Lab Name <span className="text-[#FF3B4E]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Multi-Tier Cloud Architecture"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#171C26] border border-[#293140] rounded px-3 py-2 text-xs text-[#F3F5F8] placeholder-[#9BA5B5]/60 focus:border-[#FF3B4E] focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#F3F5F8] block mb-1">
            Description <span className="text-[#9BA5B5] font-normal">(Optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Describe the environment or attack scenario..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#171C26] border border-[#293140] rounded px-3 py-2 text-xs text-[#F3F5F8] placeholder-[#9BA5B5]/60 focus:border-[#FF3B4E] focus:outline-none resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#293140]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Create Lab
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateLabModal;
