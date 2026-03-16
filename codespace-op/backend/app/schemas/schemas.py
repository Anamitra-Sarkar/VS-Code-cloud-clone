"""Pydantic schemas for request / response validation."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ──────────────────── Auth ────────────────────

class TokenVerifyRequest(BaseModel):
    token: str = Field(..., description="Firebase ID token")


class UserResponse(BaseModel):
    uid: str
    email: str
    name: str
    picture: str = ""
    email_verified: bool = False
    created_at: Optional[datetime] = None


class LogoutResponse(BaseModel):
    message: str = "Logged out – client should revoke Firebase session"


# ──────────────────── Workspaces ────────────────────

class WorkspaceCreateRequest(BaseModel):
    name: str = "default"
    repo_url: Optional[str] = None


class WorkspaceResponse(BaseModel):
    workspace_id: str
    user_id: str
    name: str
    container_name: str = ""
    repo_url: Optional[str] = None
    status: str = "creating"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class WorkspaceActionResponse(BaseModel):
    workspace_id: str
    status: str


class SnapshotResponse(BaseModel):
    snapshot_id: str = ""
    workspace_id: str
    user_id: str = ""
    name: str
    size_bytes: int = 0
    created_at: Optional[datetime] = None


class RestoreRequest(BaseModel):
    snapshot_name: str


# ──────────────────── Files ────────────────────

class FileWriteRequest(BaseModel):
    workspace_id: str
    path: str
    content: str


class FileNode(BaseModel):
    name: str
    path: str
    is_dir: bool
    children: Optional[List["FileNode"]] = None


class FileReadResponse(BaseModel):
    path: str
    content: str


# ──────────────────── LLM ────────────────────

class CompletionRequest(BaseModel):
    prompt: str
    prefer: str = "grok"
    model: Optional[str] = None


class AgentRequest(BaseModel):
    action: str = Field(..., description="One of: complete, fix, explain, run")
    prompt: str
    workspace_id: Optional[str] = None
    file_path: Optional[str] = None
    prefer: str = "grok"
    model: Optional[str] = None


class UsageRecord(BaseModel):
    provider: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    created_at: Optional[datetime] = None


class UsageResponse(BaseModel):
    user_id: str
    records: List[UsageRecord]
    total_tokens: int


# ──────────────────── Admin ────────────────────

class AdminStatsResponse(BaseModel):
    total_users: int
    total_workspaces: int
    total_llm_requests: int
    total_tokens: int


# ──────────────────── Generic ────────────────────

class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: str
