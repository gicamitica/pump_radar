import 'reflect-metadata';
import { Container } from 'inversify';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import { type IConfig, Config } from '@/shared/infrastructure/config/Config';
import { type IStorageService, StorageService } from '@/shared/infrastructure/storage/StorageService';
import { type IEventBus, EventBus } from '@/shared/infrastructure/events/EventBus';
import { type ILogger, Logger } from '@/shared/utils/Logger';
import { type IHttpClient, HttpClient } from '@/shared/infrastructure/http/HttpClient';
import { type INavigationService, NavigationService } from '@/shared/infrastructure/navigation/NavigationService';
import { type IPublicCodeExampleWhitelist, PublicCodeExampleWhitelist } from '@/shared/infrastructure/code-examples/PublicCodeExampleWhitelist';
import type { ModuleRegistry } from '@/core/di/module-loader';
import { loadAllModules } from '@/core/di/module-loader';

const container = new Container();

container.bind<IConfig>(CORE_SYMBOLS.IConfig).to(Config).inSingletonScope();
container.bind<IStorageService>(CORE_SYMBOLS.IStorageService).to(StorageService).inSingletonScope();
container.bind<IEventBus>(CORE_SYMBOLS.IEventBus).to(EventBus).inSingletonScope();
container.bind<ILogger>(CORE_SYMBOLS.ILogger).to(Logger).inSingletonScope();
container.bind<IHttpClient>(CORE_SYMBOLS.IHttpClient).to(HttpClient).inSingletonScope();
container.bind<INavigationService>(CORE_SYMBOLS.INavigationService).to(NavigationService).inSingletonScope();
container.bind<IPublicCodeExampleWhitelist>(CORE_SYMBOLS.IPublicCodeExampleWhitelist).to(PublicCodeExampleWhitelist).inSingletonScope();

const moduleRegistry: ModuleRegistry = loadAllModules(container);

export { container as diContainer, moduleRegistry };
