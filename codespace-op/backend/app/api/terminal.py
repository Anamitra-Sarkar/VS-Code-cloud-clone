"""WebSocket terminal – interactive shell into workspace containers."""

import asyncio
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from loguru import logger

from app.core.firebase_auth import verify_firebase_token
from app.core.mongodb import get_database
from app.core.docker_runner import exec_in_container

router = APIRouter(prefix="/terminal", tags=["terminal"])


async def _validate_ws_access(token: str, workspace_id: str) -> Optional[dict]:
    """Validate the Bearer token and workspace ownership.

    Returns the workspace document or None.
    """
    try:
        user = verify_firebase_token(token)
    except Exception:
        return None

    db = get_database()
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user["uid"]})
    if not ws:
        return None
    ws["_user"] = user
    return ws


@router.websocket("/ws")
async def terminal_ws(
    websocket: WebSocket,
    token: str = Query(...),
    workspace_id: str = Query(...),
):
    """Interactive terminal session inside a workspace container.

    The client connects with: ws://.../terminal/ws?token=<firebase_token>&workspace_id=<id>
    Messages sent from the client are executed as commands; output is streamed back.
    """
    ws_doc = await _validate_ws_access(token, workspace_id)
    if ws_doc is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    container_name = ws_doc["container_name"]
    logger.info("Terminal session opened for workspace {} by {}", workspace_id, ws_doc["_user"]["uid"])

    try:
        # Send a welcome message
        await websocket.send_text(f"Connected to workspace {workspace_id}\r\n$ ")

        while True:
            data = await websocket.receive_text()
            command = data.strip()
            if not command:
                await websocket.send_text("$ ")
                continue

            try:
                # Run the command inside the container in a thread to avoid blocking
                loop = asyncio.get_event_loop()
                output = await loop.run_in_executor(
                    None, exec_in_container, container_name, f"sh -c '{command}'"
                )
                await websocket.send_text(output + "\r\n$ ")
            except Exception as exc:
                await websocket.send_text(f"Error: {exc}\r\n$ ")
    except WebSocketDisconnect:
        logger.info("Terminal session closed for workspace {}", workspace_id)
    except Exception as exc:
        logger.error("Terminal error: {}", exc)
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
