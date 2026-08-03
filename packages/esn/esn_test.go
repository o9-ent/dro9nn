package esn

import (
	"math"
	"testing"
)

func TestNewESN(t *testing.T) {
	config := DefaultConfig(2, 1, 100)
	esn, err := New(config)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	if esn.config.InputSize != 2 {
		t.Errorf("InputSize = %v, want %v", esn.config.InputSize, 2)
	}
	if esn.config.OutputSize != 1 {
		t.Errorf("OutputSize = %v, want %v", esn.config.OutputSize, 1)
	}
	if esn.config.ReservoirSize != 100 {
		t.Errorf("ReservoirSize = %v, want %v", esn.config.ReservoirSize, 100)
	}
}

func TestNewESN_InvalidConfig(t *testing.T) {
	tests := []struct {
		name   string
		config *Config
	}{
		{
			name:   "zero input size",
			config: &Config{InputSize: 0, OutputSize: 1, ReservoirSize: 100, SpectralRadius: 0.9, LeakingRate: 0.3},
		},
		{
			name:   "zero output size",
			config: &Config{InputSize: 1, OutputSize: 0, ReservoirSize: 100, SpectralRadius: 0.9, LeakingRate: 0.3},
		},
		{
			name:   "zero reservoir size",
			config: &Config{InputSize: 1, OutputSize: 1, ReservoirSize: 0, SpectralRadius: 0.9, LeakingRate: 0.3},
		},
		{
			name:   "negative spectral radius",
			config: &Config{InputSize: 1, OutputSize: 1, ReservoirSize: 100, SpectralRadius: -0.5, LeakingRate: 0.3},
		},
		{
			name:   "zero leaking rate",
			config: &Config{InputSize: 1, OutputSize: 1, ReservoirSize: 100, SpectralRadius: 0.9, LeakingRate: 0},
		},
		{
			name:   "leaking rate > 1",
			config: &Config{InputSize: 1, OutputSize: 1, ReservoirSize: 100, SpectralRadius: 0.9, LeakingRate: 1.5},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := New(tt.config)
			if err == nil {
				t.Errorf("New() expected error for %s", tt.name)
			}
		})
	}
}

func TestVector(t *testing.T) {
	v := NewVector(5)
	if v.Size != 5 {
		t.Errorf("Size = %v, want %v", v.Size, 5)
	}

	// Test copy
	v.Data[0] = 1.0
	v.Data[2] = 3.0
	copy := v.Copy()
	if copy.Data[0] != 1.0 || copy.Data[2] != 3.0 {
		t.Errorf("Copy() not copying data correctly")
	}

	// Modify original shouldn't affect copy
	v.Data[0] = 100.0
	if copy.Data[0] != 1.0 {
		t.Errorf("Copy() not independent")
	}
}

func TestVectorFromSlice(t *testing.T) {
	data := []float64{1.0, 2.0, 3.0}
	v := NewVectorFromSlice(data)

	if v.Size != 3 {
		t.Errorf("Size = %v, want %v", v.Size, 3)
	}
	if v.Data[1] != 2.0 {
		t.Errorf("Data[1] = %v, want %v", v.Data[1], 2.0)
	}

	// Modify original shouldn't affect vector
	data[0] = 100.0
	if v.Data[0] != 1.0 {
		t.Errorf("Vector not independent from source slice")
	}
}

func TestMatrix(t *testing.T) {
	m := NewMatrix(3, 4)
	if m.Rows != 3 || m.Cols != 4 {
		t.Errorf("Matrix dimensions = (%v, %v), want (3, 4)", m.Rows, m.Cols)
	}

	m.Set(1, 2, 5.0)
	if m.Get(1, 2) != 5.0 {
		t.Errorf("Get(1, 2) = %v, want %v", m.Get(1, 2), 5.0)
	}

	// Test copy
	copy := m.Copy()
	if copy.Get(1, 2) != 5.0 {
		t.Errorf("Copy() Get(1, 2) = %v, want %v", copy.Get(1, 2), 5.0)
	}

	// Modify original shouldn't affect copy
	m.Set(1, 2, 100.0)
	if copy.Get(1, 2) != 5.0 {
		t.Errorf("Copy() not independent")
	}
}

