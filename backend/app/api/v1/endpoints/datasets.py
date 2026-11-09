import json
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, status
from app.core.config import settings
from app.core.security import get_current_user, AnonymousUser
from app.schemas.dataset import (
    DatasetPreviewResponse,
    QualityMetrics,
    DatasetMetadataResponse,
    DatasetMetadataCreate
)
from app.services.ingestion.parser import load_file_to_dataframe
from app.services.quality.auditor import audit_dataset_quality
from app.services.supabase.db import (
    save_dataset_metadata,
    get_saved_datasets_for_user,
    delete_saved_dataset
)

router = APIRouter()


@router.post("/preview", response_model=DatasetPreviewResponse)
async def preview_and_audit_dataset(
    file: UploadFile = File(...),
    current_user: AnonymousUser = Depends(get_current_user)
):
    """
    In-memory upload and extraction.
    Parses CSV/XLSX/JSON, audits data quality, and returns bounded preview records.
    Zero raw dataset persistence.
    """
    contents = await file.read()
    filename = file.filename or "uploaded_file"

    df, file_format = load_file_to_dataframe(filename, contents)
    quality_metrics, inferred_types = audit_dataset_quality(df)

    # Convert preview records (capped at settings.PREVIEW_MAX_ROWS)
    preview_df = df.head(settings.PREVIEW_MAX_ROWS).copy()
    # Replace NaN/inf with None for clean JSON serialization
    preview_records = preview_df.replace({float("nan"): None, float("inf"): None, float("-inf"): None}).to_dict(orient="records")

    return DatasetPreviewResponse(
        filename=filename,
        file_format=file_format,
        row_count=len(df),
        column_count=len(df.columns),
        columns=list(df.columns),
        inferred_types=inferred_types,
        preview_rows=preview_records,
        quality=quality_metrics
    )


@router.post("/profile", response_model=QualityMetrics)
async def profile_dataset(
    file: UploadFile = File(...),
    current_user: AnonymousUser = Depends(get_current_user)
):
    """Generates detailed data quality profile in-memory."""
    contents = await file.read()
    filename = file.filename or "uploaded_file"
    df, _ = load_file_to_dataframe(filename, contents)
    quality_metrics, _ = audit_dataset_quality(df)
    return quality_metrics


@router.post("/save-metadata", response_model=DatasetMetadataResponse)
async def persist_dataset_metadata(
    payload: DatasetMetadataCreate,
    current_user: AnonymousUser = Depends(get_current_user)
):
    """
    Persists ONLY dataset schema summary to Supabase PostgreSQL under user's UUID.
    """
    res = await save_dataset_metadata(
        owner_id=current_user.user_id,
        name=payload.name,
        original_filename=payload.original_filename,
        file_format=payload.file_format,
        row_count=payload.row_count,
        column_count=payload.column_count,
        column_summary=payload.column_summary
    )
    return DatasetMetadataResponse(
        id=str(res.get("id", "")),
        name=res.get("name", payload.name),
        original_filename=res.get("original_filename", payload.original_filename),
        file_format=res.get("file_format", payload.file_format),
        row_count=res.get("row_count", payload.row_count),
        column_count=res.get("column_count", payload.column_count),
        column_summary=res.get("column_summary", payload.column_summary),
        created_at=str(res.get("created_at", ""))
    )


@router.get("/saved", response_model=List[DatasetMetadataResponse])
async def list_saved_datasets(
    current_user: AnonymousUser = Depends(get_current_user)
):
    """Lists saved dataset metadata belonging to the anonymous user."""
    records = await get_saved_datasets_for_user(current_user.user_id)
    return [
        DatasetMetadataResponse(
            id=str(r.get("id")),
            name=r.get("name", ""),
            original_filename=r.get("original_filename", ""),
            file_format=r.get("file_format", ""),
            row_count=r.get("row_count", 0),
            column_count=r.get("column_count", 0),
            column_summary=r.get("column_summary", []),
            created_at=str(r.get("created_at", ""))
        )
        for r in records
    ]


@router.delete("/saved/{dataset_id}")
async def remove_saved_dataset(
    dataset_id: str,
    current_user: AnonymousUser = Depends(get_current_user)
):
    """Deletes a saved metadata entry from Supabase PostgreSQL."""
    success = await delete_saved_dataset(current_user.user_id, dataset_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found or unauthorized.")
    return {"status": "success", "message": "Dataset metadata deleted successfully."}

