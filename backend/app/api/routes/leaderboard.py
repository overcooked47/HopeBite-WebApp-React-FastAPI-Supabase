from fastapi import APIRouter, Depends, Query


from app.core.security import get_current_user
from app.services.leaderboard_service import LeaderboardService
from app.schemas.leaderboard import (
    LeaderboardResponse,
    UserRankResponse,
    DashboardStats,
    PlatformStats,
)
from app.models.user import User

router = APIRouter(tags=["Leaderboard"])


@router.get("/", response_model=LeaderboardResponse)
async def get_leaderboard(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    period: str = Query("all_time", pattern="^(all_time|monthly|weekly)$"),
):
    
    leaderboard_service = LeaderboardService()
    
    return await leaderboard_service.get_leaderboard(
        limit=limit,
        offset=offset,
        period=period,
    )


@router.get("/my-rank", response_model=UserRankResponse)
async def get_my_rank(
    current_user: User = Depends(get_current_user),
):
   
    leaderboard_service = LeaderboardService()
    
    rank_data = await leaderboard_service.get_user_rank(current_user.id)
    
    if not rank_data:
        return UserRankResponse(
            rank=0,
            total_users=0,
            percentile=0.0,
            user=current_user,
        )
    
    return rank_data


@router.get("/dashboard-stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
):
    """Get dashboard statistics for current user."""
    leaderboard_service = LeaderboardService()
    
    return await leaderboard_service.get_dashboard_stats(current_user.id)


@router.get("/platform-stats", response_model=PlatformStats)
async def get_platform_stats(
):
    """Get overall platform statistics (public)."""
    leaderboard_service = LeaderboardService()
    
    return await leaderboard_service.get_platform_stats()
