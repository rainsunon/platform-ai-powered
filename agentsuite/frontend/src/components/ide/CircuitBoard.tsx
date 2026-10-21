import React, { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  NodeTypes,
  MarkerType,
  Panel,
  XYPosition,
} from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Save,
  MessageSquare,
  Trash2,
  Loader2,
  Menu,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Loader,
} from 'lucide-react';
import { ProcessNode } from './ProcessNode';
import { NodePalette } from './NodePalette';
import { NodeConfigPanel } from './NodeConfigPanel';
import { useWorkflowStore } from '../../stores/workflows.store';
import { WorkflowDefinition, ProcessGraphNode, ProcessGraphEdge } from '../../types/workflow';
import { workflowsService } from '../../services/workflows.service';
import toast from 'react-hot-toast';

const nodeTypes: NodeTypes = {
  custom: ProcessNode,
};

const defaultEdgeOptions = {
  animated: true,
  style: { stroke: '#6366f1', strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#6366f1',
  },
};

export const CircuitBoard: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, string>>({});
  const { currentWorkflow, saveDefinition, updateWorkflow } = useWorkflowStore();

  // Load saved nodes/edges when workflow changes
  useEffect(() => {
    if (currentWorkflow?.definition) {
      const def = currentWorkflow.definition;
      const loadedNodes: Node[] = (def.nodes || []).map((n: any) => ({
        id: n.id,
        type: 'custom',
        position: n.position || { x: 0, y: 0 },
        data: {
          ...(n.data || {}),
          label: n.data?.label || n.id,
          type: n.data?.type || 'task',
          config: n.data?.config || {},
          status: nodeStatuses[n.id] || 'pending',
        } as any,
      }));
      const loadedEdges: Edge[] = (def.edges || []).map((e: any, i: number) => ({
        id: e.id || `edge-${i}`,
        source: e.source,
        target: e.target,
        label: e.label || '',
        ...defaultEdgeOptions,
      }));
      setNodes(loadedNodes);
      setEdges(loadedEdges);
    }
  }, [currentWorkflow?.id]);

  useEffect(() => {
    if (!executionId || !currentWorkflow) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await workflowsService.listExecutions(currentWorkflow.id);
        const executions = response.data; // This is an array
        const execution = executions.find((e: any) => e.id === executionId);
        
        if (execution) {
          const { apiClient } = await import('../../lib/axios');
          const { data } = await apiClient.get(`/observability/logs?workflow_execution_id=${executionId}`);
          
          if (data?.logs) {
            const statuses: Record<string, string> = {};
            data.logs.forEach((log: any) => {
              const nodeId = log.data?.node_id;
              if (nodeId && log.event_type === 'node_completed') {
                statuses[nodeId] = 'completed';
              } else if (nodeId && log.event_type === 'node_failed') {
                statuses[nodeId] = 'failed';
              }
            });
            setNodeStatuses(statuses);
            
            setNodes((nds) =>
              nds.map((n) => ({
                ...n,
                data: { ...n.data, status: statuses[n.id] || (n.data as any).status || 'pending' },
              }))
            );
          }
          
          if (execution.status === 'completed' || execution.status === 'failed') {
            clearInterval(interval);
            setExecutionId(null);
            setIsRunning(false);
            toast.success(`Workflow ${execution.status}`);
          }
        }
      } catch {
        // Silently fail
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [executionId, currentWorkflow?.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && 
          !(e.target as HTMLElement)?.closest('input, textarea, select')) {
        const selectedNodes = nodes.filter((n) => n.selected);
        const selectedEdges = edges.filter((e) => e.selected);
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          setNodes((nds) => nds.filter((n) => !n.selected));
          setEdges((eds) => eds.filter((e) => !e.selected));
          setSelectedNode(null);
          toast.success(`Deleted ${selectedNodes.length + selectedEdges.length} item(s)`);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/reactflow-label');
      if (!type) return;

      const bounds = (event.target as HTMLElement).getBoundingClientRect();
      const position: XYPosition = {
        x: event.clientX - bounds.left - 80,
        y: event.clientY - bounds.top - 30,
      };

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: label || type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
          type,
          description: '',
          config: {},
          status: 'pending',
        } as any,
      };

      setNodes((nds) => [...nds, newNode]);
      toast.success(`Added ${label} node`);
    },
    [setNodes]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleDeleteSelected = () => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
    setSelectedNode(null);
  };

  const handleSave = async () => {
    if (!currentWorkflow) {
      toast.error('No workflow loaded');
      return;
    }
    setIsSaving(true);
    try {
      const graphNodes: ProcessGraphNode[] = nodes.map((n) => ({
        id: n.id,
        type: (n.data as any).type || 'task',
        position: { x: n.position.x, y: n.position.y },
        data: {
          label: (n.data as any).label || 'Untitled',
          description: (n.data as any).description || '',
          type: (n.data as any).type || 'task',
          config: (n.data as any).config || {},
        },
      }));

      const graphEdges: ProcessGraphEdge[] = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: typeof e.label === 'string' ? e.label : undefined,
      }));

      const definition: WorkflowDefinition = {
        nodes: graphNodes,
        edges: graphEdges,
        variables: currentWorkflow.definition?.variables || [],
        triggers: currentWorkflow.definition?.triggers || [],
      };

      await saveDefinition(currentWorkflow.id, definition);
      toast.success('Workflow saved!');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRun = async () => {
    if (!currentWorkflow) return;
    setIsRunning(true);
    try {
      await handleSave();
      if (currentWorkflow.status === 'draft') {
        await updateWorkflow(currentWorkflow.id, { status: 'active' });
      }
      
      // Reset statuses
      setNodeStatuses({});
      setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: 'pending' } })));
      
      const execution = await workflowsService.startWorkflow(currentWorkflow.id);
      setExecutionId(execution.id);
      toast.success('Workflow execution started!');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to start workflow');
      setIsRunning(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please describe what you want to build');
      return;
    }
    setIsAIGenerating(true);

    const lower = aiPrompt.toLowerCase();
    const newNodes: Node[] = [
      {
        id: `start-${Date.now()}`,
        type: 'custom',
        position: { x: 100, y: 200 },
        data: { label: 'Start', type: 'start', description: 'Workflow start', config: {}, status: 'pending' } as any,
      },
    ];

    let y = 100;
    if (lower.includes('extract') || lower.includes('data')) {
      newNodes.push({
        id: `extract-${Date.now()}`,
        type: 'custom',
        position: { x: 350, y },
        data: { label: 'Extract Data', type: 'ai_skill', description: 'Extract data from document', config: { skillName: 'extract_invoice' }, status: 'pending' } as any,
      });
      y += 150;
    }
    if (lower.includes('approv') || lower.includes('review')) {
      newNodes.push({
        id: `review-${Date.now()}`,
        type: 'custom',
        position: { x: 350, y },
        data: { label: 'Human Review', type: 'human_task', description: 'Review and approve', config: {}, status: 'pending' } as any,
      });
      y += 150;
    }
    if (lower.includes('notif') || lower.includes('email') || lower.includes('send')) {
      newNodes.push({
        id: `notify-${Date.now()}`,
        type: 'custom',
        position: { x: 350, y },
        data: { label: 'Send Notification', type: 'task', description: 'Send email notification', config: { taskType: 'email_send' }, status: 'pending' } as any,
      });
      y += 150;
    }
    if (lower.includes('valid') || lower.includes('check')) {
      newNodes.push({
        id: `validate-${Date.now()}`,
        type: 'custom',
        position: { x: 350, y },
        data: { label: 'Validate Data', type: 'task', description: 'Validate extracted data', config: {}, status: 'pending' } as any,
      });
      y += 150;
    }

    newNodes.push({
      id: `end-${Date.now()}`,
      type: 'custom',
      position: { x: 600, y: y > 100 ? (y - 75) : 200 },
      data: { label: 'End', type: 'end', description: 'Workflow end', config: {}, status: 'pending' } as any,
    });

    const newEdges: Edge[] = [];
    for (let i = 0; i < newNodes.length - 1; i++) {
      newEdges.push({
        id: `edge-${Date.now()}-${i}`,
        source: newNodes[i].id,
        target: newNodes[i + 1].id,
        ...defaultEdgeOptions,
      });
    }

    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
    setAiPrompt('');
    setIsAIGenerating(false);
    toast.success(`AI generated ${newNodes.length} nodes!`);
  };

  const hasSelection = nodes.some((n) => n.selected) || edges.some((e) => e.selected);

  return (
    <div className="h-full flex">
      <button
        onClick={() => setIsPaletteOpen(!isPaletteOpen)}
        className="lg:hidden fixed top-20 left-2 z-50 p-2 bg-gray-800 text-white rounded-lg shadow-lg"
      >
        {isPaletteOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <AnimatePresence>
        {isPaletteOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 overflow-hidden"
          >
            <NodePalette onClose={() => setIsPaletteOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionMode={ConnectionMode.Loose}
          fitView
          deleteKeyCode={['Delete', 'Backspace']}
          multiSelectionKeyCode="Shift"
          className="bg-gray-900"
        >
          <Background color="#374151" gap={16} size={1} />
          <Controls className="bg-gray-800 border-gray-700 fill-gray-400" />
          <MiniMap
            className="bg-gray-800 border-gray-700"
            maskColor="rgba(0, 0, 0, 0.5)"
            nodeColor={(node) => {
              const status = (node.data as any)?.status;
              if (status === 'completed') return '#10b981';
              if (status === 'failed') return '#ef4444';
              const nodeType = (node.data as any)?.type;
              switch (nodeType) {
                case 'start': return '#10b981';
                case 'end': return '#ef4444';
                case 'human_task': return '#f59e0b';
                case 'ai_skill': return '#8b5cf6';
                default: return '#6366f1';
              }
            }}
          />
          
          <Panel position="top-right" className="flex flex-col sm:flex-row gap-2">
            {hasSelection && (
              <motion.button
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleDeleteSelected}
                className="px-3 py-2 bg-red-600 text-white rounded-lg shadow-lg flex items-center space-x-1 text-sm"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Delete</span>
              </motion.button>
            )}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
              className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg flex items-center space-x-1 text-sm">
              <MessageSquare size={14} /><span className="hidden sm:inline">AI</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleSave} disabled={isSaving}
              className="px-3 py-2 bg-green-600 text-white rounded-lg shadow-lg flex items-center space-x-1 text-sm disabled:opacity-50">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleRun} disabled={isRunning}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg shadow-lg flex items-center space-x-1 text-sm disabled:opacity-50">
              {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              <span className="hidden sm:inline">{isRunning ? 'Running...' : 'Run'}</span>
            </motion.button>
          </Panel>
        </ReactFlow>
      </div>

      <AnimatePresence>
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdate={(updatedNode: Node) => {
              setNodes((nds) => nds.map((n) => (n.id === updatedNode.id ? updatedNode : n)));
            }}
            onDelete={(nodeId: string) => {
              setNodes((nds) => nds.filter((n) => n.id !== nodeId));
              setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
              setSelectedNode(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAIPanelOpen && (
          <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
            className="w-80 lg:w-96 border-l border-gray-700 bg-gray-800 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">AI Circuit Designer</h3>
              <button onClick={() => setIsAIPanelOpen(false)} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full h-32 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              placeholder="Describe the automation you want to build...&#10;&#10;Examples:&#10;• Extract invoice data, get approval, send email&#10;• Monitor website, alert on changes" />
            <button onClick={handleAIGenerate} disabled={isAIGenerating || !aiPrompt.trim()}
              className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center">
              {isAIGenerating ? <><Loader2 size={16} className="animate-spin mr-2" /> Generating...</> : 'Generate Circuit'}
            </button>
            <div className="mt-4 text-xs text-gray-500">
              <p className="font-medium text-gray-400 mb-1">Keyboard Shortcuts:</p>
              <p>Delete/Backspace - Remove selected</p>
              <p>Ctrl+S - Save workflow</p>
              <p>Shift+Click - Multi-select</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};