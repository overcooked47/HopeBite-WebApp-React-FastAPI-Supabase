from .auth import router as auth_router
from .users import router as users_router
from .donations import router as donations_router
from .claims import router as claims_router
from .zakat import router as zakat_router
from .notifications import router as notifications_router
from .leaderboard import router as leaderboard_router
from .admin import router as admin_router
from .volunteer import router as volunteer_router
from .food_requests import router as food_requests_router
from .awards import router as awards_router
from .receipts import router as receipts_router

__all__ = [
    "auth_router",
    "users_router",
    "donations_router",
    "claims_router",
    "zakat_router",
    "notifications_router",
    "leaderboard_router",
    "admin_router",
    "volunteer_router",
    "food_requests_router",
    "awards_router",
    "receipts_router",
]
