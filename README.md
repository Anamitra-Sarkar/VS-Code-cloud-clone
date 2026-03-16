# VS-Code-cloud-clone (Codespace-OP)

A production-ready **GitHub Codespaces clone** — cloud IDE with Monaco Editor, AI assistant, terminal, workspace management, and full DevOps pipeline.

## ✨ Features

- 🖥️ **Cloud IDE** — Monaco Editor with multi-tab editing, syntax highlighting, file explorer
- 🤖 **AI Assistant** — Agentic AI sidebar with code completion, error fixing, terminal commands (Grok + NVIDIA NIM + local fallback)
- 💻 **Terminal** — Full interactive terminal via xterm.js + WebSocket PTY
- 🔐 **Firebase Auth** — Google Sign-in + Email/Password (no JWT)
- 🗄️ **MongoDB Atlas** — Per-user isolated data storage
- 📦 **Docker Workspaces** — Per-user containers with code-server
- 📸 **Snapshots** — Workspace backup/restore via MinIO
- 🌙 **Dark/Light Theme** — VS Code-inspired UI with theme toggle
- 🚀 **One-click Deploy** — Backend on HuggingFace Spaces, Frontend on Vercel

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Frontend       │────▶│   Backend         │────▶│  Workspace       │
│   (Next.js 14)   │     │  (FastAPI)        │     │  Containers      │
│   Vercel/3000    │     │  HF Space/7860    │     │  (code-server)   │
└─────────────────┘     └────────┬──────────┘     └──────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              MongoDB Atlas   Redis        MinIO
              (user data)   (sessions)   (snapshots)
```

## 🚀 Quick Start

```bash
cd codespace-op
make up-dev          # Start all services with docker-compose
# Frontend: http://localhost:3000
# Backend:  http://localhost:7860
# API Docs: http://localhost:7860/docs
```

## 📁 Project Structure

All source code is in [`codespace-op/`](./codespace-op/) — see the [full README](./codespace-op/README.md) for detailed setup.

```
codespace-op/
├── frontend/          # Next.js 14 — Landing page, Auth, IDE
├── backend/           # FastAPI — Firebase Auth, MongoDB, workspace mgmt
├── workspace-images/  # Dockerfiles for code-server containers
├── infra/             # docker-compose, Helm, Terraform, monitoring
├── tools/             # Security profiles, snapshot scripts
├── docs/              # Architecture, security, DR playbooks
└── .github/workflows/ # CI/CD + HuggingFace auto-sync
```

## 🔑 Environment Variables

See [`codespace-op/infra/.env`](./codespace-op/infra/.env) for all required variables:
- `NEXT_PUBLIC_FIREBASE_*` — Firebase project config
- `FIREBASE_CREDENTIALS_BASE64` — Firebase Admin SDK service account
- `MONGODB_URL` — MongoDB Atlas connection string
- `GROK_KEY` / `NVIDIA_KEY` — LLM provider API keys

## 📖 Documentation

- [Architecture](codespace-op/docs/architecture.md)
- [Security](codespace-op/docs/security.md)
- [Onboarding](codespace-op/docs/onboarding.md)
- [Production Deploy](codespace-op/docs/production-deploy.md)

## License

Apache License 2.0