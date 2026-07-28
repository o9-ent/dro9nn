import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Logger,
  LogLevel,
  ValidationError,
  Config,
  Timer,
  retry,
  sleep,
  deepMerge,
  uniqueId,
  chunk,
} from '../src/utils';

describe('Logger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log at INFO level by default', () => {
    const logger = new Logger('test');
    logger.info('test message');

    expect(consoleSpy.info).toHaveBeenCalledOnce();
    expect(consoleSpy.info.mock.calls[0][0]).toContain('[INFO]');
    expect(consoleSpy.info.mock.calls[0][0]).toContain('[test]');
    expect(consoleSpy.info.mock.calls[0][0]).toContain('test message');
  });

  it('should not log DEBUG when level is INFO', () => {
    const logger = new Logger('test', LogLevel.INFO);
    logger.debug('debug message');

    expect(consoleSpy.debug).not.toHaveBeenCalled();
  });

  it('should log DEBUG when level is DEBUG', () => {
    const logger = new Logger('test', LogLevel.DEBUG);
    logger.debug('debug message');

    expect(consoleSpy.debug).toHaveBeenCalledOnce();
  });

  it('should include metadata in log', () => {
    const logger = new Logger('test');
    logger.info('test message', { key: 'value' });

    expect(consoleSpy.info.mock.calls[0][0]).toContain('"key":"value"');
  });

  it('should log errors with stack trace', () => {
    const logger = new Logger('test');
    const error = new Error('test error');
    logger.error('error occurred', error);

    expect(consoleSpy.error).toHaveBeenCalledOnce();
    expect(consoleSpy.error.mock.calls[0][0]).toContain('test error');
  });
});

describe('ValidationError', () => {
  it('should create a validation error with details', () => {
    const error = new ValidationError('Validation failed', {
      field1: ['error 1'],
      field2: ['error 2', 'error 3'],
    });

    expect(error.message).toBe('Validation failed');
    expect(error.name).toBe('ValidationError');
    expect(error.details.field1).toEqual(['error 1']);
    expect(error.details.field2).toEqual(['error 2', 'error 3']);
  });
});

describe('Config', () => {
  it('should create a config from data', () => {
    const data = { key1: 'value1', key2: 42 };
    const config = Config.load(data);

    expect(config.get('key1')).toBe('value1');
    expect(config.get('key2')).toBe(42);
  });

  it('should set values', () => {
    const config = Config.load({ key: 'initial' });
    config.set('key', 'updated');

    expect(config.get('key')).toBe('updated');
  });

  it('should validate with validators', () => {
    const config = Config.load({ value: 'test' });
    config.addValidator('value', (v) => typeof v === 'string' && v.length > 0);

    expect(() => config.validate()).not.toThrow();
  });

  it('should throw on validation failure', () => {
    const config = Config.load({ value: '' });
    config.addValidator('value', (v) => typeof v === 'string' && (v as string).length > 0);

    expect(() => config.validate()).toThrow(ValidationError);
  });

  it('should convert to JSON', () => {
    const data = { key1: 'value1', key2: 42 };
    const config = Config.load(data);

    expect(config.toJSON()).toEqual(data);
  });
});

describe('Timer', () => {
  it('should measure elapsed time', async () => {
    const timer = new Timer();
    await sleep(50);
    const elapsed = timer.elapsed();

    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  it('should support marks', async () => {
    const timer = new Timer();
    await sleep(20);
    timer.mark('first');
    await sleep(20);
    timer.mark('second');

    const report = timer.report();
    expect(report.total).toBeGreaterThanOrEqual(30);
    expect(report.first).toBeDefined();
    expect(report.second).toBeDefined();
  });

  it('should reset timer', async () => {
    const timer = new Timer();
    await sleep(20);
    timer.reset();
    const elapsed = timer.elapsed();

    expect(elapsed).toBeLessThan(20);
  });
});

describe('retry', () => {
  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('should retry on failure', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const result = await retry(fn, { maxAttempts: 3, delay: 10 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));

    await expect(retry(fn, { maxAttempts: 2, delay: 10 })).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should call onError callback', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    const onError = vi.fn();

    await expect(retry(fn, { maxAttempts: 2, delay: 10, onError })).rejects.toThrow();
    expect(onError).toHaveBeenCalledTimes(2);
  });
});

describe('sleep', () => {
  it('should wait for specified time', async () => {
    const start = performance.now();
    await sleep(50);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(40);
  });
});

describe('deepMerge', () => {
  it('should merge objects', () => {
    const target = { a: 1, b: { c: 2 } };
    const source = { b: { d: 3 }, e: 4 };
    const result = deepMerge(target, source);

    expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
  });

  it('should not mutate original objects', () => {
    const target = { a: 1 };
    const source = { b: 2 };
    const result = deepMerge(target, source);

    expect(target).toEqual({ a: 1 });
    expect(source).toEqual({ b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('should handle nested objects', () => {
    const target = { a: { b: { c: 1 } } };
    const source = { a: { b: { d: 2 } } };
    const result = deepMerge(target, source);

    expect(result).toEqual({ a: { b: { c: 1, d: 2 } } });
  });
});

describe('uniqueId', () => {
  it('should generate unique ids', () => {
    const id1 = uniqueId();
    const id2 = uniqueId();

    expect(id1).not.toBe(id2);
  });

  it('should include prefix', () => {
    const id = uniqueId('test-');

    expect(id.startsWith('test-')).toBe(true);
  });

  it('should contain timestamp and random parts', () => {
    const id = uniqueId();
    const parts = id.split('-');

    expect(parts.length).toBe(2);
  });
});

describe('chunk', () => {
  it('should split array into chunks', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7];
    const result = chunk(arr, 3);

    expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  it('should handle empty array', () => {
    const result = chunk([], 3);

    expect(result).toEqual([]);
  });

  it('should handle array smaller than chunk size', () => {
    const result = chunk([1, 2], 5);

    expect(result).toEqual([[1, 2]]);
  });
});
