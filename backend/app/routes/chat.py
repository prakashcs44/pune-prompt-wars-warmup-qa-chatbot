"""
Lumina AI — Chat Routes.
"""

from fastapi import APIRouter, HTTPException
import logging

from app.models import ChatRequest, ChatResponse
from app.agents.factory import get_orchestrator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    Send a chat message and receive an AI response.
    """
    try:
        orchestrator = get_orchestrator()
        response = await orchestrator.chat(
            user_id=request.user_id,
            session_id=request.session_id,
            message=request.message,
            attachments=request.attachments,
        )
        return ChatResponse(
            response=response,
            session_id=request.session_id,
            user_id=request.user_id,
        )
    except ValueError as e:
        logger.error("Validation error: %s", e)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Chat error for user=%s session=%s", request.user_id, request.session_id)
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
