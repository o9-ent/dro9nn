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

// src/types/index.ts
var types_exports = {};
__export(types_exports, {
  Backend: () => Backend,
  DataType: () => DataType,
  Device: () => Device
});
module.exports = __toCommonJS(types_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Backend,
  DataType,
  Device
});
