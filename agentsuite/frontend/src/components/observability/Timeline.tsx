import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Bot, User, AlertCircle, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'bot_action' | 'human_action' | 'system_event' | 'error' | 'decision' | 'checkpoint';
  actor: string;
  action: string;
  description: string;
  details?: Record<string, any>;
  status: 'success' | 'failure' | 'pending';
}

interface TimelineProps {
  events: TimelineEvent[];
  title?: string;
}

const eventIcons = {
  bot_action: Bot,
  human_action: User,
  system_event: Clock,
  error: AlertCircle,
  decision: CheckCircle2,
  checkpoint: CheckCircle2,
};

const eventColors = {
  bot_action: 'bg-blue-500',
  human_action: 'bg-yellow-500',
  system_event: 'bg-gray-500',
  error: 'bg-red-500',
  decision: 'bg-purple-500',
  checkpoint: 'bg-green-500',
};

export const Timeline: React.FC<TimelineProps> = ({ events, title }) => {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const toggleExpand = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No events to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      )}
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600" />

        <div className="space-y-6">
          {events.map((event, index) => {
            const Icon = eventIcons[event.type];
            const isExpanded = expandedEvents.has(event.id);

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-10"
              >
                {/* Timeline dot */}
                <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${eventColors[event.type]}`} />

                {/* Event card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.action}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        event.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        event.status === 'failure' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {event.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Actor: {event.actor}
                    </span>
                    {event.details && (
                      <button
                        onClick={() => toggleExpand(event.id)}
                        className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-500"
                      >
                        <span>{isExpanded ? 'Less details' : 'More details'}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>

                  {isExpanded && event.details && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                    >
                      <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                        {JSON.stringify(event.details, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};