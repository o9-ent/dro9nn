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

export {
  Backend,
  Device,
  DataType
};
