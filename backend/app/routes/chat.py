"""
Lumina AI — Chat Routes.
"""

from fastapi import APIRouter, HTTPException, Depends
import logging

from app.models import ChatRequest, ChatResponse, UserOut
from app.agents.factory import get_orchestrator
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def send_message(request: ChatRequest, current_user: UserOut = Depends(get_current_user)):
    """
    Send a chat message and receive an AI response.
    """
    try:
        orchestrator = get_orchestrator()
        response = await orchestrator.chat(
            user_id=current_user.id,
            session_id=request.session_id,
            message=request.message,
            attachments=request.attachments,
        )
        return ChatResponse(
            response=response,
            session_id=request.session_id,
            user_id=current_user.id,
        )
    except ValueError as e:
        logger.error("Validation error: %s", e)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Chat error for user=%s session=%s", current_user.id, request.session_id)
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
