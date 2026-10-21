import { useEffect, useRef, useCallback, useState } from 'react';

// Use hardcoded values instead of importing from a potentially missing file
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

const WEBSOCKET_EVENTS = {
  BOT_STATUS_CHANGE: 'bot.status.change',
  WORKFLOW_EXECUTION_UPDATE: 'workflow.execution.update',
  NEW_HUMAN_TASK: 'human.task.new',
  LOG_ENTRY: 'log.entry',
  METRICS_UPDATE: 'metrics.update',
} as const;

import { useAuthStore } from '../stores/auth.store';

type MessageHandler = (data: unknown) => void;

interface WebSocketOptions {
  onMessage?: MessageHandler;
  onError?: (error: Event) => void;
  onClose?: () => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export function useWebSocket(
  channel: string,
  options: WebSocketOptions = {}
) {
  const wsRef = useRef<WebSocket | null>(null);
  // FIX: Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<unknown>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  const {
    onMessage,
    onError,
    onClose,
    autoReconnect = true,
    reconnectInterval = 5000,
  } = options;

  const connect = useCallback(() => {
    if (!accessToken) return;

    try {
      const ws = new WebSocket(`${WS_BASE_URL}/ws/${channel}?token=${accessToken}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log(`WebSocket connected to ${channel}`);
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as unknown;
          setLastMessage(data);
          onMessage?.(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log(`WebSocket disconnected from ${channel}`);
        onClose?.();

        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [accessToken, channel, onMessage, onError, onClose, autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
  }, []);

  const sendMessage = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    disconnect,
    reconnect: connect,
  };
}