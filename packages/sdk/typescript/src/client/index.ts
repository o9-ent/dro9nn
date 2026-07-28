/**
 * HTTP Client for o9nn API
 */

import { Logger, retry, LogLevel } from '@o9nn/core';

export interface ClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

/**
 * HTTP Client for interacting with o9nn API
 */
export class CogClient {
  private config: Required<ClientConfig>;
  private logger: Logger;

  constructor(config: ClientConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey || '',
      timeout: config.timeout || 30000,
      headers: config.headers || {},
    };
    this.logger = new Logger('CogClient', LogLevel.INFO);
  }

  /**
   * Make an HTTP request to the API
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const method = options.method || 'GET';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...options.headers,
    };

    if (this.config.apiKey) {
      headers['Authorization'] = 'Bearer ' + this.config.apiKey;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (options.body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    this.logger.debug(`${method} ${endpoint}`);

    const response = await retry(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          options.timeout || this.config.timeout
        );

        try {
          const res = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          return res;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      },
      {
        maxAttempts: 3,
        delay: 1000,
        onError: (error, attempt) => {
          this.logger.warn(`Request failed (attempt ${attempt}): ${error.message}`);
        },
      }
    );

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new ApiError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    const data = (await response.json()) as T;

    return {
      data,
      status: response.status,
      headers: responseHeaders,
    };
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    const response = await this.request<T>(endpoint, { ...options, method: 'GET' });
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    const response = await this.request<T>(endpoint, { ...options, method: 'POST', body });
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    const response = await this.request<T>(endpoint, { ...options, method: 'PUT', body });
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    const response = await this.request<T>(endpoint, { ...options, method: 'DELETE' });
    return response.data;
  }
}

/**
 * API Error class
 */
export class ApiError extends Error {
  status: number;
  body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// Factory function
export function createClient(config: ClientConfig): CogClient {
  return new CogClient(config);
}
