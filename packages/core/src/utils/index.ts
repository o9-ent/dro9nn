/**
 * Core utilities for the o9nn ecosystem
 */

// Logger utility
export class Logger {
  private name: string;
  private level: LogLevel;

  constructor(name: string, level: LogLevel = LogLevel.INFO) {
    this.name = name;
    this.level = level;
  }

  private format(level: string, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] [${this.name}] ${message}${metaStr}`;
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(this.format('DEBUG', message, meta));
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (this.level <= LogLevel.INFO) {
      console.info(this.format('INFO', message, meta));
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.format('WARN', message, meta));
    }
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    if (this.level <= LogLevel.ERROR) {
      const errorMeta = error
        ? { ...meta, error: { message: error.message, stack: error.stack } }
        : meta;
      console.error(this.format('ERROR', message, errorMeta));
    }
  }
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Validation error
export class ValidationError extends Error {
  details: Record<string, string[]>;

  constructor(message: string, details: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

// Configuration utility
export class Config<T extends Record<string, unknown>> {
  private data: T;
  private validators: Map<string, (value: unknown) => boolean>;

  constructor(data: T) {
    this.data = data;
    this.validators = new Map();
  }

  static load<T extends Record<string, unknown>>(data: T): Config<T> {
    return new Config(data);
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.data[key];
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    this.data[key] = value;
  }

  addValidator(key: string, validator: (value: unknown) => boolean): void {
    this.validators.set(key, validator);
  }

  validate(): void {
    const errors: Record<string, string[]> = {};

    for (const [key, validator] of this.validators) {
      if (!validator(this.data[key])) {
        errors[key] = errors[key] || [];
        errors[key].push(`Invalid value for ${key}`);
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Configuration validation failed', errors);
    }
  }

  toJSON(): T {
    return { ...this.data };
  }
}

// Timer utility for performance measurement
export class Timer {
  private startTime: number;
  private marks: Map<string, number>;

  constructor() {
    this.startTime = performance.now();
    this.marks = new Map();
  }

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  elapsed(fromMark?: string): number {
    const startTime = fromMark ? this.marks.get(fromMark) || this.startTime : this.startTime;
    return performance.now() - startTime;
  }

  reset(): void {
    this.startTime = performance.now();
    this.marks.clear();
  }

  report(): Record<string, number> {
    const report: Record<string, number> = {
      total: this.elapsed(),
    };

    const markNames = Array.from(this.marks.keys());
    for (let i = 0; i < markNames.length; i++) {
      const markName = markNames[i];
      const prevMark = i > 0 ? markNames[i - 1] : undefined;
      const startTime = prevMark ? this.marks.get(prevMark)! : this.startTime;
      report[markName] = this.marks.get(markName)! - startTime;
    }

    return report;
  }
}

// Retry utility
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
    onError?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = 2, onError } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (onError) {
        onError(lastError, attempt);
      }

      if (attempt < maxAttempts) {
        await sleep(delay * Math.pow(backoff, attempt - 1));
      }
    }
  }

  throw lastError;
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Deep merge utility
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (isObject(sourceValue) && isObject(targetValue)) {
        result[key] = deepMerge(targetValue as Record<string, unknown>, sourceValue as Record<string, unknown>) as T[Extract<keyof T, string>];
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}

function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}

// Unique ID generator
let idCounter = 0;
export function uniqueId(prefix = ''): string {
  idCounter += 1;
  return `${prefix}${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

// Chunk array utility
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
