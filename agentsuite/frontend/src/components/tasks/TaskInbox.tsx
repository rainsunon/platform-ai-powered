import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  Calendar,
  ArrowUpDown,
  Eye,
  CheckCheck,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '../../services/tasks.service';
import { HumanTask } from '../../types/task';
import { TaskDetail } from './TaskDetail';
import toast from 'react-hot-toast';

const priorityColors = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
};

const statusIcons = {
  pending: AlertCircle,
  claimed: User,
  completed: CheckCircle2,
  escalated: AlertTriangle,
};

export const TaskInbox: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'created' | 'deadline'>('priority');
  const [selectedTask, setSelectedTask] = useState<HumanTask | null>(null);
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['human-tasks', statusFilter, priorityFilter, sortBy],
    queryFn: () =>
      tasksService.listTasks({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        sort: sortBy,
      }),
    refetchInterval: 10000,
  });

  const claimMutation = useMutation({
    mutationFn: (taskId: string) => tasksService.claimTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['human-tasks'] });
      toast.success('Task claimed successfully');
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ taskId, resolution }: { taskId: string; resolution: any }) =>
      tasksService.resolveTask(taskId, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['human-tasks'] });
      toast.success('Task resolved successfully');
      setSelectedTask(null);
    },
  });

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task) =>
      searchQuery
        ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    );
  }, [tasks, searchQuery]);

  const getPriorityColor = (priority: string) =>
    priorityColors[priority as keyof typeof priorityColors] || priorityColors.medium;

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || AlertCircle;
    return <Icon size={16} />;
  };

  return (
    <div className="h-full flex">
      {/* Task List */}
      <div className={`flex-1 flex flex-col ${selectedTask ? 'hidden lg:flex' : ''}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Human Task Inbox
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tasks?.length || 0} tasks requiring your attention
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ['human-tasks'] })
                }
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-blue-500 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 text-sm"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-blue-500 rounded-lg text-gray-700 dark:text-gray-300 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="claimed">Claimed</option>
              <option value="completed">Completed</option>
              <option value="escalated">Escalated</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-blue-500 rounded-lg text-gray-700 dark:text-gray-300 text-sm"
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button
              onClick={() =>
                setSortBy(sortBy === 'priority' ? 'deadline' : sortBy === 'deadline' ? 'created' : 'priority')
              }
              className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <ArrowUpDown size={16} className="mr-2" />
              Sort
            </button>
          </div>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg h-24 animate-pulse" />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <CheckCheck size={48} className="mb-4" />
              <p className="text-lg font-medium">No tasks found</p>
              <p className="text-sm">All caught up! New tasks will appear here.</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${
                      selectedTask?.id === task.id ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Priority indicator */}
                      <div className="flex-shrink-0 mt-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            task.priority === 'critical' || task.priority === 'high'
                              ? 'bg-red-500 animate-pulse'
                              : 'bg-gray-400'
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {task.title}
                          </h3>
                          <span
                            className={`ml-2 inline-flex items-center px-2 py-0.5 text-xs rounded-full ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {task.description}
                        </p>

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            {getStatusIcon(task.status)}
                            <span className="ml-1 capitalize">{task.status}</span>
                          </span>
                          <span className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                          {task.deadline && (
                            <span className="flex items-center text-red-500">
                              <Clock size={14} className="mr-1" />
                              {new Date(task.deadline).toLocaleTimeString()}
                            </span>
                          )}
                          <span className="flex items-center">
                            <User size={14} className="mr-1" />
                            {task.assignedTo || 'Unassigned'}
                          </span>
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div className="flex-shrink-0 flex items-center space-x-1">
                        {task.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              claimMutation.mutate(task.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600"
                            title="Claim task"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Task Detail Panel */}
      {selectedTask && (
        <div className="w-full lg:w-1/2 xl:w-2/5 border-l border-gray-200 dark:border-gray-700">
          <TaskDetail
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onResolve={(resolution) =>
              resolveMutation.mutate({
                taskId: selectedTask.id,
                resolution,
              })
            }
          />
        </div>
      )}
    </div>
  );
};