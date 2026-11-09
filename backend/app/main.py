import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.v1.router import api_router
from app.core.credentials import cleanup_expired_workspaces

logger = logging.getLogger(__name__)


async def periodic_cleanup_worker():
    """Background worker running every 60s to purge expired temporary workspaces from Supabase."""
    while True:
        try:
            await asyncio.sleep(60)
            cleanup_expired_workspaces()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.warning(f"Error in background cleanup worker: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run initial cleanup on startup
    try:
        cleanup_expired_workspaces()
    except Exception as e:
        logger.warning(f"Initial cleanup error: {e}")

    task = asyncio.create_task(periodic_cleanup_worker())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SochIQ: Intelligent workspace with temporary cloud persistence and automatic 30-minute inactivity cleanup.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration for Vercel and Local Development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Master API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred during data processing."}
    )

