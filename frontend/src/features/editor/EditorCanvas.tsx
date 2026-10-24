import { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
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

function getValidRelationship(typeA?: ResourceType, typeB?: ResourceType): {
  isValid: boolean;
  sourceType?: ResourceType;
  targetType?: ResourceType;
  relationshipType?: string;
  isReversed?: boolean;
} {
  // In computer networking, all devices can be interconnected via Layer 1/2/3 cabling
  return {
    isValid: true,
    sourceType: typeA,
    targetType: typeB,
    relationshipType: 'connects',
    isReversed: false,
  };
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
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) {
        toast('Cannot connect a device to itself', 'warning');
        return;
      }

      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return;

      const sourceData = sourceNode.data as ResourceNodeData;
      const targetData = targetNode.data as ResourceNodeData;

      const typeA = sourceData?.resourceType;
      const typeB = targetData?.resourceType;

      const rel = getValidRelationship(typeA, typeB);

      // Check if duplicate edge exists in either direction
      const existing = edges.find(
        (e) =>
          (e.source === connection.source && e.target === connection.target) ||
          (e.source === connection.target && e.target === connection.source)
      );
      if (existing) {
        toast('Connection already exists between these devices', 'info');
        return;
      }

      const edgeId = `e-${connection.source}-${connection.target}-${Date.now().toString(36)}`;
      const newEdge: Edge = {
        id: edgeId,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || 'right',
        targetHandle: connection.targetHandle || 'left',
        type: 'smoothstep',
        animated: true,
        style: { stroke: appMode === 'attack' ? '#FF3B4E' : '#3B82F6', strokeWidth: 2 },
        data: {
          relationship_type: rel.relationshipType || 'connects',
          metadata: {},
        },
      };

      setEdges(addEdge(newEdge, edges));
      toastSuccess(`Connected ${sourceData.label || typeA} <-> ${targetData.label || typeB}`);
    },
    [nodes, edges, setEdges, appMode, toastSuccess, toast]
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
        isValidConnection={(c) => c.source !== c.target}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
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
