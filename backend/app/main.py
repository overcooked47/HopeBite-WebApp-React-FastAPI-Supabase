from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
import logging

from app.core.config import settings
from app.core.database import init_db, close_db
from app.api.router import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    try:
        await init_db()
        logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
        logger.info("🔒 Secure Connection: Supabase SDK Only")
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        raise
    
    yield
    
    await close_db()
    logger.info("Application shut down")


app = FastAPI(
    title=settings.APP_NAME,
    description="HopeBite Backend API",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url=None, 
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



app.include_router(api_router, prefix="/api/v1")

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """Custom Swagger UI with alternative CDN"""
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css",
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "status": "running"
    }


@app.get("/health")
@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }
