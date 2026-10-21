import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Clock,
  User,
  Calendar,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  XCircle,
  MessageSquare,
  Paperclip,
  Eye,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
} from 'lucide-react';
import { HumanTask, TaskOption } from '../../types/task';

interface TaskDetailProps {
  task: HumanTask;
  onClose: () => void;
  onResolve: (resolution: any) => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ task, onClose, onResolve }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [showingScreenshot, setShowingScreenshot] = useState(false);

  const handleResolve = () => {
    if (!selectedOption && !comment) return;
    
    onResolve({
      optionId: selectedOption,
      comment,
      timestamp: new Date().toISOString(),
    });
  };

  const handleEscalate = () => {
    onResolve({
      action: 'escalate',
      comment,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className="h-full flex flex-col bg-white dark:bg-gray-800"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task Details</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Task info */}
        <div className="p-4 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {task.title}
            </h2>
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <span className="flex items-center">
                <Clock size={14} className="mr-1" />
                {new Date(task.createdAt).toLocaleString()}
              </span>
              <span className="flex items-center">
                <User size={14} className="mr-1" />
                {task.assignedTo || 'Unassigned'}
              </span>
              {task.deadline && (
                <span className="flex items-center text-red-500">
                  <AlertCircle size={14} className="mr-1" />
                  Due {new Date(task.deadline).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Priority badge */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            task.priority === 'critical' ? 'bg-red-100 text-red-800' :
            task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {task.priority.toUpperCase()} Priority
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </h4>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>

          {/* Context */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Process Context
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-2">
              <div className="text-sm">
                <span className="text-gray-500">Workflow:</span>{' '}
                <span className="text-gray-900 dark:text-white font-medium">
                  {task.workflowName}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Execution ID:</span>{' '}
                <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                  {task.workflowExecutionId}
                </code>
              </div>
            </div>
          </div>

          {/* Bot Actions History */}
          {task.context.botActions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bot Action History
              </h4>
              <div className="space-y-2">
                {task.context.botActions.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 bg-gray-50 dark:bg-gray-900 rounded-lg p-3"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`w-2 h-2 rounded-full ${
                        action.confidence > 0.8 ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {action.action}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(action.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Target: {action.target}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Result: {action.result}
                      </p>
                      <div className="flex items-center mt-1">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                          <div
                            className="h-1.5 bg-blue-500 rounded-full"
                            style={{ width: `${action.confidence * 100}%` }}
                          />
                        </div>
                        <span className="ml-2 text-xs text-gray-500">
                          {Math.round(action.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Screenshots */}
          {task.context.screenshots.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Screenshots
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {task.context.screenshots.map((screenshot, index) => (
                  <button
                    key={index}
                    onClick={() => setShowingScreenshot(!showingScreenshot)}
                    className="relative aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden group"
                  >
                    <img
                      src={screenshot}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ExternalLink className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Suggestions */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            AI-Suggested Actions
          </h4>
          <div className="space-y-3">
            {task.options.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  selectedOption === option.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-xs">
                      <ThumbsUp size={14} className="mr-1 text-green-500" />
                      {Math.round(option.confidence * 100)}%
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      option.impact === 'high' ? 'bg-red-100 text-red-800' :
                      option.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {option.impact} impact
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {option.description}
                </p>
                <p className="text-xs text-gray-500 italic">
                  Reasoning: {option.reasoning}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Add Comment
          </h4>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add your reasoning or notes..."
            rows={3}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex space-x-3">
          <button
            onClick={handleResolve}
            disabled={!selectedOption && !comment}
            className="flex-1 flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle size={18} className="mr-2" />
            Resolve Task
          </button>
          <button
            onClick={handleEscalate}
            className="flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            <RotateCcw size={18} className="mr-2" />
            Escalate
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <XCircle size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};