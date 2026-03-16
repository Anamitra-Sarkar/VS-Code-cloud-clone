# Disaster Recovery Playbook

## Overview

This playbook covers recovery procedures for Codespace-Op's stateful components: MongoDB, MinIO, and the verification steps to confirm a successful restore.

---

## MongoDB Recovery

### Prerequisites
- Access to MongoDB backup (mongodump archive or Atlas snapshot)
- `mongosh` and `mongorestore` installed
- Target MongoDB instance running

### From mongodump Archive

```bash
# 1. Stop the backend to prevent writes during restore
kubectl scale deployment codespace-op-backend --replicas=0 -n codespace-op

# 2. Restore from archive
mongorestore \
  --uri="mongodb://admin:PASSWORD@mongodb-host:27017" \
  --db=codespace_op \
  --archive=/path/to/backup.archive \
  --gzip \
  --drop

# 3. Verify restore
mongosh "mongodb://admin:PASSWORD@mongodb-host:27017/codespace_op" \
  --eval "db.getCollectionNames(); db.workspaces.countDocuments({})"

# 4. Restart backend
kubectl scale deployment codespace-op-backend --replicas=2 -n codespace-op
```

### From MongoDB Atlas Snapshot

1. Navigate to Atlas Console → Backup → Restore
2. Select the desired snapshot point-in-time
3. Choose "Restore to this cluster"
4. Wait for restoration to complete
5. Verify via the verification checklist below

---

## MinIO Recovery

### Prerequisites
- Access to MinIO backup (mc mirror or replicated bucket)
- `mc` (MinIO Client) installed and configured

### Restore from Backup Bucket

```bash
# 1. Configure mc aliases
mc alias set restore-source https://backup-minio:9000 ACCESS_KEY SECRET_KEY
mc alias set restore-target https://minio:9000 MINIO_ACCESS_KEY MINIO_SECRET_KEY

# 2. Mirror the backup bucket to production
mc mirror restore-source/workspaces-backup restore-target/workspaces

# 3. Verify object count
mc ls --recursive restore-target/workspaces | wc -l
```

### Restore Individual Workspace Snapshot

```bash
# Copy a specific workspace snapshot back
mc cp restore-source/workspaces-backup/USER_ID/WORKSPACE_ID/ \
  restore-target/workspaces/USER_ID/WORKSPACE_ID/ \
  --recursive
```

---

## Verification Checklist

After completing any restore, run through this checklist:

### MongoDB Verification
- [ ] All collections exist: `workspaces`, `users`, `sessions`
- [ ] Document counts match expected values
- [ ] Indexes are intact: `db.workspaces.getIndexes()`
- [ ] Sample queries return valid data
- [ ] Backend can connect and serve API requests

### MinIO Verification
- [ ] Bucket `workspaces` exists and is accessible
- [ ] Object count matches pre-backup count
- [ ] Sample snapshot download works
- [ ] Snapshot restore to a workspace succeeds

### End-to-End Verification
- [ ] User can log in via Firebase Auth
- [ ] Workspace list loads correctly
- [ ] Creating a new workspace succeeds
- [ ] Opening an existing workspace loads files
- [ ] Terminal connection works
- [ ] AI assistant responds
- [ ] Snapshot creation works
- [ ] Snapshot restore works

### Monitoring Verification
- [ ] Prometheus scraping targets are UP
- [ ] Grafana dashboards show data
- [ ] No critical alerts firing (that aren't expected)

---

## Backup Schedule

| Component | Method | Frequency | Retention |
|-----------|--------|-----------|-----------|
| MongoDB | mongodump / Atlas snapshot | Every 6 hours | 30 days |
| MinIO | mc mirror to backup bucket | Daily | 30 days |
| Kubernetes | etcd snapshot | Daily | 14 days |
| Terraform state | S3 versioning | On every apply | Indefinite |

---

## Contacts

- **On-call**: Check PagerDuty / OpsGenie rotation
- **Database admin**: Refer to team roster
- **Infrastructure**: Refer to team roster
