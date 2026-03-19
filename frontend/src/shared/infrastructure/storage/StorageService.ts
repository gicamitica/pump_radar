import { injectable, inject } from 'inversify';
import { CORE_SYMBOLS } from '../../../core/di/symbols';
import type { ILogger } from '../../utils/Logger';

export interface IStorageService {
  // Local Storage
  setItem<T>(key: string, value: T): void;
  getItem<T>(key: string): T | null;
  removeItem(key: string): void;
  clear(): void;
  
  // Session Storage
  setSessionItem<T>(key: string, value: T): void;
  getSessionItem<T>(key: string): T | null;
  removeSessionItem(key: string): void;
  clearSession(): void;
  
  // Utility methods
  hasItem(key: string): boolean;
  hasSessionItem(key: string): boolean;
}

@injectable()
export class StorageService implements IStorageService {
  constructor(@inject(CORE_SYMBOLS.ILogger) private logger: ILogger) {}
  // Local Storage methods
  setItem<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      this.logger.error('Error setting localStorage item:', error);
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      this.logger.error('Error getting localStorage item:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      this.logger.error('Error removing localStorage item:', error);
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      this.logger.error('Error clearing localStorage:', error);
    }
  }

  // Session Storage methods
  setSessionItem<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      sessionStorage.setItem(key, serializedValue);
    } catch (error) {
      this.logger.error('Error setting sessionStorage item:', error);
    }
  }

  getSessionItem<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      this.logger.error('Error getting sessionStorage item:', error);
      return null;
    }
  }

  removeSessionItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      this.logger.error('Error removing sessionStorage item:', error);
    }
  }

  clearSession(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      this.logger.error('Error clearing sessionStorage:', error);
    }
  }

  // Utility methods
  hasItem(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  hasSessionItem(key: string): boolean {
    return sessionStorage.getItem(key) !== null;
  }
}
