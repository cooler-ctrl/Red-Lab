import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSimulationStore } from '../stores/simulationStore';
import { api } from '../services/api';
import type { AttackExecutionResponse, BeforeAfterComparison } from '../types';

vi.mock('../services/api', () => ({
  api: {
    validateTopology: vi.fn(),
    startRun: vi.fn(),
    stopRun: vi.fn(),
    ping: vi.fn(),
    portScan: vi.fn(),
    executeAttack: vi.fn(),
    verifyDefense: vi.fn(),
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
      bottomTab: 'attack',
      panelOpen: false,
      attackLoading: false,
      attackResponse: null,
      verifyLoading: false,
      comparisonResult: null,
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

  it('executes attack scenario and stores response', async () => {
    const mockAttackRes: AttackExecutionResponse = {
      run_id: 'atk-run-1',
      scenario_id: 'attack_port_scan',
      scenario_title: 'Port Scan Recon',
      target_id: 'srv1',
      target_name: 'Target-Server',
      status: 'completed',
      outcome: 'compromised',
      evidence: { open_ports: [80, 22] },
      events: [],
      educational_takeaway: 'Open ports discovered',
      remediation_hint: 'Configure firewall ACL to drop inbound SYN',
    };
    vi.mocked(api.executeAttack).mockResolvedValueOnce(mockAttackRes);

    const res = await useSimulationStore.getState().executeAttack('lab-123', {
      scenario_id: 'attack_port_scan',
      target_id: 'srv1',
      app_mode: 'attack',
    });

    expect(res.outcome).toBe('compromised');
    expect(useSimulationStore.getState().attackResponse).toEqual(mockAttackRes);
    expect(useSimulationStore.getState().bottomTab).toBe('attack');
    expect(useSimulationStore.getState().panelOpen).toBe(true);
    expect(useSimulationStore.getState().attackLoading).toBe(false);
  });

  it('runs verify defense and stores before/after comparison', async () => {
    const mockComparison: BeforeAfterComparison = {
      scenario_id: 'attack_port_scan',
      target_id: 'srv1',
      target_name: 'Target-Server',
      defense_applied: 'Firewall ACL default-deny',
      before_status: 'compromised',
      before_summary: 'Port 80/TCP OPEN',
      before_events_count: 5,
      after_status: 'blocked',
      after_summary: 'Traffic filtered by firewall rule',
      after_events_count: 3,
      defense_effective: true,
      explanation: 'Attack successfully blocked by firewall rule',
    };
    const mockVerifyRes: AttackExecutionResponse = {
      run_id: 'verify-run-1',
      scenario_id: 'attack_port_scan',
      scenario_title: 'Port Scan Recon',
      target_id: 'srv1',
      target_name: 'Target-Server',
      status: 'completed',
      outcome: 'blocked',
      events: [],
      evidence: {},
      educational_takeaway: 'Firewall rules successfully prevent unauthorized access',
      remediation_hint: 'Verify all interfaces are protected',
      comparison: mockComparison,
    };
    vi.mocked(api.verifyDefense).mockResolvedValueOnce(mockVerifyRes);

    const res = await useSimulationStore.getState().runVerifyDefense('lab-123', {
      scenario_id: 'attack_port_scan',
      target_id: 'srv1',
      applied_defense: 'Firewall default-deny',
    });

    expect(res.comparison?.defense_effective).toBe(true);
    expect(useSimulationStore.getState().comparisonResult).toEqual(mockComparison);
    expect(useSimulationStore.getState().bottomTab).toBe('defense_verify');
    expect(useSimulationStore.getState().panelOpen).toBe(true);
    expect(useSimulationStore.getState().verifyLoading).toBe(false);
  });
});
