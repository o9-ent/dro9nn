package cogsdk

// Backend represents the ML backend type.
type Backend string

const (
	BackendPyTorch    Backend = "pytorch"
	BackendJAX        Backend = "jax"
	BackendTensorFlow Backend = "tensorflow"
	BackendONNX       Backend = "onnx"
)

// Device represents the device type.
type Device string

const (
	DeviceCPU  Device = "cpu"
	DeviceCUDA Device = "cuda"
	DeviceMPS  Device = "mps"
	DeviceTPU  Device = "tpu"
)

// DataType represents the data type.
type DataType string

const (
	DataTypeFloat16  DataType = "float16"
	DataTypeFloat32  DataType = "float32"
	DataTypeFloat64  DataType = "float64"
	DataTypeInt8     DataType = "int8"
	DataTypeInt16    DataType = "int16"
	DataTypeInt32    DataType = "int32"
	DataTypeInt64    DataType = "int64"
	DataTypeUint8    DataType = "uint8"
	DataTypeBool     DataType = "bool"
	DataTypeBFloat16 DataType = "bfloat16"
)

// ModelConfig represents model configuration.
type ModelConfig struct {
	Name    string                 `json:"name"`
	Version string                 `json:"version,omitempty"`
	Path    string                 `json:"path,omitempty"`
	Backend Backend                `json:"backend"`
	Device  Device                 `json:"device"`
	DType   DataType               `json:"dtype,omitempty"`
	Options map[string]interface{} `json:"options,omitempty"`
}

// InferenceOptions represents inference options.
type InferenceOptions struct {
	BatchSize   int     `json:"batchSize,omitempty"`
	MaxLength   int     `json:"maxLength,omitempty"`
	Temperature float64 `json:"temperature,omitempty"`
	TopK        int     `json:"topK,omitempty"`
	TopP        float64 `json:"topP,omitempty"`
	Stream      bool    `json:"stream,omitempty"`
	Timeout     int     `json:"timeout,omitempty"`
}

// ParameterSchema represents a tool parameter schema.
type ParameterSchema struct {
	Type        string        `json:"type"`
	Description string        `json:"description,omitempty"`
	Required    bool          `json:"required,omitempty"`
	Default     interface{}   `json:"default,omitempty"`
	Enum        []interface{} `json:"enum,omitempty"`
}

// ToolConfig represents tool configuration.
type ToolConfig struct {
	Name        string                     `json:"name"`
	Description string                     `json:"description"`
	Parameters  map[string]ParameterSchema `json:"parameters,omitempty"`
}

// VectorStoreConfig represents vector store configuration.
type VectorStoreConfig struct {
	Type       string `json:"type"`
	Dimensions int    `json:"dimensions"`
}

// MemoryConfig represents memory configuration.
type MemoryConfig struct {
	Type        string             `json:"type"`
	MaxTokens   int                `json:"maxTokens,omitempty"`
	VectorStore *VectorStoreConfig `json:"vectorStore,omitempty"`
}

// AgentConfig represents agent configuration.
type AgentConfig struct {
	Name          string        `json:"name"`
	Model         ModelConfig   `json:"model"`
	Tools         []ToolConfig  `json:"tools,omitempty"`
	Memory        *MemoryConfig `json:"memory,omitempty"`
	MaxIterations int           `json:"maxIterations,omitempty"`
}

// GNNConfig represents GNN configuration.
type GNNConfig struct {
	Type       string  `json:"type"`
	NumLayers  int     `json:"numLayers"`
	HiddenDim  int     `json:"hiddenDim"`
	NumHeads   int     `json:"numHeads,omitempty"`
	Dropout    float64 `json:"dropout,omitempty"`
	Aggregator string  `json:"aggregator,omitempty"`
}

// ESNConfig represents Echo State Network configuration.
type ESNConfig struct {
	ReservoirSize  int     `json:"reservoirSize"`
	SpectralRadius float64 `json:"spectralRadius"`
	InputScaling   float64 `json:"inputScaling"`
	LeakingRate    float64 `json:"leakingRate"`
	Sparsity       float64 `json:"sparsity,omitempty"`
	Noise          float64 `json:"noise,omitempty"`
	Washout        int     `json:"washout,omitempty"`
}
