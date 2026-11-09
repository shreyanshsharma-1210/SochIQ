import io
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def generate_pdf_report(
    filename: str,
    row_count: int,
    column_count: int,
    cleanliness_score: float,
    missing_cells: int,
    duplicate_rows: int,
    columns_info: List[Dict[str, Any]],
    numeric_summaries: Dict[str, Any],
    insights: List[Dict[str, Any]]
) -> bytes:
    """
    Renders an executive analytical report directly in-memory using ReportLab.
    Applies the SochIQ modern design palette (Charcoal, Pure White, Bright Yellow, Light Grey).
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # SochIQ Brand Palette
    c_charcoal = colors.HexColor("#111111")
    c_yellow = colors.HexColor("#FFDF00")
    c_text_dark = colors.HexColor("#222222")
    c_text_muted = colors.HexColor("#666666")
    c_border = colors.HexColor("#EAEAEA")
    c_bg_subtle = colors.HexColor("#FAFAF8")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=22,
        textColor=c_charcoal,
        spaceAfter=4
    )

    tagline_style = ParagraphStyle(
        "DocTagline",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=10,
        textColor=c_text_muted,
        spaceAfter=8
    )

    h2_style = ParagraphStyle(
        "Heading2Custom",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        textColor=c_charcoal,
        spaceBefore=14,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        "BodyCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=c_text_dark,
        spaceAfter=3
    )

    elements = []

    # Title & Metadata Header
    elements.append(Paragraph("SochIQ — Executive Data Insight Report", title_style))
    elements.append(Paragraph("Think smarter. See deeper. | In-Memory Dataset Evaluation", tagline_style))
    elements.append(Paragraph(
        f"<b>Dataset:</b> {filename} &nbsp;&nbsp;|&nbsp;&nbsp; "
        f"<b>Total Records:</b> {row_count:,} &nbsp;&nbsp;|&nbsp;&nbsp; "
        f"<b>Columns:</b> {column_count} &nbsp;&nbsp;|&nbsp;&nbsp; "
        f"<b>Quality Score:</b> {cleanliness_score}%",
        body_style
    ))
    elements.append(Spacer(1, 10))

    # KPI Summary Table (Charcoal headers with Yellow accents)
    kpi_data = [
        ["Quality Score", "Total Rows", "Total Columns", "Missing Cells", "Duplicate Rows"],
        [f"{cleanliness_score}%", f"{row_count:,}", str(column_count), f"{missing_cells:,}", f"{duplicate_rows:,}"]
    ]
    kpi_table = Table(kpi_data, colWidths=[108, 108, 108, 108, 108])
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), c_charcoal),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BACKGROUND", (0, 1), (-1, 1), c_bg_subtle),
        ("TEXTCOLOR", (0, 1), (-1, 1), c_charcoal),
        ("GRID", (0, 0), (-1, -1), 1, c_border),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 14))

    # Section 1: Column Schema & Data Quality
    elements.append(Paragraph("1. Column Schema & Data Quality Audit", h2_style))
    col_rows = [["Column Name", "Inferred Type", "Missing Count", "Missing %", "Unique Count"]]
    for col in columns_info[:15]:
        col_rows.append([
            str(col.get("name", ""))[:22],
            str(col.get("inferred_type", "")),
            f"{col.get('missing_count', 0):,}",
            f"{col.get('missing_percentage', 0)}%",
            f"{col.get('unique_count', 0):,}"
        ])

    col_table = Table(col_rows, colWidths=[140, 100, 100, 100, 100])
    col_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), c_charcoal),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("GRID", (0, 0), (-1, -1), 0.5, c_border),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, c_bg_subtle]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(col_table)
    elements.append(Spacer(1, 14))

    # Section 2: Numeric Metrics
    if numeric_summaries:
        elements.append(Paragraph("2. Descriptive Statistics (Numeric Fields)", h2_style))
        num_rows = [["Field", "Mean", "Median", "Std Dev", "Min", "Max"]]
        for col_name, stats in list(numeric_summaries.items())[:10]:
            num_rows.append([
                col_name[:18],
                str(stats.get("mean", "-")),
                str(stats.get("median", "-")),
                str(stats.get("std", "-")),
                str(stats.get("min", "-")),
                str(stats.get("max", "-"))
            ])
        num_table = Table(num_rows, colWidths=[140, 80, 80, 80, 80, 80])
        num_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), c_charcoal),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("GRID", (0, 0), (-1, -1), 0.5, c_border),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, c_bg_subtle]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(num_table)
        elements.append(Spacer(1, 14))

    # Section 3: Automated Insights
    if insights:
        elements.append(Paragraph("3. Automated Rule-Based Insights", h2_style))
        for item in insights[:5]:
            title = f"• <b>{item.get('title', '')}</b>"
            desc = item.get("description", "")
            elements.append(Paragraph(f"{title}: {desc}", body_style))
            elements.append(Spacer(1, 2))

    # Footer note
    elements.append(Spacer(1, 12))
    footer_style = ParagraphStyle(
        "DocFooter",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        textColor=c_text_muted,
        alignment=1  # Center
    )
    elements.append(Paragraph("Generated by SochIQ — Privacy-First In-Memory Analytics. Zero Raw Data Retention.", footer_style))

    # Build Document
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
