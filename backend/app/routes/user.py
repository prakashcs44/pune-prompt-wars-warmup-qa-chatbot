"""
Lumina AI — User Profile & Onboarding Routes.
"""

from fastapi import APIRouter, Depends, HTTPException
from app.models import UserOnboarding, UserOut, LearnerProfile, LearnerProfileResponse
from app.utils.auth import get_current_user
from app.memory.long_term import ltm_store
from app.agents.factory import get_orchestrator

import logging
router = APIRouter(prefix="/user", tags=["User"])
logger = logging.getLogger(__name__)


@router.post("/onboarding")
async def onboarding(data: UserOnboarding, current_user: UserOut = Depends(get_current_user)):
    """
    Collect onboarding data and update the learner profile.
    """
    try:
        profile = ltm_store.update_profile(
            user_id=current_user.id,
            age=data.age,
            profession=data.profession,
            education_level=data.education_level,
            interests=data.interests,
            learning_goals=data.learning_goals
        )
        
        # Trigger dynamic prompt generation after onboarding
        orchestrator = get_orchestrator()
        await orchestrator.generate_suggested_prompts(current_user.id)
        
        return {"status": "success", "profile": profile}
    except Exception as e:
        logger.exception("Onboarding failed for user %s", current_user.id)
        raise HTTPException(status_code=500, detail="Something went wrong while updating your profile.")


@router.get("/profile", response_model=LearnerProfileResponse)
async def get_profile(current_user: UserOut = Depends(get_current_user)):
    """
    Get the current user's learner profile.
    """
    profile = ltm_store.get_profile(current_user.id)
    return LearnerProfileResponse(profile=profile)
