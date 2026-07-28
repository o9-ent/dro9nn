# Docker Configuration

This directory contains Docker configurations for o9nn services.

## Images

### Base Images

- `o9nn/base-python`: Python base image with ML dependencies
- `o9nn/base-go`: Go base image
- `o9nn/base-node`: Node.js base image

### Service Images

- `o9nn/api-server`: API server
- `o9nn/inference`: Inference service
- `o9nn/web-ui`: Web interface

## Building Images

```bash
# Build all images
docker compose build

# Build specific image
docker compose build api-server

# Build with custom tag
docker build -t o9nn/api-server:v1.0.0 ./apps/api-server
```

## Docker Compose

For local development:

```bash
# Start all services
docker compose up -d

# Start specific services
docker compose up -d api-server redis

# View logs
docker compose logs -f api-server

# Stop all services
docker compose down
```

## GPU Support

For GPU-accelerated containers:

```yaml
# docker-compose.gpu.yml
services:
  inference:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

Run with:
```bash
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d
```

## Multi-Architecture Builds

Build for multiple architectures:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag o9nn/api-server:latest \
  --push \
  ./apps/api-server
```

## Security

- All images run as non-root users
- Minimal base images (distroless where possible)
- Regular security scanning with Trivy
- No secrets in images (use runtime injection)
