import type { Container } from 'inversify';
import type { AppModule } from '@/core/di/module-loader';
import { HOME_ROUTES } from '../ui/routes';
import { HOME_SYMBOLS } from './symbols';
import { HomeRepository } from '../infrastructure/repositories/HomeRepository';
import { GuidedSetupRepository } from '../infrastructure/repositories/GuidedSetupRepository';
import { ActivityHubRepository } from '../infrastructure/repositories/ActivityHubRepository';
import type { IHomeRepository } from '../domain/ports/IHomeRepository';
import type { IGuidedSetupRepository } from '../domain/ports/IGuidedSetupRepository';
import type { IActivityHubRepository } from '../domain/ports/IActivityHubRepository';

export function createHomeModule(container: Container): AppModule {
  return {
    name: 'home',
    routes: HOME_ROUTES,
    registerBindings: () => {
      container
        .bind<IHomeRepository>(HOME_SYMBOLS.IHomeRepository)
        .to(HomeRepository)
        .inSingletonScope();
      container
        .bind<IGuidedSetupRepository>(HOME_SYMBOLS.IGuidedSetupRepository)
        .to(GuidedSetupRepository)
        .inSingletonScope();
      container
        .bind<IActivityHubRepository>(HOME_SYMBOLS.IActivityHubRepository)
        .to(ActivityHubRepository)
        .inSingletonScope();
    },
  };
}
