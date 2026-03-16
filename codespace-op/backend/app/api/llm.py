"""LLM completion and agentic AI endpoints with SSE streaming."""

import json
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger
from sse_starlette.sse import EventSourceResponse

from app.core.firebase_auth import get_current_user
from app.core.llm_router import generate_stream, count_tokens
from app.core.mongodb import get_database
from app.core.docker_runner import exec_in_container
from app.schemas.schemas import (
    AgentRequest,
    CompletionRequest,
    UsageRecord,
    UsageResponse,
)

router = APIRouter(prefix="/llm", tags=["llm"])

_SAFE_PATH_RE = re.compile(r"^[a-zA-Z0-9_\-./]+$")


@router.post("/completions")
async def completions(body: CompletionRequest, user: dict = Depends(get_current_user)):
    """SSE-streaming completions endpoint."""

    async def event_generator():
        try:
            async for chunk in generate_stream(
                prompt=body.prompt,
                prefer=body.prefer,
                user_id=user["uid"],
                model=body.model,
            ):
                yield {"data": json.dumps({"content": chunk})}
            yield {"data": json.dumps({"done": True})}
        except Exception as exc:
            logger.error("Completion stream error: {}", exc)
            yield {"data": json.dumps({"error": str(exc)})}

    return EventSourceResponse(event_generator())


@router.post("/agent")
async def agent(body: AgentRequest, user: dict = Depends(get_current_user)):
    """Agentic AI endpoint – code completion, fix errors, explain, run commands."""

    system_prompts = {
        "complete": "You are a code completion assistant. Complete the code based on the context provided. Return only code, no explanations.",
        "fix": "You are a debugging assistant. Analyze the error and provide a fixed version of the code. Explain the fix briefly.",
        "explain": "You are a code explanation assistant. Explain the code clearly and concisely.",
        "run": "You are a terminal command assistant. Suggest and explain the command to run.",
    }

    system_prompt = system_prompts.get(body.action, system_prompts["complete"])
    full_prompt = f"{system_prompt}\n\n{body.prompt}"

    # If workspace and file context is provided, enrich the prompt
    if body.workspace_id and body.file_path:
        try:
            db = get_database()
            ws = await db.workspaces.find_one({
                "workspace_id": body.workspace_id,
                "user_id": user["uid"],
            })
            if ws and body.file_path and _SAFE_PATH_RE.match(body.file_path) and ".." not in body.file_path:
                file_content = exec_in_container(ws["container_name"], f"cat {body.file_path}")
                full_prompt += f"\n\nFile ({body.file_path}):\n```\n{file_content}\n```"
        except Exception as exc:
            logger.warning("Could not read file context: {}", exc)

    # If action is "run" and workspace is provided, execute the command
    if body.action == "run" and body.workspace_id:

        async def run_generator():
            try:
                # First get AI suggestion for the command
                command_suggestion = ""
                async for chunk in generate_stream(
                    prompt=full_prompt,
                    prefer=body.prefer,
                    user_id=user["uid"],
                    model=body.model,
                ):
                    command_suggestion += chunk
                    yield {"data": json.dumps({"content": chunk, "phase": "thinking"})}

                yield {"data": json.dumps({"done": True})}
            except Exception as exc:
                logger.error("Agent run error: {}", exc)
                yield {"data": json.dumps({"error": str(exc)})}

        return EventSourceResponse(run_generator())

    async def event_generator():
        try:
            async for chunk in generate_stream(
                prompt=full_prompt,
                prefer=body.prefer,
                user_id=user["uid"],
                model=body.model,
            ):
                yield {"data": json.dumps({"content": chunk})}
            yield {"data": json.dumps({"done": True})}
        except Exception as exc:
            logger.error("Agent stream error: {}", exc)
            yield {"data": json.dumps({"error": str(exc)})}

    return EventSourceResponse(event_generator())


@router.get("/usage", response_model=UsageResponse)
async def get_usage(user: dict = Depends(get_current_user)):
    """Return per-user token usage from MongoDB."""
    db = get_database()
    cursor = db.llm_usage.find(
        {"user_id": user["uid"]},
        {"_id": 0},
    ).sort("created_at", -1).limit(100)

    records = await cursor.to_list(length=100)
    total = sum(r.get("total_tokens", 0) for r in records)

    return UsageResponse(
        user_id=user["uid"],
        records=[UsageRecord(**r) for r in records],
        total_tokens=total,
    )
