import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import type { Lab, ScanResult, Finding, GraphData, GraphNode, GraphEdge, ResourceType, AppMode } from '../types';
import { api } from '../services/api';

export interface ResourceNodeData extends Record<string, unknown> {
  label: string;
  resourceType: ResourceType;
  config: Record<string, unknown>;
  findingCount?: number;
}

interface EditorStore {
  lab: Lab | null;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  scanResult: ScanResult | null;
  scanning: boolean;
  saving: boolean;
  hasUnsavedChanges: boolean;
  scanPanelOpen: boolean;
  appMode: AppMode;

  setAppMode: (mode: AppMode) => void;
  loadLab: (labId: string) => Promise<void>;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  selectNode: (id: string | null) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  addNode: (node: Node) => void;
  deleteNode: (nodeId: string) => void;
  saveLab: () => Promise<void>;
  runScan: () => Promise<void>;
  setScanPanelOpen: (open: boolean) => void;
  getNodeFindings: (nodeId: string) => Finding[];
}

export function graphToFlowNodes(graphNodes: GraphNode[], findings: Finding[] = []): Node[] {
  return graphNodes.map((gn) => {
    const findingCount = findings.filter((f) => f.affected_resource_id === gn.id).length;
    return {
      id: gn.id,
      type: 'resourceNode',
      position: gn.position || { x: 100, y: 100 },
      data: {
        label: gn.label || (gn.config?.name as string) || gn.id,
        resourceType: gn.type,
        config: gn.config || {},
        findingCount,
      },
    };
  });
}

export function graphToFlowEdges(graphEdges: GraphEdge[]): Edge[] {
  return graphEdges.map((ge) => ({
    id: ge.id,
    source: ge.source,
    target: ge.target,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#FF3B4E', strokeWidth: 2 },
    data: {
      relationship_type: ge.relationship_type,
      metadata: ge.metadata || {},
    },
  }));
}

export function flowToGraphData(nodes: Node[], edges: Edge[]): GraphData {
  const graphNodes: GraphNode[] = nodes.map((n) => {
    const data = n.data as ResourceNodeData;
    return {
      id: n.id,
      type: (data.resourceType || 'pc') as ResourceType,
      position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
      label: (data.label as string) || n.id,
      config: (data.config as Record<string, unknown>) || {},
    };
  });

  const graphEdges: GraphEdge[] = edges.map((e) => {
    const data = (e.data as Record<string, unknown>) || {};
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      relationship_type: (data.relationship_type as string) || 'connects',
      metadata: (data.metadata as Record<string, unknown>) || {},
    };
  });

  return { nodes: graphNodes, edges: graphEdges };
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  lab: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  scanResult: null,
  scanning: false,
  saving: false,
  hasUnsavedChanges: false,
  scanPanelOpen: false,
  appMode: 'attack',

  setAppMode: (mode: AppMode) => {
    const edgeColor = mode === 'attack' ? '#FF3B4E' : '#3B82F6';
    set((state) => ({
      appMode: mode,
      edges: state.edges.map((e) => ({
        ...e,
        style: { ...e.style, stroke: edgeColor },
      })),
    }));
  },

  loadLab: async (labId: string) => {
    try {
      const lab = await api.getLab(labId);
      let scanResult: ScanResult | null = null;
      try {
        const scans = await api.getScanHistory(labId);
        if (scans && scans.length > 0) {
          scanResult = scans[scans.length - 1];
        }
      } catch {
        // Scans might not exist yet, ignore
      }

      const flowNodes = graphToFlowNodes(lab.graph_data?.nodes || [], scanResult?.findings || []);
      const flowEdges = graphToFlowEdges(lab.graph_data?.edges || []);

      set({
        lab,
        nodes: flowNodes,
        edges: flowEdges,
        selectedNodeId: null,
        scanResult,
        hasUnsavedChanges: false,
      });
    } catch (error) {
      console.error('Failed to load lab:', error);
      throw error;
    }
  },

  setNodes: (nodes: Node[]) => {
    set({ nodes, hasUnsavedChanges: true });
  },

  setEdges: (edges: Edge[]) => {
    set({ edges, hasUnsavedChanges: true });
  },

  onNodesChange: (changes: NodeChange[]) => {
    const updated = applyNodeChanges(changes, get().nodes);
    set({ nodes: updated, hasUnsavedChanges: true });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const updated = applyEdgeChanges(changes, get().edges);
    set({ edges: updated, hasUnsavedChanges: true });
  },

  selectNode: (id: string | null) => {
    set({ selectedNodeId: id });
  },

  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => {
    const currentNodes = get().nodes;
    const updated = currentNodes.map((node) => {
      if (node.id === nodeId) {
        const currentData = (node.data as ResourceNodeData) || {};
        return {
          ...node,
          data: {
            ...currentData,
            config: {
              ...(currentData.config || {}),
              ...config,
            },
            label: (config.name as string) || currentData.label,
          },
        };
      }
      return node;
    });
    set({ nodes: updated, hasUnsavedChanges: true });
  },

  updateNodeLabel: (nodeId: string, label: string) => {
    const currentNodes = get().nodes;
    const updated = currentNodes.map((node) => {
      if (node.id === nodeId) {
        const currentData = (node.data as ResourceNodeData) || {};
        const currentConfig = (currentData.config || {}) as Record<string, unknown>;
        return {
          ...node,
          data: {
            ...currentData,
            label,
            config: {
              ...currentConfig,
              name: label,
            },
          },
        };
      }
      return node;
    });
    set({ nodes: updated, hasUnsavedChanges: true });
  },

  addNode: (node: Node) => {
    set((state) => ({
      nodes: [...state.nodes, node],
      hasUnsavedChanges: true,
      selectedNodeId: node.id,
    }));
  },

  deleteNode: (nodeId: string) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      hasUnsavedChanges: true,
    }));
  },

  saveLab: async () => {
    const { lab, nodes, edges } = get();
    if (!lab) return;

    set({ saving: true });
    try {
      const graphData = flowToGraphData(nodes, edges);
      const updatedLab = await api.updateLab(lab.id, {
        graph_data: graphData,
        node_count: nodes.length,
      });

      set({
        lab: updatedLab,
        saving: false,
        hasUnsavedChanges: false,
      });
    } catch (error) {
      set({ saving: false });
      console.error('Failed to save lab:', error);
      throw error;
    }
  },

  runScan: async () => {
    const { lab, saveLab } = get();
    if (!lab) return;

    set({ scanning: true });
    try {
      // Save lab first to ensure backend has latest topology
      await saveLab();

      const result = await api.runScan(lab.id);

      // Update node finding counts in canvas
      const currentNodes = get().nodes;
      const updatedNodes = currentNodes.map((n) => {
        const count = result.findings.filter((f) => f.affected_resource_id === n.id).length;
        return {
          ...n,
          data: {
            ...n.data,
            findingCount: count,
          },
        };
      });

      set({
        scanResult: result,
        scanning: false,
        scanPanelOpen: true,
        nodes: updatedNodes,
      });
    } catch (error) {
      set({ scanning: false });
      console.error('Failed to run scan:', error);
      throw error;
    }
  },

  setScanPanelOpen: (open: boolean) => {
    set({ scanPanelOpen: open });
  },

  getNodeFindings: (nodeId: string) => {
    const { scanResult } = get();
    if (!scanResult) return [];
    return scanResult.findings.filter((f) => f.affected_resource_id === nodeId);
  },
}));
