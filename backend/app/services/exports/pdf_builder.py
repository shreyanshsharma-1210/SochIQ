import io
import os
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image as RLImage,
    KeepTogether,
    HRFlowable
)
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
    Applies the SochIQ modern design palette (Charcoal #111111, Pure White, Bright Yellow #FFDF00, Light Grey #EAEAEA).
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=32,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # SochIQ Brand Palette
    c_charcoal = colors.HexColor("#111111")
    c_yellow = colors.HexColor("#FFDF00")
    c_dark_grey = colors.HexColor("#333333")
    c_muted_grey = colors.HexColor("#666666")
    c_light_grey = colors.HexColor("#EAEAEA")
    c_card_bg = colors.HexColor("#FAFAF8")
    c_green = colors.HexColor("#10B981")
    c_amber = colors.HexColor("#F59E0B")

    score_color = c_green if cleanliness_score >= 80 else (c_amber if cleanliness_score >= 50 else colors.HexColor("#EF4444"))

    # Typography Styles
    title_brand_style = ParagraphStyle(
        "BrandTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=c_charcoal,
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=c_dark_grey,
        spaceAfter=2
    )

    meta_style = ParagraphStyle(
        "DocMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=c_muted_grey,
    )

    meta_right_style = ParagraphStyle(
        "DocMetaRight",
        parent=meta_style,
        alignment=2  # Right aligned
    )

    h2_style = ParagraphStyle(
        "Heading2Custom",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=c_charcoal,
        spaceBefore=14,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        "BodyCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=c_dark_grey,
    )

    insight_title_style = ParagraphStyle(
        "InsightTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        textColor=c_charcoal,
    )

    insight_desc_style = ParagraphStyle(
        "InsightDesc",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=c_muted_grey,
    )

    elements = []

    # ---------------------------------------------------------
    # Header Banner: Logo + Brand + Executive Title + Timestamp
    # ---------------------------------------------------------
    logo_path = os.path.join(os.path.dirname(__file__), "..", "..", "static", "sochiq_logo.png")
    
    brand_col = []
    brand_col.append(Paragraph(
        '<font color="#111111"><b>Soch</b></font><font color="#E5C700"><b>IQ</b></font> '
        '<font size="10" color="#666666">| Executive Data Insight Report</font>',
        title_brand_style
    ))
    brand_col.append(Paragraph("Think smarter. See deeper.", subtitle_style))
    brand_col.append(Paragraph(
        f"<b>Dataset:</b> {filename} &nbsp;•&nbsp; <b>Format:</b> {filename.rsplit('.', 1)[-1].upper()} &nbsp;•&nbsp; <b>Evaluated:</b> {datetime.utcnow().strftime('%b %d, %Y %H:%M UTC')}",
        meta_style
    ))

    badge_col = [
        Paragraph('<b>PRIVACY CERTIFIED</b>', ParagraphStyle('BadgeH', parent=meta_right_style, fontSize=7.5, textColor=c_muted_grey)),
        Paragraph('<font color="#10B981">●</font> <b>In-Memory Session</b>', ParagraphStyle('BadgeP', parent=meta_right_style, fontSize=8.5, textColor=c_charcoal)),
        Paragraph('Zero Raw Data Retained', ParagraphStyle('BadgeSub', parent=meta_right_style, fontSize=7.5, textColor=c_muted_grey))
    ]

    header_cells = []
    if os.path.exists(logo_path):
        logo_img = RLImage(logo_path, width=38, height=38)
        header_cells = [[logo_img, brand_col, badge_col]]
        header_table = Table(header_cells, colWidths=[46, 360, 134])
    else:
        header_cells = [[brand_col, badge_col]]
        header_table = Table(header_cells, colWidths=[406, 134])

    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(header_table)

    # Accent Divider Bar (Charcoal with Yellow segment)
    elements.append(Spacer(1, 6))
    divider_table = Table([["", ""]], colWidths=[120, 420], rowHeights=[2.5])
    divider_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), c_yellow),
        ("BACKGROUND", (1, 0), (1, 0), c_charcoal),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    elements.append(divider_table)
    elements.append(Spacer(1, 12))

    # ---------------------------------------------------------
    # KPI Scorecard Strip (5 Modern Metric Cards)
    # ---------------------------------------------------------
    kpi_card_style_num = ParagraphStyle('KpiNum', fontName="Helvetica-Bold", fontSize=15, leading=18, alignment=1, textColor=c_charcoal)
    kpi_card_style_score = ParagraphStyle('KpiScore', fontName="Helvetica-Bold", fontSize=15, leading=18, alignment=1, textColor=score_color)
    kpi_card_style_lbl = ParagraphStyle('KpiLbl', fontName="Helvetica", fontSize=7.5, leading=9, alignment=1, textColor=c_muted_grey)

    kpi_cards = [
        [
            Paragraph(f"{cleanliness_score:.1f}%", kpi_card_style_score),
            Paragraph(f"{row_count:,}", kpi_card_style_num),
            Paragraph(str(column_count), kpi_card_style_num),
            Paragraph(f"{missing_cells:,}", kpi_card_style_num),
            Paragraph(f"{duplicate_rows:,}", kpi_card_style_num)
        ],
        [
            Paragraph("QUALITY SCORE", kpi_card_style_lbl),
            Paragraph("TOTAL RECORDS", kpi_card_style_lbl),
            Paragraph("COLUMNS", kpi_card_style_lbl),
            Paragraph("MISSING CELLS", kpi_card_style_lbl),
            Paragraph("DUPLICATE ROWS", kpi_card_style_lbl)
        ]
    ]
    kpi_table = Table(kpi_cards, colWidths=[108, 108, 108, 108, 108], rowHeights=[24, 14])
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), c_card_bg),
        ("BOX", (0, 0), (-1, -1), 1, c_light_grey),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, c_light_grey),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 6),
        ("LINEBELOW", (0, 0), (0, -1), 2.5, score_color),  # Accent underline on quality score
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # Section 1: Column Schema & Data Quality Audit
    # ---------------------------------------------------------
    elements.append(Paragraph("1. Column Schema & Data Quality Audit", h2_style))
    col_rows = [[
        Paragraph("<b>Column Name</b>", ParagraphStyle('Th1', fontName="Helvetica-Bold", fontSize=8, textColor=colors.white)),
        Paragraph("<b>Type</b>", ParagraphStyle('Th2', fontName="Helvetica-Bold", fontSize=8, textColor=colors.white)),
        Paragraph("<b>Missing</b>", ParagraphStyle('Th3', fontName="Helvetica-Bold", fontSize=8, textColor=colors.white, alignment=2)),
        Paragraph("<b>Missing %</b>", ParagraphStyle('Th4', fontName="Helvetica-Bold", fontSize=8, textColor=colors.white, alignment=2)),
        Paragraph("<b>Unique Values</b>", ParagraphStyle('Th5', fontName="Helvetica-Bold", fontSize=8, textColor=colors.white, alignment=2)),
        Paragraph("<b>Status</b>", ParagraphStyle('Th6', fontName="Helvetica-Bold", fontSize=8, textColor=colors.white, alignment=1)),
    ]]

    for col in columns_info[:16]:
        missing_cnt = col.get('missing_count', 0)
        missing_pct = col.get('missing_percentage', 0.0)
        status_text = '<font color="#10B981"><b>Clean</b></font>' if missing_cnt == 0 else f'<font color="#F59E0B"><b>{missing_pct}% gap</b></font>'
        
        col_rows.append([
            Paragraph(f"<b>{str(col.get('name', ''))[:22]}</b>", body_style),
            Paragraph(str(col.get('inferred_type', '')), body_style),
            Paragraph(f"{missing_cnt:,}", ParagraphStyle('Td3', parent=body_style, alignment=2)),
            Paragraph(f"{missing_pct:.1f}%", ParagraphStyle('Td4', parent=body_style, alignment=2)),
            Paragraph(f"{col.get('unique_count', 0):,}", ParagraphStyle('Td5', parent=body_style, alignment=2)),
            Paragraph(status_text, ParagraphStyle('Td6', parent=body_style, alignment=1))
        ])

    col_table = Table(col_rows, colWidths=[140, 75, 75, 75, 95, 80])
    col_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), c_charcoal),
        ("ALIGN", (0, 0), (-1, 0), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, c_light_grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, c_card_bg]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(col_table)
    elements.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # Section 2: Numeric Summaries (Descriptive Statistics)
    # ---------------------------------------------------------
    if numeric_summaries:
        elements.append(Paragraph("2. Descriptive Statistics (Numeric Fields)", h2_style))
        num_rows = [[
            Paragraph("<b>Field</b>", ParagraphStyle('NTh1', fontName="Helvetica-Bold", fontSize=8, textColor=colors.white)),
            Paragraph("<b>Mean</b>", ParagraphStyle('NTh2', fontName="Helvetica-Bold", fontSize=8, textColor=colors.white, alignment=2)),
            Paragraph("<b>Median</b>", ParagraphStyle('NTh3', fontName="Helvetica-Bold", fontSize=8, textColor=colors.white, alignment=2)),
            Paragraph("<b>Std Dev</b>", ParagraphStyle('NTh4', fontName="Helvetica-Bold", fontSize=8, textColor=colors.white, alignment=2)),
            Paragraph("<b>Min</b>", ParagraphStyle('NTh5', fontName="Helvetica-Bold", fontSize=8, textColor=colors.white, alignment=2)),
            Paragraph("<b>Max</b>", ParagraphStyle('NTh6', fontName="Helvetica-Bold", fontSize=8, textColor=colors.white, alignment=2)),
        ]]
        
        for col_name, stats in list(numeric_summaries.items())[:10]:
            mean_v = f"{stats.get('mean', 0):,.2f}" if isinstance(stats.get('mean'), (int, float)) else str(stats.get('mean', '-'))
            median_v = f"{stats.get('median', 0):,.2f}" if isinstance(stats.get('median'), (int, float)) else str(stats.get('median', '-'))
            std_v = f"{stats.get('std', 0):,.2f}" if isinstance(stats.get('std'), (int, float)) else str(stats.get('std', '-'))
            min_v = f"{stats.get('min', 0):,.2f}" if isinstance(stats.get('min'), (int, float)) else str(stats.get('min', '-'))
            max_v = f"{stats.get('max', 0):,.2f}" if isinstance(stats.get('max'), (int, float)) else str(stats.get('max', '-'))

            num_rows.append([
                Paragraph(f"<b>{col_name[:18]}</b>", body_style),
                Paragraph(mean_v, ParagraphStyle('NTd2', parent=body_style, alignment=2)),
                Paragraph(median_v, ParagraphStyle('NTd3', parent=body_style, alignment=2)),
                Paragraph(std_v, ParagraphStyle('NTd4', parent=body_style, alignment=2)),
                Paragraph(min_v, ParagraphStyle('NTd5', parent=body_style, alignment=2)),
                Paragraph(max_v, ParagraphStyle('NTd6', parent=body_style, alignment=2)),
            ])
            
        num_table = Table(num_rows, colWidths=[140, 80, 80, 80, 80, 80])
        num_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), c_charcoal),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.5, c_light_grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, c_card_bg]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(num_table)
        elements.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # Section 3: Automated Rule-Based Insights
    # ---------------------------------------------------------
    if insights:
        elements.append(Paragraph("3. Automated Rule-Based Insights", h2_style))
        insight_elements = []
        for item in insights[:4]:
            title = item.get("title", "Observation")
            desc = item.get("description", "")
            
            card_content = [
                Paragraph(f"• <b>{title}</b>", insight_title_style),
                Paragraph(desc, insight_desc_style)
            ]
            card_table = Table([[card_content]], colWidths=[540])
            card_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), c_card_bg),
                ("BOX", (0, 0), (-1, -1), 0.5, c_light_grey),
                ("LINELEFT", (0, 0), (0, -1), 3, c_yellow),  # Yellow brand accent strip
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]))
            insight_elements.append(card_table)
            insight_elements.append(Spacer(1, 6))

        elements.append(KeepTogether(insight_elements))

    # ---------------------------------------------------------
    # Footer Note & Privacy Guarantee
    # ---------------------------------------------------------
    elements.append(Spacer(1, 14))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=c_light_grey, spaceBefore=4, spaceAfter=8))
    
    footer_table = Table([
        [
            Paragraph("<b>SochIQ In-Memory Analytics</b> &nbsp;|&nbsp; Think smarter. See deeper.", ParagraphStyle('FLeft', parent=meta_style, fontSize=7.5)),
            Paragraph("Zero Raw Data Retention &nbsp;•&nbsp; Confidential Executive Report", ParagraphStyle('FRight', parent=meta_right_style, fontSize=7.5))
        ]
    ], colWidths=[270, 270])
    footer_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    elements.append(footer_table)

    # Build Document
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
