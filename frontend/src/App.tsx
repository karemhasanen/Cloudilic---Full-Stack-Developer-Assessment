import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Sidebar } from './components/Sidebar';
import { InputNode } from './components/nodes/InputNode';
import { RAGNode } from './components/nodes/RAGNode';
import { OutputNode } from './components/nodes/OutputNode';
import { RunButton } from './components/RunButton';
import { useWorkflowExecution } from './hooks/useWorkflowExecution';

const nodeTypes: NodeTypes = {
  input: InputNode,
  rag: RAGNode,
  output: OutputNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeData, setNodeData] = useState<Record<string, any>>({});
  const { executeWorkflow, isExecuting, clearMemory, workflowId } = useWorkflowExecution();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAddNode = useCallback(
    (type: string, position?: { x: number; y: number }) => {
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position: position || {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
        data: {},
      };

      setNodes((nds) => [...nds, newNode]);
      setNodeData((prev) => ({ ...prev, [newNode.id]: {} }));
    },
    [setNodes]
  );

  const handleNodeDataChange = useCallback((nodeId: string, data: any) => {
    setNodeData((prev) => ({
      ...prev,
      [nodeId]: { ...prev[nodeId], ...data },
    }));
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      )
    );
  }, [setNodes]);

  const handleRun = useCallback(async () => {
    try {
      const result = await executeWorkflow(nodes, edges, nodeData);
      
      // Update output node with result
      const outputNode = nodes.find((n) => n.type === 'output');
      if (outputNode && result) {
        handleNodeDataChange(outputNode.id, {
          response: result.response,
          query: result.query,
          contextSources: result.contextSources,
          steps: result.steps,
        });
      }
    } catch (error: any) {
      console.error('Workflow execution error:', error);
      alert(`Error: ${error.message}`);
    }
  }, [nodes, edges, nodeData, executeWorkflow, handleNodeDataChange]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (type) {
        const reactFlowBounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const position = {
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        };
        handleAddNode(type, position);
      }
    },
    [handleAddNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      <Sidebar onAddNode={handleAddNode} />
      <div style={{ flex: 1, position: 'relative' }} onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              onDataChange: (data: any) => handleNodeDataChange(node.id, data),
            },
          }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          connectionLineStyle={{ stroke: '#667eea', strokeWidth: 2.5 }}
          defaultEdgeOptions={{ style: { stroke: '#667eea', strokeWidth: 2.5 } }}
        >
          <Controls />
          <Background />
          <MiniMap />
        </ReactFlow>
        <RunButton onRun={handleRun} isExecuting={isExecuting} />
      </div>
    </div>
  );
}

export default App;

