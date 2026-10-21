import React from 'react';
import { motion } from 'framer-motion';
import { Clock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { HumanTask } from '../../types/task';

interface TaskCardProps {
  task: HumanTask;
  onClick: (task: HumanTask) => void;
  onClaim: (taskId: string) => void;
}

const priorityColors = {
  critical: 'border-l-red-500 bg-red-50/50 dark:bg-red-900/5',
  high: 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/5',
  medium: 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/5',
  low: 'border-l-green-500 bg-green-50/50 dark:bg-green-900/5',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onClaim }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={`border-l-4 rounded-r-lg p-4 cursor-pointer transition-shadow hover:shadow-md ${
        priorityColors[task.priority]
      }`}
      onClick={() => onClick(task)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {task.title}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {task.workflowName} • {task.nodeId}
          </p>
        </div>
        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          task.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
          task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        }`}>
          {task.priority}
        </span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
        {task.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          <span className="flex items-center">
            <Clock size={12} className="mr-1" />
            {new Date(task.createdAt).toLocaleDateString()}
          </span>
          {task.assignedTo && (
            <span className="flex items-center">
              <User size={12} className="mr-1" />
              {task.assignedTo}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {task.status === 'pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClaim(task.id);
              }}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
            >
              Claim
            </button>
          )}
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {task.deadline && (
        <div className="mt-2 flex items-center text-xs text-red-500">
          <AlertCircle size={12} className="mr-1" />
          Due: {new Date(task.deadline).toLocaleString()}
        </div>
      )}
    </motion.div>
  );
};