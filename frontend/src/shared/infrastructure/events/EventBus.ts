import { injectable, inject } from 'inversify';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { ILogger } from '@/shared/utils/Logger';

export interface IEventBus {
  subscribe<T>(eventName: string, callback: (data: T) => void): () => void;
  publish<T>(eventName: string, data: T): void;
  unsubscribe<T>(eventName: string, callback: (data: T) => void): void;
  clear(): void;
}

type EventCallback = (data: unknown) => void;

@injectable()
export class EventBus implements IEventBus {
  private events: Map<string, EventCallback[]> = new Map();

  constructor(@inject(CORE_SYMBOLS.ILogger) private logger: ILogger) {}

  subscribe<T>(eventName: string, callback: (data: T) => void): () => void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const callbacks = this.events.get(eventName)!;
    callbacks.push(callback as EventCallback);

    return () => this.unsubscribe(eventName, callback);
  }

  publish<T>(eventName: string, data: T): void {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach(cb => {
        try { cb(data); } catch (err) { this.logger.error(`Event error ${eventName}`, err); }
      });
    }
  }

  unsubscribe<T>(eventName: string, callback: (data: T) => void): void {
    const callbacks = this.events.get(eventName);
    if (!callbacks) return;
    const idx = callbacks.indexOf(callback as EventCallback);
    if (idx > -1) callbacks.splice(idx, 1);
    if (callbacks.length === 0) this.events.delete(eventName);
  }

  clear(): void { this.events.clear(); }
}
