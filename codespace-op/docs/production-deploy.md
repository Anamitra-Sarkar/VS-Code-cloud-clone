# Production Deployment Guide

## Deployment Architecture

Codespace-Op uses a split deployment model for production:

| Component | Platform | Why |
|-----------|----------|-----|
| **Backend** | HuggingFace Space (Docker) | Free GPU-enabled hosting, auto-scaling, Docker support |
| **Frontend** | Vercel | Edge network, automatic Next.js optimization, instant deploys |
| **Database** | MongoDB Atlas | Managed, auto-scaling, backups, global clusters |
| **Storage** | MinIO / AWS S3 | Workspace snapshots, scalable object storage |

## HuggingFace Space (Backend)

### Automatic Deployment

The backend is automatically synced to a HuggingFace Space on every push to `main` via the `.github/workflows/hf-sync.yml` workflow.

**Required secrets:**
- `HF_TOKEN`: HuggingFace API token with write access

**Required variables:**
- `HF_SPACE_NAME`: Your space name (e.g., `your-username/codespace-op`)

### Manual Setup

1. Create a new Space on https://huggingface.co/new-space
   - Select **Docker** as the SDK
   - Set the Space to **Public** or **Private**

2. Set Space environment variables (Settings → Variables and secrets):
   ```
   MONGODB_URL=mongodb+srv://...
   MONGODB_DB_NAME=codespace_op
   FIREBASE_CREDENTIALS_BASE64=...
   REDIS_URL=redis://:your-password@redis-host:6379/0
   MINIO_ENDPOINT=...
   MINIO_ACCESS_KEY=...
   MINIO_SECRET_KEY=...
   OPENAI_API_KEY=...
   ```

3. The `hf-sync` workflow will push the `backend/` directory as the Space content

### Manual Push

```bash
pip install huggingface_hub
huggingface-cli login

huggingface-cli upload your-username/codespace-op \
  codespace-op/backend . \
  --repo-type space
```

## Vercel (Frontend)

### Automatic Deployment

The frontend is deployed to Vercel via the `.github/workflows/deploy.yml` workflow.

**Required secrets:**
- `VERCEL_TOKEN`: Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### Manual Setup

1. Install the Vercel CLI: `npm i -g vercel`
2. Link the project:
   ```bash
   cd codespace-op/frontend
   vercel link
   ```
3. Set environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://your-username-codespace-op.hf.space
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```
4. Deploy: `vercel --prod`

## MongoDB Atlas

1. Create a free cluster at https://cloud.mongodb.com
2. Create a database user
3. Whitelist your backend's IP (or use 0.0.0.0/0 for HuggingFace Spaces)
4. Get the connection string and set as `MONGODB_URL`
5. Enable backup (recommended: continuous backup with point-in-time restore)

## Kubernetes Deployment (Alternative)

For teams needing full control, deploy to Kubernetes:

```bash
# Provision infrastructure
cd infra/terraform
terraform init
terraform apply

# Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name codespace-op

# Deploy with Helm
helm upgrade --install codespace-op infra/k8s/helm-chart \
  --namespace codespace-op \
  --create-namespace \
  -f production-values.yaml
```

## SSL/TLS

- **Vercel**: Automatic SSL for frontend
- **HuggingFace**: Automatic SSL for Space
- **Kubernetes**: Use cert-manager with Let's Encrypt

## Monitoring in Production

- Prometheus metrics exposed at `/metrics` on the backend
- Configure Grafana Cloud or self-hosted Grafana to scrape
- Set up alerting via PagerDuty / Slack / email
- See `docs/restore-playbook.md` for DR procedures
