/**
 * Shared WebSocket Manager
 * 
 * A singleton manager for WebSocket connections that can be used across the entire application.
 * Supports multiple channels/topics with automatic reconnection and React Strict Mode compatibility.
 * 
 * Usage:
 * 1. Create a channel configuration for your module
 * 2. Use the useRealtimeChannel hook to subscribe to messages
 * 3. Messages are automatically routed to the correct subscribers
 */

export type RealtimeMessage<T = unknown> = {
  type: string;
  channel?: string;
  data: T;
  timestamp?: string;
};

type MessageListener<T = unknown> = (message: RealtimeMessage<T>) => void;
type ConnectionListener = (connected: boolean) => void;
type ErrorListener = (error: Event) => void;

interface WebSocketManagerConfig {
  url: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  debug?: boolean;
}

/**
 * Centralized WebSocket connection manager
 * Handles connection lifecycle, reconnection, and message routing
 */
export class WebSocketManager {
  private static instances = new Map<string, WebSocketManager>();
  
  private ws: WebSocket | null = null;
  private config: Required<WebSocketManagerConfig>;
  private subscribers = new Set<MessageListener>();
  private channelSubscribers = new Map<string, Set<MessageListener>>();
  private connectionListeners = new Set<ConnectionListener>();
  private errorListeners = new Set<ErrorListener>();
  private reconnectCount = 0;
  private isConnected = false;
  private isConnecting = false;
  private cleanupScheduled = false;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  private constructor(config: WebSocketManagerConfig) {
    this.config = {
      url: config.url,
      reconnectAttempts: config.reconnectAttempts ?? 5,
      reconnectInterval: config.reconnectInterval ?? 3000,
      debug: config.debug ?? false,
    };
  }

  /**
   * Get or create a WebSocket manager instance for a given URL
   * Multiple calls with the same URL return the same instance
   */
  static getInstance(config: WebSocketManagerConfig): WebSocketManager {
    const key = config.url;
    if (!WebSocketManager.instances.has(key)) {
      WebSocketManager.instances.set(key, new WebSocketManager(config));
    }
    return WebSocketManager.instances.get(key)!;
  }

  /**
   * Get a manager by URL if it exists
   */
  static getInstanceByUrl(url: string): WebSocketManager | undefined {
    return WebSocketManager.instances.get(url);
  }

  /**
   * Subscribe to all messages
   */
  subscribe(listener: MessageListener): () => void {
    this.subscribers.add(listener);
    this.connect();
    
    return () => {
      this.subscribers.delete(listener);
      this.scheduleCleanup();
    };
  }

  /**
   * Subscribe to messages for a specific channel
   */
  subscribeToChannel<T = unknown>(channel: string, listener: MessageListener<T>): () => void {
    if (!this.channelSubscribers.has(channel)) {
      this.channelSubscribers.set(channel, new Set());
    }
    this.channelSubscribers.get(channel)!.add(listener as MessageListener);
    this.connect();
    
    // Send subscription message to server
    this.send({ type: 'subscribe', channels: [channel] });
    
    return () => {
      const channelSubs = this.channelSubscribers.get(channel);
      if (channelSubs) {
        channelSubs.delete(listener as MessageListener);
        if (channelSubs.size === 0) {
          this.channelSubscribers.delete(channel);
          // Unsubscribe from server
          this.send({ type: 'unsubscribe', channels: [channel] });
        }
      }
      this.scheduleCleanup();
    };
  }

  /**
   * Subscribe to connection state changes
   */
  subscribeToConnection(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    // Immediately notify of current state
    listener(this.isConnected);
    
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  /**
   * Subscribe to error events
   */
  subscribeToErrors(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  private scheduleCleanup(): void {
    if (this.cleanupScheduled) return;
    this.cleanupScheduled = true;
    
    // Delay cleanup to handle React Strict Mode double-mount
    setTimeout(() => {
      this.cleanupScheduled = false;
      // Only count active message subscribers - connection listeners are passive observers
      // and should not keep the WebSocket connection alive
      const hasActiveSubscribers = 
        this.subscribers.size > 0 || 
        this.channelSubscribers.size > 0;
      
      if (!hasActiveSubscribers) {
        this.disconnect();
      }
    }, 100);
  }

  private connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;

    this.isConnecting = true;
    this.log('Connecting to:', this.config.url);

    const ws = new WebSocket(this.config.url);
    this.ws = ws;

    ws.onopen = () => {
      this.log('Connected');
      this.isConnecting = false;
      this.isConnected = true;
      this.reconnectCount = 0;
      this.notifyConnectionChange(true);
      
      // Re-subscribe to all channels
      const channels = Array.from(this.channelSubscribers.keys());
      if (channels.length > 0) {
        this.send({ type: 'subscribe', channels });
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as RealtimeMessage;
        this.routeMessage(message);
      } catch (e) {
        console.error('[WebSocket] Failed to parse message:', e);
      }
    };

    ws.onclose = () => {
      this.log('Disconnected');
      this.isConnecting = false;
      this.isConnected = false;
      this.ws = null;
      this.notifyConnectionChange(false);

      // Only reconnect if there are still subscribers
      const hasSubscribers = 
        this.subscribers.size > 0 || 
        this.channelSubscribers.size > 0;
      
      if (hasSubscribers && this.reconnectCount < this.config.reconnectAttempts) {
        this.reconnectCount++;
        this.log(`Reconnecting... (${this.reconnectCount}/${this.config.reconnectAttempts})`);
        this.reconnectTimeout = setTimeout(() => this.connect(), this.config.reconnectInterval);
      }
    };

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      this.isConnecting = false;
      this.errorListeners.forEach((listener) => listener(error));
    };
  }

  private disconnect(): void {
    this.log('Cleaning up connection');
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.reconnectCount = this.config.reconnectAttempts; // Prevent reconnection
    this.ws?.close();
    this.ws = null;
    this.isConnected = false;
    this.isConnecting = false;
  }

  private routeMessage(message: RealtimeMessage): void {
    // Notify global subscribers
    this.subscribers.forEach((listener) => listener(message));
    
    // Route to channel-specific subscribers
    const channel = message.channel || message.type;
    const channelSubs = this.channelSubscribers.get(channel);
    if (channelSubs) {
      channelSubs.forEach((listener) => listener(message));
    }
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionListeners.forEach((listener) => listener(connected));
  }

  /**
   * Send a message through the WebSocket
   */
  send(message: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): boolean {
    return this.isConnected;
  }

  /**
   * Force reconnection
   */
  reconnect(): void {
    this.reconnectCount = 0;
    this.disconnect();
    this.connect();
  }

  /**
   * Get the WebSocket URL
   */
  getUrl(): string {
    return this.config.url;
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[WebSocket]', ...args);
    }
  }
}

/**
 * Helper to build WebSocket URLs
 */
export function buildWebSocketUrl(path: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
}
