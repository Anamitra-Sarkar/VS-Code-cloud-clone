"""Workspace lifecycle management using Docker SDK and MinIO snapshots."""

import io
import tarfile
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import boto3
import docker
from botocore.exceptions import ClientError
from docker.errors import DockerException, NotFound
from loguru import logger

from app.core.config import settings
from app.core.mongodb import get_database

_docker_client: Optional[docker.DockerClient] = None
_s3_client: Optional[Any] = None

CONTAINER_PREFIX = "codeop-ws"


def _get_docker() -> docker.DockerClient:
    global _docker_client
    if _docker_client is None:
        _docker_client = docker.from_env()
    return _docker_client


def _get_s3():
    global _s3_client
    if _s3_client is None:
        endpoint_url = f"{'https' if settings.MINIO_SECURE else 'http'}://{settings.MINIO_ENDPOINT}"
        _s3_client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
        )
    return _s3_client


def _container_name(user_id: str, workspace_id: str) -> str:
    return f"{CONTAINER_PREFIX}-{user_id[:8]}-{workspace_id[:8]}"


def init() -> None:
    """Ensure the MinIO bucket exists."""
    try:
        s3 = _get_s3()
        try:
            s3.head_bucket(Bucket=settings.MINIO_BUCKET)
            logger.info("MinIO bucket '{}' already exists", settings.MINIO_BUCKET)
        except ClientError:
            s3.create_bucket(Bucket=settings.MINIO_BUCKET)
            logger.info("Created MinIO bucket '{}'", settings.MINIO_BUCKET)
    except Exception as exc:
        logger.warning("Could not initialise MinIO (non-fatal): {}", exc)


