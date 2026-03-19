/**
 * Shared Realtime Hooks
 * 
 * React hooks for subscribing to realtime data via WebSocket.
 * These hooks are designed to be used across the entire application.
 */

import { useCallback, useEffect, useState, useSyncExternalStore, useMemo, useRef } from 'react';
import { WebSocketManager, buildWebSocketUrl } from './WebSocketManager';
import type { RealtimeMessage } from './WebSocketManager';

// ============================================================================
// Core Hooks
// ============================================================================

interface UseRealtimeOptions {
  /** WebSocket endpoint path (e.g., '/ws/ecom/realtime') */
  path: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Maximum reconnection attempts */
  reconnectAttempts?: number;
  /** Interval between reconnection attempts in ms */
  reconnectInterval?: number;
}

/**
 * Low-level hook for WebSocket connection management
 * Returns connection state and methods to interact with the WebSocket
 */
export function useRealtimeConnection(options: UseRealtimeOptions) {
  const { path, debug = false, reconnectAttempts = 5, reconnectInterval = 3000 } = options;
  
  // Use useMemo for stable manager instance - WebSocketManager.getInstance is idempotent
  const manager = useMemo(() => {
    const url = buildWebSocketUrl(path);
    return WebSocketManager.getInstance({
      url,
      debug,
      reconnectAttempts,
      reconnectInterval,
    });
  }, [path, debug, reconnectAttempts, reconnectInterval]);

  // Use useSyncExternalStore for tear-free connection state
  const isConnected = useSyncExternalStore(
    (callback) => manager.subscribeToConnection(callback),
    () => manager.getConnectionState(),
    () => false // Server snapshot
  );

  const send = useCallback((message: object) => {
    manager.send(message);
  }, [manager]);

  const reconnect = useCallback(() => {
    manager.reconnect();
  }, [manager]);

  return { isConnected, send, reconnect, manager };
}

/**
 * Hook for subscribing to a specific realtime channel
 * Automatically handles subscription/unsubscription lifecycle
 */
export function useRealtimeChannel<T = unknown>(
  options: UseRealtimeOptions & { channel: string }
) {
  const { channel, ...connectionOptions } = options;
  const { isConnected, send, reconnect, manager } = useRealtimeConnection(connectionOptions);
  const [lastMessage, setLastMessage] = useState<RealtimeMessage<T> | null>(null);

  useEffect(() => {
    return manager.subscribeToChannel<T>(channel, (message) => {
      setLastMessage(message);
    });
  }, [manager, channel]);

  return { isConnected, lastMessage, send, reconnect };
}

/**
 * Hook for subscribing to all messages from a WebSocket endpoint
 */
export function useRealtimeMessages<T = unknown>(options: UseRealtimeOptions) {
  const { isConnected, send, reconnect, manager } = useRealtimeConnection(options);
  const [lastMessage, setLastMessage] = useState<RealtimeMessage<T> | null>(null);

  useEffect(() => {
    return manager.subscribe((message) => {
      setLastMessage(message as RealtimeMessage<T>);
    });
  }, [manager]);

  return { isConnected, lastMessage, send, reconnect };
}

// ============================================================================
// Higher-Level Hooks for Common Patterns
// ============================================================================

interface UseRealtimeCounterOptions extends UseRealtimeOptions {
  channel: string;
  /** Field in the message data that contains the count */
  countField?: string;
}

