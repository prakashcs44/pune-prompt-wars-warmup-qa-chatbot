"""
Lumina AI — Health & Profile Routes.
"""

from fastapi import APIRouter

from app.models import HealthResponse, LearnerProfile, LearnerProfileResponse
from app.config import settings
from app.memory.long_term import ltm_store

router = APIRouter(tags=["Health & Profile"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        model=settings.openrouter_model,
        ltm_users_count=ltm_store.get_all_users_count(),
    )


@router.get("/profile/{user_id}", response_model=LearnerProfileResponse)
async def get_learner_profile(user_id: str):
    """Retrieve the learner profile (LTM) for a user."""
    profile = ltm_store.get_profile(user_id)
    return LearnerProfileResponse(profile=profile)
