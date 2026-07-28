# o9nn Architecture Overview

This document provides a high-level overview of the o9nn monorepo architecture.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Applications                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Web UI    │  │ API Server  │  │   Desktop   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                         SDK Layer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐ │
│  │   Python    │  │ TypeScript  │  │     Go      │  │  C++   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Platform Services                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     Agent Framework                       │   │
│  │  ┌─────────┐  ┌─────────────┐  ┌───────────────────┐    │   │
│  │  │ MetaGPT │  │ CogFoundry  │  │   Orchestration   │    │   │
│  │  └─────────┘  └─────────────┘  └───────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    LLM Infrastructure                     │   │
│  │  ┌───────────┐  ┌──────────┐  ┌─────────────────┐       │   │
│  │  │ Inference │  │ Training │  │     Serving     │       │   │
│  │  └───────────┘  └──────────┘  └─────────────────┘       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                       ML Core Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   PyTorch   │  │     JAX     │  │    ONNX     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │   Graph Neural Nets  │  │   Echo State Nets    │            │
│  │        (GNN)         │  │        (ESN)         │            │
│  └──────────────────────┘  └──────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                        Core Package                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    Types    │  │  Utilities  │  │   Config    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Package Dependencies

```
@o9nn/core
    │
    ├── @o9nn/ml-torch
    │       └── @o9nn/gnn
    │       └── @o9nn/esn
    │
    ├── @o9nn/ml-jax
    │
    ├── @o9nn/llm-inference
    │       └── @o9nn/llm-serving
    │
    ├── @o9nn/agents-orchestration
    │       └── @o9nn/agents-metagpt
    │       └── @o9nn/agents-cogfoundry
    │
    └── @o9nn/sdk-*
            └── @o9nn/cli
```

## Key Design Principles

### 1. Modularity
Each package is self-contained with clear boundaries and minimal dependencies.

### 2. Backend Agnostic
ML components support multiple backends (PyTorch, JAX, ONNX) through unified interfaces.

### 3. Scalability
Designed for distributed training and inference from the ground up.

### 4. Developer Experience
Consistent APIs, comprehensive documentation, and helpful tooling.

## Data Flow

```
Input → Preprocessing → Model Inference → Postprocessing → Output
                 ↓
           Model Registry
                 ↓
         Training Pipeline
                 ↓
         Model Optimization
```

## Component Descriptions

### Core Package
Shared utilities, types, and configurations used across all packages.

### ML Layer
- **PyTorch Integration**: Full PyTorch support with Lightning compatibility
- **JAX Integration**: JAX/Flax support for research workloads
- **ONNX Runtime**: Cross-platform inference optimization

### Specialized ML
- **GNN**: Graph Neural Networks (GCN, GAT, GraphSAGE, GIN)
- **ESN**: Echo State Networks and reservoir computing

### LLM Infrastructure
- **Inference**: Optimized LLM inference (llama.cpp integration)
- **Training**: Fine-tuning and training pipelines
- **Serving**: Production-ready model serving

### Agent Framework
- **Orchestration**: Agent coordination and workflow management
- **MetaGPT**: Multi-agent collaboration
- **CogFoundry**: Cognitive architecture patterns

### SDK Layer
Client libraries for multiple programming languages with consistent APIs.

### Applications
End-user applications built on the platform:
- Web UI: Browser-based interface
- API Server: RESTful/GraphQL API
- Desktop: Native desktop applications