func TestESNUpdate(t *testing.T) {
	config := DefaultConfig(2, 1, 50)
	esn, err := New(config)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	input := NewVectorFromSlice([]float64{1.0, 0.5})
	state := esn.Update(input)

	if state.Size != 50 {
		t.Errorf("State size = %v, want %v", state.Size, 50)
	}

	// State should not be all zeros after update
	allZero := true
	for _, v := range state.Data {
		if v != 0 {
			allZero = false
			break
		}
	}
	if allZero {
		t.Errorf("State should not be all zeros after update")
	}
}

func TestESNReset(t *testing.T) {
	config := DefaultConfig(2, 1, 50)
	esn, err := New(config)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	// Update state
	input := NewVectorFromSlice([]float64{1.0, 0.5})
	esn.Update(input)

	// Reset
	esn.Reset()
	state := esn.State()

	// State should be all zeros
	for i, v := range state.Data {
		if v != 0 {
			t.Errorf("State[%d] = %v after reset, want 0", i, v)
			break
		}
	}
}

func TestCollectStates(t *testing.T) {
	config := DefaultConfig(2, 1, 30)
	esn, err := New(config)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	// Create input sequence
	inputs := make([]*Vector, 100)
	for i := 0; i < 100; i++ {
		inputs[i] = NewVectorFromSlice([]float64{
			math.Sin(float64(i) * 0.1),
			math.Cos(float64(i) * 0.1),
		})
	}

	states, err := esn.CollectStates(inputs)
	if err != nil {
		t.Fatalf("CollectStates() error = %v", err)
	}

	if len(states) != 100 {
		t.Errorf("len(states) = %v, want %v", len(states), 100)
	}
}

func TestCollectStates_EmptyInput(t *testing.T) {
	config := DefaultConfig(2, 1, 30)
	esn, err := New(config)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	_, err = esn.CollectStates([]*Vector{})
	if err == nil {
		t.Errorf("CollectStates() expected error for empty input")
	}
}

func TestCollectStates_WrongInputSize(t *testing.T) {
	config := DefaultConfig(2, 1, 30)
	esn, err := New(config)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	inputs := []*Vector{
		NewVectorFromSlice([]float64{1.0, 2.0}),
		NewVectorFromSlice([]float64{1.0, 2.0, 3.0}), // Wrong size
	}

	_, err = esn.CollectStates(inputs)
	if err == nil {
		t.Errorf("CollectStates() expected error for wrong input size")
	}
}

func TestFitAndPredict(t *testing.T) {
	config := DefaultConfig(1, 1, 100)
	config.Washout = 50
	config.RegularizationCoef = 1e-4

	esn, err := New(config)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	// Generate sine wave data
	n := 500
	inputs := make([]*Vector, n)
	targets := make([]*Vector, n)
	for i := 0; i < n; i++ {
		inputs[i] = NewVectorFromSlice([]float64{math.Sin(float64(i) * 0.1)})
		// Target is next step
		targets[i] = NewVectorFromSlice([]float64{math.Sin(float64(i+1) * 0.1)})
	}

	// Train
	err = esn.Fit(inputs, targets)
	if err != nil {
		t.Fatalf("Fit() error = %v", err)
	}

	if !esn.IsTrained() {
		t.Errorf("ESN should be trained after Fit()")
	}

	// Test prediction
	esn.Reset()
	testInputs := make([]*Vector, 100)
	for i := 0; i < 100; i++ {
		testInputs[i] = NewVectorFromSlice([]float64{math.Sin(float64(i) * 0.1)})
	}

	outputs, err := esn.PredictSequence(testInputs)
	if err != nil {
		t.Fatalf("PredictSequence() error = %v", err)
	}

	// Outputs should exist
	if len(outputs) != 100 {
		t.Errorf("len(outputs) = %v, want %v", len(outputs), 100)
	}

	// Check that predictions are reasonable (not NaN/Inf)
	for i, out := range outputs {
		if math.IsNaN(out.Data[0]) || math.IsInf(out.Data[0], 0) {
			t.Errorf("Output[%d] is NaN or Inf", i)
		}
	}
}

