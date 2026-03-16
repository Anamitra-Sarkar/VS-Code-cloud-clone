"""Docker SDK helper – low-level container operations."""

from typing import Any, Dict, List, Optional

import docker
from docker.errors import DockerException, NotFound
from loguru import logger

_client: Optional[docker.DockerClient] = None


def _get_client() -> docker.DockerClient:
    """Lazy-initialize the Docker client."""
    global _client
    if _client is None:
        _client = docker.from_env()
    return _client


def exec_in_container(container_name: str, command: str) -> str:
    """Run a command inside a running container and return stdout."""
    try:
        client = _get_client()
        container = client.containers.get(container_name)
        exit_code, output = container.exec_run(command, demux=False)
        decoded = output.decode("utf-8", errors="replace") if output else ""
        if exit_code != 0:
            logger.warning(
                "exec_in_container({}, {!r}) exited with code {}",
                container_name,
                command,
                exit_code,
            )
        return decoded
    except NotFound:
        logger.error("Container not found: {}", container_name)
        raise
    except DockerException as exc:
        logger.error("Docker error in exec_in_container: {}", exc)
        raise


def get_container_status(container_name: str) -> Dict[str, Any]:
    """Return basic status info for a container."""
    try:
        client = _get_client()
        container = client.containers.get(container_name)
        return {
            "name": container.name,
            "status": container.status,
            "short_id": container.short_id,
            "image": str(container.image),
            "labels": container.labels,
        }
    except NotFound:
        return {"name": container_name, "status": "not_found"}
    except DockerException as exc:
        logger.error("Docker error in get_container_status: {}", exc)
        return {"name": container_name, "status": "error", "error": str(exc)}


def list_containers(label_filter: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
    """List containers, optionally filtered by labels."""
    try:
        client = _get_client()
        filters: Dict[str, Any] = {}
        if label_filter:
            filters["label"] = [f"{k}={v}" for k, v in label_filter.items()]
        containers = client.containers.list(all=True, filters=filters)
        return [
            {
                "name": c.name,
                "status": c.status,
                "short_id": c.short_id,
                "labels": c.labels,
            }
            for c in containers
        ]
    except DockerException as exc:
        logger.error("Docker error in list_containers: {}", exc)
        return []
