/**
 * DI Context Hooks
 * 
 * Separated from DIProvider.tsx to ensure Fast Refresh works correctly.
 * Fast Refresh only works when a file exports only React components.
 */

import { useContext, createContext } from 'react';
import type { Container } from 'inversify';

export interface DIContextType {
  container: Container;
  get: <T>(serviceIdentifier: symbol) => T;
}

// Context is created here but provided by DIProvider
export const DIContext = createContext<DIContextType | null>(null);

export const useDI = (): DIContextType => {
  const context = useContext(DIContext);
  if (!context) {
    throw new Error('useDI must be used within a DIProvider');
  }
  return context;
};

export const useService = <T,>(token: symbol): T => {
  const { get } = useDI();
  return get<T>(token);
};
