# Developer Onboarding Guide

## Prerequisites

Ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| Docker | 24+ | Container runtime |
| Docker Compose | 2.20+ | Local orchestration |
| Python | 3.11+ | Backend development |
| Node.js | 20+ | Frontend development |
| Git | 2.40+ | Version control |

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/VS-Code-cloud-clone.git
cd VS-Code-cloud-clone/codespace-op
```

### 2. Set Up Environment Variables

```bash
cp infra/.env infra/.env.local
# Edit infra/.env.local with your Firebase credentials and API keys
```

### 3. Start the Full Stack (Docker Compose)

```bash
cd infra
docker compose up -d
```

This starts: MongoDB, Redis, MinIO, backend (port 7860), frontend (port 3000), Traefik, Prometheus, Grafana, and Loki.

### 4. Verify Services

```bash
# Backend health check
curl http://localhost:7860/health

# Frontend
open http://localhost:3000

# Grafana (monitoring)
open http://localhost:3001  # admin/admin
```

## Local Development (Without Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start with hot reload
uvicorn app.main:app --host 0.0.0.0 --port 7860 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend lint
cd frontend
npx next lint
```

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication → Sign-in methods: Google, GitHub, Email/Password
3. Go to Project Settings → Service Accounts → Generate new private key
4. Base64 encode the JSON key file:
   ```bash
   base64 -i firebase-service-account.json
   ```
5. Set `FIREBASE_CREDENTIALS_BASE64` in your `.env.local`
6. Copy the web app config values to `NEXT_PUBLIC_FIREBASE_*` variables

## Project Structure

```
codespace-op/
├── backend/            # FastAPI backend
│   ├── app/
│   │   ├── api/        # Route handlers
│   │   ├── core/       # Business logic (docker, auth, llm)
│   │   ├── models/     # Data models
│   │   └── schemas/    # Pydantic schemas
│   └── tests/          # pytest tests
├── frontend/           # Next.js frontend
│   ├── app/            # Pages (App Router)
│   ├── components/     # React components
│   └── lib/            # Utilities, types, API client
├── infra/              # Infrastructure
│   ├── docker-compose.yml
│   ├── k8s/            # Kubernetes Helm chart
│   ├── terraform/      # AWS EKS provisioning
│   └── monitor/        # Prometheus, Grafana, Loki
├── workspace-images/   # Docker images for workspaces
├── tools/              # Security profiles, scripts
├── docs/               # Documentation
└── scripts/            # Build & utility scripts
```

## Common Tasks

| Task | Command |
|------|---------|
| Start all services | `make up-dev` |
| Run backend tests | `make test` |
| Build all images | `make build-images` |
| Lint code | `make lint` |
| Create a snapshot | `make snapshot-user UID=<uid> WID=<wid>` |
| Clean up | `make clean` |

## Getting Help

- Read `docs/architecture.md` for system overview
- Read `docs/security.md` for security model
- Check existing tests for API usage examples
- Review the Makefile for available commands
