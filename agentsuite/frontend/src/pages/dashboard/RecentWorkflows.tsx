import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

interface RecentWorkflow {
  id: string;
  workflowId: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
}

interface RecentWorkflowsProps {
  workflows: RecentWorkflow[];
  isLoading?: boolean;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  completed: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  failed: {
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
  },
  running: {
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
};

export const RecentWorkflows: React.FC<RecentWorkflowsProps> = ({
  workflows,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse h-14 bg-gray-100 dark:bg-gray-700 rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (!workflows || workflows.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          No workflows executed yet
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Workflows will appear here once executed
        </p>
      </div>
    );
  }

  const formatDuration = (ms: number | null): string => {
    if (ms === null || ms === undefined) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const formatTime = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className="space-y-2">
      {workflows.map((workflow) => {
        const config = statusConfig[workflow.status] || statusConfig.running;
        
        return (
          <div
            key={workflow.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
            onClick={() => navigate(`/workflows/${workflow.workflowId}/executions/${workflow.id}`)}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-1.5 rounded-full ${config.bg}`}>
                <span className={config.color}>{config.icon}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {workflow.workflowId.substring(0, 8)}...
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(workflow.startedAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDuration(workflow.duration)}
              </span>
              <span
                className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}
              >
                {workflow.status}
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
};