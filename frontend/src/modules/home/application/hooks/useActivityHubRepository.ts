import { useRepository } from '@/shared/hooks/useRepository';
import { HOME_SYMBOLS } from '../../di/symbols';
import type { IActivityHubRepository } from '../../domain/ports/IActivityHubRepository';

export const useActivityHubRepository = (): IActivityHubRepository =>
  useRepository<IActivityHubRepository>(HOME_SYMBOLS.IActivityHubRepository);
