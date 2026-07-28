# o9nn Integrated Monorepo

<p align="center">
  <strong>AI/ML Platform • LLM Infrastructure • Agent Systems • Graph Neural Networks</strong>
</p>

<p align="center">
  <a href="https://github.com/o9nn/dro9nn/actions/workflows/core-ci.yml"><img src="https://github.com/o9nn/dro9nn/actions/workflows/core-ci.yml/badge.svg" alt="CI Status"></a>
  <a href="https://github.com/o9nn/dro9nn/actions/workflows/security-scan.yml"><img src="https://github.com/o9nn/dro9nn/actions/workflows/security-scan.yml/badge.svg" alt="Security Scan"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>

---

## Overview

This monorepo contains the integrated o9nn ecosystem, providing:

- **🧠 ML Frameworks**: PyTorch, JAX, ONNX integrations
- **💬 LLM Infrastructure**: Inference, training, and serving
- **🤖 Agent Systems**: Multi-agent orchestration and cognitive architectures
- **🔗 Graph Neural Networks**: GCN, GAT, GraphSAGE, GIN implementations
- **🌊 Reservoir Computing**: Echo State Networks (ESN)
- **📦 SDKs**: Python, TypeScript, Go, C++ client libraries
- **🛠️ CLI Tools**: Model management and development utilities

## Quick Start

```bash
# Clone the repository
git clone https://github.com/o9nn/dro9nn.git
cd dro9nn

# Install dependencies
pnpm install

# Build all packages
pnpm turbo build

# Run tests
pnpm turbo test
```

## Package Structure

```
packages/
├── core/           # Shared utilities and types
├── ml/             # ML framework integrations
│   ├── torch/      # PyTorch ecosystem
│   ├── jax/        # JAX ecosystem
│   └── onnx/       # ONNX runtime
├── llm/            # LLM infrastructure
│   ├── inference/  # Model inference
│   ├── training/   # Fine-tuning
│   └── serving/    # Production serving
├── agents/         # Agent systems
│   ├── orchestration/
│   ├── metagpt/
│   └── cogfoundry/
├── gnn/            # Graph Neural Networks
├── esn/            # Echo State Networks
├── sdk/            # Client SDKs
└── cli/            # CLI tools
```

## Documentation

- [Getting Started](./docs/guides/installation.md)
- [API Reference](./docs/api/)
- [Architecture](./docs/architecture/overview.md)
- [Contributing](./CONTRIBUTING.md)

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

```bash
# Development mode
pnpm dev

# Lint
pnpm lint

# Type check
pnpm typecheck

# Format
pnpm format
```

## License

MIT © o9nn Organization

---

## Legacy Repository Mapping

This repository also serves as a fractal representation of the **o9nn** GitHub organization.

### Structure (Level 2 Mapping)

- **This Repo** (`o9-ent/o9nn`) = o9nn organization
- **Folders** = Repositories in o9nn
- **Files in Folders** = Root contents of each repository

### Statistics

| Metric | Count |
|--------|-------|
| Repositories | 579 |

## Repositories

