import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  RefreshCw,
  Bot,
  Play,
  Square,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { botsService } from '../../services/bots.service';
import { dashboardService } from '../../services/dashboard.service';
import type { Bot as BotType, BotType as BotTypeEnum } from '../../types/bot';
import toast from 'react-hot-toast';

const statusIcons: Record<string, React.ReactNode> = {
  running: <Play className="w-4 h-4 text-green-500" />,
  idle: <Clock className="w-4 h-4 text-yellow-500" />,
  error: <AlertCircle className="w-4 h-4 text-red-500" />,
  offline: <XCircle className="w-4 h-4 text-gray-400" />,
  maintenance: <AlertCircle className="w-4 h-4 text-orange-500" />,
};

const statusColors: Record<string, string> = {
  running: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  idle: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  offline: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  maintenance: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

// Create Bot Dialog Component
const CreateBotDialog: React.FC<{
  onClose: () => void;
  onCreated: () => void;
}> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<BotTypeEnum>('web');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createBotMutation = useMutation({
    mutationFn: (data: { name: string; type: BotTypeEnum }) =>
      botsService.createBot({
        name: data.name,
        type: data.type,
        configuration: {
          maxConcurrentTasks: 3,
          timeoutSeconds: 300,
          retryAttempts: 3,
          screenshotOnError: true,
          headless: true,
          environmentVariables: {},
        },
      }),
    onSuccess: () => {
      onCreated();
      toast.success('Bot created successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to create bot');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createBotMutation.mutate({ name: name.trim(), type });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Create New Bot
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bot Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Invoice Processor"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bot Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as BotTypeEnum)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="web">Web Automation</option>
              <option value="desktop">Desktop Automation</option>
              <option value="api">API Integration</option>
              <option value="ai_agent">AI Agent</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createBotMutation.isPending || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
            >
              {createBotMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Create Bot
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Main BotListPage Component
export const BotListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const { data: botsData, isLoading } = useQuery({
    queryKey: ['bots', page, statusFilter, typeFilter],
    queryFn: () =>
      botsService.listBots({
        page,
        pageSize: 20,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
  });

  const startBotMutation = useMutation({
    mutationFn: (botId: string) => botsService.startBot(botId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      toast.success('Bot started');
    },
    onError: () => toast.error('Failed to start bot'),
  });

  const stopBotMutation = useMutation({
    mutationFn: (botId: string) => botsService.stopBot(botId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      toast.success('Bot stopped');
    },
    onError: () => toast.error('Failed to stop bot'),
  });

  const deleteBotMutation = useMutation({
    mutationFn: (botId: string) => botsService.deleteBot(botId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setShowDeleteConfirm(null);
      toast.success('Bot deleted');
    },
    onError: () => toast.error('Failed to delete bot'),
  });

  const handleSelectBot = (bot: BotType) => {
    navigate(`/bots/${bot.id}`);
  };

  const filteredBots =
    botsData?.data?.filter(
      (bot) =>
        !searchTerm ||
        bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bot.type.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bot Fleet</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your automation bot agents
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['bots'] })}
              className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} className="mr-2" />
              Create Bot
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Bots</p>
              <Bot className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {stats?.totalBots ?? botsData?.total ?? 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <Play className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {stats?.activeBots ?? 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">Running Workflows</p>
              <RefreshCw className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {stats?.runningExecutions ?? 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Tasks</p>
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {stats?.pendingTasks ?? 0}
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bots by name or type..."
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
            <option value="running">Running</option>
            <option value="idle">Idle</option>
            <option value="error">Error</option>
            <option value="offline">Offline</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="web">Web</option>
            <option value="desktop">Desktop</option>
            <option value="api">API</option>
            <option value="ai_agent">AI Agent</option>
          </select>
        </div>

        {/* Bot List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-6 h-24"
              />
            ))}
          </div>
        ) : filteredBots.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl">
            <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No bots found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || statusFilter || typeFilter
                ? 'Try adjusting your filters'
                : 'Create your first bot to get started'}
            </p>
            {!searchTerm && !statusFilter && !typeFilter && (
              <button
                onClick={() => setShowCreateDialog(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} className="mr-2" />
                Create Bot
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBots.map((bot) => (
              <motion.div
                key={bot.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleSelectBot(bot)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {bot.name}
                      </h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {bot.type.replace('_', ' ')}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[bot.status] || statusColors.offline}`}
                        >
                          {statusIcons[bot.status]}
                          <span className="ml-1 capitalize">{bot.status}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    {bot.status === 'idle' || bot.status === 'offline' ? (
                      <button
                        onClick={() => startBotMutation.mutate(bot.id)}
                        disabled={startBotMutation.isPending}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Start bot"
                      >
                        {startBotMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                    ) : bot.status === 'running' ? (
                      <button
                        onClick={() => stopBotMutation.mutate(bot.id)}
                        disabled={stopBotMutation.isPending}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Stop bot"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    ) : null}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(bot.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete bot"
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
        {botsData && botsData.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {botsData.data.length > 0 ? (page - 1) * 20 + 1 : 0} -{' '}
              {Math.min(page * 20, botsData.total)} of {botsData.total} bots
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: Math.min(5, botsData.totalPages) }, (_, i) => {
                const startPage = Math.max(1, page - 2);
                const pageNum = startPage + i;
                if (pageNum > botsData.totalPages) return null;
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
                onClick={() => setPage((p) => Math.min(botsData.totalPages, p + 1))}
                disabled={page === botsData.totalPages}
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
                Delete Bot
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this bot? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteBotMutation.mutate(showDeleteConfirm)}
                  disabled={deleteBotMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {deleteBotMutation.isPending ? (
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

        {/* Create Bot Dialog */}
        {showCreateDialog && (
          <CreateBotDialog
            onClose={() => setShowCreateDialog(false)}
            onCreated={() => {
              setShowCreateDialog(false);
              queryClient.invalidateQueries({ queryKey: ['bots'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            }}
          />
        )}
      </div>
    </div>
  );
};