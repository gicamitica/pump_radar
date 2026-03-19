import { useRepository } from '@/shared/hooks/useRepository';
import { HOME_SYMBOLS } from '../../di/symbols';
import type { IHomeRepository } from '../../domain/ports/IHomeRepository';

export const useHomeRepository = (): IHomeRepository =>
  useRepository<IHomeRepository>(HOME_SYMBOLS.IHomeRepository);