| Repository | Description |
|------------|-------------|
| [o9c](./o9c/) | o9c |
| [NeuroPilot](./NeuroPilot/) | An Outer Wilds mod to give ship autopilot control  |
| [BepInEx](./BepInEx/) | Unity / XNA game patcher and plugin framework |
| [typescript-neuro-game-sdk](./typescript-neuro-game-sdk/) | A TypeScript/JavaScript SDK for integrating games  |
| [typescript-neuro-game-api](./typescript-neuro-game-api/) | JavaScript/TypeScript package to assist in making  |
| [neuro-sama](./neuro-sama/) | Neuro SDK + API for allowing Neuro to play games |
| [neuro-sdk](./neuro-sdk/) | Neuro SDK + API for allowing Neuro to play games |
| [airi](./airi/) | 💖🧸 Self hosted, you owned Grok Companion, a contai |
| [the-org](./the-org/) | Agents for organizations |
| [reka-ui](./reka-ui/) | An open-source UI component library for building h |
| [moeru-ai](./moeru-ai/) | No description |
| [Game-Bots](./Game-Bots/) | Ultimate Game Bot Guide (Vol. 1) |
| [action-send-mail](./action-send-mail/) | :gear: A GitHub Action to send an email to multipl |
| [copilot-cli](./copilot-cli/) | GitHub Copilot CLI brings the power of Copilot cod |
| [graphiql](./graphiql/) | GraphiQL & the GraphQL LSP Reference Ecosystem for |
| [daedalOS](./daedalOS/) | Desktop environment in the browser |
| [socket.io](./socket.io/) | Realtime application framework (Node.JS server) |
| [socket.io-client-cpp](./socket.io-client-cpp/) | C++11 implementation of Socket.IO client |
| [vcpkg](./vcpkg/) | C++ Library Manager for Windows, Linux, and MacOS |
| [ecma262](./ecma262/) | Status, process, and documents for ECMA-262 |
| [ecmarkup](./ecmarkup/) | An HTML superset/Markdown subset source format for |
| [re2](./re2/) | RE2 is a fast, safe, thread-friendly alternative t |
| [bazelisk](./bazelisk/) | A user-friendly launcher for Bazel. |
| [bazel-central-registry](./bazel-central-registry/) | The central registry of Bazel modules for the Bzlm |
| [nvm](./nvm/) | Node Version Manager - POSIX-compliant bash script |
| [node](./node/) | Node.js JavaScript runtime ✨🐢🚀✨ |
| [gitea](./gitea/) | Git with a cup of tea! Painless self-hosted all-in |
| [9it](./9it/) | Git with a cup of tea! Painless self-hosted all-in |
| [dnslib-cpp](./dnslib-cpp/) | C++ library for encoding and decoding of DNS proto |
| [character-card-spec-v3](./character-card-spec-v3/) | A updated spec for character card used on roleplay |
| [character-card-spec-v2](./character-card-spec-v2/) | An updated specification for AI character cards. |
| [agn-ai](./agn-ai/) | No description |
| [galatea-ui](./galatea-ui/) | The official front-end UI. |
| [aphrodite-engine](./aphrodite-engine/) | Large-scale LLM inference engine |
| [cli-generator](./cli-generator/) | No description |
| [aphrodite-loadbalancer](./aphrodite-loadbalancer/) | No description |
| [circles](./circles/) | Scripts and web pages to visualise CMSSW resource  |
| [daelos](./daelos/) | Desktop environment in the browser |
| [fs](./fs/) | No description |
| [cursdk](./cursdk/) | Recursal SDK v1 - examples, snippets, and prompt e |
| [n8n-nodes-featherless](./n8n-nodes-featherless/) | This is an n8n community node for Featherless API  |
| [cline](./cline/) | Autonomous coding agent right in your IDE, capable |
| [prompts](./prompts/) | Library of prompts from the Cline community |
| [go-lib](./go-lib/) | General Golang Common Base Reusable Functionality |
| [dgraph](./dgraph/) | high-performance graph database for real-time use  |
| [d9](./d9/) | high-performance graph database for real-time use  |
| [hyper-commerce](./hyper-commerce/) | No description |
| [hyperdocs](./hyperdocs/) | Documentation for Hypermode and Modus |
| [turbo-jelly](./turbo-jelly/) | No description |
| [modus](./modus/) | modus: a framework for building agentic flows powe |
| [goakt](./goakt/) | [Go] Distributed Actor/Grain framework using proto |
| [llm-functions](./llm-functions/) | Easily create LLM tools and agents using plain Bas |
| [ecco9](./ecco9/) | ecco9 |
| [anarki](./anarki/) | Community-managed fork of the Arc dialect of Lisp; |
| [rainbow](./rainbow/) | arc in java |
| [arc-nu](./arc-nu/) | Rewrite of Arc 3.1 with more features, more speed, |
| [racket](./racket/) | The Racket repository |
| [imgui](./imgui/) | Dear ImGui: Bloat-free Graphical User interface fo |
| [networkx](./networkx/) | Network Analysis in Python |
| [grave](./grave/) | Grave—dead simple graph visualization |
| [cogfoundry](./cogfoundry/) | No description |
| [beast](./beast/) | HTTP and WebSocket built on Boost.Asio in C++11 |
| [WinKoGNN](./WinKoGNN/) | Windows Kognitive Graph Neural Network Source code |
| [hyperd](./hyperd/) | HyperContainer Daemon |
| [echo.kern](./echo.kern/) | echo kernel |
| [electron](./electron/) | :electron: Build cross-platform desktop apps with  |
| [ag2](./ag2/) | AG2 (formerly AutoGen): The Open-Source AgentOS. J |
| [fastagency](./fastagency/) | The fastest way to bring multi-agent workflows to  |
| [CubismExternalAppPluginSamples](./CubismExternalAppPluginSamples/) | No description |
| [CubismHologramApp](./CubismHologramApp/) | No description |
| [nLPluginQmlSample](./nLPluginQmlSample/) | No description |
| [nLPluginMouseExtender](./nLPluginMouseExtender/) | No description |
| [CubismUnitySamplesExtended](./CubismUnitySamplesExtended/) | No description |
| [CubismUnrealEngineComponents](./CubismUnrealEngineComponents/) | No description |
| [npu](./npu/) | No description |
| [firecrawl](./firecrawl/) | 🔥 The Web Data API for AI - Turn entire websites i |
| [mendable-nextjs-chatbot](./mendable-nextjs-chatbot/) | Next.js Starter Template for building chatbots wit |
| [fern](./fern/) | Input OpenAPI. Output SDKs and Docs. |
| [fern-platform](./fern-platform/) | Beautiful, interactive documentation websites powe |
| [aa-sdk](./aa-sdk/) | No description |
| [alchemy-sdk-js](./alchemy-sdk-js/) | The easiest way to connect your dApp to the blockc |
| [create-web3-dapp](./create-web3-dapp/) | The complete toolbox to create web3 applications.  |
| [scaffold-alchemy](./scaffold-alchemy/) | No description |
| [modular-account](./modular-account/) | No description |
| [light-account](./light-account/) | No description |
| [account-abstraction](./account-abstraction/) | No description |
| [eil-sdk](./eil-sdk/) | No description |
| [safe-smart-account](./safe-smart-account/) | Safe allows secure management of blockchain assets |
| [org-torch](./org-torch/) | No description |
| [cogtorch](./cogtorch/) | No description |
| [nnpu](./nnpu/) | No description |
| [pyg-galatea-frontend](./pyg-galatea-frontend/) | The frontend of the PygmalionAI Project |
| [pyg-aphrodite-engine](./pyg-aphrodite-engine/) | Large-scale LLM inference engine |
| [pyg-cli-generator](./pyg-cli-generator/) | No description |
| [pyg-aphrodite-loadbalancer](./pyg-aphrodite-loadbalancer/) | No description |
| [pyg-galatea-ui](./pyg-galatea-ui/) | The official front-end UI. |
| [pyg-gradio-ui](./pyg-gradio-ui/) | Prototype UI for chatting with the Pygmalion model |
| [pyg-paphos-backend](./pyg-paphos-backend/) | The official service back-end. |
| [pyg-colossalai-training-code](./pyg-colossalai-training-code/) | Our old fine-tuning code based on ColossalAI. |
| [pyg-data-toolbox](./pyg-data-toolbox/) | Our data munging code. |

*... and 479 more repositories*

---
*Fractal mapping generated on 2025-12-28 08:46:07*
*Part of the [o9-ent](https://github.com/o9-ent) enterprise-level representation*

### Fractal Hierarchy
```
o9 enterprise
└── o9-ent (org) = enterprise mapping
    └── o9nn (repo) = this org
        └── [repo folders] = repos in o9nn
            └── [files] = repo contents
```
