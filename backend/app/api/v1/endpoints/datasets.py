import io
import uuid
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status, Response, Request
from fastapi.responses import Response as FastApiResponse
from app.core.config import settings
from app.core.security import get_auth_context, AuthContext, get_cookie_security_params
from app.core.credentials import create_browser_session, validate_browser_session
from app.schemas.dataset import (
    DatasetPreviewResponse,
    QualityMetrics,
    DatasetMetadataResponse,
    DatasetMetadataCreate,
    DatasetUploadResponse,
    AnalyticsSummaryResponse,
    ChartDataResponse,
    RuleInsightsResponse
)
from app.services.ingestion.parser import load_file_to_dataframe
from app.services.quality.auditor import audit_dataset_quality
from app.services.analytics.calculator import compute_descriptive_analytics, generate_chart_payloads
from app.services.insights.rules import generate_rule_based_insights
from app.services.supabase.db import (
    save_dataset_metadata,
    get_saved_datasets_for_user,
    get_dataset_by_id,
    delete_saved_dataset,
    save_analysis_history,
    get_analyses_for_user,
    get_cached_dataset_analysis,
    cache_dataset_analysis
)
from app.services.supabase.storage import (
    upload_dataset_file,
    download_dataset_file,
    delete_dataset_file
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload", response_model=DatasetUploadResponse)
async def upload_and_process_dataset(
    response: Response,
    request: Request,
    file: UploadFile = File(...),
    auth: AuthContext = Depends(get_auth_context)
):
    """
    Temporary Cloud Dataset Ingestion:
    1. Validates active browser workspace & file limits (<= 25 MB).
    2. Uploads raw file to private Supabase Storage ({owner_id}/{session_id}/{dataset_id}/{filename}).
    3. Computes in-memory quality metrics, descriptive analytics, charts, and rule insights.
    4. Persists dataset metadata & initial analysis run in Supabase PostgreSQL.
    5. Returns full analysis payload for instant workspace hydration.
    """
    contents = await file.read()
    file_size = len(contents)

    if file_size > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum upload limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # Ensure browser session credential exists
    session_cookie = request.cookies.get(settings.SESSION_COOKIE_NAME)
    session_data = validate_browser_session(session_cookie) if session_cookie else None

    if not session_data and auth.credential_type in ("local_dev", "anonymous"):
        # Auto-provision anonymous browser session if uploaded before /session/initialize
        created = create_browser_session()
        owner_id = created["owner_id"]
        session_id = created["session_id"]
        cookie_params = get_cookie_security_params(request)
        response.set_cookie(
            key=settings.SESSION_COOKIE_NAME,
            value=created["raw_token"],
            max_age=365 * 24 * 3600,
            httponly=True,
            samesite=cookie_params["samesite"],
            secure=cookie_params["secure"]
        )
    else:
        owner_id = auth.user_id
        session_id = auth.session_id or str(uuid.uuid4())

    filename = file.filename or "uploaded_dataset"
    dataset_id = str(uuid.uuid4())

    # Parse dataframe in RAM
    try:
        df, file_format = load_file_to_dataframe(filename, contents)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not parse dataset: {str(e)}"
        )

    # 1. Upload original file to private Supabase Storage
    storage_path = upload_dataset_file(
        owner_id=owner_id,
        browser_session_id=session_id,
        dataset_id=dataset_id,
        filename=filename,
        file_bytes=contents,
        content_type=file.content_type or "application/octet-stream"
    )

    if not storage_path:
        storage_path = f"{owner_id}/{session_id}/{dataset_id}/{filename}"
        logger.warning(f"Storage upload unconfigured/failed, using virtual path: {storage_path}")

    # 2. Run Analytics Pipeline
    quality_metrics, inferred_types = audit_dataset_quality(df)
    analytics_summary = compute_descriptive_analytics(df)
    charts_data = generate_chart_payloads(df)
    rule_insights = generate_rule_based_insights(df)

    # Convert preview records (capped at settings.PREVIEW_MAX_ROWS)
    preview_df = df.head(settings.PREVIEW_MAX_ROWS).copy()
    preview_records = preview_df.replace({float("nan"): None, float("inf"): None, float("-inf"): None}).to_dict(orient="records")

    preview_resp = DatasetPreviewResponse(
        filename=filename,
        file_format=file_format,
        row_count=len(df),
        column_count=len(df.columns),
        columns=list(df.columns),
        inferred_types=inferred_types,
        preview_rows=preview_records,
        quality=quality_metrics
    )

    # 3 & 4. Persist Dataset Metadata & Analysis History in parallel
    import asyncio
    meta_future = save_dataset_metadata(
        owner_id=owner_id,
        name=filename.rsplit(".", 1)[0],
        original_filename=filename,
        file_format=file_format,
        row_count=len(df),
        column_count=len(df.columns),
        column_summary=[c.model_dump() for c in quality_metrics.column_audits],
        storage_path=storage_path,
        file_size_bytes=file_size,
        browser_session_id=session_id,
        dataset_id=dataset_id,
        status="ready"
    )

    history_future = save_analysis_history(
        owner_id=owner_id,
        dataset_id=dataset_id,
        analysis_type="initial_profile",
        parameters={"filename": filename, "file_format": file_format},
        result_summary={
            "preview": preview_resp.model_dump(),
            "analytics": analytics_summary.model_dump(),
            "charts": charts_data.model_dump(),
            "insights": rule_insights.model_dump()
        },
        browser_session_id=session_id
    )

    try:
        saved_meta, _ = await asyncio.gather(meta_future, history_future)
    except Exception as e:
        logger.error(f"Failed to persist dataset metadata/history: {e}")
        delete_dataset_file(storage_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to persist dataset metadata to database."
        )

    # Fast in-memory cache population for sub-millisecond tab switching
    cache_dataset_analysis(
        dataset_id=dataset_id,
        owner_id=owner_id,
        preview=preview_resp.model_dump(),
        analytics=analytics_summary.model_dump(),
        charts=charts_data.model_dump(),
        insights=rule_insights.model_dump(),
        metadata=saved_meta if isinstance(saved_meta, dict) else None
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    return DatasetUploadResponse(
        dataset_id=dataset_id,
        filename=filename,
        file_format=file_format,
        file_size_bytes=file_size,
        row_count=len(df),
        column_count=len(df.columns),
        storage_path=storage_path,
        preview=preview_resp,
        analytics=analytics_summary,
        charts=charts_data,
        insights=rule_insights,
        created_at=now_iso
    )


@router.get("", response_model=List[DatasetMetadataResponse])
async def list_user_datasets(
    auth: AuthContext = Depends(get_auth_context)
):
    """Lists all datasets belonging to the active browser workspace."""
    records = await get_saved_datasets_for_user(auth.user_id)
    return [
        DatasetMetadataResponse(
            id=str(r.get("id")),
            name=r.get("name", ""),
            original_filename=r.get("original_filename", ""),
            file_format=r.get("file_format", ""),
            row_count=r.get("row_count", 0),
            column_count=r.get("column_count", 0),
            column_summary=r.get("column_summary", []),
            created_at=str(r.get("created_at", "")),
            storage_path=r.get("storage_path"),
            file_size_bytes=r.get("file_size_bytes"),
            status=r.get("status", "ready")
        )
        for r in records
    ]


@router.get("/{dataset_id}")
async def get_dataset_details(
    dataset_id: str,
    auth: AuthContext = Depends(get_auth_context)
):
    """
    Retrieves dataset metadata and its latest analysis run from Supabase or fast memory cache.
    Allows instant workspace restoration without re-uploading the file.
    """
    # 1. Fast in-memory cache check (sub-millisecond reopen)
    cached = get_cached_dataset_analysis(dataset_id, auth.user_id)
    if cached:
        return {
            "dataset": cached.get("metadata") or await get_dataset_by_id(auth.user_id, dataset_id),
            "preview": cached.get("preview"),
            "analytics": cached.get("analytics"),
            "charts": cached.get("charts"),
            "insights": cached.get("insights"),
            "analyses": []
        }

    # 2. Parallel Supabase retrieval
    import asyncio
    ds, analyses = await asyncio.gather(
        get_dataset_by_id(auth.user_id, dataset_id),
        get_analyses_for_user(auth.user_id, dataset_id=dataset_id, include_summary=True)
    )

    if not ds:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found or does not belong to active workspace."
        )

    latest_analysis = analyses[0] if analyses else None

    # If analysis history exists, cache and return it directly
    if latest_analysis and latest_analysis.get("result_summary"):
        res_sum = latest_analysis["result_summary"]
        cache_dataset_analysis(
            dataset_id=dataset_id,
            owner_id=auth.user_id,
            preview=res_sum.get("preview"),
            analytics=res_sum.get("analytics"),
            charts=res_sum.get("charts"),
            insights=res_sum.get("insights"),
            metadata=ds
        )
        return {
            "dataset": ds,
            "preview": res_sum.get("preview"),
            "analytics": res_sum.get("analytics"),
            "charts": res_sum.get("charts"),
            "insights": res_sum.get("insights"),
            "analyses": analyses
        }

    # If no analysis history, re-parse from Supabase Storage file
    storage_path = ds.get("storage_path")
    if storage_path:
        file_bytes = download_dataset_file(storage_path)
        if file_bytes:
            filename = ds.get("original_filename", "data.csv")
            df, file_format = load_file_to_dataframe(filename, file_bytes)
            quality_metrics, inferred_types = audit_dataset_quality(df)
            analytics_summary = compute_descriptive_analytics(df)
            charts_data = generate_chart_payloads(df)
            rule_insights = generate_rule_based_insights(df)

            preview_df = df.head(settings.PREVIEW_MAX_ROWS).copy()
            preview_records = preview_df.replace({float("nan"): None, float("inf"): None, float("-inf"): None}).to_dict(orient="records")

            preview_resp = DatasetPreviewResponse(
                filename=filename,
                file_format=file_format,
                row_count=len(df),
                column_count=len(df.columns),
                columns=list(df.columns),
                inferred_types=inferred_types,
                preview_rows=preview_records,
                quality=quality_metrics
            )

            return {
                "dataset": ds,
                "preview": preview_resp.model_dump(),
                "analytics": analytics_summary.model_dump(),
                "charts": charts_data.model_dump(),
                "insights": rule_insights.model_dump(),
                "analyses": analyses
            }

    return {"dataset": ds, "analyses": analyses}


