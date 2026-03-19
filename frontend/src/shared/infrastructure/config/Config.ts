import { injectable } from 'inversify';
import EnvSchema from './EnvSchema';

export interface IConfig {
  api: { baseUrl: string; timeout: number };
  auth: { loginPath: string; tokenKey: string; currentUserKey: string };
  app: { name: string; environment: string };
  features: { debugMode: boolean; useMsw: boolean; enablePublicCodeExamples: boolean };
  sidebar: { defaultWidth: number; minWidth: number; maxWidth: number; enableResize: boolean };
  isDevelopment(): boolean;
  isProduction(): boolean;
}

@injectable()
export class Config implements IConfig {
  private readonly env = EnvSchema.parse(import.meta.env);

  public readonly api = {
    baseUrl: this.env.VITE_API_BASE_URL,
    timeout: parseInt(this.env.VITE_API_TIMEOUT),
  };

  public readonly auth = {
    tokenKey: this.env.VITE_AUTH_TOKEN_KEY,
    loginPath: this.env.VITE_AUTH_LOGIN_PATH,
    currentUserKey: this.env.VITE_AUTH_CURRENT_USER_KEY,
  };

  public readonly app = {
    name: this.env.VITE_APP_NAME,
    environment: this.env.VITE_APP_ENVIRONMENT,
  };

  public readonly features = {
    debugMode: this.env.VITE_APP_ENVIRONMENT === 'development',
    useMsw: this.env.VITE_USE_MSW === 'true',
    enablePublicCodeExamples: this.env.VITE_ENABLE_PUBLIC_CODE_EXAMPLES === 'true',
  };

  public readonly sidebar = {
    defaultWidth: parseInt(this.env.VITE_SIDEBAR_DEFAULT_WIDTH),
    minWidth: parseInt(this.env.VITE_SIDEBAR_MIN_WIDTH),
    maxWidth: parseInt(this.env.VITE_SIDEBAR_MAX_WIDTH),
    enableResize: this.env.VITE_ENABLE_SIDEBAR_RESIZE === 'true',
  };

  public isDevelopment(): boolean {
    return this.app.environment === 'development';
  }

  public isProduction(): boolean {
    return this.app.environment === 'production';
  }
}