func TestFit_LengthMismatch(t *testing.T) {
	config := DefaultConfig(1, 1, 50)
	esn, err := New(config)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	inputs := make([]*Vector, 10)
	targets := make([]*Vector, 5)
	for i := range inputs {
		inputs[i] = NewVector(1)
	}
	for i := range targets {
		targets[i] = NewVector(1)
	}

	err = esn.Fit(inputs, targets)
	if err == nil {
		t.Errorf("Fit() expected error for length mismatch")
	}
}

func TestFit_ShortSequence(t *testing.T) {
	config := DefaultConfig(1, 1, 50)
	config.Washout = 100
	esn, err := New(config)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	inputs := make([]*Vector, 50)
	targets := make([]*Vector, 50)
	for i := range inputs {
		inputs[i] = NewVector(1)
		targets[i] = NewVector(1)
	}

	err = esn.Fit(inputs, targets)
	if err == nil {
		t.Errorf("Fit() expected error for sequence shorter than washout")
	}
}

func TestPredict_Untrained(t *testing.T) {
	config := DefaultConfig(1, 1, 50)
	esn, err := New(config)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	input := NewVector(1)
	_, err = esn.Predict(input)
	if err == nil {
		t.Errorf("Predict() expected error for untrained ESN")
	}
}

func TestCholeskyDecomposition(t *testing.T) {
	// Create positive definite matrix A = [[4, 2], [2, 5]]
	A := NewMatrix(2, 2)
	A.Set(0, 0, 4)
	A.Set(0, 1, 2)
	A.Set(1, 0, 2)
	A.Set(1, 1, 5)

	L, err := choleskyDecomposition(A)
	if err != nil {
		t.Fatalf("choleskyDecomposition() error = %v", err)
	}

	// Verify L * L^T = A
	for i := 0; i < 2; i++ {
		for j := 0; j < 2; j++ {
			sum := 0.0
			for k := 0; k < 2; k++ {
				sum += L.Get(i, k) * L.Get(j, k)
			}
			if math.Abs(sum-A.Get(i, j)) > 1e-10 {
				t.Errorf("L * L^T [%d,%d] = %v, want %v", i, j, sum, A.Get(i, j))
			}
		}
	}
}

func TestDefaultConfig(t *testing.T) {
	config := DefaultConfig(3, 2, 500)

	if config.InputSize != 3 {
		t.Errorf("InputSize = %v, want %v", config.InputSize, 3)
	}
	if config.OutputSize != 2 {
		t.Errorf("OutputSize = %v, want %v", config.OutputSize, 2)
	}
	if config.ReservoirSize != 500 {
		t.Errorf("ReservoirSize = %v, want %v", config.ReservoirSize, 500)
	}
	if config.SpectralRadius != 0.9 {
		t.Errorf("SpectralRadius = %v, want %v", config.SpectralRadius, 0.9)
	}
}

func BenchmarkESNUpdate(b *testing.B) {
	config := DefaultConfig(10, 5, 1000)
	esn, _ := New(config)
	input := NewVector(10)
	for i := 0; i < 10; i++ {
		input.Data[i] = float64(i) / 10.0
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		esn.Update(input)
	}
}

func BenchmarkESNFit(b *testing.B) {
	config := DefaultConfig(5, 3, 200)
	config.Washout = 50

	n := 500
	inputs := make([]*Vector, n)
	targets := make([]*Vector, n)
	for i := 0; i < n; i++ {
		inputs[i] = NewVectorFromSlice([]float64{
			math.Sin(float64(i) * 0.1),
			math.Cos(float64(i) * 0.1),
			math.Sin(float64(i) * 0.2),
			math.Cos(float64(i) * 0.2),
			math.Sin(float64(i) * 0.05),
		})
		targets[i] = NewVectorFromSlice([]float64{
			math.Sin(float64(i+1) * 0.1),
			math.Cos(float64(i+1) * 0.1),
			math.Sin(float64(i+1) * 0.2),
		})
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		esn, _ := New(config)
		esn.Fit(inputs, targets)
	}
}
