/**
 * Core utilities for the o9nn ecosystem
 */
declare class Logger {
    private name;
    private level;
    constructor(name: string, level?: LogLevel);
    private format;
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, error?: Error, meta?: Record<string, unknown>): void;
}
declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
declare class ValidationError extends Error {
    details: Record<string, string[]>;
    constructor(message: string, details?: Record<string, string[]>);
}
declare class Config<T extends Record<string, unknown>> {
    private data;
    private validators;
    constructor(data: T);
    static load<T extends Record<string, unknown>>(data: T): Config<T>;
    get<K extends keyof T>(key: K): T[K];
    set<K extends keyof T>(key: K, value: T[K]): void;
    addValidator(key: string, validator: (value: unknown) => boolean): void;
    validate(): void;
    toJSON(): T;
}
declare class Timer {
    private startTime;
    private marks;
    constructor();
    mark(name: string): void;
    elapsed(fromMark?: string): number;
    reset(): void;
    report(): Record<string, number>;
}
declare function retry<T>(fn: () => Promise<T>, options?: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
    onError?: (error: Error, attempt: number) => void;
}): Promise<T>;
declare function sleep(ms: number): Promise<void>;
declare function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T;
declare function uniqueId(prefix?: string): string;
declare function chunk<T>(array: T[], size: number): T[][];

export { Config, LogLevel, Logger, Timer, ValidationError, chunk, deepMerge, retry, sleep, uniqueId };
