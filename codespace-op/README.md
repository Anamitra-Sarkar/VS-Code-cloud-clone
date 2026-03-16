# Codespace-Op

> A cloud-based IDE platform with isolated Docker workspaces, AI assistance, and real-time collaboration — like GitHub Codespaces, but open source.

```
┌──────────────────────────────────────────────────────────────┐
│                      Traefik / Ingress                        │
└────────────┬────────────────────────────┬────────────────────┘
             │                            │
      ┌──────▼──────┐             ┌───────▼──────┐
      │   Frontend   │             │   Backend     │
      │  (Next.js)   │◄───────────►│  (FastAPI)    │
      │  Vercel      │  REST + WS  │  HF Space     │
      └──────────────┘             └──┬──┬──┬──────┘
                                      │  │  │
                       ┌──────────────┘  │  └──────────────┐
                       │                 │                  │
                ┌──────▼─────┐   ┌──────▼─────┐   ┌───────▼──────┐
                │  MongoDB    │   │   Redis     │   │    MinIO      │
                │  (Atlas)    │   │  (Cache)    │   │  (Snapshots)  │
                └─────────────┘   └────────────┘   └──────────────┘
```

## Features

- 🖥️ **Monaco Editor** — Full VS Code editing experience in the browser
- 🐳 **Isolated Workspaces** — Each user gets their own Docker container
- 🤖 **AI Assistant** — Multi-provider LLM support (OpenAI, Anthropic, Google)
- 🔐 **Firebase Auth** — Google, GitHub, and email/password authentication
- 📁 **File Management** — Full file tree with CRUD operations
- 💻 **Web Terminal** — Real terminal access via WebSocket + xterm.js
- 📸 **Snapshots** — Save and restore workspace state
- 📊 **Monitoring** — Prometheus + Grafana + Loki observability stack
- 🔒 **Security** — Seccomp, AppArmor, network policies, container isolation

## Quick Start

### Prerequisites

- Docker 24+ and Docker Compose 2.20+
- Node.js 20+, Python 3.11+

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/VS-Code-cloud-clone.git
cd VS-Code-cloud-clone/codespace-op
cp infra/.env infra/.env.local
# Edit infra/.env.local with your Firebase credentials
```

### 2. Start Everything

```bash
make up-dev
```

### 3. Open

- **App**: http://localhost:3000
- **API**: http://localhost:7860/docs
- **Grafana**: http://localhost:3001

## Project Structure

```
codespace-op/
├── backend/              # FastAPI backend (Python)
├── frontend/             # Next.js frontend (TypeScript)
├── workspace-images/     # Docker images for user workspaces
├── infra/
│   ├── docker-compose.yml
│   ├── k8s/              # Helm chart + manifests
│   ├── terraform/        # AWS EKS provisioning
│   ├── traefik/          # Reverse proxy config
│   └── monitor/          # Prometheus, Grafana, Loki
├── tools/                # Security profiles + scripts
├── docs/                 # Documentation
├── scripts/              # Build utilities
└── Makefile              # Development commands
```

## Development Commands

| Command | Description |
|---------|-------------|
| `make up-dev` | Start all services with Docker Compose |
| `make build-images` | Build all Docker images |
| `make test` | Run backend tests + frontend lint |
| `make lint` | Lint backend (ruff) and frontend (eslint) |
| `make clean` | Stop services and clean up |
| `make deploy-staging` | Deploy to staging via Helm |

## Deployment

### Production (Recommended)

| Component | Platform |
|-----------|----------|
| Backend | [HuggingFace Spaces](https://huggingface.co/spaces) (Docker) |
| Frontend | [Vercel](https://vercel.com) |
| Database | [MongoDB Atlas](https://cloud.mongodb.com) |

Auto-deploy is configured via GitHub Actions:
- **Backend** → HuggingFace Space (on push to `main`)
- **Frontend** → Vercel (on push to `main`)

See [docs/production-deploy.md](docs/production-deploy.md) for full instructions.

### Kubernetes

```bash
cd infra/terraform && terraform apply    # Provision EKS
helm upgrade --install codespace-op infra/k8s/helm-chart -n codespace-op
```

## Documentation

- [Architecture](docs/architecture.md) — System design overview
- [Security](docs/security.md) — Security model and container isolation
- [Privacy](docs/privacy.md) — Data isolation and GDPR compliance
- [Onboarding](docs/onboarding.md) — Developer setup guide
- [Production Deploy](docs/production-deploy.md) — HuggingFace + Vercel deployment
- [Secrets Management](docs/secrets.md) — Managing credentials
- [DR Playbook](docs/restore-playbook.md) — Disaster recovery procedures

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Monaco Editor |
| Backend | FastAPI, Python 3.12, Docker SDK |
| Auth | Firebase Authentication |
| Database | MongoDB (Atlas) |
| Cache | Redis |
| Storage | MinIO (S3-compatible) |
| Containers | Docker, code-server |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus, Grafana, Loki |
| Infrastructure | Terraform, Helm, Kubernetes |

## License

See [LICENSE](../LICENSE) for details.