async def create_workspace(
    user_id: str,
    name: str = "default",
    repo_url: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a new workspace container with resource limits."""
    db = get_database()
    workspace_id = uuid.uuid4().hex[:12]
    container_name = _container_name(user_id, workspace_id)

    workspace_doc = {
        "workspace_id": workspace_id,
        "user_id": user_id,
        "name": name,
        "container_name": container_name,
        "repo_url": repo_url,
        "status": "creating",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    await db.workspaces.insert_one(workspace_doc)

    try:
        client = _get_docker()
        env_vars = {"WORKSPACE_ID": workspace_id, "USER_ID": user_id}
        if repo_url:
            env_vars["REPO_URL"] = repo_url

        container = client.containers.run(
            image=settings.WORKSPACE_IMAGE,
            name=container_name,
            detach=True,
            environment=env_vars,
            labels={
                "codespace-op": "true",
                "user_id": user_id,
                "workspace_id": workspace_id,
            },
            mem_limit="512m",
            cpu_period=100000,
            cpu_quota=50000,  # 0.5 CPU
            network_mode="bridge",
        )
        await db.workspaces.update_one(
            {"workspace_id": workspace_id},
            {"$set": {"status": "running", "updated_at": datetime.now(timezone.utc)}},
        )
        logger.info("Created workspace {} for user {}", workspace_id, user_id)
    except DockerException as exc:
        await db.workspaces.update_one(
            {"workspace_id": workspace_id},
            {"$set": {"status": "error", "error": str(exc), "updated_at": datetime.now(timezone.utc)}},
        )
        logger.error("Failed to create workspace container: {}", exc)
        raise

    workspace_doc["status"] = "running"
    workspace_doc.pop("_id", None)
    return workspace_doc


async def start_workspace(user_id: str, workspace_id: str) -> Dict[str, Any]:
    """Start a stopped workspace container."""
    db = get_database()
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user_id})
    if not ws:
        raise ValueError("Workspace not found")

    try:
        client = _get_docker()
        container = client.containers.get(ws["container_name"])
        container.start()
        await db.workspaces.update_one(
            {"workspace_id": workspace_id},
            {"$set": {"status": "running", "updated_at": datetime.now(timezone.utc)}},
        )
        logger.info("Started workspace {}", workspace_id)
        return {"workspace_id": workspace_id, "status": "running"}
    except NotFound:
        raise ValueError("Container not found – workspace may need to be recreated")
    except DockerException as exc:
        logger.error("Failed to start workspace: {}", exc)
        raise


async def stop_workspace(user_id: str, workspace_id: str) -> Dict[str, Any]:
    """Stop a running workspace container."""
    db = get_database()
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user_id})
    if not ws:
        raise ValueError("Workspace not found")

    try:
        client = _get_docker()
        container = client.containers.get(ws["container_name"])
        container.stop(timeout=10)
        await db.workspaces.update_one(
            {"workspace_id": workspace_id},
            {"$set": {"status": "stopped", "updated_at": datetime.now(timezone.utc)}},
        )
        logger.info("Stopped workspace {}", workspace_id)
        return {"workspace_id": workspace_id, "status": "stopped"}
    except NotFound:
        raise ValueError("Container not found")
    except DockerException as exc:
        logger.error("Failed to stop workspace: {}", exc)
        raise


async def delete_workspace(user_id: str, workspace_id: str) -> Dict[str, Any]:
    """Delete a workspace container and its database record."""
    db = get_database()
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user_id})
    if not ws:
        raise ValueError("Workspace not found")

    try:
        client = _get_docker()
        container = client.containers.get(ws["container_name"])
        container.remove(force=True)
    except NotFound:
        logger.warning("Container already removed for workspace {}", workspace_id)
    except DockerException as exc:
        logger.error("Failed to remove container: {}", exc)

    await db.workspaces.delete_one({"workspace_id": workspace_id, "user_id": user_id})
    logger.info("Deleted workspace {}", workspace_id)
    return {"workspace_id": workspace_id, "status": "deleted"}


async def snapshot_workspace(user_id: str, workspace_id: str) -> Dict[str, Any]:
    """Export workspace container filesystem to MinIO."""
    db = get_database()
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user_id})
    if not ws:
        raise ValueError("Workspace not found")

    snapshot_name = f"{user_id}/{workspace_id}/{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.tar"

    try:
        client = _get_docker()
        container = client.containers.get(ws["container_name"])
        bits, _ = container.get_archive("/workspace")
        data = b"".join(bits)

        s3 = _get_s3()
        s3.put_object(
            Bucket=settings.MINIO_BUCKET,
            Key=snapshot_name,
            Body=data,
        )

        snapshot_doc = {
            "snapshot_id": uuid.uuid4().hex[:12],
            "workspace_id": workspace_id,
            "user_id": user_id,
            "name": snapshot_name,
            "size_bytes": len(data),
            "created_at": datetime.now(timezone.utc),
        }
        await db.snapshots.insert_one(snapshot_doc)
        snapshot_doc.pop("_id", None)
        logger.info("Created snapshot {} for workspace {}", snapshot_name, workspace_id)
        return snapshot_doc
    except Exception as exc:
        logger.error("Snapshot failed: {}", exc)
        raise


async def restore_snapshot(user_id: str, workspace_id: str, snapshot_name: str) -> Dict[str, Any]:
    """Restore a snapshot from MinIO into the workspace container."""
    db = get_database()
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user_id})
    if not ws:
        raise ValueError("Workspace not found")

    # Verify snapshot belongs to user
    snap = await db.snapshots.find_one({"name": snapshot_name, "user_id": user_id})
    if not snap:
        raise ValueError("Snapshot not found")

    try:
        s3 = _get_s3()
        obj = s3.get_object(Bucket=settings.MINIO_BUCKET, Key=snapshot_name)
        data = obj["Body"].read()

        client = _get_docker()
        container = client.containers.get(ws["container_name"])
        container.put_archive("/", data)

        logger.info("Restored snapshot {} to workspace {}", snapshot_name, workspace_id)
        return {"workspace_id": workspace_id, "snapshot": snapshot_name, "status": "restored"}
    except Exception as exc:
        logger.error("Restore failed: {}", exc)
        raise


async def list_workspaces(user_id: str) -> List[Dict[str, Any]]:
    """List all workspaces belonging to a specific user."""
    db = get_database()
    cursor = db.workspaces.find({"user_id": user_id}, {"_id": 0})
    workspaces = await cursor.to_list(length=100)
    return workspaces
