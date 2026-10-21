import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Play,
  Pause,
  RefreshCw,
  Settings,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Zap,
  Globe,
  Mail,
  Bot,
  Terminal,
  FileText,
  Loader2,
  Send,
  Image,
  History,
  Eye,
  ChevronDown,
  ChevronUp,
  Copy,
} from 'lucide-react';
import { botsService, BotTaskResponse } from '../../services/bots.service';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { BotStatusBadge } from '../../components/bots/BotStatusBadge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { apiClient } from '../../lib/axios';
import toast from 'react-hot-toast';

const Monitor: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

const capabilityIcons: Record<string, React.FC<{ className?: string }>> = {
  web_scraping: Globe, browser_automation: Globe, form_filling: FileText,
  screenshot: Image, rest_api: Terminal, graphql: Terminal, webhook: Send,
  send_email: Mail, read_email: Mail, text_analysis: Bot,
  document_processing: FileText, classification: Bot, summarization: Bot,
  desktop_automation: Monitor,
};

const taskTypes = [
  { value: 'web_scrape', label: 'Web Scrape', icon: Globe, description: 'Extract data from a website' },
  { value: 'api_call', label: 'API Call', icon: Terminal, description: 'Make an HTTP API request' },
  { value: 'send_email', label: 'Send Email', icon: Mail, description: 'Send an email message' },
  { value: 'ai_task', label: 'AI Task', icon: Bot, description: 'Run an AI analysis' },
  { value: 'process_file', label: 'Process File', icon: FileText, description: 'Process a file' },
  { value: 'screenshot', label: 'Take Screenshot', icon: Image, description: 'Capture a webpage screenshot' },
];

