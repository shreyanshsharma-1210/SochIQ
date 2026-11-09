import io
from typing import Optional
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status, Query
from fastapi.responses import Response
from app.core.security import get_auth_context, AuthContext
from app.services.ingestion.parser import load_file_to_dataframe
from app.services.quality.auditor import audit_dataset_quality
from app.services.analytics.calculator import compute_descriptive_analytics
from app.services.insights.rules import generate_rule_based_insights
from app.services.exports.pdf_builder import generate_pdf_report
from app.services.supabase.db import get_dataset_by_id
from app.services.supabase.storage import download_dataset_file

router = APIRouter()


@router.post("/csv")
async def export_cleaned_csv(
    file: Optional[UploadFile] = File(None),
    dataset_id: Optional[str] = Query(None),
    auth: AuthContext = Depends(get_auth_context)
):
    """
    Returns on-demand cleaned CSV export (removes duplicates, trims whitespace).
    Accepts either an uploaded file or an active dataset_id from cloud storage.
    """
    contents: bytes = b""
    filename = "data.csv"

    if file:
        contents = await file.read()
        filename = file.filename or "data.csv"
    elif dataset_id:
        ds = await get_dataset_by_id(auth.user_id, dataset_id)
        if not ds or not ds.get("storage_path"):
            raise HTTPException(status_code=404, detail="Dataset not found or storage path unavailable.")
        raw = download_dataset_file(ds["storage_path"])
        if not raw:
            raise HTTPException(status_code=404, detail="Could not retrieve dataset file from storage.")
        contents = raw
        filename = ds.get("original_filename", "data.csv")
    else:
        raise HTTPException(status_code=400, detail="Either file upload or dataset_id must be provided.")

    df, _ = load_file_to_dataframe(filename, contents)
    clean_df = df.drop_duplicates()

    out_buffer = io.StringIO()
    clean_df.to_csv(out_buffer, index=False)
    out_buffer.seek(0)

    clean_filename = f"cleaned_{filename.rsplit('.', 1)[0]}.csv"
    return Response(
        content=out_buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{clean_filename}"'}
    )


@router.post("/pdf")
async def export_executive_pdf(
    file: Optional[UploadFile] = File(None),
    dataset_id: Optional[str] = Query(None),
    auth: AuthContext = Depends(get_auth_context)
):
    """
    Renders and streams on-demand executive PDF report using ReportLab.
    Accepts either an uploaded file or an active dataset_id from cloud storage.
    """
    contents: bytes = b""
    filename = "data"

    if file:
        contents = await file.read()
        filename = file.filename or "data"
    elif dataset_id:
        ds = await get_dataset_by_id(auth.user_id, dataset_id)
        if not ds or not ds.get("storage_path"):
            raise HTTPException(status_code=404, detail="Dataset not found or storage path unavailable.")
        raw = download_dataset_file(ds["storage_path"])
        if not raw:
            raise HTTPException(status_code=404, detail="Could not retrieve dataset file from storage.")
        contents = raw
        filename = ds.get("original_filename", "data")
    else:
        raise HTTPException(status_code=400, detail="Either file upload or dataset_id must be provided.")

    df, _ = load_file_to_dataframe(filename, contents)
    quality, _ = audit_dataset_quality(df)
    summary = compute_descriptive_analytics(df)
    insights = generate_rule_based_insights(df)

    pdf_bytes = generate_pdf_report(
        filename=filename,
        row_count=len(df),
        column_count=len(df.columns),
        cleanliness_score=quality.cleanliness_score,
        missing_cells=quality.missing_cells,
        duplicate_rows=quality.duplicate_rows,
        columns_info=[col.model_dump() for col in quality.column_audits],
        numeric_summaries={k: v.model_dump() for k, v in summary.numeric_columns.items()},
        insights=[i.model_dump() for i in insights.insights]
    )

    pdf_filename = f"SochIQ_Report_{filename.rsplit('.', 1)[0]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{pdf_filename}"'}
    )


@router.get("/pdf/{dataset_id}")
async def export_pdf_by_id(
    dataset_id: str,
    auth: AuthContext = Depends(get_auth_context)
):
    """Direct GET export of executive PDF for a cloud-persisted dataset."""
    return await export_executive_pdf(file=None, dataset_id=dataset_id, auth=auth)


@router.get("/csv/{dataset_id}")
async def export_csv_by_id(
    dataset_id: str,
    auth: AuthContext = Depends(get_auth_context)
):
    """Direct GET export of cleaned CSV for a cloud-persisted dataset."""
    return await export_cleaned_csv(file=None, dataset_id=dataset_id, auth=auth)
