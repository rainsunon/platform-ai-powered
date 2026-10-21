import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Download,
  Play,
  Pause,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  CheckCircle2,
} from 'lucide-react';
import { observabilityService } from '../../services/observability.service';

interface LogEntry {
  id: string;
  timestamp: string;
  event_type: string;
  data: Record<string, any>;
  workflow_execution_id?: string;
}

const levelConfig: Record<string, { icon: React.FC<any>; color: string; bg: string }> = {
  workflow_started: { icon: Play, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  workflow_completed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  node_completed: { icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  node_failed: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  task_completed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  task_failed: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  workflow_failed: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  default: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20' },
};

export const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await observabilityService.getLogs({ limit: 100 });
        if (data.logs) {
          setLogs(data.logs);
        }
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      }
    };
    fetchLogs();

    let interval: ReturnType<typeof setInterval> | null = null;
    if (isStreaming) {
      interval = setInterval(async () => {
        try {
          const data = await observabilityService.getLogs({ limit: 100 });
          if (data.logs) {
            setLogs(data.logs);
          }
        } catch (err) {
          // Keep old logs
        }
      }, 3000);
    }

    return () => { if (interval) clearInterval(interval); };
  }, [isStreaming]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevel = (eventType: string): string => {
    if (eventType.includes('failed') || eventType.includes('error')) return 'error';
    if (eventType.includes('completed') || eventType.includes('started')) return 'info';
    return 'default';
  };

  const filteredLogs = logs.filter((log) => {
    const level = getLevel(log.event_type);
    if (levelFilter !== 'all' && level !== levelFilter) return false;
    if (searchQuery) {
      const searchable = JSON.stringify(log.data).toLowerCase();
      if (!searchable.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.json`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Execution Logs
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isStreaming ? 'Live' : 'Paused'} • {filteredLogs.length} entries
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`p-2 rounded-lg transition-colors ${
                isStreaming
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
              }`}
            >
              {isStreaming ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              onClick={() => setLogs([])}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={exportLogs}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            >
              <Download size={18} />
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
              placeholder="Search logs..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-blue-500 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 text-sm"
            />
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-blue-500 rounded-lg text-gray-700 dark:text-gray-300 text-sm"
          >
            <option value="all">All Types</option>
            <option value="info">Completed</option>
            <option value="error">Failed</option>
          </select>
        </div>
      </div>

      {/* Log list */}
      <div ref={logContainerRef} className="flex-1 overflow-y-auto font-mono text-sm">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Info size={48} className="mx-auto mb-4" />
              <p className="text-lg font-medium">No logs yet</p>
              <p className="text-sm">Run a workflow or bot task to see logs</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredLogs.map((log) => {
              const level = getLevel(log.event_type);
              const config = levelConfig[log.event_type] || levelConfig[level] || levelConfig.default;
              const Icon = config.icon;

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`flex items-start px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${
                    selectedLog?.id === log.id ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className={`flex-shrink-0 mt-0.5 ${config.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${config.bg} ${config.color}`}>
                        {log.event_type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-gray-300 break-all text-xs">
                      {log.data?.node_label || log.data?.workflow_name || JSON.stringify(log.data).substring(0, 200)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedLog && (
        <div className="h-48 border-t border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Log Details</h4>
            <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
          </div>
          <pre className="text-xs text-gray-600 dark:text-gray-400">
            {JSON.stringify(selectedLog, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};