"""
Lumina AI — User Profile & Onboarding Routes.
"""

from fastapi import APIRouter, Depends, HTTPException
from app.models import UserOnboarding, UserOut, LearnerProfile, LearnerProfileResponse
from app.utils.auth import get_current_user
from app.memory.long_term import ltm_store

router = APIRouter(prefix="/user", tags=["User"])


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
        return {"status": "success", "profile": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")


@router.get("/profile", response_model=LearnerProfileResponse)
async def get_profile(current_user: UserOut = Depends(get_current_user)):
    """
    Get the current user's learner profile.
    """
    profile = ltm_store.get_profile(current_user.id)
    return LearnerProfileResponse(profile=profile)
