import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLabStore } from '../stores/labStore';
import { useEditorStore } from '../stores/editorStore';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    listLabs: vi.fn(),
    createLab: vi.fn(),
    getLab: vi.fn(),
    updateLab: vi.fn(),
    deleteLab: vi.fn(),
    runScan: vi.fn(),
    getScanHistory: vi.fn(),
    importLab: vi.fn(),
    exportLab: vi.fn(),
  },
}));

describe('LabStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLabStore.setState({ labs: [], loading: false, error: null });
  });

  it('fetches and populates labs list', async () => {
    const mockLabs = [
      {
        id: 'lab-1',
        name: 'Alpha Lab',
        description: 'First lab',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        graph_data: { nodes: [], edges: [] },
        schema_version: '1.0',
        node_count: 0,
        last_scan_status: null,
      },
    ];
    vi.mocked(api.listLabs).mockResolvedValueOnce(mockLabs);

    await useLabStore.getState().fetchLabs();
    expect(useLabStore.getState().labs).toHaveLength(1);
    expect(useLabStore.getState().labs[0].name).toBe('Alpha Lab');
    expect(useLabStore.getState().loading).toBe(false);
  });

  it('creates a lab and prepends to state', async () => {
    const newLab = {
      id: 'lab-2',
      name: 'Beta Lab',
      description: 'Second lab',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      graph_data: { nodes: [], edges: [] },
      schema_version: '1.0',
      node_count: 0,
      last_scan_status: null,
    };
    vi.mocked(api.createLab).mockResolvedValueOnce(newLab);

    const created = await useLabStore.getState().createLab('Beta Lab', 'Second lab');
    expect(created.id).toBe('lab-2');
    expect(useLabStore.getState().labs).toContainEqual(newLab);
  });

  it('deletes a lab from state', async () => {
    useLabStore.setState({
      labs: [
        {
          id: 'lab-del',
          name: 'To Delete',
          description: '',
          created_at: '',
          updated_at: '',
          graph_data: { nodes: [], edges: [] },
          schema_version: '1.0',
          node_count: 0,
          last_scan_status: null,
        },
      ],
    });
    vi.mocked(api.deleteLab).mockResolvedValueOnce(undefined);

    await useLabStore.getState().deleteLab('lab-del');
    expect(useLabStore.getState().labs).toHaveLength(0);
  });
});

describe('EditorStore', () => {
  beforeEach(() => {
    useEditorStore.setState({
      lab: null,
      nodes: [],
      edges: [],
      selectedNodeId: null,
      scanResult: null,
      scanning: false,
      saving: false,
      hasUnsavedChanges: false,
      scanPanelOpen: false,
    });
  });

  it('adds and selects nodes correctly', () => {
    const node = {
      id: 's3-test',
      type: 'resourceNode',
      position: { x: 100, y: 150 },
      data: {
        label: 'Bucket 1',
        resourceType: 's3',
        config: { public_access: true },
        findingCount: 0,
      },
    };

    useEditorStore.getState().addNode(node as any);
    expect(useEditorStore.getState().nodes).toHaveLength(1);
    expect(useEditorStore.getState().hasUnsavedChanges).toBe(true);

    useEditorStore.getState().selectNode('s3-test');
    expect(useEditorStore.getState().selectedNodeId).toBe('s3-test');
  });

  it('updates node config and marks unsaved', () => {
    const node = {
      id: 's3-test',
      type: 'resourceNode',
      position: { x: 100, y: 150 },
      data: {
        label: 'Bucket 1',
        resourceType: 's3',
        config: { public_access: true },
        findingCount: 0,
      },
    };
    useEditorStore.getState().addNode(node as any);

    useEditorStore.getState().updateNodeConfig('s3-test', { public_access: false, encryption: true });
    const updated = useEditorStore.getState().nodes[0];
    expect(updated.data.config).toEqual({ public_access: false, encryption: true });
    expect(useEditorStore.getState().hasUnsavedChanges).toBe(true);
  });

  it('filters findings by node id', () => {
    useEditorStore.setState({
      scanResult: {
        id: 'scan-1',
        lab_id: 'lab-1',
        timestamp: new Date().toISOString(),
        total_rules: 10,
        passed: 9,
        failed: 1,
        findings: [
          {
            rule_id: 'S3_PUBLIC_ACCESS',
            title: 'Public S3 Bucket',
            severity: 'high',
            category: 'Storage',
            affected_resource_id: 's3-target',
            affected_resource_name: 'Target S3',
            explanation: 'Vulnerable',
            impact: 'Data leak',
            remediation: 'Block public',
            references: [],
          },
        ],
        findings_by_severity: { high: 1 },
        risk_score: 7.0,
        summary: '1 issue found',
        attack_paths: [],
      },
    });

    const targetFindings = useEditorStore.getState().getNodeFindings('s3-target');
    const otherFindings = useEditorStore.getState().getNodeFindings('other-node');
    expect(targetFindings).toHaveLength(1);
    expect(otherFindings).toHaveLength(0);
  });
});
