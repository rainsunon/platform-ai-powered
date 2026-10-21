import React, { useEffect, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Search, Pause, Play, Trash2, Download } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  metadata?: Record<string, any>;
}

interface LogStreamProps {
  logs: LogEntry[];
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onClear: () => void;
  onExport: () => void;
}

// FIX: Define these outside the component with proper types
const levelColors: Record<string, string> = {
  info: 'text-blue-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
  debug: 'text-purple-400',
};

const levelBgColors: Record<string, string> = {
  info: 'bg-blue-400/10',
  warn: 'bg-yellow-400/10',
  error: 'bg-red-400/10',
  debug: 'bg-purple-400/10',
};

// FIX: Add proper type for the Row component props
interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: LogEntry[];
}

const Row: React.FC<RowProps> = ({ index, style, data }) => {
  const log = data[index];
  // Now TypeScript knows the keys are valid
  const levelColor = levelColors[log.level] || 'text-gray-400';
  const levelBg = levelBgColors[log.level] || 'bg-gray-400/10';

  return (
    <div style={style} className="flex items-start px-4 py-1 hover:bg-gray-800/50">
      <span className="text-xs text-gray-500 w-20 flex-shrink-0">
        {new Date(log.timestamp).toLocaleTimeString()}
      </span>
      <span className={`text-xs px-1.5 py-0.5 rounded ${levelBg} ${levelColor} w-16 text-center flex-shrink-0`}>
        {log.level.toUpperCase()}
      </span>
      <span className="text-xs text-gray-400 w-24 flex-shrink-0 truncate">
        {log.source}
      </span>
      <span className="text-xs text-gray-300 font-mono flex-1 truncate">
        {log.message}
      </span>
    </div>
  );
};

export const LogStream: React.FC<LogStreamProps> = ({
  logs,
  isStreaming,
  onToggleStreaming,
  onClear,
  onExport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const listRef = useRef<List>(null);

  const filteredLogs = logs.filter(log => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    if (listRef.current && isStreaming && filteredLogs.length > 0) {
      listRef.current.scrollToItem(filteredLogs.length - 1, 'end');
    }
  }, [filteredLogs.length, isStreaming]);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter logs..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-gray-200 text-xs placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-gray-300 text-xs"
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">{filteredLogs.length} entries</span>
          <button
            onClick={onToggleStreaming}
            className={`p-1.5 rounded-md transition-colors ${
              isStreaming ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400 hover:text-gray-300'
            }`}
          >
            {isStreaming ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={onClear}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onExport}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Log list */}
      <div className="h-96">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            No logs to display
          </div>
        ) : (
          <List
            ref={listRef}
            height={384}
            itemCount={filteredLogs.length}
            itemSize={32}
            width="100%"
            itemData={filteredLogs}
          >
            {Row}
          </List>
        )}
      </div>
    </div>
  );
};