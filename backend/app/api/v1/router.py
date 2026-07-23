from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router

api_router = APIRouter(prefix="/api/v1")


api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])

@api_router.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for API v1."""
    return {"status": "healthy"}
