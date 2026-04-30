"""
Lumina AI — Session Management Routes.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List

from app.models import SessionInfo, SessionListResponse, UserOut
from app.memory.short_term import stm_store
from app.agents.factory import get_orchestrator
from app.utils.auth import get_current_user

router = APIRouter(prefix="sessions", tags=["Sessions"])


@router.get("", response_model=SessionListResponse)
async def list_sessions(current_user: UserOut = Depends(get_current_user)):
    """List all chat sessions for the current user."""
    sessions_raw = stm_store.get_sessions_for_user(current_user.id)
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
    return SessionListResponse(user_id=current_user.id, sessions=sessions)


@router.get("/{session_id}/history")
async def get_session_history(session_id: str, current_user: UserOut = Depends(get_current_user)):
    """Retrieve full message history for a specific session."""
    try:
        orchestrator = get_orchestrator()
        # Note: In a real app, we should verify session_id belongs to current_user
        history = orchestrator.get_history(session_id)
        return {"session_id": session_id, "messages": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{session_id}")
async def delete_session(session_id: str, current_user: UserOut = Depends(get_current_user)):
    """Delete a chat session."""
    # Note: In a real app, we should verify session_id belongs to current_user
    success = stm_store.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted", "session_id": session_id}