const formatDuration = (ms: number): string => {
  if (!ms) return '0ms';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

interface TaskHistoryItem {
  id: string;
  task_type: string;
  parameters: Record<string, any>;
  status: string;
  result?: Record<string, any>;
  error?: string;
  execution_time_ms: number;
  created_at: string;
}

export const BotDetailPage: React.FC = () => {
  const { botId } = useParams<{ botId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'capabilities' | 'tasks' | 'history' | 'metrics' | 'config'>('overview');
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState('ai_task');
  const [taskParams, setTaskParams] = useState<Record<string, string>>({});
  const [lastResult, setLastResult] = useState<BotTaskResponse | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const { data: bot, isLoading } = useQuery({
    queryKey: ['bot', botId],
    queryFn: () => botsService.getBot(botId!),
    enabled: !!botId,
  });

  // Fetch task history
  const { data: taskHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['bot-task-history', botId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/bots/${botId}/tasks/history`);
      return data as TaskHistoryItem[];
    },
    enabled: !!botId && activeTab === 'history',
  });

  const executeTaskMutation = useMutation({
    mutationFn: (data: { task_type: string; parameters: Record<string, any> }) =>
      apiClient.post(`/bots/${botId}/execute`, data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['bot', botId] });
      queryClient.invalidateQueries({ queryKey: ['bot-task-history', botId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setLastResult(response.data);
      toast.success(`Task completed in ${response.data?.execution_time_ms || 0}ms`);
      setShowTaskPanel(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Task execution failed');
    },
  });

  const handleExecuteTask = () => {
    setLastResult(null);
    executeTaskMutation.mutate({
      task_type: selectedTaskType,
      parameters: taskParams,
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedResults(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyResult = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (isLoading) return <LoadingSkeleton type="page" />;

  if (!bot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bot Not Found</h2>
          <button onClick={() => navigate('/bots')} className="text-blue-600 hover:text-blue-500">Go back to bot list</button>
        </div>
      </div>
    );
  }

  const completedTasks = bot.metrics?.tasksCompleted || 0;
  const failedTasks = bot.metrics?.tasksFailed || 0;
  const avgDuration = bot.metrics?.averageExecutionTimeMs || 0;
  const successRate = bot.metrics?.successRate || 100;

  const chartData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    tasks: Math.max(0, completedTasks - Math.floor(Math.random() * 10)),
    errors: Math.max(0, failedTasks - Math.floor(Math.random() * 3)),
    duration: Math.floor((avgDuration || 1000) * (0.5 + Math.random())),
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => navigate('/bots')} className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4">
            <ArrowLeft size={18} className="mr-2" /> Back to Bots
          </button>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{bot.name}</h1>
                <div className="flex items-center space-x-3 mt-2">
                  <BotStatusBadge status={bot.status} />
                  <span className="text-sm text-gray-500 capitalize">{bot.type.replace('_', ' ')}</span>
                  <span className="text-sm text-gray-500">ID: {bot.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {bot.status === 'running' ? (
                <button onClick={() => botsService.stopBot(bot.id).then(() => queryClient.invalidateQueries({ queryKey: ['bot', botId] }))}
                  className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                  <Pause size={18} className="mr-2" /> Stop
                </button>
              ) : (
                <button onClick={() => botsService.startBot(bot.id).then(() => queryClient.invalidateQueries({ queryKey: ['bot', botId] }))}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Play size={18} className="mr-2" /> Start
                </button>
              )}
              <button onClick={() => botsService.restartBot(bot.id).then(() => queryClient.invalidateQueries({ queryKey: ['bot', botId] }))}
                className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                <RefreshCw size={18} />
              </button>
              {bot.status === 'running' && (
                <button onClick={() => { setShowTaskPanel(!showTaskPanel); setLastResult(null); }}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  <Zap size={18} className="mr-2" /> Execute Task
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-lg p-1 mb-6 shadow-sm overflow-x-auto">
          {[
            { id: 'overview' as const, label: 'Overview', icon: Activity },
            { id: 'capabilities' as const, label: 'Capabilities', icon: Zap },
            { id: 'tasks' as const, label: 'Run Task', icon: Play },
            { id: 'history' as const, label: 'History', icon: History },
            { id: 'metrics' as const, label: 'Metrics', icon: BarChart3 },
            { id: 'config' as const, label: 'Config', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}>
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Last Result Display */}
        {lastResult && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`mb-6 rounded-xl p-6 shadow-sm border-2 ${
              lastResult.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' :
              'bg-red-50 dark:bg-red-900/20 border-red-500'
            }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {lastResult.status === 'completed' ? <CheckCircle2 className="text-green-600" size={20} /> : <XCircle className="text-red-600" size={20} />}
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Task {lastResult.status === 'completed' ? 'Completed' : 'Failed'}
                </h3>
              </div>
              <span className="text-sm text-gray-500">{formatDuration(lastResult.execution_time_ms)}</span>
            </div>
            {lastResult.result && (
              <div className="relative">
                <pre className="text-sm bg-white dark:bg-gray-800 rounded-lg p-4 overflow-x-auto max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700">
                  {JSON.stringify(lastResult.result, null, 2)}
                </pre>
                <button onClick={() => copyResult(JSON.stringify(lastResult.result, null, 2))}
                  className="absolute top-2 right-2 p-1.5 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                  <Copy size={14} />
                </button>
              </div>
            )}
            {lastResult.error && (
              <p className="text-sm text-red-600 mt-2">{lastResult.error}</p>
            )}
          </motion.div>
        )}

        {/* Task Execution Panel */}
        {showTaskPanel && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Execute Task on {bot.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {taskTypes.map((task) => {
                const Icon = task.icon;
                return (
                  <button key={task.value} onClick={() => { setSelectedTaskType(task.value); setTaskParams({}); }}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedTaskType === task.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
                    }`}>
                    <Icon className="w-6 h-6 text-blue-500 mb-2" />
                    <p className="font-medium text-gray-900 dark:text-white">{task.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                  </button>
                );
              })}
            </div>
            <div className="space-y-3 mb-4">
              {selectedTaskType === 'web_scrape' && (
                <>
                  <input type="text" placeholder="URL to scrape" value={taskParams.url || ''} onChange={(e) => setTaskParams({ ...taskParams, url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  <input type="text" placeholder="CSS Selector" value={taskParams.selector || ''} onChange={(e) => setTaskParams({ ...taskParams, selector: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </>
              )}
              {selectedTaskType === 'api_call' && (
                <>
                  <input type="text" placeholder="API URL" value={taskParams.url || ''} onChange={(e) => setTaskParams({ ...taskParams, url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  <select value={taskParams.method || 'GET'} onChange={(e) => setTaskParams({ ...taskParams, method: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="GET">GET</option><option value="POST">POST</option><option value="PUT">PUT</option><option value="DELETE">DELETE</option>
                  </select>
                </>
              )}
              {selectedTaskType === 'send_email' && (
                <>
                  <input type="email" placeholder="Recipient email" value={taskParams.to || ''} onChange={(e) => setTaskParams({ ...taskParams, to: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  <input type="text" placeholder="Subject" value={taskParams.subject || ''} onChange={(e) => setTaskParams({ ...taskParams, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  <textarea placeholder="Email body" value={taskParams.body || ''} onChange={(e) => setTaskParams({ ...taskParams, body: e.target.value })} rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </>
              )}
              {selectedTaskType === 'ai_task' && (
                <>
                  <textarea placeholder="Prompt for AI..." value={taskParams.prompt || ''} onChange={(e) => setTaskParams({ ...taskParams, prompt: e.target.value })} rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  <select value={taskParams.task || 'analyze'} onChange={(e) => setTaskParams({ ...taskParams, task: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="analyze">Analyze</option><option value="summarize">Summarize</option>
                    <option value="classify">Classify</option><option value="extract">Extract</option>
                  </select>
                </>
              )}
            </div>
            <button onClick={handleExecuteTask} disabled={executeTaskMutation.isPending}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center font-medium">
              {executeTaskMutation.isPending ? <><Loader2 className="animate-spin mr-2" size={18} /> Executing...</> : <><Zap className="mr-2" size={18} /> Execute Task</>}
            </button>
          </motion.div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Tasks Completed', value: completedTasks, icon: CheckCircle2, color: 'text-green-500' },
                { label: 'Tasks Failed', value: failedTasks, icon: XCircle, color: 'text-red-500' },
                { label: 'Avg Duration', value: formatDuration(avgDuration), icon: Clock, color: 'text-blue-500' },
                { label: 'Success Rate', value: `${successRate}%`, icon: Activity, color: 'text-purple-500' },
              ].map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <motion.div key={metric.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</p>
                      <Icon className={`w-5 h-5 ${metric.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                  </motion.div>
                );
              })}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" stroke="#9ca3af" /><YAxis stroke="#9ca3af" /><Tooltip />
                  <Area type="monotone" dataKey="tasks" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="errors" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task History</h3>
              <p className="text-sm text-gray-500 mt-1">All tasks executed by this bot</p>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {historyLoading ? (
                <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
              ) : !taskHistory || taskHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tasks executed yet</p>
                  <p className="text-sm">Run a task to see results here</p>
                </div>
              ) : (
                taskHistory.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(item.id)}>
                      <div className="flex items-center space-x-3">
                        {item.status === 'completed' ? <CheckCircle2 className="text-green-500" size={18} /> : <XCircle className="text-red-500" size={18} />}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{item.task_type.replace('_', ' ')}</p>
                          <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-xs text-gray-500">{formatDuration(item.execution_time_ms)}</span>
                        {expandedResults.has(item.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedResults.has(item.id) && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="mt-3 ml-9 overflow-hidden">
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-500 mb-2">Parameters:</p>
                            <pre className="text-xs text-gray-700 dark:text-gray-300 mb-2">{JSON.stringify(item.parameters, null, 2)}</pre>
                            {item.result && (
                              <>
                                <p className="text-xs font-medium text-gray-500 mb-2">Result:</p>
                                <div className="relative">
                                  <pre className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded p-2 max-h-40 overflow-y-auto">{JSON.stringify(item.result, null, 2)}</pre>
                                  <button onClick={() => copyResult(JSON.stringify(item.result, null, 2))}
                                    className="absolute top-1 right-1 p-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300">
                                    <Copy size={12} />
                                  </button>
                                </div>
                              </>
                            )}
                            {item.error && <p className="text-xs text-red-500 mt-2">Error: {item.error}</p>}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'capabilities' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bot Capabilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(bot.capabilities || []).map((cap: any, i: number) => {
                const Icon = capabilityIcons[cap.name] || Zap;
                return (
                  <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <Icon className="w-8 h-8 text-blue-500 mb-2" />
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{cap.name.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-500 mt-1">{cap.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Run a Task</h3>
            <p className="text-gray-500 mb-4">Start the bot and execute tasks. Results appear below and in the History tab.</p>
            <button onClick={() => {
              if (bot.status !== 'running') {
                botsService.startBot(bot.id).then(() => {
                  queryClient.invalidateQueries({ queryKey: ['bot', botId] });
                  setShowTaskPanel(true);
                });
              } else {
                setShowTaskPanel(true);
              }
            }} className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center">
              <Zap className="mr-2" size={18} />
              {bot.status !== 'running' ? 'Start Bot & Execute Task' : 'Execute Task'}
            </button>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#9ca3af" /><YAxis stroke="#9ca3af" /><Tooltip />
                <Line type="monotone" dataKey="duration" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bot Configuration</h3>
            <pre className="text-sm text-gray-600 dark:text-gray-400 overflow-x-auto bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              {JSON.stringify(bot.configuration, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};