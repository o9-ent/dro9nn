// Package esn provides Echo State Network (ESN) and Reservoir Computing implementations.
//
// Echo State Networks are recurrent neural networks with a random, fixed
// "reservoir" of recurrently connected neurons. Only the output weights
// are trained, typically using ridge regression.
//
// Features:
//   - Classic Echo State Networks
//   - Leaky integrator neurons
//   - Multiple readout strategies
//   - Time series prediction
//   - Chaotic system modeling
package esn

import (
	"fmt"
	"math"
	"math/rand"
)

// Version of the ESN package
const Version = "0.1.0"

// Config holds ESN configuration parameters
type Config struct {
	// InputSize is the dimension of input vectors
	InputSize int

	// OutputSize is the dimension of output vectors
	OutputSize int

	// ReservoirSize is the number of reservoir neurons
	ReservoirSize int

	// SpectralRadius controls the echo state property (typically < 1)
	SpectralRadius float64

	// InputScaling scales the input weights
	InputScaling float64

	// LeakingRate controls leaky integration (0 < α ≤ 1)
	LeakingRate float64

	// Sparsity of reservoir connections (0-1)
	Sparsity float64

	// Noise level for regularization
	Noise float64

	// Washout number of initial steps to discard
	Washout int

	// RegularizationCoef for ridge regression (λ)
	RegularizationCoef float64

	// Seed for random number generation
	Seed int64
}

// DefaultConfig returns default ESN configuration
func DefaultConfig(inputSize, outputSize, reservoirSize int) *Config {
	return &Config{
		InputSize:          inputSize,
		OutputSize:         outputSize,
		ReservoirSize:      reservoirSize,
		SpectralRadius:     0.9,
		InputScaling:       0.5,
		LeakingRate:        0.3,
		Sparsity:           0.9,
		Noise:              0.0001,
		Washout:            100,
		RegularizationCoef: 1e-6,
		Seed:               42,
	}
}

// ESN represents an Echo State Network
type ESN struct {
	config *Config

	// Matrices
	Win  *Matrix // Input weights [reservoirSize x inputSize]
	W    *Matrix // Reservoir weights [reservoirSize x reservoirSize]
	Wout *Matrix // Output weights [outputSize x (reservoirSize + inputSize)]

	// State
	state *Vector // Current reservoir state [reservoirSize]

	// Random source
	rng *rand.Rand

	// Training flag
	trained bool
}

// New creates a new ESN with the given configuration
func New(config *Config) (*ESN, error) {
	if config.InputSize <= 0 {
		return nil, fmt.Errorf("input size must be positive")
	}
	if config.OutputSize <= 0 {
		return nil, fmt.Errorf("output size must be positive")
	}
	if config.ReservoirSize <= 0 {
		return nil, fmt.Errorf("reservoir size must be positive")
	}
	if config.SpectralRadius <= 0 || config.SpectralRadius >= 1.5 {
		return nil, fmt.Errorf("spectral radius should be in (0, 1.5)")
	}
	if config.LeakingRate <= 0 || config.LeakingRate > 1 {
		return nil, fmt.Errorf("leaking rate must be in (0, 1]")
	}

	esn := &ESN{
		config: config,
		rng:    rand.New(rand.NewSource(config.Seed)),
	}

	// Initialize matrices
	esn.initializeWeights()

	return esn, nil
}

// initializeWeights creates random input and reservoir weight matrices
func (esn *ESN) initializeWeights() {
	cfg := esn.config

	// Initialize input weights Win
	esn.Win = NewMatrix(cfg.ReservoirSize, cfg.InputSize)
	for i := 0; i < cfg.ReservoirSize; i++ {
		for j := 0; j < cfg.InputSize; j++ {
			esn.Win.Set(i, j, (esn.rng.Float64()*2-1)*cfg.InputScaling)
		}
	}

	// Initialize reservoir weights W with sparsity
	esn.W = NewMatrix(cfg.ReservoirSize, cfg.ReservoirSize)
	for i := 0; i < cfg.ReservoirSize; i++ {
		for j := 0; j < cfg.ReservoirSize; j++ {
			if esn.rng.Float64() > cfg.Sparsity {
				esn.W.Set(i, j, esn.rng.Float64()*2-1)
			}
		}
	}

	// Scale to desired spectral radius
	esn.scaleSpectralRadius()

	// Initialize state to zeros
	esn.state = NewVector(cfg.ReservoirSize)
}

