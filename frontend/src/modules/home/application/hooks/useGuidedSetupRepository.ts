import { useRepository } from '@/shared/hooks/useRepository';
import { HOME_SYMBOLS } from '../../di/symbols';
import type { IGuidedSetupRepository } from '../../domain/ports/IGuidedSetupRepository';

export const useGuidedSetupRepository = (): IGuidedSetupRepository =>
  useRepository<IGuidedSetupRepository>(HOME_SYMBOLS.IGuidedSetupRepository);
