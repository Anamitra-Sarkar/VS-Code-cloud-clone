# Privacy & Data Isolation

## User Data Isolation

### Per-User Scoping
Every piece of data in Codespace-Op is scoped to the authenticated user via their Firebase UID:

- **MongoDB documents**: All collections include a `user_id` field indexed and filtered on every query
- **Workspace containers**: Each container is labeled with the owner's UID; the backend enforces ownership checks before any operation
- **Object storage (MinIO)**: Snapshot objects are stored under `{user_id}/{workspace_id}/` key prefixes
- **Redis cache**: Cache keys are prefixed with user ID

### Container Isolation
- Each workspace runs in its own Docker container with its own filesystem
- Containers cannot access other users' containers (separate Docker networks)
- Seccomp and AppArmor profiles prevent container escape attempts
- Resource limits prevent one user from impacting others

## Data Collection

### What We Collect
- **Authentication data**: Firebase UID, email, display name (provided by Firebase)
- **Workspace metadata**: Name, language, creation date, last accessed
- **Usage data**: Workspace start/stop events for resource management

### What We Do NOT Collect
- File contents are NOT stored outside the workspace container (unless snapshotted by the user)
- Terminal session content is NOT logged
- AI conversation history is NOT persisted server-side by default
- No analytics tracking or third-party data sharing

## GDPR Compliance

### Data Subject Rights

| Right | Implementation |
|-------|---------------|
| **Right to Access** | Users can export their workspace data via the API (`GET /api/workspaces`) |
| **Right to Rectification** | Users can update their workspace metadata |
| **Right to Erasure** | Users can delete workspaces; admin can delete all user data via `DELETE /api/admin/users/{uid}` |
| **Right to Portability** | Workspace snapshots can be downloaded as archives |
| **Right to Restrict Processing** | Users can stop/pause workspaces at any time |

### Data Retention
- **Active workspaces**: Retained while user account is active
- **Stopped workspaces**: Automatically cleaned up after configurable timeout (default: 7 days)
- **Snapshots**: Retained until user deletes them or account is deleted
- **Account deletion**: All associated data (workspaces, snapshots, metadata) is permanently deleted

### Data Processing
- All data processing occurs on infrastructure we control (self-hosted or managed cloud)
- LLM API calls send only the code context the user explicitly shares
- No user data is used for model training

## Incident Response

In the event of a data breach:
1. Affected users are notified within 72 hours
2. The breach is reported to relevant supervisory authorities
3. Compromised credentials are rotated immediately
4. Affected containers are isolated and forensically analyzed
5. Post-incident review and remediation plan published
