# Security Model

## Overview

Codespace-Op implements a defense-in-depth security model with multiple layers of protection for user workspaces and data.

## Authentication

### Firebase Auth
- All user authentication is handled via **Firebase Authentication**
- Supported providers: Google, GitHub, email/password
- Backend verifies Firebase ID tokens on every API request using the Firebase Admin SDK
- Tokens are short-lived (1 hour) and automatically refreshed by the client SDK
- No passwords are stored in our database

### Token Verification
```
Client → Firebase ID Token → Backend Middleware → Firebase Admin SDK → Verified UID
```

## Container Isolation

Each user workspace runs in an isolated Docker container with the following security measures:

### Seccomp Profile (`tools/seccomp.json`)
- Strict allowlist of system calls
- Blocks dangerous syscalls (e.g., `ptrace`, `mount`, `reboot`, kernel module loading)
- Applied at container creation time

### AppArmor Profile (`tools/apparmor.profile`)
- Restricts file system access to user workspace directories
- Denies access to sensitive system files (`/etc/shadow`, `/etc/passwd` write)
- Blocks raw network sockets (prevents packet sniffing)
- Denies Docker socket access from within workspaces
- Prevents privilege escalation via `mount`, `ptrace`

### Resource Limits
- **CPU**: Limited to 1 core per workspace (configurable)
- **Memory**: Limited to 512MB per workspace (configurable)
- **Disk**: Isolated filesystem per container
- **Network**: Containers on isolated Docker network
- **Timeout**: Automatic cleanup after configurable idle timeout

## Network Security

### Network Policies (Kubernetes)
- Backend can only communicate with MongoDB, Redis, MinIO, and external HTTPS
- MongoDB and Redis only accept connections from backend pods
- Frontend can only reach the backend API
- DNS resolution allowed for service discovery

### Traefik / Ingress
- TLS termination at the edge
- Rate limiting middleware
- CORS headers configured
- WebSocket proxying for terminal connections

## Data Security

### Data at Rest
- MongoDB: Encryption at rest (Atlas provides this by default)
- MinIO: Server-side encryption for snapshots
- Workspace data: Ephemeral (destroyed with container) unless snapshotted

### Data in Transit
- All external traffic over TLS 1.2+
- Internal service communication over private network
- WebSocket connections upgraded from HTTPS

### Data Isolation
- Each user's data is scoped by Firebase UID
- MongoDB queries always include user ID filter
- Container filesystem isolated per workspace
- MinIO objects keyed by user ID + workspace ID

## Secrets Management

- Kubernetes Secrets for production credentials
- Environment variables for local development (never committed)
- Firebase credentials stored as base64-encoded service account JSON
- See `docs/secrets.md` for detailed secrets management guide

## Security Scanning

### CI/CD Pipeline
- **Trivy**: Container image vulnerability scanning on every push
- **Ruff**: Python linting including security rules
- **ESLint**: Frontend code quality and security patterns
- Image scanning results uploaded as SARIF to GitHub Security tab

## Pod Security

- Kubernetes Pod Security Standards: `restricted` level
- Non-root containers
- Read-only root filesystem where possible
- No privilege escalation
- Dropped all capabilities, add back only required ones
