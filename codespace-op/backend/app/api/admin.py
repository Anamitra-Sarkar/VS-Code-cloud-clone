"""Admin endpoints – user list and platform stats."""

from fastapi import APIRouter, Depends
from loguru import logger

from app.core.firebase_auth import get_current_user
from app.core.mongodb import get_database
from app.schemas.schemas import AdminStatsResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
async def list_users(
    skip: int = 0,
    limit: int = 50,
    user: dict = Depends(get_current_user),
):
    """List all users (admin endpoint)."""
    db = get_database()
    cursor = db.users.find({}, {"_id": 0}).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    total = await db.users.count_documents({})
    return {"users": users, "total": total, "skip": skip, "limit": limit}


@router.get("/stats", response_model=AdminStatsResponse)
async def get_stats(user: dict = Depends(get_current_user)):
    """Return platform-wide statistics."""
    db = get_database()

    total_users = await db.users.count_documents({})
    total_workspaces = await db.workspaces.count_documents({})
    total_llm_requests = await db.llm_usage.count_documents({})

    # Sum total tokens
    pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$total_tokens"}}}
    ]
    result = await db.llm_usage.aggregate(pipeline).to_list(length=1)
    total_tokens = result[0]["total"] if result else 0

    return AdminStatsResponse(
        total_users=total_users,
        total_workspaces=total_workspaces,
        total_llm_requests=total_llm_requests,
        total_tokens=total_tokens,
    )
