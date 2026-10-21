import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecentWorkflow {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  duration: number;
  botName: string;
}

interface RecentWorkflowsProps {
  workflows: RecentWorkflow[];
}

const statusConfig = {
  running: {
    icon: Activity,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    label: 'Running',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
    label: 'Completed',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    label: 'Failed',
  },
};

export const RecentWorkflows: React.FC<RecentWorkflowsProps> = ({ workflows }) => {
  const navigate = useNavigate();

  if (workflows.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No recent workflows</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workflows.map((workflow, index) => {
        const status = statusConfig[workflow.status];
        const StatusIcon = status.icon;

        return (
          <motion.div
            key={workflow.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            onClick={() => navigate(`/workflows/${workflow.id}`)}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-lg ${status.bg} flex items-center justify-center`}>
                <StatusIcon className={`w-5 h-5 ${status.color}`} />
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {workflow.name}
                </h4>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs text-gray-500 flex items-center">
                    <Clock size={12} className="mr-1" />
                    {new Date(workflow.startedAt).toLocaleTimeString()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {workflow.duration}s
                  </span>
                  <span className="text-xs text-gray-500">
                    {workflow.botName}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                {status.label}
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};