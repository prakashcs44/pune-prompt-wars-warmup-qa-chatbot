"""
Lumina AI — Pydantic request/response models for type safety and validation.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ── Chat ────────────────────────────────────────────────────────────────────────

class Attachment(BaseModel):
    """File attachment info."""
    filename: str
    content: str  # Base64 encoded content


class ChatRequest(BaseModel):
    """Incoming chat message from the frontend."""
    message: str = Field(..., min_length=1, max_length=10_000, description="User message text")
    session_id: str = Field(..., min_length=1, max_length=100, description="Unique session identifier")
    user_id: str = Field(..., min_length=1, max_length=100, description="Unique user identifier")
    attachments: Optional[List[Attachment]] = Field(default=None, description="Optional list of file contents")



class ChatResponse(BaseModel):
    """Response returned to the frontend."""
    response: str
    session_id: str
    user_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ── Session Management ──────────────────────────────────────────────────────────

class SessionInfo(BaseModel):
    """Summary of a single chat session."""
    session_id: str
    title: str
    message_count: int
    created_at: datetime
    last_active: datetime


class SessionListResponse(BaseModel):
    """List of sessions for a user."""
    user_id: str
    sessions: List[SessionInfo]


# ── Learner Profile (LTM) ──────────────────────────────────────────────────────

class ScoreEntry(BaseModel):
    """Timestamped score for progress tracking."""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    score: float

class LearnerProfile(BaseModel):
    """Persistent learner profile stored in Long-Term Memory."""
    user_id: str
    pace: str = Field(default="medium", description="Learning pace: slow, medium, fast")
    expertise_level: str = Field(default="beginner", description="beginner, intermediate, advanced")
    interests: List[str] = Field(default_factory=list)
    stuck_points: List[str] = Field(default_factory=list)
    understanding_score: float = Field(default=0.5, ge=0.0, le=1.0)
    topics_completed: List[str] = Field(default_factory=list)
    progress_history: List[ScoreEntry] = Field(default_factory=list)
    total_messages: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)



class LearnerProfileResponse(BaseModel):
    """Response wrapper for learner profile."""
    profile: LearnerProfile


# ── Health ──────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    version: str = "1.0.0"
    model: str = ""
    ltm_users_count: int = 0
