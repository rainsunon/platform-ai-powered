import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Play,
  StopCircle,
  Bot,
  User,
  GitBranch,
  Workflow,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

interface ProcessNodeData {
  label: string;
  type: string;
  description?: string;
  status?: 'running' | 'completed' | 'failed' | 'pending';
  config?: Record<string, any>;
  metrics?: {
    duration: number;
    successRate: number;
  };
}

const nodeConfigs: Record<string, { icon: React.FC<any>; color: string; bgColor: string }> = {
  start: { icon: Play, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
  end: { icon: StopCircle, color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
  task: { icon: Bot, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
  human_task: { icon: User, color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  decision: { icon: GitBranch, color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
  subprocess: { icon: Workflow, color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
  ai_skill: { icon: Sparkles, color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.1)' },
};

const statusIcons: Record<string, React.FC<any>> = {
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
  pending: Clock,
};

export const ProcessNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as ProcessNodeData;
  const config = nodeConfigs[nodeData.type] || nodeConfigs.task;
  const Icon = config.icon;
  const StatusIcon = nodeData.status ? statusIcons[nodeData.status] : null;

  return (
    <div
      className={`
        relative px-4 py-3 rounded-xl border-2 shadow-lg min-w-[180px]
        transition-all duration-200
        ${selected ? 'border-blue-500 shadow-blue-500/20' : 'border-gray-700'}
        hover:border-gray-500
      `}
      style={{
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-gray-500 !w-3 !h-3 !border-2 !border-gray-800"
      />

      <div className="flex items-center space-x-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: config.bgColor }}
        >
          <Icon className="w-5 h-5" style={{ color: config.color }} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {nodeData.label}
          </p>
          {nodeData.description && (
            <p className="text-xs text-gray-400 truncate">
              {nodeData.description}
            </p>
          )}
        </div>

        {StatusIcon && (
          <StatusIcon
            className={`w-4 h-4 ${
              nodeData.status === 'running' ? 'text-blue-400 animate-spin' :
              nodeData.status === 'completed' ? 'text-green-400' :
              nodeData.status === 'failed' ? 'text-red-400' :
              'text-gray-400'
            }`}
          />
        )}
      </div>

      {nodeData.metrics && (
        <div className="mt-2 pt-2 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
          <span>{nodeData.metrics.duration}ms</span>
          <span>{nodeData.metrics.successRate}%</span>
        </div>
      )}

      {nodeData.status && (
        <div
          className={`
            absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-medium
            ${nodeData.status === 'running' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50' :
              nodeData.status === 'completed' ? 'bg-green-500/20 text-green-300 border border-green-500/50' :
              nodeData.status === 'failed' ? 'bg-red-500/20 text-red-300 border border-red-500/50' :
              'bg-gray-500/20 text-gray-300 border border-gray-500/50'}
          `}
        >
          {nodeData.status}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-gray-500 !w-3 !h-3 !border-2 !border-gray-800"
      />
    </div>
  );
});

ProcessNode.displayName = 'ProcessNode';