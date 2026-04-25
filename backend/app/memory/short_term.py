"""
Lumina AI — Short-Term Memory (STM) Module.

Wraps LangGraph's MemorySaver (in-memory checkpoint) to provide
per-session conversational context. Each session_id maps to a
separate thread in the checkpointer, so conversations don't bleed.
"""

from langgraph.checkpoint.memory import MemorySaver
from typing import Dict, Any, Optional
from datetime import datetime


class ShortTermMemory:
    """
    Manages per-session conversation state via LangGraph checkpoints.

    Also maintains a lightweight session registry (title, timestamps,
    message counts) for the session-list API.
    """

    def __init__(self):
        self.checkpointer = MemorySaver()
        # session_id → metadata
        self._session_meta: Dict[str, Dict[str, Any]] = {}

    # ── Session registry ────────────────────────────────────────

    def register_session(self, session_id: str, user_id: str) -> None:
        """Ensure a session is tracked in the registry."""
        if session_id not in self._session_meta:
            self._session_meta[session_id] = {
                "session_id": session_id,
                "user_id": user_id,
                "title": "New Chat",
                "message_count": 0,
                "created_at": datetime.utcnow(),
                "last_active": datetime.utcnow(),
            }

    def bump_session(self, session_id: str, title: Optional[str] = None) -> None:
        """Update last-active time and optionally the title."""
        meta = self._session_meta.get(session_id)
        if meta:
            meta["message_count"] += 1
            meta["last_active"] = datetime.utcnow()
            if title:
                meta["title"] = title

    def get_sessions_for_user(self, user_id: str):
        """Return all sessions for a given user, sorted by last_active desc."""
        return sorted(
            [m for m in self._session_meta.values() if m["user_id"] == user_id],
            key=lambda m: m["last_active"],
            reverse=True,
        )

    def delete_session(self, session_id: str) -> bool:
        """Remove a session from the registry."""
        if session_id in self._session_meta:
            del self._session_meta[session_id]
            return True
        return False

    def get_config(self, session_id: str) -> dict:
        """Return the LangGraph config dict for a given session."""
        return {"configurable": {"thread_id": session_id}}


# ── Singleton ───────────────────────────────────────────────────────────────────
stm_store = ShortTermMemory()
