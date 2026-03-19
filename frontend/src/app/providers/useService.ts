import type { Container } from 'inversify';
import { diContainer } from '@/core/di/container';

export const container: Container = diContainer;

export const useService = <T,>(token: symbol): T => {
  return container.get<T>(token);
};
