import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSimulationStore } from '../stores/simulationStore';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    validateTopology: vi.fn(),
    startRun: vi.fn(),
    stopRun: vi.fn(),
    getRunEvents: vi.fn(),
    ping: vi.fn(),
    portScan: vi.fn(),
  },
}));

describe('SimulationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSimulationStore.setState({
      currentRun: null,
      runLoading: false,
      runEvents: [],
      validationResult: null,
      validating: false,
      pingLoading: false,
      pingEvents: [],
      bottomTab: 'security',
      panelOpen: false,
    });
  });

  it('switches bottomTab and opens panel', () => {
    useSimulationStore.getState().setBottomTab('ping');
    expect(useSimulationStore.getState().bottomTab).toBe('ping');
    expect(useSimulationStore.getState().panelOpen).toBe(true);
  });

  it('validates topology and stores result', async () => {
    const mockValidation = {
      valid: true,
      errors: [],
      warnings: [],
    };
    vi.mocked(api.validateTopology).mockResolvedValueOnce(mockValidation);

    const res = await useSimulationStore.getState().validateTopology('lab-123');
    expect(res.valid).toBe(true);
    expect(useSimulationStore.getState().validationResult).toEqual(mockValidation);
    expect(useSimulationStore.getState().bottomTab).toBe('simulation');
    expect(useSimulationStore.getState().panelOpen).toBe(true);
    expect(useSimulationStore.getState().validating).toBe(false);
  });

  it('starts simulation run and populates events', async () => {
    const mockRun = {
      id: 'run-001',
      lab_id: 'lab-123',
      mode: 'simulator' as const,
      status: 'completed' as const,
      scenario_id: null,
      started_at: '2026-10-21T00:00:00Z',
      ended_at: '2026-10-21T00:00:01Z',
      validation: { valid: true, errors: [], warnings: [] },
      events: [
        {
          id: 'evt-1',
          run_id: 'run-001',
          timestamp: '2026-10-21T00:00:00Z',
          event_type: 'icmp_reply' as const,
          source_device_id: 'pc1',
          source_device_name: 'PC-1',
          dest_device_id: 'pc2',
          dest_device_name: 'PC-2',
          protocol: 'icmp',
          interface_name: 'eth0',
          summary: 'Echo reply received',
          detail: {},
          provenance: 'simulated' as const,
        },
      ],
      result_summary: { pairs_tested: 1, reachable_pairs: 1 },
    };
    vi.mocked(api.startRun).mockResolvedValueOnce(mockRun);

    const run = await useSimulationStore.getState().startSimulation('lab-123');
    expect(run.id).toBe('run-001');
    expect(useSimulationStore.getState().currentRun).toEqual(mockRun);
    expect(useSimulationStore.getState().runEvents).toHaveLength(1);
    expect(useSimulationStore.getState().bottomTab).toBe('simulation');
    expect(useSimulationStore.getState().runLoading).toBe(false);
  });

  it('runs interactive ping and sets events', async () => {
    const mockEvents = [
      {
        id: 'pe-1',
        run_id: 'ping-run',
        timestamp: '2026-10-21T00:00:00Z',
        event_type: 'icmp_request' as const,
        source_device_id: 'pc1',
        source_device_name: 'PC-1',
        dest_device_id: 'srv1',
        dest_device_name: 'Server',
        protocol: 'icmp',
        interface_name: 'eth0',
        summary: 'Echo request sent',
        detail: {},
        provenance: 'simulated' as const,
      },
      {
        id: 'pe-2',
        run_id: 'ping-run',
        timestamp: '2026-10-21T00:00:00Z',
        event_type: 'icmp_reply' as const,
        source_device_id: 'srv1',
        source_device_name: 'Server',
        dest_device_id: 'pc1',
        dest_device_name: 'PC-1',
        protocol: 'icmp',
        interface_name: 'eth0',
        summary: 'Echo reply received',
        detail: {},
        provenance: 'simulated' as const,
      },
    ];
    vi.mocked(api.ping).mockResolvedValueOnce(mockEvents);

    const events = await useSimulationStore.getState().runPing('lab-123', 'pc1', 'srv1');
    expect(events).toHaveLength(2);
    expect(useSimulationStore.getState().pingEvents).toEqual(mockEvents);
    expect(useSimulationStore.getState().bottomTab).toBe('ping');
    expect(useSimulationStore.getState().panelOpen).toBe(true);
    expect(useSimulationStore.getState().pingLoading).toBe(false);
  });

  it('runs port scan attack and sets events', async () => {
    const mockEvents = [
      {
        id: 'pse-1',
        run_id: 'scan-run',
        timestamp: '2026-10-21T00:00:00Z',
        event_type: 'port_scan_open' as const,
        source_device_id: 'pc1',
        source_device_name: 'Attacker-PC',
        dest_device_id: 'srv1',
        dest_device_name: 'Victim-Server',
        protocol: 'tcp',
        interface_name: null,
        summary: 'Port 80/TCP OPEN',
        detail: { port: 80, state: 'open' },
        provenance: 'simulated' as const,
      },
    ];
    vi.mocked(api.portScan).mockResolvedValueOnce(mockEvents);

    const events = await useSimulationStore.getState().runPortScan('lab-123', 'pc1', 'srv1', [80]);
    expect(events).toHaveLength(1);
    expect(useSimulationStore.getState().portScanEvents).toEqual(mockEvents);
    expect(useSimulationStore.getState().bottomTab).toBe('portscan');
    expect(useSimulationStore.getState().panelOpen).toBe(true);
    expect(useSimulationStore.getState().portScanLoading).toBe(false);
  });
});
