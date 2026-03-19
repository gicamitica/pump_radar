import { injectable, inject } from 'inversify';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IConfig } from '@/shared/infrastructure/config/Config';

export type PublicCodeExampleId =
  | 'buttons'
  | 'avatars'
  | 'stat-cards'
  | 'badges'
  | 'cards'
  | 'alerts'
  | 'inputs'
  | 'selects'
  | 'checkboxes'
  | 'switches'
  | 'tabs'
  | 'dialogs'
  | 'dropdowns'
  | 'tooltips'
  | 'tables'
  | 'forms'
  | 'charts'
  | 'navigation'
  | 'states'
  | 'density'
  | 'overflow'
  | 'compositions'
  | 'progressive'
  | 'inline-editing'
  | 'micro-interactions'
  | 'bulk-actions'
  | 'command-palette'
  | 'keyboard-shortcuts';

const PUBLIC_CODE_EXAMPLE_WHITELIST: readonly PublicCodeExampleId[] = [
  'buttons',
  'avatars',
  'stat-cards',
  'badges',
  'cards',
  'alerts',
] as const;

export interface IPublicCodeExampleWhitelist {
  isAllowed(id: PublicCodeExampleId | string): boolean;
}

@injectable()
export class PublicCodeExampleWhitelist implements IPublicCodeExampleWhitelist {
  constructor(@inject(CORE_SYMBOLS.IConfig) private readonly config: IConfig) {}

  public isAllowed(id: PublicCodeExampleId | string): boolean {
    if (this.config.isDevelopment()) {
      return true;
    }

    if (!this.config.features.enablePublicCodeExamples) {
      return false;
    }

    return PUBLIC_CODE_EXAMPLE_WHITELIST.includes(id as PublicCodeExampleId);
  }
}
