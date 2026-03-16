"""File operations router – read/write/upload/download inside workspace containers."""

import io
import re
import tarfile

import docker as docker_lib
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import PlainTextResponse, StreamingResponse
from loguru import logger

from app.core.firebase_auth import get_current_user
from app.core.mongodb import get_database
from app.core.docker_runner import exec_in_container
from app.schemas.schemas import FileWriteRequest, FileReadResponse

router = APIRouter(prefix="/files", tags=["files"])

# Reject paths containing shell metacharacters or traversal sequences
_SAFE_PATH_RE = re.compile(r"^[a-zA-Z0-9_\-./]+$")


def _validate_path(path: str) -> str:
    """Validate that a file path is safe for shell interpolation."""
    if not path or ".." in path or not _SAFE_PATH_RE.match(path):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid path: {path!r}",
        )
    return path


async def _get_user_workspace(user_id: str, workspace_id: str) -> dict:
    """Verify workspace belongs to user and return the workspace doc."""
    db = get_database()
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user_id})
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return ws


@router.get("/tree")
async def file_tree(
    workspace_id: str = Query(...),
    path: str = Query("/workspace"),
    user: dict = Depends(get_current_user),
):
    """List directory tree in the workspace container."""
    safe_path = _validate_path(path)
    ws = await _get_user_workspace(user["uid"], workspace_id)
    try:
        output = exec_in_container(
            ws["container_name"],
            f"find {safe_path} -maxdepth 3 -not -path '*/\\.*' -printf '%y %p\\n'",
        )
        nodes = []
        for line in output.strip().split("\n"):
            if not line.strip():
                continue
            parts = line.split(" ", 1)
            if len(parts) == 2:
                file_type, file_path = parts
                nodes.append({
                    "name": file_path.rsplit("/", 1)[-1],
                    "path": file_path,
                    "is_dir": file_type == "d",
                })
        return {"tree": nodes}
    except Exception as exc:
        logger.error("File tree failed: {}", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.get("/read", response_model=FileReadResponse)
async def read_file(
    workspace_id: str = Query(...),
    path: str = Query(...),
    user: dict = Depends(get_current_user),
):
    """Read a file from the workspace container."""
    safe_path = _validate_path(path)
    ws = await _get_user_workspace(user["uid"], workspace_id)
    try:
        content = exec_in_container(ws["container_name"], f"cat {safe_path}")
        return FileReadResponse(path=path, content=content)
    except Exception as exc:
        logger.error("File read failed: {}", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/write")
async def write_file(
    body: FileWriteRequest,
    user: dict = Depends(get_current_user),
):
    """Write content to a file in the workspace container."""
    safe_path = _validate_path(body.path)
    ws = await _get_user_workspace(user["uid"], body.workspace_id)
    try:
        # Write file via tar archive to avoid shell interpolation entirely
        content_bytes = body.content.encode("utf-8")
        filename = safe_path.lstrip("/")

        tar_stream = io.BytesIO()
        with tarfile.open(fileobj=tar_stream, mode="w") as tar:
            file_info = tarfile.TarInfo(name=filename)
            file_info.size = len(content_bytes)
            tar.addfile(file_info, io.BytesIO(content_bytes))
        tar_stream.seek(0)

        client = docker_lib.from_env()
        container = client.containers.get(ws["container_name"])
        container.put_archive("/", tar_stream)
        return {"message": "File written", "path": body.path}
    except Exception as exc:
        logger.error("File write failed: {}", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/upload")
async def upload_file(
    workspace_id: str = Query(...),
    path: str = Query("/workspace"),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """Upload a file into the workspace container via docker cp equivalent."""
    ws = await _get_user_workspace(user["uid"], workspace_id)
    try:
        content = await file.read()
        filename = file.filename or "uploaded_file"

        # Build a tar archive to put into the container
        tar_stream = io.BytesIO()
        with tarfile.open(fileobj=tar_stream, mode="w") as tar:
            file_info = tarfile.TarInfo(name=filename)
            file_info.size = len(content)
            tar.addfile(file_info, io.BytesIO(content))
        tar_stream.seek(0)

        client = docker_lib.from_env()
        container = client.containers.get(ws["container_name"])
        container.put_archive(path, tar_stream)

        return {"message": "File uploaded", "path": f"{path}/{filename}"}
    except Exception as exc:
        logger.error("File upload failed: {}", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.get("/download")
async def download_file(
    workspace_id: str = Query(...),
    path: str = Query(...),
    user: dict = Depends(get_current_user),
):
    """Download a file from the workspace container."""
    ws = await _get_user_workspace(user["uid"], workspace_id)
    safe_path = _validate_path(path)
    try:
        client = docker_lib.from_env()
        container = client.containers.get(ws["container_name"])
        bits, stat = container.get_archive(safe_path)
        data = b"".join(bits)

        filename = path.rsplit("/", 1)[-1]
        return StreamingResponse(
            io.BytesIO(data),
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename={filename}.tar"},
        )
    except Exception as exc:
        logger.error("File download failed: {}", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
