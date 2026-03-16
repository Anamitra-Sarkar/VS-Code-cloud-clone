"""FastAPI application entry-point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.core.config import settings
from app.core.firebase_auth import init_firebase
from app.core.mongodb import connect_db, close_db, init_db
from app.core import llm_router, workspace_manager
from app.api import auth, workspaces, files, terminal, llm, admin


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Startup / shutdown lifecycle."""
    # ── Startup ──
    logger.info("Starting codespace-op backend on port {}", settings.PORT)

    try:
        init_firebase()
    except Exception as exc:
        logger.warning("Firebase init deferred (non-fatal in dev): {}", exc)

    await connect_db()
    await init_db()

    llm_router.init()

    try:
        workspace_manager.init()
    except Exception as exc:
        logger.warning("Workspace manager init deferred (non-fatal): {}", exc)

    logger.info("All services initialized")

    yield

    # ── Shutdown ──
    await close_db()
    await llm_router._close()
    logger.info("Backend shut down cleanly")


app = FastAPI(
    title="Codespace-OP Backend",
    description="Cloud IDE backend – Firebase auth, MongoDB storage, Docker workspaces, LLM streaming",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(auth.router)
app.include_router(workspaces.router)
app.include_router(files.router)
app.include_router(terminal.router)
app.include_router(llm.router)
app.include_router(admin.router)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "codespace-op-backend"}
