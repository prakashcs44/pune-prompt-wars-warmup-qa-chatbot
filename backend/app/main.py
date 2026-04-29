"""
Lumina AI — Application Entrypoint.

Assembles the FastAPI application with all routers, middleware, and
startup configuration. This is the single file Uvicorn points to.
"""

import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv

# Load .env BEFORE any app imports that read settings
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.config import settings
from app.routes import chat, sessions, health, auth, user
from app.utils.auth import init_db


# ── Logging ─────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("lumina")


# ── Lifespan (startup / shutdown) ───────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Lumina AI starting — model=%s", settings.openrouter_model)
    logger.info("📂 LTM storage path: %s", settings.ltm_storage_path)
    init_db()
    yield
    logger.info("👋 Lumina AI shutting down")


# ── App Factory ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Lumina AI — Intelligent Learning Assistant",
    description=(
        "A personalized chatbot that adapts to a user's learning pace "
        "and understanding level, powered by Google Gemini and LangGraph."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ────────────────────────────────────────────────────────────────────────
origins = [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(chat.router)
app.include_router(sessions.router)
app.include_router(health.router)


# ── Root ────────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    return {
        "name": "Lumina AI",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


# ── Direct Run ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
