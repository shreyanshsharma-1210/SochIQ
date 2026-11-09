from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.security import get_auth_context, AuthContext
from app.schemas.dataset import AnalysisRunResponse
from app.services.supabase.db import (
    get_analyses_for_user,
    get_analysis_by_id,
    save_analysis_history,
    get_dataset_by_id
)

router = APIRouter()


class CreateAnalysisRunRequest(BaseModel):
    analysis_type: str = "custom_run"
    parameters: Dict[str, Any] = {}
    result_summary: Dict[str, Any] = {}


@router.get("", response_model=List[AnalysisRunResponse])
async def list_all_analyses(
    dataset_id: Optional[str] = None,
    auth: AuthContext = Depends(get_auth_context)
):
    """Lists all saved analysis runs for the active browser workspace."""
    runs = await get_analyses_for_user(auth.user_id, dataset_id=dataset_id, include_summary=False)
    return [
        AnalysisRunResponse(
            id=str(r.get("id")),
            dataset_id=str(r.get("dataset_id")),
            analysis_type=r.get("analysis_type", "analysis"),
            parameters=r.get("parameters", {}),
            result_summary=r.get("result_summary", {}),
            created_at=str(r.get("created_at", ""))
        )
        for r in runs
    ]


@router.get("/{analysis_id}", response_model=AnalysisRunResponse)
async def get_analysis_details(
    analysis_id: str,
    auth: AuthContext = Depends(get_auth_context)
):
    """Retrieves a specific analysis run."""
    run = await get_analysis_by_id(auth.user_id, analysis_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis run not found or does not belong to active workspace."
        )
    return AnalysisRunResponse(
        id=str(run.get("id")),
        dataset_id=str(run.get("dataset_id")),
        analysis_type=run.get("analysis_type", "analysis"),
        parameters=run.get("parameters", {}),
        result_summary=run.get("result_summary", {}),
        created_at=str(run.get("created_at", ""))
    )


@router.post("/dataset/{dataset_id}", response_model=AnalysisRunResponse)
async def create_analysis_run(
    dataset_id: str,
    payload: CreateAnalysisRunRequest,
    auth: AuthContext = Depends(get_auth_context)
):
    """Records a new analysis run for a dataset."""
    ds = await get_dataset_by_id(auth.user_id, dataset_id)
    if not ds:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found or does not belong to active workspace."
        )

    res = await save_analysis_history(
        owner_id=auth.user_id,
        dataset_id=dataset_id,
        analysis_type=payload.analysis_type,
        parameters=payload.parameters,
        result_summary=payload.result_summary,
        browser_session_id=auth.session_id
    )
    return AnalysisRunResponse(
        id=str(res.get("id")),
        dataset_id=str(res.get("dataset_id")),
        analysis_type=res.get("analysis_type", payload.analysis_type),
        parameters=res.get("parameters", payload.parameters),
        result_summary=res.get("result_summary", payload.result_summary),
        created_at=str(res.get("created_at", ""))
    )

