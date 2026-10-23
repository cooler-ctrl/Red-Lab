import { create } from 'zustand';
import type { LabRun, NetworkEvent, TopologyValidationResult } from '../types';
import { api } from '../services/api';

export type BottomTab = 'security' | 'simulation' | 'traffic' | 'ping' | 'portscan';

interface SimulationStore {
  currentRun: LabRun | null;
  runLoading: boolean;
  runEvents: NetworkEvent[];
  validationResult: TopologyValidationResult | null;
  validating: boolean;
  pingLoading: boolean;
  pingEvents: NetworkEvent[];
  portScanLoading: boolean;
  portScanEvents: NetworkEvent[];
  bottomTab: BottomTab;
  panelOpen: boolean;

  setBottomTab: (tab: BottomTab) => void;
  setPanelOpen: (open: boolean) => void;
  validateTopology: (labId: string) => Promise<TopologyValidationResult>;
  startSimulation: (labId: string, scenarioId?: string) => Promise<LabRun>;
  stopSimulation: (runId: string) => Promise<void>;
  loadRunEvents: (runId: string, eventType?: string) => Promise<void>;
  runPing: (labId: string, sourceId: string, destId: string) => Promise<NetworkEvent[]>;
  runPortScan: (labId: string, sourceId: string, destId: string, ports?: number[]) => Promise<NetworkEvent[]>;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  currentRun: null,
  runLoading: false,
  runEvents: [],
  validationResult: null,
  validating: false,
  pingLoading: false,
  pingEvents: [],
  portScanLoading: false,
  portScanEvents: [],
  bottomTab: 'security',
  panelOpen: false,

  setBottomTab: (tab: BottomTab) => {
    set({ bottomTab: tab, panelOpen: true });
  },

  setPanelOpen: (open: boolean) => {
    set({ panelOpen: open });
  },

  validateTopology: async (labId: string) => {
    set({ validating: true });
    try {
      const result = await api.validateTopology(labId);
      set({
        validationResult: result,
        validating: false,
        bottomTab: 'simulation',
        panelOpen: true,
      });
      return result;
    } catch (error) {
      set({ validating: false });
      console.error('Validation failed:', error);
      throw error;
    }
  },

  startSimulation: async (labId: string, scenarioId?: string) => {
    set({ runLoading: true });
    try {
      const run = await api.startRun(labId, 'simulator', scenarioId);
      set({
        currentRun: run,
        runLoading: false,
        runEvents: run.events || [],
        validationResult: run.validation,
        bottomTab: 'simulation',
        panelOpen: true,
      });
      return run;
    } catch (error) {
      set({ runLoading: false });
      console.error('Simulation run failed:', error);
      throw error;
    }
  },

  stopSimulation: async (runId: string) => {
    try {
      const run = await api.stopRun(runId);
      set({ currentRun: run });
    } catch (error) {
      console.error('Failed to stop run:', error);
      throw error;
    }
  },

  loadRunEvents: async (runId: string, eventType?: string) => {
    try {
      const events = await api.getRunEvents(runId, eventType);
      set({ runEvents: events });
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  },

  runPing: async (labId: string, sourceId: string, destId: string) => {
    set({ pingLoading: true });
    try {
      const events = await api.ping(labId, sourceId, destId);
      set({
        pingEvents: events,
        pingLoading: false,
        bottomTab: 'ping',
        panelOpen: true,
      });
      return events;
    } catch (error) {
      set({ pingLoading: false });
      console.error('Ping failed:', error);
      throw error;
    }
  },

  runPortScan: async (labId: string, sourceId: string, destId: string, ports?: number[]) => {
    set({ portScanLoading: true });
    try {
      const events = await api.portScan(labId, sourceId, destId, ports);
      set({
        portScanEvents: events,
        portScanLoading: false,
        bottomTab: 'portscan',
        panelOpen: true,
      });
      return events;
    } catch (error) {
      set({ portScanLoading: false });
      console.error('Port scan failed:', error);
      throw error;
    }
  },
}));
