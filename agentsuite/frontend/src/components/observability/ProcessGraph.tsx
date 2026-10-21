import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  GitBranch,
  Play,
  Bot,
  User,
  Sparkles,
  ArrowRight,
  Loader2,
  Filter,
} from 'lucide-react';
import { observabilityService } from '../../services/observability.service';

interface GraphNode {
  id: string;
  type: string;
  label: string;
  status: string;
  description?: string;
  metrics?: Record<string, any>;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  animated?: boolean;
}

interface ProcessGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_events: number;
}

const nodeIcons: Record<string, React.FC<any>> = {
  start: Play,
  end: CheckCircle2,
  task: Bot,
  human_task: User,
  ai_skill: Sparkles,
  decision: GitBranch,
};

const statusColors: Record<string, string> = {
  completed: 'border-green-500 bg-green-50 dark:bg-green-900/20',
  failed: 'border-red-500 bg-red-50 dark:bg-red-900/20',
  pending: 'border-gray-300 bg-white dark:bg-gray-800',
  running: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
};

const statusDots: Record<string, string> = {
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  pending: 'bg-gray-400',
  running: 'bg-blue-500 animate-pulse',
};

export const ProcessGraph: React.FC = () => {
  const [timeRange, setTimeRange] = useState(24);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['process-graph', timeRange],
    queryFn: () => observabilityService.getProcessGraph({ time_range_hours: timeRange }),
    refetchInterval: 10000,
  });

  const graphData = data as ProcessGraphData | undefined;

  // Build node lookup
  const nodeMap: Record<string, GraphNode> = {};
  graphData?.nodes?.forEach((n) => { nodeMap[n.id] = n; });

  // Group edges by source
  const edgesBySource: Record<string, GraphEdge[]> = {};
  graphData?.edges?.forEach((e) => {
    if (!edgesBySource[e.source]) edgesBySource[e.source] = [];
    edgesBySource[e.source].push(e);
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Process Graph</h2>
          <p className="text-sm text-gray-500">
            {graphData?.total_events || 0} executions in the selected period
          </p>
        </div>
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {[
            { label: '1h', value: 1 },
            { label: '6h', value: 6 },
            { label: '24h', value: 24 },
            { label: '7d', value: 168 },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTimeRange(opt.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                timeRange === opt.value
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : !graphData || graphData.nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <GitBranch size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No process data yet</p>
              <p className="text-sm">Run a workflow to see the process graph</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Nodes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {graphData.nodes.map((node) => {
                const Icon = nodeIcons[node.type] || Bot;
                const outgoingEdges = edgesBySource[node.id] || [];
                
                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setSelectedNode(node)}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                      statusColors[node.status] || statusColors.pending
                    } ${selectedNode?.id === node.id ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${statusDots[node.status] || statusDots.pending}`} />
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {node.type.replace('_', ' ')}
                        </span>
                      </div>
                      <Icon className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{node.label}</h4>
                    {node.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{node.description}</p>
                    )}
                    
                    {/* Outgoing edges */}
                    {outgoingEdges.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 mb-1">Connects to:</p>
                        {outgoingEdges.map((edge) => {
                          const targetNode = nodeMap[edge.target];
                          return (
                            <div key={edge.id} className="flex items-center space-x-1 text-xs">
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                              <span className="text-blue-600 dark:text-blue-400">
                                {targetNode?.label || edge.target}
                              </span>
                              {edge.label && (
                                <span className="text-gray-400">({edge.label})</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {node.metrics && (
                      <div className="mt-2 flex gap-3 text-xs text-gray-500">
                        {node.metrics.execution_id && (
                          <span>Exec: {node.metrics.execution_id.slice(0, 8)}</span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Edges Table */}
          {graphData.edges.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Connections</h3>
              <div className="space-y-2">
                {graphData.edges.map((edge, idx) => {
                  const sourceNode = nodeMap[edge.source];
                  const targetNode = nodeMap[edge.target];
                  return (
                    <div key={`${edge.id}-${idx}`} className="flex items-center text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {sourceNode?.label || edge.source}
                      </span>
                      <ArrowRight className="w-4 h-4 mx-2 text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {targetNode?.label || edge.target}
                      </span>
                      {edge.label && (
                        <span className="ml-2 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                          {edge.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{graphData.nodes.length}</p>
                <p className="text-xs text-gray-500">Total Nodes</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{graphData.edges.length}</p>
                <p className="text-xs text-gray-500">Connections</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {graphData.nodes.filter((n) => n.status === 'completed').length}
                </p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-600">
                  {graphData.nodes.filter((n) => n.status === 'failed').length}
                </p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Node Detail Modal */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedNode(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedNode.label}</h3>
              <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Type</span>
                <span className="text-sm font-medium capitalize">{selectedNode.type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                  selectedNode.status === 'completed' ? 'bg-green-100 text-green-800' :
                  selectedNode.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>{selectedNode.status}</span>
              </div>
              {selectedNode.description && (
                <div>
                  <span className="text-sm text-gray-500">Description</span>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedNode.description}</p>
                </div>
              )}
              {selectedNode.metrics && (
                <div>
                  <span className="text-sm text-gray-500">Metrics</span>
                  <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded">
                    {JSON.stringify(selectedNode.metrics, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};