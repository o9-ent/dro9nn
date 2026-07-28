"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Backend: () => Backend,
  Config: () => Config,
  DataType: () => DataType,
  Device: () => Device,
  LogLevel: () => LogLevel,
  Logger: () => Logger,
  Timer: () => Timer,
  VERSION: () => VERSION,
  ValidationError: () => ValidationError,
  chunk: () => chunk,
  deepMerge: () => deepMerge,
  retry: () => retry,
  sleep: () => sleep,
  uniqueId: () => uniqueId
});
module.exports = __toCommonJS(index_exports);

// src/types/index.ts
var Backend = /* @__PURE__ */ ((Backend2) => {
  Backend2["PYTORCH"] = "pytorch";
  Backend2["JAX"] = "jax";
  Backend2["TENSORFLOW"] = "tensorflow";
  Backend2["ONNX"] = "onnx";
  return Backend2;
})(Backend || {});
var Device = /* @__PURE__ */ ((Device2) => {
  Device2["CPU"] = "cpu";
  Device2["CUDA"] = "cuda";
  Device2["MPS"] = "mps";
  Device2["TPU"] = "tpu";
  return Device2;
})(Device || {});
var DataType = /* @__PURE__ */ ((DataType2) => {
  DataType2["FLOAT16"] = "float16";
  DataType2["FLOAT32"] = "float32";
  DataType2["FLOAT64"] = "float64";
  DataType2["INT8"] = "int8";
  DataType2["INT16"] = "int16";
  DataType2["INT32"] = "int32";
  DataType2["INT64"] = "int64";
  DataType2["UINT8"] = "uint8";
  DataType2["BOOL"] = "bool";
  DataType2["BFLOAT16"] = "bfloat16";
  return DataType2;
})(DataType || {});

// src/utils/index.ts
var Logger = class {
  name;
  level;
  constructor(name, level = 1 /* INFO */) {
    this.name = name;
    this.level = level;
  }
  format(level, message, meta) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level}] [${this.name}] ${message}${metaStr}`;
  }
  debug(message, meta) {
    if (this.level <= 0 /* DEBUG */) {
      console.debug(this.format("DEBUG", message, meta));
    }
  }
  info(message, meta) {
    if (this.level <= 1 /* INFO */) {
      console.info(this.format("INFO", message, meta));
    }
  }
  warn(message, meta) {
    if (this.level <= 2 /* WARN */) {
      console.warn(this.format("WARN", message, meta));
    }
  }
  error(message, error, meta) {
    if (this.level <= 3 /* ERROR */) {
      const errorMeta = error ? { ...meta, error: { message: error.message, stack: error.stack } } : meta;
      console.error(this.format("ERROR", message, errorMeta));
    }
  }
};
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 3] = "ERROR";
  return LogLevel2;
})(LogLevel || {});
var ValidationError = class extends Error {
  details;
  constructor(message, details = {}) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
};
var Config = class _Config {
  data;
  validators;
  constructor(data) {
    this.data = data;
    this.validators = /* @__PURE__ */ new Map();
  }
  static load(data) {
    return new _Config(data);
  }
  get(key) {
    return this.data[key];
  }
  set(key, value) {
    this.data[key] = value;
  }
  addValidator(key, validator) {
    this.validators.set(key, validator);
  }
  validate() {
    const errors = {};
    for (const [key, validator] of this.validators) {
      if (!validator(this.data[key])) {
        errors[key] = errors[key] || [];
        errors[key].push(`Invalid value for ${key}`);
      }
    }
    if (Object.keys(errors).length > 0) {
      throw new ValidationError("Configuration validation failed", errors);
    }
  }
  toJSON() {
    return { ...this.data };
  }
};
var Timer = class {
  startTime;
  marks;
  constructor() {
    this.startTime = performance.now();
    this.marks = /* @__PURE__ */ new Map();
  }
  mark(name) {
    this.marks.set(name, performance.now());
  }
  elapsed(fromMark) {
    const startTime = fromMark ? this.marks.get(fromMark) || this.startTime : this.startTime;
    return performance.now() - startTime;
  }
  reset() {
    this.startTime = performance.now();
    this.marks.clear();
  }
  report() {
    const report = {
      total: this.elapsed()
    };
    const markNames = Array.from(this.marks.keys());
    for (let i = 0; i < markNames.length; i++) {
      const markName = markNames[i];
      const prevMark = i > 0 ? markNames[i - 1] : void 0;
      const startTime = prevMark ? this.marks.get(prevMark) : this.startTime;
      report[markName] = this.marks.get(markName) - startTime;
    }
    return report;
  }
};
async function retry(fn, options = {}) {
  const { maxAttempts = 3, delay = 1e3, backoff = 2, onError } = options;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
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
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      if (isObject(sourceValue) && isObject(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else if (sourceValue !== void 0) {
        result[key] = sourceValue;
      }
    }
  }
  return result;
}
function isObject(item) {
  return item !== null && typeof item === "object" && !Array.isArray(item);
}
function uniqueId(prefix = "") {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${prefix}${timestamp}-${randomPart}`;
}
function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// src/index.ts
var VERSION = "0.1.0";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Backend,
  Config,
  DataType,
  Device,
  LogLevel,
  Logger,
  Timer,
  VERSION,
  ValidationError,
  chunk,
  deepMerge,
  retry,
  sleep,
  uniqueId
});
