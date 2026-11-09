import io
from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import Response, StreamingResponse
from app.core.security import get_current_user, AnonymousUser
from app.services.ingestion.parser import load_file_to_dataframe
from app.services.quality.auditor import audit_dataset_quality
from app.services.analytics.calculator import compute_descriptive_analytics
from app.services.insights.rules import generate_rule_based_insights
from app.services.exports.pdf_builder import generate_pdf_report

router = APIRouter()


@router.post("/csv")
async def export_cleaned_csv(
    file: UploadFile = File(...),
    current_user: AnonymousUser = Depends(get_current_user)
):
    """
    Returns on-demand cleaned CSV export (removes exact duplicates, trims whitespace).
    Generated in-memory and streamed to client.
    """
    contents = await file.read()
    filename = file.filename or "data.csv"
    df, _ = load_file_to_dataframe(filename, contents)

    # Clean duplicates
    clean_df = df.drop_duplicates()

    out_buffer = io.StringIO()
    clean_df.to_csv(out_buffer, index=False)
    out_buffer.seek(0)

    clean_filename = f"cleaned_{filename.rsplit('.', 1)[0]}.csv"
    return Response(
        content=out_buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={clean_filename}"}
    )


@router.post("/pdf")
async def export_executive_pdf(
    file: UploadFile = File(...),
    current_user: AnonymousUser = Depends(get_current_user)
):
    """
    Renders and streams on-demand executive PDF report using ReportLab.
    """
    contents = await file.read()
    filename = file.filename or "data"
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
        headers={"Content-Disposition": f"attachment; filename={pdf_filename}"}
    )

