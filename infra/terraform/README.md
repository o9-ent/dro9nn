# Terraform Infrastructure

This directory contains Terraform configurations for o9nn cloud infrastructure.

## Providers

Supported cloud providers:
- AWS
- Google Cloud Platform (GCP)
- Azure

## Directory Structure

```
terraform/
├── modules/              # Reusable modules
│   ├── kubernetes/       # Kubernetes cluster
│   ├── storage/          # Object storage
│   ├── database/         # Database resources
│   └── networking/       # VPC/networking
├── environments/
│   ├── dev/              # Development environment
│   ├── staging/          # Staging environment
│   └── prod/             # Production environment
└── README.md             # This file
```

## Quick Start

### Prerequisites

- Terraform >= 1.5.0
- Cloud provider CLI configured
- Required permissions

### Initialize

```bash
cd environments/dev
terraform init
```

### Plan

```bash
terraform plan -out=tfplan
```

### Apply

```bash
terraform apply tfplan
```

## Modules

### Kubernetes Cluster

```hcl
module "kubernetes" {
  source = "../../modules/kubernetes"

  cluster_name = "o9nn-cluster"
  node_count   = 3
  machine_type = "n2-standard-4"
  gpu_enabled  = true
}
```

### Model Storage

```hcl
module "storage" {
  source = "../../modules/storage"

  bucket_name = "o9nn-models"
  region      = "us-central1"
  versioning  = true
}
```

## State Management

Remote state is stored in cloud storage:

```hcl
terraform {
  backend "gcs" {
    bucket = "o9nn-terraform-state"
    prefix = "terraform/state"
  }
}
```

## Security

- State files are encrypted at rest
- Secrets managed via cloud secret managers
- IAM follows principle of least privilege
- Network policies restrict access