@router.get("/{dataset_id}/file")
async def download_original_dataset_file(
    dataset_id: str,
    auth: AuthContext = Depends(get_auth_context)
):
    """Streams the original dataset file downloaded securely from Supabase Storage."""
    ds = await get_dataset_by_id(auth.user_id, dataset_id)
    if not ds or not ds.get("storage_path"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset file not found or inaccessible."
        )

    file_bytes = download_dataset_file(ds["storage_path"])
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File could not be retrieved from cloud storage."
        )

    filename = ds.get("original_filename", "dataset")
    media_type = "text/csv" if filename.endswith(".csv") else "application/octet-stream"

    return FastApiResponse(
        content=file_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    auth: AuthContext = Depends(get_auth_context)
):
    """
    Deletes a dataset:
    - Removes original file from private Supabase Storage.
    - Removes dataset_metadata record.
    - Removes all associated analysis_history records.
    """
    success = await delete_saved_dataset(auth.user_id, dataset_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found or unauthorized."
        )
    return {"status": "success", "message": "Dataset and cloud storage object successfully deleted."}


# -------------------------------------------------------------
# Backward-Compatible Route Aliases
# -------------------------------------------------------------

@router.post("/preview", response_model=DatasetPreviewResponse)
async def preview_and_audit_dataset(
    file: UploadFile = File(...),
    auth: AuthContext = Depends(get_auth_context)
):
    """In-memory extraction fallback."""
    contents = await file.read()
    filename = file.filename or "uploaded_file"
    df, file_format = load_file_to_dataframe(filename, contents)
    quality_metrics, inferred_types = audit_dataset_quality(df)

    preview_df = df.head(settings.PREVIEW_MAX_ROWS).copy()
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
    auth: AuthContext = Depends(get_auth_context)
):
    contents = await file.read()
    filename = file.filename or "uploaded_file"
    df, _ = load_file_to_dataframe(filename, contents)
    quality_metrics, _ = audit_dataset_quality(df)
    return quality_metrics


