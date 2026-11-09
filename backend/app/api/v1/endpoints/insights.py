from fastapi import APIRouter, Depends, File, UploadFile
from app.core.security import get_current_user, AnonymousUser
from app.schemas.dataset import RuleInsightsResponse
from app.services.ingestion.parser import load_file_to_dataframe
from app.services.insights.rules import generate_rule_based_insights

router = APIRouter()


@router.post("/rules", response_model=RuleInsightsResponse)
async def get_rule_insights(
    file: UploadFile = File(...),
    current_user: AnonymousUser = Depends(get_current_user)
):
    """Generates non-AI deterministic statistical observations."""
    contents = await file.read()
    filename = file.filename or "uploaded_file"
    df, _ = load_file_to_dataframe(filename, contents)
    insights = generate_rule_based_insights(df)
    return insights

