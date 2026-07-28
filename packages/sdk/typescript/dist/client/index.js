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

// src/client/index.ts
var client_exports = {};
__export(client_exports, {
  ApiError: () => ApiError,
  CogClient: () => CogClient,
  createClient: () => createClient
});
module.exports = __toCommonJS(client_exports);
var import_core = require("@o9nn/core");
var CogClient = class {
  config;
  logger;
  constructor(config) {
    this.config = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey || "",
      timeout: config.timeout || 3e4,
      headers: config.headers || {}
    };
    this.logger = new import_core.Logger("CogClient", import_core.LogLevel.INFO);
  }
  /**
   * Make an HTTP request to the API
   */
  async request(endpoint, options = {}) {
    const url = `${this.config.baseUrl}${endpoint}`;
    const method = options.method || "GET";
    const headers = {
      "Content-Type": "application/json",
      ...this.config.headers,
      ...options.headers
    };
    if (this.config.apiKey) {
      headers["Authorization"] = "Bearer " + this.config.apiKey;
    }
    const fetchOptions = {
      method,
      headers
    };
    if (options.body && method !== "GET") {
      fetchOptions.body = JSON.stringify(options.body);
    }
    this.logger.debug(`${method} ${endpoint}`);
    const shouldRetry = options.noRetry !== true && method === "GET";
    const makeRequest = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeout || this.config.timeout
      );
      try {
        const res = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return res;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };
    const response = shouldRetry ? await (0, import_core.retry)(
      makeRequest,
      {
        maxAttempts: 3,
        delay: 1e3,
        onError: (error, attempt) => {
          this.logger.warn(`Request failed (attempt ${attempt}): ${error.message}`);
        }
      }
    ) : await makeRequest();
    const responseHeaders = {};
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
    const data = await response.json();
    return {
      data,
      status: response.status,
      headers: responseHeaders
    };
  }
  /**
   * GET request
   */
  async get(endpoint, options) {
    const response = await this.request(endpoint, { ...options, method: "GET" });
    return response.data;
  }
  /**
   * POST request
   */
  async post(endpoint, body, options) {
    const response = await this.request(endpoint, { ...options, method: "POST", body });
    return response.data;
  }
  /**
   * PUT request
   */
  async put(endpoint, body, options) {
    const response = await this.request(endpoint, { ...options, method: "PUT", body });
    return response.data;
  }
  /**
   * DELETE request
   */
  async delete(endpoint, options) {
    const response = await this.request(endpoint, { ...options, method: "DELETE" });
    return response.data;
  }
};
var ApiError = class extends Error {
  status;
  body;
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
};
function createClient(config) {
  return new CogClient(config);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiError,
  CogClient,
  createClient
});
