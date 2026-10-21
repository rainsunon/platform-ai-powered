import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  RefreshCw,
  Workflow,
  Play,
  Pause,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  GitBranch,
} from 'lucide-react';
import { workflowsService } from '../../services/workflows.service';
import type { Workflow as WorkflowType } from '../../types/workflow';
import toast from 'react-hot-toast';

const statusIcons: Record<string, React.ReactNode> = {
  active: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  draft: <Clock className="w-4 h-4 text-yellow-500" />,
  paused: <Pause className="w-4 h-4 text-orange-500" />,
  error: <AlertCircle className="w-4 h-4 text-red-500" />,
  archived: <MoreHorizontal className="w-4 h-4 text-gray-400" />,
};

const statusColors: Record<string, string> = {
  active: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  draft: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  paused: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  error: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

// Create Workflow Dialog
const CreateWorkflowDialog: React.FC<{
  onClose: () => void;
  onCreated: () => void;
}> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      workflowsService.createWorkflow(data),
    onSuccess: () => {
      onCreated();
      toast.success('Workflow created!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to create workflow');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), description: description.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Create New Workflow
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Workflow Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Invoice Processing"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe what this workflow does..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Create
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Main WorkflowsPage Component
export const WorkflowsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const { data: workflowsData, isLoading } = useQuery({
    queryKey: ['workflows', page, statusFilter],
    queryFn: () =>
      workflowsService.listWorkflows({
        page,
        pageSize: 20,
        status: statusFilter || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (workflowId: string) => workflowsService.deleteWorkflow(workflowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setShowDeleteConfirm(null);
      toast.success('Workflow deleted');
    },
    onError: () => toast.error('Failed to delete workflow'),
  });

  const startMutation = useMutation({
    mutationFn: (workflowId: string) => workflowsService.startWorkflow(workflowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow started');
    },
    onError: () => toast.error('Failed to start workflow'),
  });

  const filteredWorkflows =
    workflowsData?.data?.filter(
      (wf) =>
        !searchTerm ||
        wf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (wf.description && wf.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Workflows</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your automation workflows
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['workflows'] })}
              className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() => navigate('/ide')}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <GitBranch size={18} className="mr-2" />
              Visual IDE
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} className="mr-2" />
              New Workflow
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Workflows</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {workflowsData?.total ?? 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {workflowsData?.data?.filter((w) => w.status === 'active').length ?? 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400">Drafts</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {workflowsData?.data?.filter((w) => w.status === 'draft').length ?? 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400">Errors</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {workflowsData?.data?.filter((w) => w.status === 'error').length ?? 0}
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="error">Error</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Workflow List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-6 h-24" />
            ))}
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl">
            <Workflow className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No workflows found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || statusFilter
                ? 'Try adjusting your filters'
                : 'Create your first workflow to get started'}
            </p>
            {!searchTerm && !statusFilter && (
              <button
                onClick={() => setShowCreateDialog(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} className="mr-2" />
                Create Workflow
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWorkflows.map((workflow) => (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate(`/ide/${workflow.id}`)}
                >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <Workflow className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {workflow.name}
                        </h3>
                        <div className="flex items-center space-x-3 mt-1">
                        {workflow.description && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                            {workflow.description.length > 80
                                ? workflow.description.substring(0, 80) + '...'
                                : workflow.description}
                            </span>
                        )}
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            statusColors[workflow.status] || statusColors.draft
                            }`}
                        >
                            {statusIcons[workflow.status]}
                            <span className="ml-1">{workflow.status}</span>
                        </span>
                        </div>
                    </div>
                    </div>

                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-gray-400 mr-2">v{workflow.version}</span>
                    
                    {/* Run button */}
                    <button
                        onClick={() => startMutation.mutate(workflow.id)}
                        disabled={startMutation.isPending}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Run workflow"
                    >
                        {startMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                        <Play className="w-4 h-4" />
                        )}
                    </button>
                    
                    {/* Edit in IDE button */}
                    <button
                        onClick={() => navigate(`/ide/${workflow.id}`)}
                        className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        title="Edit in Circuit IDE"
                    >
                        <GitBranch className="w-4 h-4" />
                    </button>
                    
                    {/* Delete button */}
                    <button
                        onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(workflow.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete workflow"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    </div>
                </div>
                </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {workflowsData && workflowsData.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {workflowsData.data.length > 0 ? (page - 1) * 20 + 1 : 0} -{' '}
              {Math.min(page * 20, workflowsData.total)} of {workflowsData.total} workflows
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: Math.min(5, workflowsData.totalPages) }, (_, i) => {
                const startPage = Math.max(1, page - 2);
                const pageNum = startPage + i;
                if (pageNum > workflowsData.totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium ${
                      page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(workflowsData.totalPages, p + 1))}
                disabled={page === workflowsData.totalPages}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete Workflow
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this workflow? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(showDeleteConfirm)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Create Dialog */}
        {showCreateDialog && (
          <CreateWorkflowDialog
            onClose={() => setShowCreateDialog(false)}
            onCreated={() => {
              setShowCreateDialog(false);
              queryClient.invalidateQueries({ queryKey: ['workflows'] });
            }}
          />
        )}
      </div>
    </div>
  );
};