from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    session,
    datasets,
    analyses,
    analytics,
    insights,
    ai,
    exports
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(session.router, prefix="/session", tags=["Workspace Session"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Keys"])
api_router.include_router(datasets.router, prefix="/datasets", tags=["Datasets"])
api_router.include_router(analyses.router, prefix="/analyses", tags=["Analysis History"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(insights.router, prefix="/insights", tags=["Insights"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI"])
api_router.include_router(exports.router, prefix="/exports", tags=["Exports"])
