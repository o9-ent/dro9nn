# Kubernetes Deployment

This directory contains Kubernetes configurations for deploying o9nn services.

## Structure

```
kubernetes/
├── charts/              # Helm charts
│   ├── o9nn-api/        # API server chart
│   ├── o9nn-inference/  # Inference service chart
│   └── o9nn-web/        # Web UI chart
├── operators/           # Custom operators
└── base/                # Base configurations
```

## Quick Start

### Prerequisites

- Kubernetes cluster (1.28+)
- kubectl configured
- Helm 3.x installed

### Deploy with Helm

```bash
# Add o9nn Helm repository
helm repo add o9nn https://charts.o9nn.org
helm repo update

# Install the API server
helm install o9nn-api o9nn/o9nn-api \
  --namespace o9nn \
  --create-namespace

# Install the inference service
helm install o9nn-inference o9nn/o9nn-inference \
  --namespace o9nn \
  --set replicas=3 \
  --set resources.limits.nvidia.com/gpu=1
```

### Configuration

See individual chart READMEs for configuration options.

## GPU Support

For GPU-accelerated inference:

```yaml
# values.yaml
resources:
  limits:
    nvidia.com/gpu: 1
  requests:
    nvidia.com/gpu: 1

nodeSelector:
  accelerator: nvidia-tesla-t4

tolerations:
  - key: nvidia.com/gpu
    operator: Exists
    effect: NoSchedule
```

## Monitoring

Deploy with Prometheus/Grafana:

```bash
helm install o9nn-monitoring o9nn/o9nn-monitoring \
  --namespace o9nn-monitoring \
  --create-namespace
```

## Scaling

Configure Horizontal Pod Autoscaler:

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```