// scaleSpectralRadius scales W to have the desired spectral radius
func (esn *ESN) scaleSpectralRadius() {
	// Use power iteration to estimate spectral radius
	n := esn.config.ReservoirSize
	x := NewVector(n)
	for i := 0; i < n; i++ {
		x.Data[i] = esn.rng.Float64()
	}

	// Power iteration (100 iterations)
	for iter := 0; iter < 100; iter++ {
		// y = W * x
		y := NewVector(n)
		for i := 0; i < n; i++ {
			sum := 0.0
			for j := 0; j < n; j++ {
				sum += esn.W.Get(i, j) * x.Data[j]
			}
			y.Data[i] = sum
		}

		// Normalize
		norm := 0.0
		for i := 0; i < n; i++ {
			norm += y.Data[i] * y.Data[i]
		}
		norm = math.Sqrt(norm)
		if norm > 0 {
			for i := 0; i < n; i++ {
				x.Data[i] = y.Data[i] / norm
			}
		}
	}

	// Compute Rayleigh quotient
	// eigenvalue ≈ (x^T * W * x) / (x^T * x)
	wx := NewVector(n)
	for i := 0; i < n; i++ {
		sum := 0.0
		for j := 0; j < n; j++ {
			sum += esn.W.Get(i, j) * x.Data[j]
		}
		wx.Data[i] = sum
	}

	numerator := 0.0
	denominator := 0.0
	for i := 0; i < n; i++ {
		numerator += x.Data[i] * wx.Data[i]
		denominator += x.Data[i] * x.Data[i]
	}

	currentRadius := math.Abs(numerator / denominator)

	// Scale W
	if currentRadius > 0 {
		scale := esn.config.SpectralRadius / currentRadius
		for i := 0; i < n; i++ {
			for j := 0; j < n; j++ {
				esn.W.Set(i, j, esn.W.Get(i, j)*scale)
			}
		}
	}
}

// Update performs one reservoir update step
// x(t+1) = (1-α)x(t) + α·tanh(Win·u(t+1) + W·x(t))
func (esn *ESN) Update(input *Vector) *Vector {
	cfg := esn.config
	n := cfg.ReservoirSize

	// Compute Win * input
	winU := NewVector(n)
	for i := 0; i < n; i++ {
		sum := 0.0
		for j := 0; j < cfg.InputSize; j++ {
			sum += esn.Win.Get(i, j) * input.Data[j]
		}
		winU.Data[i] = sum
	}

	// Compute W * state
	wX := NewVector(n)
	for i := 0; i < n; i++ {
		sum := 0.0
		for j := 0; j < n; j++ {
			sum += esn.W.Get(i, j) * esn.state.Data[j]
		}
		wX.Data[i] = sum
	}

	// Leaky integrator update
	alpha := cfg.LeakingRate
	for i := 0; i < n; i++ {
		// Add noise for regularization
		noise := 0.0
		if cfg.Noise > 0 {
			noise = (esn.rng.Float64()*2 - 1) * cfg.Noise
		}

		preActivation := winU.Data[i] + wX.Data[i] + noise
		newState := (1-alpha)*esn.state.Data[i] + alpha*math.Tanh(preActivation)
		esn.state.Data[i] = newState
	}

	return esn.state.Copy()
}

// CollectStates runs the reservoir on input sequence and collects states
func (esn *ESN) CollectStates(inputs []*Vector) ([]*Vector, error) {
	if len(inputs) == 0 {
		return nil, fmt.Errorf("empty input sequence")
	}

	cfg := esn.config
	states := make([]*Vector, len(inputs))

	// Reset state
	esn.state = NewVector(cfg.ReservoirSize)

	// Run through inputs
	for t, input := range inputs {
		if input.Size != cfg.InputSize {
			return nil, fmt.Errorf("input at t=%d has wrong size: got %d, want %d",
				t, input.Size, cfg.InputSize)
		}
		states[t] = esn.Update(input)
	}

	return states, nil
}

