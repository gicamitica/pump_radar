import { injectable, inject } from 'inversify';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IConfig } from '@/shared/infrastructure/config/Config';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  setLevel(level: LogLevel): void;
}

@injectable()
export class Logger implements ILogger {
  private level: LogLevel;

  constructor(@inject(CORE_SYMBOLS.IConfig) private config: IConfig) {
    this.level = this.config.isDevelopment() ? LogLevel.DEBUG : LogLevel.INFO;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${this.formatMessage(message)}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${this.formatMessage(message)}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${this.formatMessage(message)}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${this.formatMessage(message)}`, ...args);
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private formatMessage(message: string): string {
    const timestamp = new Date().toISOString();
    return `${timestamp} - ${message}`;
  }
}
