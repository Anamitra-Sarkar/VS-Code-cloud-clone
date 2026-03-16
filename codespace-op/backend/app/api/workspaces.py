"""Workspace CRUD router – all operations scoped to the authenticated user."""

from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger

from app.core.firebase_auth import get_current_user
from app.core.workspace_manager import (
    create_workspace,
    delete_workspace,
    list_workspaces,
    restore_snapshot,
    snapshot_workspace,
    start_workspace,
    stop_workspace,
)
from app.schemas.schemas import (
    RestoreRequest,
    SnapshotResponse,
    WorkspaceActionResponse,
    WorkspaceCreateRequest,
    WorkspaceResponse,
)

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.post("/", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create(body: WorkspaceCreateRequest, user: dict = Depends(get_current_user)):
    """Create a new workspace for the authenticated user."""
    try:
        ws = await create_workspace(user["uid"], name=body.name, repo_url=body.repo_url)
        return WorkspaceResponse(**ws)
    except Exception as exc:
        logger.error("Workspace creation failed: {}", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.get("/", response_model=list[WorkspaceResponse])
async def list_user_workspaces(user: dict = Depends(get_current_user)):
    """List all workspaces belonging to the authenticated user."""
    workspaces = await list_workspaces(user["uid"])
    return [WorkspaceResponse(**ws) for ws in workspaces]


@router.post("/{workspace_id}/start", response_model=WorkspaceActionResponse)
async def start(workspace_id: str, user: dict = Depends(get_current_user)):
    """Start a stopped workspace."""
    try:
        result = await start_workspace(user["uid"], workspace_id)
        return WorkspaceActionResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("Start workspace failed: {}", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/{workspace_id}/stop", response_model=WorkspaceActionResponse)
async def stop(workspace_id: str, user: dict = Depends(get_current_user)):
    """Stop a running workspace."""
    try:
        result = await stop_workspace(user["uid"], workspace_id)
        return WorkspaceActionResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("Stop workspace failed: {}", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/{workspace_id}/snapshot", response_model=SnapshotResponse)
async def create_snapshot(workspace_id: str, user: dict = Depends(get_current_user)):
    """Create a snapshot of the workspace."""
    try:
        snap = await snapshot_workspace(user["uid"], workspace_id)
        return SnapshotResponse(**snap)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("Snapshot failed: {}", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/{workspace_id}/restore", response_model=WorkspaceActionResponse)
async def restore(
    workspace_id: str,
    body: RestoreRequest,
    user: dict = Depends(get_current_user),
):
    """Restore a workspace from a snapshot."""
    try:
        result = await restore_snapshot(user["uid"], workspace_id, body.snapshot_name)
        return WorkspaceActionResponse(workspace_id=result["workspace_id"], status=result["status"])
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("Restore failed: {}", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.delete("/{workspace_id}", response_model=WorkspaceActionResponse)
async def delete(workspace_id: str, user: dict = Depends(get_current_user)):
    """Delete a workspace."""
    try:
        result = await delete_workspace(user["uid"], workspace_id)
        return WorkspaceActionResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("Delete workspace failed: {}", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