// Fit trains the ESN on input-output pairs using ridge regression
func (esn *ESN) Fit(inputs, targets []*Vector) error {
	if len(inputs) != len(targets) {
		return fmt.Errorf("inputs and targets must have same length")
	}
	if len(inputs) <= esn.config.Washout {
		return fmt.Errorf("input length must be greater than washout")
	}

	cfg := esn.config

	// Collect reservoir states
	states, err := esn.CollectStates(inputs)
	if err != nil {
		return fmt.Errorf("collecting states: %w", err)
	}

	// Build design matrix X (after washout)
	// X = [state | input] for extended state
	effectiveLength := len(inputs) - cfg.Washout
	extendedSize := cfg.ReservoirSize + cfg.InputSize

	// Build X matrix [effectiveLength x extendedSize]
	X := NewMatrix(effectiveLength, extendedSize)
	for t := 0; t < effectiveLength; t++ {
		actualT := t + cfg.Washout
		// Copy state
		for i := 0; i < cfg.ReservoirSize; i++ {
			X.Set(t, i, states[actualT].Data[i])
		}
		// Copy input
		for i := 0; i < cfg.InputSize; i++ {
			X.Set(t, cfg.ReservoirSize+i, inputs[actualT].Data[i])
		}
	}

	// Build Y matrix [effectiveLength x outputSize]
	Y := NewMatrix(effectiveLength, cfg.OutputSize)
	for t := 0; t < effectiveLength; t++ {
		actualT := t + cfg.Washout
		for i := 0; i < cfg.OutputSize; i++ {
			Y.Set(t, i, targets[actualT].Data[i])
		}
	}

	// Ridge regression: Wout = (X^T X + λI)^(-1) X^T Y
	// First compute X^T X
	XtX := NewMatrix(extendedSize, extendedSize)
	for i := 0; i < extendedSize; i++ {
		for j := 0; j < extendedSize; j++ {
			sum := 0.0
			for t := 0; t < effectiveLength; t++ {
				sum += X.Get(t, i) * X.Get(t, j)
			}
			XtX.Set(i, j, sum)
		}
	}

	// Add regularization: XtX += λI
	for i := 0; i < extendedSize; i++ {
		XtX.Set(i, i, XtX.Get(i, i)+cfg.RegularizationCoef)
	}

	// Compute X^T Y
	XtY := NewMatrix(extendedSize, cfg.OutputSize)
	for i := 0; i < extendedSize; i++ {
		for j := 0; j < cfg.OutputSize; j++ {
			sum := 0.0
			for t := 0; t < effectiveLength; t++ {
				sum += X.Get(t, i) * Y.Get(t, j)
			}
			XtY.Set(i, j, sum)
		}
	}

	// Solve using Cholesky decomposition
	// Since XtX is symmetric positive definite
	L, err := choleskyDecomposition(XtX)
	if err != nil {
		return fmt.Errorf("cholesky decomposition failed: %w", err)
	}

	// Solve L * Z = XtY (forward substitution)
	Z := NewMatrix(extendedSize, cfg.OutputSize)
	for j := 0; j < cfg.OutputSize; j++ {
		for i := 0; i < extendedSize; i++ {
			sum := XtY.Get(i, j)
			for k := 0; k < i; k++ {
				sum -= L.Get(i, k) * Z.Get(k, j)
			}
			Z.Set(i, j, sum/L.Get(i, i))
		}
	}

	// Solve L^T * Wout^T = Z (backward substitution)
	WoutT := NewMatrix(extendedSize, cfg.OutputSize)
	for j := 0; j < cfg.OutputSize; j++ {
		for i := extendedSize - 1; i >= 0; i-- {
			sum := Z.Get(i, j)
			for k := i + 1; k < extendedSize; k++ {
				sum -= L.Get(k, i) * WoutT.Get(k, j)
			}
			WoutT.Set(i, j, sum/L.Get(i, i))
		}
	}

	// Transpose to get Wout [outputSize x extendedSize]
	esn.Wout = NewMatrix(cfg.OutputSize, extendedSize)
	for i := 0; i < cfg.OutputSize; i++ {
		for j := 0; j < extendedSize; j++ {
			esn.Wout.Set(i, j, WoutT.Get(j, i))
		}
	}

	esn.trained = true
	return nil
}

