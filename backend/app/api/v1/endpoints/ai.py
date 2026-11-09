from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user, AnonymousUser
from app.schemas.dataset import AIQueryRequest, AIQueryResponse
from app.services.ai.groq_client import query_groq_summary
from app.core.config import settings

router = APIRouter()


@router.post("/query", response_model=AIQueryResponse)
async def ask_dataset_question(
    payload: AIQueryRequest,
    current_user: AnonymousUser = Depends(get_current_user)
):
    """
    Answers natural language inquiries about the dataset via Groq Cloud API.
    Sends ONLY aggregate summary metrics. Never raw data.
    """
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Assistant is not configured on this server. Core analytics remain 100% operational."
        )

    answer, structured = await query_groq_summary(
        question=payload.question,
        summary_context=payload.summary_context,
        quality_context=payload.quality_context
    )

    if not answer and not structured:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to receive response from Groq AI service. Please verify your query or try again later."
        )

    return AIQueryResponse(
        answer=answer or (structured.message if structured else "No response generated."),
        structured=structured,
        model=settings.GROQ_MODEL,
        source="groq",
        disclaimer="Grounded strictly on computed summary statistics. No raw data was transmitted to external servers."
    )

