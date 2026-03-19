import React from 'react';
import type { PropsWithChildren } from 'react';
import { diContainer } from '@/core/di/container';
import { DIContext, type DIContextType } from './useDI';

export const DIProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // Create context value once - diContainer is already initialized by the time
  // React components render
  const contextValue: DIContextType = {
    container: diContainer,
    get: <T,>(serviceIdentifier: symbol): T => diContainer.get<T>(serviceIdentifier),
  };

  return (
    <DIContext.Provider value={contextValue}>
      {children}
    </DIContext.Provider>
  );
};
