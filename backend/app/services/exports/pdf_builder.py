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
    Applies the DataLens warm Diwali-inspired palette (Ivory, Bronze, Gold).
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom Palette
    c_primary = colors.HexColor("#9B681E")  # Bronze
    c_gold = colors.HexColor("#C99A3A")     # Gold
    c_dark = colors.HexColor("#28251F")     # Text
    c_border = colors.HexColor("#EEE7D9")   # Border
    c_bg = colors.HexColor("#FFFDF8")       # Ivory

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=24,
        textColor=c_primary,
        spaceAfter=6
    )

    h2_style = ParagraphStyle(
        "Heading2Custom",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        "BodyCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=c_dark,
        spaceAfter=4
    )

    elements = []

    # Title & Metadata Header
    elements.append(Paragraph("DataLens — Executive Data Insight Report", title_style))
    elements.append(Paragraph(f"<b>Dataset:</b> {filename} | <b>Total Records:</b> {row_count:,} | <b>Columns:</b> {column_count}", body_style))
    elements.append(Spacer(1, 12))

    # KPI Summary Table
    kpi_data = [
        ["Quality Score", "Total Rows", "Total Columns", "Missing Cells", "Duplicate Rows"],
        [f"{cleanliness_score}%", f"{row_count:,}", str(column_count), f"{missing_cells:,}", f"{duplicate_rows:,}"]
    ]
    kpi_table = Table(kpi_data, colWidths=[105, 105, 105, 105, 105])
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), c_primary),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 1), (-1, 1), c_bg),
        ("GRID", (0, 0), (-1, -1), 1, c_border),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 16))

    # Section 1: Column Schema & Data Quality
    elements.append(Paragraph("1. Column Schema & Data Quality Audit", h2_style))
    col_rows = [["Column Name", "Inferred Type", "Missing Count", "Missing %", "Unique Count"]]
    for col in columns_info[:15]:  # Display top 15 columns
        col_rows.append([
            str(col.get("name", ""))[:20],
            str(col.get("inferred_type", "")),
            f"{col.get('missing_count', 0):,}",
            f"{col.get('missing_percentage', 0)}%",
            f"{col.get('unique_count', 0):,}"
        ])

    col_table = Table(col_rows, colWidths=[140, 95, 95, 95, 95])
    col_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), c_gold),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("GRID", (0, 0), (-1, -1), 0.5, c_border),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, c_bg]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(col_table)
    elements.append(Spacer(1, 16))

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
        num_table = Table(num_rows, colWidths=[140, 75, 75, 75, 75, 80])
        num_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), c_primary),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, c_border),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, c_bg]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(num_table)
        elements.append(Spacer(1, 16))

    # Section 3: Automated Insights
    if insights:
        elements.append(Paragraph("3. Automated Rule-Based Insights", h2_style))
        for item in insights[:5]:
            title = f"• <b>{item.get('title', '')}</b>"
            desc = item.get("description", "")
            elements.append(Paragraph(f"{title}: {desc}", body_style))
            elements.append(Spacer(1, 3))

    # Build Document
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

