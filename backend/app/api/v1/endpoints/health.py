from fastapi import APIRouter
from app.core.config import settings
from app.schemas.dataset import HealthResponse
from app.services.supabase.db import get_supabase_client

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for Render monitoring and uptime checks."""
    supabase_active = get_supabase_client() is not None
    groq_active = bool(settings.GROQ_API_KEY)

    return HealthResponse(
        status="ok",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        mode="cloud-persisted" if supabase_active else "memory-only",
        groq_available=groq_active,
        supabase_connected=supabase_active
    )