// Predict generates output for a single input
func (esn *ESN) Predict(input *Vector) (*Vector, error) {
	if !esn.trained {
		return nil, fmt.Errorf("ESN has not been trained")
	}

	cfg := esn.config

	// Update reservoir state
	_ = esn.Update(input)

	// Build extended state [state | input]
	extended := NewVector(cfg.ReservoirSize + cfg.InputSize)
	for i := 0; i < cfg.ReservoirSize; i++ {
		extended.Data[i] = esn.state.Data[i]
	}
	for i := 0; i < cfg.InputSize; i++ {
		extended.Data[cfg.ReservoirSize+i] = input.Data[i]
	}

	// Compute output: y = Wout * extended
	output := NewVector(cfg.OutputSize)
	for i := 0; i < cfg.OutputSize; i++ {
		sum := 0.0
		for j := 0; j < extended.Size; j++ {
			sum += esn.Wout.Get(i, j) * extended.Data[j]
		}
		output.Data[i] = sum
	}

	return output, nil
}

// PredictSequence generates outputs for a sequence of inputs
func (esn *ESN) PredictSequence(inputs []*Vector) ([]*Vector, error) {
	outputs := make([]*Vector, len(inputs))
	for t, input := range inputs {
		output, err := esn.Predict(input)
		if err != nil {
			return nil, fmt.Errorf("prediction at t=%d: %w", t, err)
		}
		outputs[t] = output
	}
	return outputs, nil
}

// Reset resets the reservoir state to zeros
func (esn *ESN) Reset() {
	esn.state = NewVector(esn.config.ReservoirSize)
}

// State returns a copy of the current reservoir state
func (esn *ESN) State() *Vector {
	return esn.state.Copy()
}

// Config returns the ESN configuration
func (esn *ESN) Config() *Config {
	return esn.config
}

// IsTrained returns whether the ESN has been trained
func (esn *ESN) IsTrained() bool {
	return esn.trained
}

// choleskyDecomposition computes L such that A = L * L^T
func choleskyDecomposition(A *Matrix) (*Matrix, error) {
	n := A.Rows
	L := NewMatrix(n, n)

	for i := 0; i < n; i++ {
		for j := 0; j <= i; j++ {
			sum := 0.0
			for k := 0; k < j; k++ {
				sum += L.Get(i, k) * L.Get(j, k)
			}

			if i == j {
				val := A.Get(i, i) - sum
				if val <= 0 {
					return nil, fmt.Errorf("matrix is not positive definite")
				}
				L.Set(i, j, math.Sqrt(val))
			} else {
				L.Set(i, j, (A.Get(i, j)-sum)/L.Get(j, j))
			}
		}
	}

	return L, nil
}

// Vector is a simple 1D float array
type Vector struct {
	Data []float64
	Size int
}

// NewVector creates a new zero vector
func NewVector(size int) *Vector {
	return &Vector{
		Data: make([]float64, size),
		Size: size,
	}
}

// NewVectorFromSlice creates a vector from a slice
func NewVectorFromSlice(data []float64) *Vector {
	copied := make([]float64, len(data))
	copy(copied, data)
	return &Vector{
		Data: copied,
		Size: len(data),
	}
}

// Copy returns a copy of the vector
func (v *Vector) Copy() *Vector {
	return NewVectorFromSlice(v.Data)
}

// Matrix is a simple 2D float array in row-major order
type Matrix struct {
	Data []float64
	Rows int
	Cols int
}

// NewMatrix creates a new zero matrix
func NewMatrix(rows, cols int) *Matrix {
	return &Matrix{
		Data: make([]float64, rows*cols),
		Rows: rows,
		Cols: cols,
	}
}

// Get returns the element at (row, col)
func (m *Matrix) Get(row, col int) float64 {
	return m.Data[row*m.Cols+col]
}

// Set sets the element at (row, col)
func (m *Matrix) Set(row, col int, val float64) {
	m.Data[row*m.Cols+col] = val
}

// Copy returns a copy of the matrix
func (m *Matrix) Copy() *Matrix {
	newM := NewMatrix(m.Rows, m.Cols)
	copy(newM.Data, m.Data)
	return newM
}