@router.post("/save-metadata", response_model=DatasetMetadataResponse)
async def persist_dataset_metadata(
    payload: DatasetMetadataCreate,
    auth: AuthContext = Depends(get_auth_context)
):
    res = await save_dataset_metadata(
        owner_id=auth.user_id,
        name=payload.name,
        original_filename=payload.original_filename,
        file_format=payload.file_format,
        row_count=payload.row_count,
        column_count=payload.column_count,
        column_summary=payload.column_summary,
        browser_session_id=auth.session_id
    )
    return DatasetMetadataResponse(
        id=str(res.get("id", "")),
        name=res.get("name", payload.name),
        original_filename=res.get("original_filename", payload.original_filename),
        file_format=res.get("file_format", payload.file_format),
        row_count=res.get("row_count", payload.row_count),
        column_count=res.get("column_count", payload.column_count),
        column_summary=res.get("column_summary", payload.column_summary),
        created_at=str(res.get("created_at", "")),
        storage_path=res.get("storage_path"),
        file_size_bytes=res.get("file_size_bytes"),
        status=res.get("status", "ready")
    )


@router.get("/saved", response_model=List[DatasetMetadataResponse])
async def list_saved_datasets_alias(
    auth: AuthContext = Depends(get_auth_context)
):
    return await list_user_datasets(auth=auth)


@router.delete("/saved/{dataset_id}")
async def remove_saved_dataset_alias(
    dataset_id: str,
    auth: AuthContext = Depends(get_auth_context)
):
    return await delete_dataset(dataset_id=dataset_id, auth=auth)
