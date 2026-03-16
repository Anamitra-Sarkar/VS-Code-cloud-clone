"""Async MongoDB connection via Motor."""

from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from loguru import logger

from app.core.config import settings

_client: Optional[AsyncIOMotorClient] = None
_database: Optional[AsyncIOMotorDatabase] = None


async def connect_db() -> None:
    """Create the Motor client and select the database."""
    global _client, _database
    _client = AsyncIOMotorClient(settings.MONGODB_URL)
    _database = _client[settings.MONGODB_DB_NAME]
    logger.info("Connected to MongoDB: {}", settings.MONGODB_DB_NAME)


async def close_db() -> None:
    """Close the Motor client."""
    global _client, _database
    if _client:
        _client.close()
        _client = None
        _database = None
        logger.info("MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    """Return the active database instance."""
    if _database is None:
        raise RuntimeError("Database not initialized – call connect_db() first")
    return _database


async def init_db() -> None:
    """Create indexes on collections for performance and uniqueness."""
    db = get_database()

    # Users collection
    await db.users.create_index("uid", unique=True)
    await db.users.create_index("email")

    # Workspaces collection
    await db.workspaces.create_index("user_id")
    await db.workspaces.create_index([("user_id", 1), ("name", 1)])

    # LLM usage
    await db.llm_usage.create_index("user_id")
    await db.llm_usage.create_index("created_at")

    # Snapshots
    await db.snapshots.create_index("user_id")
    await db.snapshots.create_index([("user_id", 1), ("workspace_id", 1)])

    # Audit logs
    await db.audit_logs.create_index("user_id")
    await db.audit_logs.create_index("created_at")

    logger.info("MongoDB indexes created")
