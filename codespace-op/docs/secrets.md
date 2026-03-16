# Secrets Management Guide

## Overview

Codespace-Op uses different secrets management strategies depending on the deployment environment.

## Secret Categories

| Secret | Used By | Sensitivity |
|--------|---------|-------------|
| `FIREBASE_CREDENTIALS_BASE64` | Backend | **Critical** - Full Firebase admin access |
| `MONGODB_URL` / `MONGODB_PASSWORD` | Backend | **Critical** - Database access |
| `REDIS_PASSWORD` | Backend | High - Cache access |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | Backend | High - Object storage access |
| `OPENAI_API_KEY` | Backend | High - LLM billing |
| `ANTHROPIC_API_KEY` | Backend | High - LLM billing |
| `GOOGLE_AI_API_KEY` | Backend | High - LLM billing |
| `HF_TOKEN` | CI/CD | High - HuggingFace deploy |
| `VERCEL_TOKEN` | CI/CD | High - Vercel deploy |
| `NEXT_PUBLIC_FIREBASE_*` | Frontend | Low - Public client config |

## Local Development

1. Copy the template: `cp infra/.env infra/.env.local`
2. Fill in your development credentials
3. **Never commit `.env.local`** (it's in `.gitignore`)
4. Docker Compose reads from `infra/.env` by default

## CI/CD (GitHub Actions)

Secrets are stored in GitHub repository settings:

1. Go to Settings → Secrets and variables → Actions
2. Add each secret as a **Repository secret**
3. Workflows reference them as `${{ secrets.SECRET_NAME }}`

Required GitHub Secrets:
```
FIREBASE_CREDENTIALS_BASE64
FIREBASE_PROJECT_ID
MONGODB_PASSWORD
REDIS_PASSWORD
MINIO_ACCESS_KEY
MINIO_SECRET_KEY
OPENAI_API_KEY
HF_TOKEN
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
KUBECONFIG  (base64-encoded, for K8s deploy)
```

## Kubernetes

Secrets are managed via Helm values and Kubernetes Secrets:

```bash
# Create secrets from values (handled by Helm chart)
helm upgrade --install codespace-op infra/k8s/helm-chart \
  --set mongodb.auth.rootPassword="$MONGODB_PASSWORD" \
  --set redis.password="$REDIS_PASSWORD" \
  --set firebase.credentialsBase64="$FIREBASE_CREDS"
```

For enhanced security, use an external secrets operator:
- **AWS Secrets Manager** + External Secrets Operator
- **HashiCorp Vault** + Vault Secrets Operator
- **Google Secret Manager** + External Secrets Operator

## HuggingFace Spaces

Set secrets in the Space settings UI:

1. Go to your Space → Settings → Variables and secrets
2. Add each secret as a **Secret** (not a variable)
3. Secrets are injected as environment variables at runtime

## Rotation Procedures

### Firebase Credentials
1. Generate a new service account key in Firebase Console
2. Base64 encode: `base64 -i new-key.json`
3. Update in all environments (GitHub Secrets, HF Space, K8s)
4. Revoke the old key in Firebase Console

### Database Passwords
1. Update the password in MongoDB Atlas / local instance
2. Update `MONGODB_PASSWORD` in all environments
3. Restart backend pods/containers

### API Keys (LLM Providers)
1. Generate a new key in the provider's dashboard
2. Update in all environments
3. Revoke the old key

## Security Best Practices

- ✅ Use environment variables, never hardcode secrets
- ✅ Rotate secrets quarterly or after any team member departure
- ✅ Use least-privilege credentials (separate read/write keys)
- ✅ Monitor for exposed secrets using GitHub secret scanning
- ✅ Audit secret access logs regularly
- ❌ Never commit secrets to Git
- ❌ Never log secrets (mask in application logs)
- ❌ Never share secrets via chat or email
