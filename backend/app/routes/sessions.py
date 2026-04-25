"""
Lumina AI — Session Management Routes.
"""

from fastapi import APIRouter, HTTPException
from typing import List

from app.models import SessionInfo, SessionListResponse
from app.memory.short_term import stm_store
from app.agents.factory import get_orchestrator

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.get("/{user_id}", response_model=SessionListResponse)
async def list_sessions(user_id: str):
    """List all chat sessions for a user."""
    sessions_raw = stm_store.get_sessions_for_user(user_id)
    sessions = [
        SessionInfo(
            session_id=s["session_id"],
            title=s["title"],
            message_count=s["message_count"],
            created_at=s["created_at"],
            last_active=s["last_active"],
        )
        for s in sessions_raw
    ]
    return SessionListResponse(user_id=user_id, sessions=sessions)


@router.get("/{session_id}/history")
async def get_session_history(session_id: str):
    """Retrieve full message history for a specific session."""
    try:
        orchestrator = get_orchestrator()
        history = orchestrator.get_history(session_id)
        return {"session_id": session_id, "messages": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """Delete a chat session."""
    success = stm_store.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted", "session_id": session_id}
