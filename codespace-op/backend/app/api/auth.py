"""Authentication API router – Firebase token verification only."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger

from app.core.firebase_auth import get_current_user, verify_firebase_token
from app.core.mongodb import get_database
from app.schemas.schemas import (
    LogoutResponse,
    MessageResponse,
    TokenVerifyRequest,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/verify", response_model=UserResponse)
async def verify_token(body: TokenVerifyRequest):
    """Verify a Firebase ID token and upsert the user in MongoDB."""
    user_info = verify_firebase_token(body.token)
    db = get_database()

    now = datetime.now(timezone.utc)
    result = await db.users.find_one_and_update(
        {"uid": user_info["uid"]},
        {
            "$set": {
                "email": user_info["email"],
                "name": user_info["name"],
                "picture": user_info.get("picture", ""),
                "email_verified": user_info.get("email_verified", False),
                "last_login": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
        return_document=True,
    )

    logger.info("User verified: {} ({})", user_info["email"], user_info["uid"])

    await db.audit_logs.insert_one({
        "user_id": user_info["uid"],
        "action": "login",
        "created_at": now,
    })

    return UserResponse(
        uid=user_info["uid"],
        email=user_info["email"],
        name=user_info["name"],
        picture=user_info.get("picture", ""),
        email_verified=user_info.get("email_verified", False),
        created_at=result.get("created_at"),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the current authenticated user's profile."""
    db = get_database()
    user_doc = await db.users.find_one({"uid": current_user["uid"]})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found in database")

    return UserResponse(
        uid=current_user["uid"],
        email=current_user["email"],
        name=current_user["name"],
        picture=current_user.get("picture", ""),
        email_verified=current_user.get("email_verified", False),
        created_at=user_doc.get("created_at"),
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(current_user: dict = Depends(get_current_user)):
    """Placeholder – Firebase handles client-side session revocation."""
    db = get_database()
    await db.audit_logs.insert_one({
        "user_id": current_user["uid"],
        "action": "logout",
        "created_at": datetime.now(timezone.utc),
    })
    logger.info("User logged out: {}", current_user["uid"])
    return LogoutResponse()
