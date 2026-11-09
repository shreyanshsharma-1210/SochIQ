from fastapi import APIRouter, Depends, File, UploadFile
from app.core.security import get_current_user, AnonymousUser
from app.schemas.dataset import AnalyticsSummaryResponse, ChartDataResponse
from app.services.ingestion.parser import load_file_to_dataframe
from app.services.analytics.calculator import compute_descriptive_analytics, generate_chart_payloads

router = APIRouter()


@router.post("/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    file: UploadFile = File(...),
    current_user: AnonymousUser = Depends(get_current_user)
):
    """Computes descriptive statistical metrics in-memory."""
    contents = await file.read()
    filename = file.filename or "uploaded_file"
    df, _ = load_file_to_dataframe(filename, contents)
    summary = compute_descriptive_analytics(df)
    return summary


@router.post("/chart-data", response_model=ChartDataResponse)
async def get_chart_data(
    file: UploadFile = File(...),
    current_user: AnonymousUser = Depends(get_current_user)
):
    """Generates structured chart payloads ready for Recharts."""
    contents = await file.read()
    filename = file.filename or "uploaded_file"
    df, _ = load_file_to_dataframe(filename, contents)
    charts = generate_chart_payloads(df)
    return charts

