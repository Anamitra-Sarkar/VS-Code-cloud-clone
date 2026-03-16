"""Firebase Admin SDK initialization and token verification."""

import base64
import json
import tempfile
from typing import Optional

import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from loguru import logger

from app.core.config import settings

_firebase_app: Optional[firebase_admin.App] = None
_bearer_scheme = HTTPBearer(auto_error=False)


def init_firebase() -> None:
    """Initialize the Firebase Admin SDK.

    Supports:
    - A file path to a service-account JSON file.
    - A base64-encoded JSON string in the environment variable.
    - Empty string → use Application Default Credentials.
    """
    global _firebase_app
    if _firebase_app is not None:
        return

    cred_value = settings.FIREBASE_CREDENTIALS_JSON.strip()

    if not cred_value:
        logger.info("No Firebase credentials provided; using Application Default Credentials")
        cred = credentials.ApplicationDefault()
    elif cred_value.startswith("{"):
        # Raw JSON string
        info = json.loads(cred_value)
        cred = credentials.Certificate(info)
        logger.info("Firebase initialized from JSON string")
    elif cred_value.endswith(".json"):
        # File path
        cred = credentials.Certificate(cred_value)
        logger.info("Firebase initialized from file: {}", cred_value)
    else:
        # Assume base64-encoded JSON
        decoded = base64.b64decode(cred_value)
        info = json.loads(decoded)
        cred = credentials.Certificate(info)
        logger.info("Firebase initialized from base64-encoded credentials")

    _firebase_app = firebase_admin.initialize_app(cred)
    logger.info("Firebase Admin SDK initialized successfully")


def verify_firebase_token(token: str) -> dict:
    """Verify a Firebase ID token and return the decoded claims.

    Returns a dict with at minimum: uid, email, name.
    Raises HTTPException on failure.
    """
    try:
        decoded = firebase_auth.verify_id_token(token)
        return {
            "uid": decoded["uid"],
            "email": decoded.get("email", ""),
            "name": decoded.get("name", decoded.get("email", "Anonymous")),
            "picture": decoded.get("picture", ""),
            "email_verified": decoded.get("email_verified", False),
        }
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase token has expired",
        )
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase token",
        )
    except Exception as exc:
        logger.error("Firebase token verification failed: {}", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )


async def get_current_user(
    cred: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> dict:
    """FastAPI dependency – extracts Bearer token, verifies with Firebase,
    and returns user dict with uid, email, name."""
    if cred is None or not cred.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return verify_firebase_token(cred.credentials)
