import type { Lab, ScanResult } from '../types';

declare global {
  interface Window {
    __REDLAB_API_URL__?: string;
  }
}

const API_BASE =
  (typeof window !== 'undefined' && window.__REDLAB_API_URL__) ||
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000/api';


async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
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
};
