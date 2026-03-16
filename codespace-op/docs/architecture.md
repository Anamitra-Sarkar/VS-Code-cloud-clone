# Architecture Overview

## System Architecture

Codespace-Op is a cloud-based IDE platform that provides isolated development workspaces with AI assistance. The system uses a modern microservices architecture.

```
┌─────────────────────────────────────────────────────────────┐
│                        Traefik / Ingress                     │
│                    (TLS termination, routing)                 │
└──────────┬───────────────────────────┬──────────────────────┘
           │                           │
    ┌──────▼──────┐            ┌───────▼───────┐
    │   Frontend   │            │    Backend     │
    │  (Next.js)   │◄──────────►│   (FastAPI)    │
    │   Port 3000  │  REST/WS   │   Port 7860    │
    └──────────────┘            └───┬───┬───┬───┘
                                    │   │   │
                    ┌───────────────┘   │   └───────────────┐
                    │                   │                     │
             ┌──────▼──────┐    ┌──────▼──────┐     ┌───────▼───────┐
             │   MongoDB    │    │    Redis     │     │     MinIO      │
             │  (Atlas /    │    │  (Sessions,  │     │  (Workspace    │
             │   local)     │    │   cache)     │     │   snapshots)   │
             └──────────────┘    └─────────────┘     └───────────────┘
                                        │
                                ┌───────▼───────┐
                                │  Docker Engine │
                                │  (Workspace    │
                                │   containers)  │
                                └───────────────┘
```

## Core Components

### Frontend (Next.js 14)
- **Framework**: Next.js with App Router, TypeScript, Tailwind CSS
- **Editor**: Monaco Editor (VS Code engine)
- **Terminal**: xterm.js with WebSocket connection
- **Auth**: Firebase Auth (Google, GitHub, email/password)
- **State**: React Context + SWR for server state

### Backend (FastAPI / Python)
- **API Framework**: FastAPI with async support
- **Authentication**: Firebase Admin SDK for token verification
- **Workspace Management**: Docker SDK for container lifecycle
- **LLM Router**: Multi-provider AI (OpenAI, Anthropic, Google)
- **File Operations**: REST API for file CRUD within containers
- **Terminal**: WebSocket proxy to container PTY

### Database Layer
- **MongoDB** (Atlas in production, local in dev): User data, workspace metadata, session history
- **Redis**: Session caching, rate limiting, pub/sub for real-time events
- **MinIO**: S3-compatible object storage for workspace snapshots

### Workspace Containers
- Based on `codercom/code-server:4.15.0`
- Isolated per user with seccomp + AppArmor profiles
- Resource-limited (CPU, memory, disk)
- Pre-built images: base, Python, Node.js

## Authentication Flow

1. User signs in via Firebase Auth on the frontend
2. Frontend obtains a Firebase ID token
3. Token is sent with each API request as `Authorization: Bearer <token>`
4. Backend verifies the token using Firebase Admin SDK
5. User UID from token is used to scope all data operations

## Deployment Options

| Component | Development | Production |
|-----------|------------|------------|
| Backend | Docker Compose | HuggingFace Space / K8s |
| Frontend | `npm run dev` | Vercel / K8s |
| Database | Local MongoDB | MongoDB Atlas |
| Storage | Local MinIO | AWS S3 / MinIO |
| Monitoring | Prometheus + Grafana | Same + alerting |

## Data Flow

1. **Workspace Creation**: User → Frontend → Backend API → Docker Engine → Container created
2. **Code Editing**: Frontend (Monaco) → Backend (file API) → Container filesystem
3. **Terminal**: Frontend (xterm.js) ↔ Backend (WebSocket) ↔ Container (PTY)
4. **AI Assist**: Frontend → Backend (LLM router) → OpenAI/Anthropic/Google → Response streamed back
5. **Snapshots**: Backend → Docker commit → MinIO upload
