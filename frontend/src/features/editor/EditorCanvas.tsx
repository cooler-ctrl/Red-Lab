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

// Valid relationship definitions: [sourceType, targetType, relationship_type]
const VALID_RELATIONSHIPS: Array<[ResourceType, ResourceType, string]> = [
  ['subnet', 'vpc', 'contains'],
  ['ec2', 'subnet', 'contains'],
  ['rds', 'subnet', 'contains'],
  ['security_group', 'ec2', 'attaches'],
  ['security_group', 'rds', 'attaches'],
  ['internet_gateway', 'vpc', 'attaches'],
  ['iam_role', 'ec2', 'references'],
];

function getValidRelationship(typeA: ResourceType, typeB: ResourceType): {
  isValid: boolean;
  sourceType?: ResourceType;
  targetType?: ResourceType;
  relationshipType?: string;
  isReversed?: boolean;
} {
  // Check direct A -> B
  const direct = VALID_RELATIONSHIPS.find(([s, t]) => s === typeA && t === typeB);
  if (direct) {
    return {
      isValid: true,
      sourceType: direct[0],
      targetType: direct[1],
      relationshipType: direct[2],
      isReversed: false,
    };
  }

  // Check reversed B -> A
  const reversed = VALID_RELATIONSHIPS.find(([s, t]) => s === typeB && t === typeA);
  if (reversed) {
    return {
      isValid: true,
      sourceType: reversed[0],
      targetType: reversed[1],
      relationshipType: reversed[2],
      isReversed: true,
    };
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
          `Invalid connection: cannot link ${typeA} with ${typeB}. Allowed connections: Subnet -> VPC, EC2/RDS -> Subnet, SG -> EC2/RDS, IGW -> VPC, IAM -> EC2.`
        );
        return;
      }

      // Canonical source & target
      const canonicalSourceId = rel.isReversed ? targetNode.id : sourceNode.id;
      const canonicalTargetId = rel.isReversed ? sourceNode.id : targetNode.id;
      const relationshipType = rel.relationshipType || 'attaches';

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
        style: { stroke: '#FF3B4E', strokeWidth: 2 },
        data: {
          relationship_type: relationshipType,
          metadata: {},
        },
      };

      setEdges([...edges, newEdge]);
      toastSuccess(`Connected ${rel.sourceType} -> ${rel.targetType} (${relationshipType})`);

      // Update node configs automatically to reflect topology
      if (rel.sourceType === 'subnet' && rel.targetType === 'vpc') {
        const sub = rel.isReversed ? targetNode : sourceNode;
        const vpc = rel.isReversed ? sourceNode : targetNode;
        updateNodeConfig(sub.id, { ...(sub.data as ResourceNodeData).config, vpc_id: vpc.id });
      } else if (rel.sourceType === 'ec2' && rel.targetType === 'subnet') {
        const ec2 = rel.isReversed ? targetNode : sourceNode;
        const sub = rel.isReversed ? sourceNode : targetNode;
        updateNodeConfig(ec2.id, { ...(ec2.data as ResourceNodeData).config, subnet_id: sub.id });
      } else if (rel.sourceType === 'rds' && rel.targetType === 'subnet') {
        const rds = rel.isReversed ? targetNode : sourceNode;
        const sub = rel.isReversed ? sourceNode : targetNode;
        updateNodeConfig(rds.id, { ...(rds.data as ResourceNodeData).config, subnet_id: sub.id });
      } else if (rel.sourceType === 'security_group' && rel.targetType === 'ec2') {
        const sg = rel.isReversed ? targetNode : sourceNode;
        const ec2 = rel.isReversed ? sourceNode : targetNode;
        const cfg = (ec2.data as ResourceNodeData).config as Record<string, any>;
        const currentSgs: string[] = cfg.security_group_ids || [];
        if (!currentSgs.includes(sg.id)) {
          updateNodeConfig(ec2.id, { ...cfg, security_group_ids: [...currentSgs, sg.id] });
        }
      } else if (rel.sourceType === 'security_group' && rel.targetType === 'rds') {
        const sg = rel.isReversed ? targetNode : sourceNode;
        const rds = rel.isReversed ? sourceNode : targetNode;
        const cfg = (rds.data as ResourceNodeData).config as Record<string, any>;
        const currentSgs: string[] = cfg.security_group_ids || [];
        if (!currentSgs.includes(sg.id)) {
          updateNodeConfig(rds.id, { ...cfg, security_group_ids: [...currentSgs, sg.id] });
        }
      } else if (rel.sourceType === 'internet_gateway' && rel.targetType === 'vpc') {
        const igw = rel.isReversed ? targetNode : sourceNode;
        const vpc = rel.isReversed ? sourceNode : targetNode;
        updateNodeConfig(igw.id, { ...(igw.data as ResourceNodeData).config, vpc_id: vpc.id });
      } else if (rel.sourceType === 'iam_role' && rel.targetType === 'ec2') {
        const iam = rel.isReversed ? targetNode : sourceNode;
        const ec2 = rel.isReversed ? sourceNode : targetNode;
        updateNodeConfig(ec2.id, { ...(ec2.data as ResourceNodeData).config, iam_role_id: iam.id });
      }
    },
    [nodes, edges, setEdges, toastError, toastSuccess, toast, updateNodeConfig]
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
            if (data?.resourceType === 'vpc') return '#60A5FA';
            if (data?.resourceType === 'subnet') return '#818CF8';
            if (data?.resourceType === 'ec2') return '#F59E0B';
            if (data?.resourceType === 's3') return '#34D399';
            if (data?.resourceType === 'rds') return '#A78BFA';
            if (data?.resourceType === 'security_group') return '#F472B6';
            if (data?.resourceType === 'iam_role') return '#FB923C';
            if (data?.resourceType === 'internet_gateway') return '#22D3EE';
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
