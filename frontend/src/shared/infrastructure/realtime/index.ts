/**
 * Shared Realtime Infrastructure
 * 
 * This module provides WebSocket-based realtime functionality that can be used
 * across the entire application. It includes:
 * 
 * - WebSocketManager: Singleton manager for WebSocket connections
 * - useRealtimeConnection: Low-level hook for connection management
 * - useRealtimeChannel: Hook for subscribing to specific channels
 * - useRealtimeCounter: Hook for realtime counter values (e.g., live visitors)
 * - useRealtimeList: Hook for realtime lists (e.g., live orders)
 * - useRealtimeMode: Global mode configuration (polling vs WebSocket)
 * 
 * @example
 * // Subscribe to a realtime counter
 * const { count, trend, isConnected } = useRealtimeCounter({
 *   path: '/ws/dashboard/realtime',
 *   channel: 'visitors',
 * });
 * 
 * @example
 * // Subscribe to a realtime list
 * const { items, newItemIds, isConnected } = useRealtimeList<Order>({
 *   path: '/ws/ecom/realtime',
 *   channel: 'orders',
 *   maxItems: 20,
 * });
 */

export { WebSocketManager, buildWebSocketUrl } from './WebSocketManager';
export type { RealtimeMessage } from './WebSocketManager';

export {
  useRealtimeConnection,
  useRealtimeChannel,
  useRealtimeMessages,
  useRealtimeCounter,
  useRealtimeList,
  useRealtimeMode,
  useRealtimeWithFallback,
} from './useRealtime';
export type { RealtimeMode } from './useRealtime';
