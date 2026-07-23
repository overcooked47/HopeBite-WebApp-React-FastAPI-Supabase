from typing import List, Any, Optional
from datetime import datetime, timezone, timedelta
from app.core.supabase import supabase, run_query
from app.schemas.leaderboard import LeaderboardResponse, LeaderboardEntry, DashboardStats
from app.schemas.user import UserPublicResponse
from app.models.user import UserRole, UserType
import logging

logger = logging.getLogger(__name__)


class LeaderboardService:
    def __init__(self, db=None):
        pass

    async def get_leaderboard(self, limit: int = 10, offset: int = 0, period: str = "all_time") -> LeaderboardResponse:
        """Get the leaderboard of top contributors based on donations and approvals"""
        try:
            
            date_filter = None
            if period == "weekly":
                date_filter = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
            elif period == "monthly":
                date_filter = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
            
            
            contributors_response = await run_query(
                supabase.table("users")
                .select("id, full_name, city, avatar_url, role, user_type, organization_name, total_donations, total_meals_donated, donation_points")
                .eq("role", "contributor")
                .eq("is_active", True)
            )
            
            if not contributors_response.data:
                return LeaderboardResponse(entries=[], total_users=0, period=period)
            
            contributors = contributors_response.data
            entries = []
            
            for contributor in contributors:
                user_id = contributor["id"]
                
                
                donation_query = supabase.table("food_donations").select("id, quantity", count="exact").eq("donor_id", user_id)
                if date_filter:
                    donation_query = donation_query.gte("created_at", date_filter)
                donation_response = await run_query(donation_query)
                food_donation_count = donation_response.count or 0
                total_meals = sum(d.get("quantity", 0) for d in (donation_response.data or []))
                
                
                zakat_query = supabase.table("zakat_donations").select("id, amount", count="exact").eq("donor_id", user_id)
                if date_filter:
                    zakat_query = zakat_query.gte("created_at", date_filter)
                zakat_response = await run_query(zakat_query)
                zakat_donation_count = zakat_response.count or 0
                total_zakat = sum(float(z.get("amount", 0)) for z in (zakat_response.data or []))
                
                
                total_donations = food_donation_count + zakat_donation_count
                donation_points = (food_donation_count * 10) + (total_meals * 5) + int(total_zakat / 100)
                
                if total_donations > 0 or donation_points > 0:
                    entries.append({
                        "user": UserPublicResponse(
                            id=contributor["id"],
                            full_name=contributor["full_name"],
                            city=contributor.get("city"),
                            avatar_url=contributor.get("avatar_url"),
                            role=UserRole(contributor["role"]),
                            user_type=UserType(contributor.get("user_type", "individual")),
                            organization_name=contributor.get("organization_name"),
                            total_donations=total_donations,
                            total_meals_donated=total_meals,
                            donation_points=donation_points,
                        ),
                        "total_donations": total_donations,
                        "total_meals_donated": total_meals,
                        "donation_points": donation_points,
                    })
            
            
            entries.sort(key=lambda x: x["donation_points"], reverse=True)
            
            
            total_users = len(entries)
            paginated_entries = entries[offset:offset + limit]
            
            leaderboard_entries = [
                LeaderboardEntry(
                    rank=offset + idx + 1,
                    user=entry["user"],
                    total_donations=entry["total_donations"],
                    total_meals_donated=entry["total_meals_donated"],
                    donation_points=entry["donation_points"],
                )
                for idx, entry in enumerate(paginated_entries)
            ]
            
            logger.info(f"Leaderboard fetched: {len(leaderboard_entries)} entries, total users: {total_users}")
            
            return LeaderboardResponse(
                entries=leaderboard_entries,
                total_users=total_users,
                period=period
            )
            
        except Exception as e:
            logger.error(f"Error fetching leaderboard: {e}", exc_info=True)
            return LeaderboardResponse(entries=[], total_users=0, period=period)

    async def get_user_rank(self, user_id: str) -> Optional[dict]:
        """Get user's current rank in the leaderboard"""
        try:
            leaderboard = await self.get_leaderboard(limit=1000)
            
            for entry in leaderboard.entries:
                if entry.user.id == user_id:
                    return {
                        "rank": entry.rank,
                        "total_users": leaderboard.total_users,
                        "percentile": round((1 - (entry.rank / leaderboard.total_users)) * 100, 1) if leaderboard.total_users > 0 else 0,
                    }
            
            return {
                "rank": leaderboard.total_users + 1,
                "total_users": leaderboard.total_users,
                "percentile": 0,
            }
        except Exception as e:
            logger.error(f"Error getting user rank: {e}")
            return None

    async def get_dashboard_stats(self, user_id: str) -> DashboardStats:
        """Get dashboard stats for a user"""
        try:
            
            donations_response = await run_query(
                supabase.table("food_donations")
                .select("id, quantity, status", count="exact")
                .eq("donor_id", user_id)
            )
            
            donations = donations_response.data or []
            total_donations = len(donations)
            total_meals = sum(d.get("quantity", 0) for d in donations)
            active_donations = len([d for d in donations if d.get("status") == "available"])
            completed_donations = len([d for d in donations if d.get("status") in ["claimed", "completed"]])
            
            
            pending_claims = 0
            
            
            donation_points = (total_donations * 10) + (total_meals * 5)
            
            
            rank_data = await self.get_user_rank(user_id)
            rank = rank_data.get("rank") if rank_data else None
            
            return DashboardStats(
                total_donations=total_donations,
                total_meals_donated=total_meals,
                active_donations=active_donations,
                completed_donations=completed_donations,
                pending_claims=pending_claims,
                donation_points=donation_points,
                rank=rank,
                recent_activity=[],
            )
        except Exception as e:
            logger.error(f"Error getting dashboard stats: {e}")
            return DashboardStats(
                total_donations=0,
                total_meals_donated=0,
                active_donations=0,
                completed_donations=0,
                pending_claims=0,
                donation_points=0,
                rank=None,
                recent_activity=[],
            )
