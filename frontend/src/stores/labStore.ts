import { create } from 'zustand';
import { api } from '../services/api';
import type { Lab } from '../types';

interface LabStore {
  labs: Lab[];
  loading: boolean;
  error: string | null;
  fetchLabs: () => Promise<void>;
  createLab: (name: string, description?: string, graphData?: unknown) => Promise<Lab>;
  deleteLab: (id: string) => Promise<void>;
  updateLab: (id: string, data: Partial<Lab>) => Promise<Lab>;
}

export const useLabStore = create<LabStore>((set) => ({
  labs: [],
  loading: false,
  error: null,
  fetchLabs: async () => {
    set({ loading: true, error: null });
    try {
      const labs = await api.listLabs();
      set({ labs, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },
  createLab: async (name, description, graph_data) => {
    const lab = await api.createLab({ name, description, graph_data });
    set((s) => ({ labs: [lab, ...s.labs] }));
    return lab;
  },
  deleteLab: async (id) => {
    await api.deleteLab(id);
    set((s) => ({ labs: s.labs.filter((l) => l.id !== id) }));
  },
  updateLab: async (id, data) => {
    const updated = await api.updateLab(id, data);
    set((s) => ({ labs: s.labs.map((l) => (l.id === id ? updated : l)) }));
    return updated;
  },
}));
