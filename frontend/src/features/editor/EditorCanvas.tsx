import { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Edge,
  type Node,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import ResourceNode from './ResourceNode';
import { useEditorStore, type ResourceNodeData } from '../../stores/editorStore';
import { DEFAULT_CONFIGS } from './ResourceLibrary';
import { useToast } from '../../components/Toast';
import type { ResourceType } from '../../types';

const nodeTypes = {
  resourceNode: ResourceNode,
};

const HOST_TYPES: Set<ResourceType> = new Set([
  'pc',
  'server',
  'linux_server',
  'web_server',
  'dns_server',
  'endpoint',
]);
const SWITCH_TYPES: Set<ResourceType> = new Set(['switch', 'layer3_switch']);
const ROUTER_TYPES: Set<ResourceType> = new Set(['router', 'layer3_switch']);
const SECURITY_TYPES: Set<ResourceType> = new Set(['firewall', 'ids_ips']);
const WAN_TYPES: Set<ResourceType> = new Set(['external_network']);

function getValidRelationship(typeA: ResourceType, typeB: ResourceType): {
  isValid: boolean;
  sourceType?: ResourceType;
  targetType?: ResourceType;
  relationshipType?: string;
  isReversed?: boolean;
} {
  // Direct device matches
  const isHostA = HOST_TYPES.has(typeA);
  const isHostB = HOST_TYPES.has(typeB);
  const isSwitchA = SWITCH_TYPES.has(typeA);
  const isSwitchB = SWITCH_TYPES.has(typeB);
  const isRouterA = ROUTER_TYPES.has(typeA);
  const isRouterB = ROUTER_TYPES.has(typeB);
  const isSecurityA = SECURITY_TYPES.has(typeA);
  const isSecurityB = SECURITY_TYPES.has(typeB);
  const isWanA = WAN_TYPES.has(typeA);
  const isWanB = WAN_TYPES.has(typeB);

  // Host <-> Switch
  if ((isHostA && isSwitchB) || (isHostB && isSwitchA)) {
    return { isValid: true, sourceType: typeA, targetType: typeB, relationshipType: 'connects', isReversed: false };
  }
  // Host <-> Router
  if ((isHostA && isRouterB) || (isHostB && isRouterA)) {
    return { isValid: true, sourceType: typeA, targetType: typeB, relationshipType: 'connects', isReversed: false };
  }
  // Host <-> Security (Firewall / IDS)
  if ((isHostA && isSecurityB) || (isHostB && isSecurityA)) {
    return { isValid: true, sourceType: typeA, targetType: typeB, relationshipType: 'connects', isReversed: false };
  }
  // Host <-> Host (Direct peer cross-over link)
  if (isHostA && isHostB) {
    return { isValid: true, sourceType: typeA, targetType: typeB, relationshipType: 'connects', isReversed: false };
  }
  // Host <-> WAN
  if ((isHostA && isWanB) || (isHostB && isWanA)) {
    return { isValid: true, sourceType: typeA, targetType: typeB, relationshipType: 'connects', isReversed: false };
  }
  // Switch <-> Switch (Trunk / Uplink)
  if (isSwitchA && isSwitchB) {
    return { isValid: true, sourceType: typeA, targetType: typeB, relationshipType: 'connects', isReversed: false };
  }
  // Switch <-> Router (Gateway uplink)
  if ((isSwitchA && isRouterB) || (isSwitchB && isRouterA)) {
    return { isValid: true, sourceType: typeA, targetType: typeB, relationshipType: 'connects', isReversed: false };
  }
  // Switch <-> Security
  if ((isSwitchA && isSecurityB) || (isSwitchB && isSecurityA)) {
    return { isValid: true, sourceType: typeA, targetType: typeB, relationshipType: 'connects', isReversed: false };
  }
  // Switch <-> WAN
  if ((isSwitchA && isWanB) || (isSwitchB && isWanA)) {
    return { isValid: true, sourceType: typeA, targetType: typeB, relationshipType: 'connects', isReversed: false };
  }
  // Router <-> Router
  if (isRouterA && isRouterB) {
    return { isValid: true, sourceType: typeA, targetType: typeB, relationshipType: 'connects', isReversed: false };
  }
  // Router <-> Security
  if ((isRouterA && isSecurityB) || (isRouterB && isSecurityA)) {
    return { isValid: true, sourceType: typeA, targetType: typeB, relationshipType: 'connects', isReversed: false };
  }
  // Router <-> WAN
  if ((isRouterA && isWanB) || (isRouterB && isWanA)) {
    return { isValid: true, sourceType: typeA, targetType: typeB, relationshipType: 'connects', isReversed: false };
  }
  // Security <-> Security
  if (isSecurityA && isSecurityB) {
    return { isValid: true, sourceType: typeA, targetType: typeB, relationshipType: 'connects', isReversed: false };
  }
  // Security <-> WAN
  if ((isSecurityA && isWanB) || (isSecurityB && isWanA)) {
    return { isValid: true, sourceType: typeA, targetType: typeB, relationshipType: 'connects', isReversed: false };
  }

  return { isValid: false };
}

function CanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const { toast, error: toastError, success: toastSuccess } = useToast();

  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const onNodesChange = useEditorStore((s) => s.onNodesChange);
  const onEdgesChange = useEditorStore((s) => s.onEdgesChange);
  const setEdges = useEditorStore((s) => s.setEdges);
  const addNode = useEditorStore((s) => s.addNode);
  const selectNode = useEditorStore((s) => s.selectNode);
  const updateNodeConfig = useEditorStore((s) => s.updateNodeConfig);
  const appMode = useEditorStore((s) => s.appMode);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/type') as ResourceType;
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const uniqueSuffix = Math.random().toString(36).substring(2, 6);
      const id = `${type}-${uniqueSuffix}`;
      const defaultConf = DEFAULT_CONFIGS[type] || { name: `${type}-${uniqueSuffix}` };
      const label = `${defaultConf.name || type} ${uniqueSuffix}`;

      const newNode: Node = {
        id,
        type: 'resourceNode',
        position,
        data: {
          label,
          resourceType: type,
          config: {
            ...defaultConf,
            name: label,
          },
          findingCount: 0,
        },
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return;

      const sourceData = sourceNode.data as ResourceNodeData;
      const targetData = targetNode.data as ResourceNodeData;

      const typeA = sourceData.resourceType;
      const typeB = targetData.resourceType;

      const rel = getValidRelationship(typeA, typeB);

      if (!rel.isValid) {
        toastError(
          `Invalid connection: cannot link ${typeA} with ${typeB}. Connect endpoints (PC/Server) to Switches, Routers, or Firewalls.`
        );
        return;
      }

      // Canonical source & target
      const canonicalSourceId = rel.isReversed ? targetNode.id : sourceNode.id;
      const canonicalTargetId = rel.isReversed ? sourceNode.id : targetNode.id;
      const relationshipType = rel.relationshipType || 'connects';

      // Check if duplicate edge exists
      const existing = edges.find(
        (e) => e.source === canonicalSourceId && e.target === canonicalTargetId
      );
      if (existing) {
        toast('Connection already exists', 'info');
        return;
      }

      const edgeId = `e-${canonicalSourceId}-${canonicalTargetId}`;
      const newEdge: Edge = {
        id: edgeId,
        source: canonicalSourceId,
        target: canonicalTargetId,
        animated: true,
        style: { stroke: appMode === 'attack' ? '#FF3B4E' : '#3B82F6', strokeWidth: 2 },
        data: {
          relationship_type: relationshipType,
          metadata: {},
        },
      };

      setEdges([...edges, newEdge]);
      toastSuccess(`Connected ${rel.sourceType} <-> ${rel.targetType}`);
    },
    [nodes, edges, setEdges, toastError, toastSuccess, toast]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full relative bg-[#0B0D12]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        className="dark-flow"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#293140" gap={20} size={1.5} />
        <Controls
          className="!bg-[#171C26] !border-[#293140] !rounded-lg overflow-hidden [&>button]:!bg-[#171C26] [&>button]:!border-[#293140] [&>button]:!text-[#F3F5F8] [&>button:hover]:!bg-[#202735]"
        />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as ResourceNodeData;
            if (data?.resourceType === 'pc') return '#10B981';
            if (data?.resourceType === 'router') return '#3B82F6';
            if (data?.resourceType === 'switch') return '#8B5CF6';
            if (data?.resourceType === 'server') return '#EC4899';
            if (data?.resourceType === 'firewall') return '#EF4444';
            if (data?.resourceType === 'external_network') return '#06B6D4';
            return '#9BA5B5';
          }}
          maskColor="rgba(11, 13, 18, 0.75)"
          className="!bg-[#11151D] !border-[#293140] !rounded-lg overflow-hidden"
        />
      </ReactFlow>
    </div>
  );
}

export function EditorCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}

export default EditorCanvas;
