// Core Services DI Types Only
export const CORE_SYMBOLS = {
  IConfig: Symbol.for('IConfig'),
  IHttpClient: Symbol.for('IHttpClient'),
  IStorageService: Symbol.for('IStorageService'),
  IEventBus: Symbol.for('IEventBus'),
  ILogger: Symbol.for('ILogger'),
  INavigationService: Symbol.for('INavigationService'),
  IPublicCodeExampleWhitelist: Symbol.for('IPublicCodeExampleWhitelist'),
} as const;

export type CoreSymbols = typeof CORE_SYMBOLS;
