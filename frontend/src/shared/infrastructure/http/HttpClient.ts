import { injectable, inject } from 'inversify';
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IConfig } from '@/shared/infrastructure/config/Config';
import type { IStorageService } from '@/shared/infrastructure/storage/StorageService';
import type { ILogger } from '@/shared/utils/Logger';
import { AUTH_PATHS } from '@/modules/auth/ui/routes';
import type { ApiResponse } from '../models/api';

export interface IHttpClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  post<T, D>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  put<T, D>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  patch<T, D>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
}

@injectable()
export class HttpClient implements IHttpClient {
  private axiosInstance: AxiosInstance;

  constructor(
    @inject(CORE_SYMBOLS.IConfig) private config: IConfig,
    @inject(CORE_SYMBOLS.IStorageService) private storageService: IStorageService,
    @inject(CORE_SYMBOLS.ILogger) private logger: ILogger
  ) {
    this.axiosInstance = axios.create({
      baseURL: this.config.api.baseUrl,
      timeout: this.config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Automatically inject auth token if available
        const token = this.getStoredToken();
        if (token && !config.headers['Authorization']) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }

        if (this.config.features.debugMode) {
          this.logger.debug('HTTP Request:', config);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        if (this.config.features.debugMode) {
          this.logger.debug('HTTP Response:', response);
        }
        return response;
      },
      async (error: AxiosError) => {
        if (this.config.features.debugMode) {
          this.logger.error('HTTP Error:', error);
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          // Only redirect if NOT the login endpoint
          const loginEndpoint = AUTH_PATHS.LOGIN;
          // Axios may store the full URL or a relative path; handle both
          const requestUrl = error.config?.url || '';
          if (!requestUrl.endsWith(loginEndpoint)) {
            this.removeAuthToken();
            setTimeout(() => {
              window.location.href = this.config.auth.loginPath;
            }, 300);
          }
        }

        const errorData = error.response?.data as Record<string, unknown>;
        const enhancedError = {
          ...(errorData.error || {}),
          status: error.response?.status,
          statusText: error.response?.statusText,
        };
        return Promise.reject(enhancedError);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get<ApiResponse<T>>(url, config);
    this.logger.debug('HTTP GET Response:', response);

    return response.data;
  }

  async post<T, D>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config);
    this.logger.info('HTTP POST Response:', response);

    return response.data;
  }

  async put<T, D>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.put<ApiResponse<T>>(url, data, config);
    this.logger.info('HTTP PUT Response:', response);

    return response.data;
  }

  async patch<T, D>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.patch<ApiResponse<T>>(url, data, config);
    this.logger.info('HTTP PATCH Response:', response);

    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete<ApiResponse<T>>(url, config);
    this.logger.info('HTTP DELETE Response:', response);

    return response.data;
  }

  removeAuthToken(): void {
    this.storageService.removeItem(this.config.auth.tokenKey);
    this.storageService.removeSessionItem(this.config.auth.tokenKey);
    this.storageService.removeItem(this.config.auth.currentUserKey);
    this.storageService.removeSessionItem(this.config.auth.currentUserKey);
  }

  private getStoredToken(): string | null {
    return this.storageService.getItem(this.config.auth.tokenKey) ||
           this.storageService.getSessionItem(this.config.auth.tokenKey);
  }
}
