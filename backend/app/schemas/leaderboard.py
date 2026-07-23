from pydantic import BaseModel
from typing import List, Optional
from app.schemas.user import UserPublicResponse


class LeaderboardEntry(BaseModel):
    rank: int
    user: UserPublicResponse
    total_donations: int
    total_meals_donated: int
    donation_points: int


class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntry]
    total_users: int
    period: str  


class UserRankResponse(BaseModel):
    rank: int
    total_users: int
    percentile: float
    user: UserPublicResponse


class DashboardStats(BaseModel):
    total_donations: int
    total_meals_donated: int
    active_donations: int
    completed_donations: int
    pending_claims: int
    donation_points: int
    rank: Optional[int] = None
    recent_activity: List[dict] = []


class PlatformStats(BaseModel):
    total_users: int
    total_donations: int
    total_meals_shared: int
    total_claims_completed: int
    active_donors: int
    cities_covered: int
