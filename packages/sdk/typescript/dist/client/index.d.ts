/**
 * HTTP Client for o9nn API
 */
interface ClientConfig {
    baseUrl: string;
    apiKey?: string;
    timeout?: number;
    headers?: Record<string, string>;
}
interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: unknown;
    timeout?: number;
}
interface ApiResponse<T> {
    data: T;
    status: number;
    headers: Record<string, string>;
}
/**
 * HTTP Client for interacting with o9nn API
 */
declare class CogClient {
    private config;
    private logger;
    constructor(config: ClientConfig);
    /**
     * Make an HTTP request to the API
     */
    request<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>>;
    /**
     * GET request
     */
    get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
    /**
     * POST request
     */
    post<T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T>;
    /**
     * PUT request
     */
    put<T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T>;
    /**
     * DELETE request
     */
    delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T>;
}
/**
 * API Error class
 */
declare class ApiError extends Error {
    status: number;
    body: string;
    constructor(message: string, status: number, body: string);
}
declare function createClient(config: ClientConfig): CogClient;

export { ApiError, type ApiResponse, type ClientConfig, CogClient, type RequestOptions, createClient };
