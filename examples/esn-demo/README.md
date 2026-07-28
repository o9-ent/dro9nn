# ESN Demo

This example demonstrates Echo State Network (Reservoir Computing) capabilities of the o9nn platform.

## Overview

Echo State Networks (ESNs) are a type of recurrent neural network that uses a fixed, randomly generated "reservoir" of neurons. They are particularly effective for:

- **Time Series Prediction**
- **Signal Processing**
- **Dynamic System Modeling**
- **Sequence Classification**

## Basic Time Series Prediction

```python
import asyncio
import numpy as np
from o9nn_sdk import create_sdk, ModelManager
from o9nn_sdk.types import ESNConfig

async def time_series_prediction():
    client = create_sdk(base_url="http://localhost:8080")
    
    async with client:
        models = ModelManager(client)
        
        # Configure ESN
        esn_config = ESNConfig(
            reservoir_size=1000,
            spectral_radius=0.9,
            input_scaling=0.5,
            leaking_rate=0.3,
            sparsity=0.1,
            noise=0.001,
        )
        
        # Load ESN model
        model = await models.load({
            "name": "time-series-esn",
            "backend": "pytorch",
            "device": "cpu",
            "options": esn_config.model_dump(by_alias=True),
        })
        
        # Generate sine wave data
        t = np.linspace(0, 10 * np.pi, 1000)
        data = np.sin(t) + 0.1 * np.random.randn(len(t))
        
        # Predict next values
        result = await models.infer(model.id, {
            "sequence": data.tolist(),
            "predict_steps": 100,
        })
        
        predictions = np.array(result.output)
        print(f"Predicted {len(predictions)} steps")

asyncio.run(time_series_prediction())
```

## Using ReservoirPy

```python
import numpy as np
from reservoirpy.nodes import Reservoir, Ridge

# Create ESN with ReservoirPy
reservoir = Reservoir(
    units=1000,
    sr=0.9,           # spectral radius
    input_scaling=0.5,
    lr=0.3,           # leaking rate
)

readout = Ridge(ridge=1e-6)

# Create ESN model
esn = reservoir >> readout

# Train on data
X_train = np.sin(np.linspace(0, 10*np.pi, 1000)).reshape(-1, 1)
Y_train = np.sin(np.linspace(0.1, 10.1*np.pi, 1000)).reshape(-1, 1)

esn.fit(X_train, Y_train, warmup=100)

# Predict
predictions = esn.run(X_train[-100:])
print(f"Predictions shape: {predictions.shape}")
```

## Chaotic Time Series (Mackey-Glass)

```python
import asyncio
import numpy as np
from o9nn_sdk import create_sdk, ModelManager
from o9nn_sdk.types import ESNConfig

def generate_mackey_glass(n_steps=2000, tau=17, delta_t=1):
    """Generate Mackey-Glass time series."""
    x = np.zeros(n_steps)
    x[0] = 1.2
    
    for i in range(1, n_steps):
        if i < tau:
            x_tau = 0
        else:
            x_tau = x[i - tau]
        
        x[i] = x[i-1] + delta_t * (
            0.2 * x_tau / (1 + x_tau**10) - 0.1 * x[i-1]
        )
    
    return x

async def mackey_glass_prediction():
    client = create_sdk(base_url="http://localhost:8080")
    
    async with client:
        models = ModelManager(client)
        
        # Generate data
        data = generate_mackey_glass()
        train_data = data[:1500]
        test_data = data[1500:]
        
        # Configure ESN for chaotic prediction
        esn_config = ESNConfig(
            reservoir_size=500,
            spectral_radius=0.95,
            input_scaling=0.3,
            leaking_rate=0.5,
            sparsity=0.05,
            washout=100,
        )
        
        model = await models.load({
            "name": "mackey-glass-esn",
            "backend": "pytorch",
            "device": "cpu",
            "options": esn_config.model_dump(by_alias=True),
        })
        
        # Train and predict
        result = await models.infer(model.id, {
            "train_sequence": train_data.tolist(),
            "test_length": len(test_data),
        })
        
        predictions = np.array(result.output)
        mse = np.mean((predictions - test_data)**2)
        print(f"MSE: {mse:.6f}")

asyncio.run(mackey_glass_prediction())
```

## Multi-Step Ahead Prediction

```python
import asyncio
import numpy as np
from o9nn_sdk import create_sdk, ModelManager
from o9nn_sdk.types import ESNConfig

async def multi_step_prediction():
    client = create_sdk(base_url="http://localhost:8080")
    
    async with client:
        models = ModelManager(client)
        
        esn_config = ESNConfig(
            reservoir_size=800,
            spectral_radius=0.85,
            input_scaling=0.4,
            leaking_rate=0.4,
        )
        
        model = await models.load({
            "name": "multi-step-esn",
            "backend": "pytorch",
            "device": "cpu",
            "options": esn_config.model_dump(by_alias=True),
        })
        
        # Multi-variate time series
        t = np.linspace(0, 20 * np.pi, 2000)
        data = np.column_stack([
            np.sin(t),
            np.cos(t),
            np.sin(2 * t),
        ])
        
        result = await models.infer(model.id, {
            "sequence": data.tolist(),
            "predict_steps": 200,
            "variables": 3,
        })
        
        predictions = np.array(result.output)
        print(f"Predicted shape: {predictions.shape}")

asyncio.run(multi_step_prediction())
```

## ESN Configuration Parameters

| Parameter | Description | Typical Range |
|-----------|-------------|---------------|
| `reservoir_size` | Number of reservoir neurons | 100-5000 |
| `spectral_radius` | Controls memory and dynamics | 0.8-0.99 |
| `input_scaling` | Scales input to reservoir | 0.1-1.0 |
| `leaking_rate` | Controls integration speed | 0.1-1.0 |
| `sparsity` | Fraction of zero weights | 0.0-0.9 |
| `noise` | Regularization noise | 0.0001-0.01 |
| `washout` | Initial states to discard | 50-500 |

## Supported Tasks

| Task | Status |
|------|--------|
| Time Series Prediction | ✅ |
| Sequence Classification | ✅ |
| Signal Filtering | ✅ |
| Anomaly Detection | ✅ |
| System Identification | ✅ |
| Speech Recognition | 🔄 Coming Soon |