interface CounterState {
  count: number | null;
  previousCount: number | null;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Hook for realtime counter values (e.g., live visitors, active users)
 * Automatically tracks count, previous count, and trend
 */
export function useRealtimeCounter(options: UseRealtimeCounterOptions) {
  const { countField = 'count', ...channelOptions } = options;
  const { isConnected, lastMessage, reconnect } = useRealtimeChannel<Record<string, unknown>>(channelOptions);
  
  // Use single state object to batch updates and avoid cascading renders
  const [state, setState] = useState<CounterState>({
    count: null,
    previousCount: null,
    trend: 'stable',
  });

  // This effect responds to external WebSocket messages - setState is appropriate here
  // as we're synchronizing React state with an external subscription (a core useEffect use case)
  useEffect(() => {
    if (!lastMessage?.data) return;
    
    const newCount = lastMessage.data[countField];
    if (typeof newCount !== 'number') return;

    // Single setState call with all derived values
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: sync React state with external WebSocket/realtime data source
    setState((prev) => {
      if (prev.count === newCount) return prev;
      
      const newTrend = prev.count !== null
        ? (newCount > prev.count ? 'up' : newCount < prev.count ? 'down' : 'stable')
        : 'stable';
      
      return {
        count: newCount,
        previousCount: prev.count,
        trend: newTrend,
      };
    });
  }, [lastMessage, countField]);

  // Reset trend after animation
  useEffect(() => {
    if (state.trend !== 'stable') {
      const timeout = setTimeout(() => {
        setState((prev) => ({ ...prev, trend: 'stable' }));
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [state.trend]);

  return {
    count: state.count,
    previousCount: state.previousCount,
    trend: state.trend,
    isConnected,
    refetch: reconnect,
  };
}

interface UseRealtimeListOptions<T> extends UseRealtimeOptions {
  channel: string;
  /** Maximum items to keep in the list */
  maxItems?: number;
  /** Function to extract the item from the message */
  extractItem?: (message: RealtimeMessage) => T | null;
  /** Function to get a unique ID from an item */
  getItemId?: (item: T) => string;
}

/**
 * Hook for realtime lists (e.g., live orders, notifications)
 * Automatically manages list with new item highlighting
 */
export function useRealtimeList<T>(options: UseRealtimeListOptions<T>) {
  const { 
    maxItems = 20, 
    extractItem = (msg) => msg.data as T,
    getItemId = (item) => (item as { id?: string }).id ?? String(Math.random()),
    ...channelOptions 
  } = options;
  
  const { isConnected, lastMessage, reconnect } = useRealtimeChannel(channelOptions);
  
  const [items, setItems] = useState<T[]>([]);
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());
  
  // Ref to track the highlight timeout for proper cleanup
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!lastMessage) return;
    
    const newItem = extractItem(lastMessage);
    if (!newItem) return;

    const itemId = getItemId(newItem);

    setItems((prev) => {
      // Check if item already exists to prevent duplicates
      const exists = prev.some((item) => getItemId(item) === itemId);
      if (exists) return prev;
      
      const updated = [newItem, ...prev].slice(0, maxItems);
      return updated;
    });

    // Highlight new item
    setNewItemIds((prev) => {
      if (prev.has(itemId)) return prev;
      return new Set([itemId]);
    });
    
    // Clear any existing timeout before setting a new one
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => setNewItemIds(new Set()), 2000);
    
    // Cleanup on unmount or when effect re-runs
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [lastMessage, maxItems, extractItem, getItemId]);

  return {
    items,
    newItemIds,
    isConnected,
    refetch: reconnect,
  };
}

// ============================================================================
// Realtime Mode Configuration
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RealtimeMode = 'polling' | 'websocket';

interface RealtimeModeState {
  mode: RealtimeMode;
  setMode: (mode: RealtimeMode) => void;
}

/**
 * Global realtime mode configuration
 * Allows switching between polling and WebSocket modes
 */
export const useRealtimeMode = create<RealtimeModeState>()(
  persist(
    (set) => ({
      mode: 'websocket', // Default to WebSocket
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'realtime-mode-config',
    }
  )
);

/**
 * Hook that provides data based on the current realtime mode
 * Automatically switches between polling and WebSocket implementations
 */
export function useRealtimeWithFallback<TPolling, TWebSocket>(
  pollingHook: () => TPolling,
  websocketHook: () => TWebSocket,
  options?: { forceMode?: RealtimeMode }
): (TPolling | TWebSocket) & { mode: RealtimeMode } {
  const { mode: globalMode } = useRealtimeMode();
  const mode = options?.forceMode ?? globalMode;
  
  // Always call both hooks to maintain React hook rules
  const pollingResult = pollingHook();
  const websocketResult = websocketHook();
  
  if (mode === 'websocket') {
    return { ...websocketResult, mode: 'websocket' };
  }
  
  return { ...pollingResult, mode: 'polling' };
}
