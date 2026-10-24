import type {
  Lab,
  ScanResult,
  TopologyValidationResult,
  LabRun,
  NetworkEvent,
  Scenario,
  ScenarioAssessment,
  ExecutionMode,
  AttackExecutionRequest,
  AttackExecutionResponse,
  VerifyDefenseRequest,
} from '../types';

declare global {
  interface Window {
    __REDLAB_API_URL__?: string;
  }
}

function getApiBase(): string {
  if (typeof window !== 'undefined') {
    if (window.__REDLAB_API_URL__) return window.__REDLAB_API_URL__;
    if (window.location && window.location.origin && window.location.origin.startsWith('http')) {
      return `${window.location.origin}/api`;
    }
  }
  return import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${getApiBase()}${url}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      signal: controller.signal,
      ...options,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(error.detail || `Request failed: ${res.status}`);
    }
    if (res.status === 204) {
      return {} as T;
    }
    return res.json();
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') {
      throw new Error('Connection timed out. The RedLab backend is taking longer than expected to respond.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  // Labs
  listLabs: () => request<Lab[]>('/labs'),
  createLab: (data: { name: string; description?: string; graph_data?: unknown }) =>
    request<Lab>('/labs', { method: 'POST', body: JSON.stringify(data) }),
  getLab: (id: string) => request<Lab>(`/labs/${id}`),
  updateLab: (id: string, data: Partial<Lab>) =>
    request<Lab>(`/labs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLab: (id: string) => request<void>(`/labs/${id}`, { method: 'DELETE' }),

  // Scanning
  runScan: (labId: string) => request<ScanResult>(`/labs/${labId}/scan`, { method: 'POST' }),
  getScanHistory: (labId: string) => request<ScanResult[]>(`/labs/${labId}/scans`),

  // Import/Export
  importLab: (data: unknown) => request<Lab>('/labs/import', { method: 'POST', body: JSON.stringify(data) }),
  exportLab: (id: string) => request<unknown>(`/labs/${id}/export`),

  // v1.1 Network Simulation & Runs
  validateTopology: (labId: string) =>
    request<TopologyValidationResult>(`/labs/${labId}/validate`, { method: 'POST' }),
  startRun: (labId: string, mode: ExecutionMode = 'simulator', scenarioId?: string) =>
    request<LabRun>(`/labs/${labId}/runs`, {
      method: 'POST',
      body: JSON.stringify({ mode, scenario_id: scenarioId }),
    }),
  getRun: (runId: string) => request<LabRun>(`/runs/${runId}`),
  stopRun: (runId: string) => request<LabRun>(`/runs/${runId}/stop`, { method: 'POST' }),
  getRunEvents: (runId: string, eventType?: string) =>
    request<NetworkEvent[]>(`/runs/${runId}/events${eventType ? `?event_type=${encodeURIComponent(eventType)}` : ''}`),
  ping: (labId: string, sourceId: string, destId: string) =>
    request<NetworkEvent[]>(`/labs/${labId}/ping`, {
      method: 'POST',
      body: JSON.stringify({ source_id: sourceId, dest_id: destId }),
    }),
  portScan: (labId: string, sourceId: string, destId: string, ports?: number[]) =>
    request<NetworkEvent[]>(`/labs/${labId}/port-scan`, {
      method: 'POST',
      body: JSON.stringify({ source_id: sourceId, dest_id: destId, ports }),
    }),

  // v1.1 Scenarios
  listScenarios: () => request<Scenario[]>('/scenarios'),
  getScenario: (scenarioId: string) => request<Scenario>(`/scenarios/${scenarioId}`),
  startScenario: (scenarioId: string) =>
    request<{ message: string; lab_id: string; run_id: string; scenario_id: string }>(
      `/scenarios/${scenarioId}/start`,
      { method: 'POST' }
    ),
  assessRun: (runId: string, answers?: Record<string, unknown>) =>
    request<ScenarioAssessment>(`/runs/${runId}/assess`, {
      method: 'POST',
      body: JSON.stringify({ answers: answers || {} }),
    }),

  // RedLab 1.1 Attack & Defend Mode
  executeAttack: (labId: string, data: AttackExecutionRequest) =>
    request<AttackExecutionResponse>(`/labs/${labId}/attack`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  verifyDefense: (labId: string, data: VerifyDefenseRequest) =>
    request<AttackExecutionResponse>(`/labs/${labId}/verify-defense`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

