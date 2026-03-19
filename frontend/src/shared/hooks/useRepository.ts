/**
 * Generic Repository Hook
 * 
 * Provides a type-safe way to retrieve repositories from the DI container.
 * This hook memoizes the repository instance to prevent unnecessary re-renders.
 * 
 * Usage:
 * ```ts
 * const repo = useRepository<IUserRepository>(USER_SYMBOLS.IUserRepository);
 * ```
 * 
 * For better semantic clarity in module code, prefer creating module-specific
 * wrapper hooks that internally call this generic hook:
 * ```ts
 * export const useUsersRepository = () =>
 *   useRepository<IUserRepository>(USER_SYMBOLS.IUserRepository);
 * ```
 */

import { useMemo } from 'react';
import { useDI } from '@/app/providers/useDI';

/**
 * Hook to retrieve a repository from the DI container
 * Uses React context to access the container, avoiding circular dependency
 * issues during HMR that occur with direct diContainer imports.
 * @param symbol - The DI symbol for the repository
 * @returns The repository instance
 */
export function useRepository<T>(symbol: symbol): T {
  const { get } = useDI();
  return useMemo(() => get<T>(symbol), [get, symbol]);
}
