from fastapi import APIRouter
from app.api.routes import (
    auth,
    users,
    donations,
    claims,
    zakat,
    notifications,
    leaderboard,
    admin,
    volunteer,
    food_requests,
    awards,
    receipts
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(donations.router, prefix="/donations", tags=["Donations"])
api_router.include_router(claims.router, prefix="/claims", tags=["Claims"])
api_router.include_router(zakat.router, prefix="/zakat", tags=["Zakat"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(leaderboard.router, prefix="/leaderboard", tags=["Leaderboard"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(volunteer.router, prefix="/volunteer", tags=["Volunteer"])
api_router.include_router(food_requests.router, prefix="/food-requests", tags=["Food Requests"])
api_router.include_router(awards.router, prefix="/awards", tags=["Awards"])
api_router.include_router(receipts.router, prefix="/receipts", tags=["Receipts"])


api_router.include_router(food_requests.router, prefix="/requests", tags=["Food Requests - Alias"])
api_router.include_router(volunteer.router, prefix="/deliveries", tags=["Volunteer - Alias"])
