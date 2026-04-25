"""
Lumina AI — Long-Term Memory (LTM) Module.

Persists learner profiles across sessions. Uses a lightweight JSON file store
as the default (works without Firestore credentials), with an interface
designed to be swapped for Google Cloud Firestore in production.
"""

import json
import os
import threading
from datetime import datetime, timedelta
from typing import Optional, Dict, List

from app.models import LearnerProfile, ScoreEntry
from app.config import settings


class LongTermMemory:
    """
    Thread-safe in-process Long-Term Memory store.

    Stores LearnerProfile objects keyed by user_id.
    Persists to a JSON file on disk so data survives restarts.
    """

    def __init__(self, storage_path: Optional[str] = None):
        self._storage_path = storage_path or settings.ltm_storage_path
        self._lock = threading.Lock()
        self._profiles: Dict[str, LearnerProfile] = {}
        self._load()

    # ── Public API ──────────────────────────────────────────────

    def get_profile(self, user_id: str) -> LearnerProfile:
        """Retrieve a learner profile, creating a default one if it doesn't exist."""
        with self._lock:
            if user_id not in self._profiles:
                p = LearnerProfile(user_id=user_id)
                # Mock some history for the demo if it's a new profile
                now = datetime.utcnow()
                p.progress_history = [
                    ScoreEntry(timestamp=now - timedelta(days=4), score=0.3),
                    ScoreEntry(timestamp=now - timedelta(days=3), score=0.45),
                    ScoreEntry(timestamp=now - timedelta(days=2), score=0.4),
                    ScoreEntry(timestamp=now - timedelta(days=1), score=0.55),
                    ScoreEntry(timestamp=now, score=p.understanding_score),
                ]
                self._profiles[user_id] = p
                self._persist()
            return self._profiles[user_id]

    def update_profile(self, user_id: str, **kwargs) -> LearnerProfile:
        """Update specific fields on a learner profile."""
        with self._lock:
            profile = self._profiles.get(user_id, LearnerProfile(user_id=user_id))
            for key, value in kwargs.items():
                if hasattr(profile, key):
                    setattr(profile, key, value)
            profile.updated_at = datetime.utcnow()
            self._profiles[user_id] = profile
            self._persist()
            return profile

    def increment_messages(self, user_id: str) -> None:
        """Bump the total message count for a user."""
        with self._lock:
            profile = self._profiles.get(user_id, LearnerProfile(user_id=user_id))
            profile.total_messages += 1
            profile.updated_at = datetime.utcnow()
            self._profiles[user_id] = profile
            self._persist()

    def update_understanding(self, user_id: str, delta: float) -> float:
        """
        Adjust the understanding score by a delta (clamped to 0.0-1.0).
        Also appends to progress_history for visualization.
        """
        with self._lock:
            profile = self._profiles.get(user_id, LearnerProfile(user_id=user_id))
            profile.understanding_score = max(0.0, min(1.0, profile.understanding_score + delta))
            
            # Record entry for charting
            profile.progress_history.append(
                ScoreEntry(timestamp=datetime.utcnow(), score=profile.understanding_score)
            )
            
            # Limit history to last 50 entries
            if len(profile.progress_history) > 50:
                profile.progress_history = profile.progress_history[-50:]
                
            profile.updated_at = datetime.utcnow()
            self._profiles[user_id] = profile
            self._persist()
            return profile.understanding_score

    def add_stuck_point(self, user_id: str, topic: str) -> None:
        """Record a topic the user is struggling with."""
        with self._lock:
            profile = self._profiles.get(user_id, LearnerProfile(user_id=user_id))
            if topic not in profile.stuck_points:
                profile.stuck_points.append(topic)
                profile.updated_at = datetime.utcnow()
                self._profiles[user_id] = profile
                self._persist()

    def resolve_stuck_point(self, user_id: str, topic: str) -> None:
        """Mark a stuck point as resolved."""
        with self._lock:
            profile = self._profiles.get(user_id, LearnerProfile(user_id=user_id))
            if topic in profile.stuck_points:
                profile.stuck_points.remove(topic)
                if topic not in profile.topics_completed:
                    profile.topics_completed.append(topic)
                profile.updated_at = datetime.utcnow()
                self._profiles[user_id] = profile
                self._persist()

    def add_interest(self, user_id: str, interest: str) -> None:
        """Track a new user interest."""
        with self._lock:
            profile = self._profiles.get(user_id, LearnerProfile(user_id=user_id))
            if interest not in profile.interests:
                profile.interests.append(interest)
                profile.updated_at = datetime.utcnow()
                self._profiles[user_id] = profile
                self._persist()

    def get_all_users_count(self) -> int:
        """Return the total number of tracked users."""
        return len(self._profiles)

    def get_all_profiles(self) -> Dict[str, LearnerProfile]:
        """Return all profiles (for admin/debug)."""
        return dict(self._profiles)

    # ── Persistence ─────────────────────────────────────────────

    def _load(self) -> None:
        """Load profiles from JSON file."""
        if os.path.exists(self._storage_path):
            try:
                with open(self._storage_path, "r") as f:
                    raw = json.load(f)
                    for uid, data in raw.items():
                        self._profiles[uid] = LearnerProfile(**data)
            except (json.JSONDecodeError, Exception):
                self._profiles = {}

    def _persist(self) -> None:
        """Write profiles to JSON file."""
        os.makedirs(os.path.dirname(self._storage_path) or ".", exist_ok=True)
        with open(self._storage_path, "w") as f:
            json.dump(
                {uid: p.model_dump(mode="json") for uid, p in self._profiles.items()},
                f,
                indent=2,
                default=str,
            )


# ── Singleton ───────────────────────────────────────────────────────────────────
ltm_store = LongTermMemory()
