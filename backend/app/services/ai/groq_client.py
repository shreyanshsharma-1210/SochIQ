import json
import logging
import re
from typing import Dict, Any, Optional, Tuple
import httpx
from app.core.config import settings
from app.schemas.dataset import StructuredAIResponse, AIMetric, AISection, AITable, AIChart

logger = logging.getLogger(__name__)


def _extract_json(text: str) -> Optional[Dict[str, Any]]:
    """Attempts to parse JSON from raw text, stripping markdown code fences if present."""
    text = text.strip()
    if text.startswith("```"):
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            text = match.group(1).strip()
    try:
        return json.loads(text)
    except Exception:
        # Try finding outer braces
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except Exception:
                pass
    return None


def _format_markdown_from_structured(structured: StructuredAIResponse) -> str:
    """Builds a polished markdown representation from a structured response."""
    parts = []
    if structured.message:
        parts.append(structured.message)

    if structured.metrics:
        metric_lines = []
        for m in structured.metrics:
            unit_str = f" {m.unit}" if m.unit else ""
            desc = f" ({m.description})" if m.description else ""
            metric_lines.append(f"- **{m.label}**: `{m.value}{unit_str}`{desc}")
        if metric_lines:
            parts.append("### Key Metrics\n" + "\n".join(metric_lines))

    if structured.sections:
        for s in structured.sections:
            parts.append(f"### {s.title}\n{s.content}")

    if structured.tables:
        for t in structured.tables:
            header = "| " + " | ".join(t.headers) + " |"
            sep = "| " + " | ".join(["---"] * len(t.headers)) + " |"
            rows = ["| " + " | ".join(str(cell) for cell in r) + " |" for r in t.rows]
            title_str = f"**{t.title}**\n" if t.title else ""
            parts.append(title_str + "\n".join([header, sep] + rows))

    if structured.suggestions:
        sug_lines = [f"- _{s}_" for s in structured.suggestions]
        parts.append("### Suggested Next Inquiries\n" + "\n".join(sug_lines))

    return "\n\n".join(parts)


async def query_groq_summary(
    question: str,
    summary_context: Dict[str, Any],
    quality_context: Optional[Dict[str, Any]] = None
) -> Tuple[Optional[str], Optional[StructuredAIResponse]]:
    """
    Calls Groq Cloud API using aggregate summary context only.
    ZERO raw dataset records are transmitted.
    Returns (formatted_markdown_answer, structured_response_object).
    """
    if not settings.GROQ_API_KEY:
        return None, None

    system_prompt = (
        "You are an expert Data Analyst assistant for DataLens.\n"
        "You answer questions about datasets based ONLY on the provided summary metrics, "
        "column schema, and data quality information. "
        "Do NOT invent numbers. If a metric is not present, explain what additional data would be needed.\n\n"
        "You MUST respond strictly with a valid JSON object matching this schema:\n"
        "{\n"
        '  "response_type": "greeting | overview | analysis | comparison | data_quality | trend | explanation | error",\n'
        '  "message": "Clear natural language interpretation in markdown. Keep it concise, insightful, and professional.",\n'
        '  "sections": [\n'
        '    {"title": "Section Title", "content": "Markdown text with bullet points or findings", "type": "text | list | callout"}\n'
        "  ],\n"
        '  "metrics": [\n'
        '    {"label": "Metric Name", "value": "Metric Value", "unit": "optional unit or % or null", "description": "Brief context"}\n'
        "  ],\n"
        '  "tables": [\n'
        '    {"title": "Optional Table Title", "headers": ["Col 1", "Col 2"], "rows": [["val1", "val2"]]}\n'
        "  ],\n"
        '  "charts": [\n'
        '    {"chart_type": "bar | line | pie", "title": "Chart Title", "data": [{"name": "A", "value": 10}], "x_key": "name", "y_key": "value"}\n'
        "  ],\n"
        '  "suggestions": ["Follow-up question 1", "Follow-up question 2"]\n'
        "}\n\n"
        "Guidelines:\n"
        "- Response types:\n"
        "  - 'greeting': User greets or introduces themselves.\n"
        "  - 'overview': High-level summary of dataset shape, dimensions, key columns.\n"
        "  - 'analysis': Specific questions analyzing values, distributions, or calculations.\n"
        "  - 'comparison': Contrasting 2 or more variables or categories.\n"
        "  - 'data_quality': Questions regarding missing values, cleanliness score, skewness.\n"
        "  - 'trend': Patterns, distributions, or correlations over numeric/date metrics.\n"
        "  - 'explanation': Explaining specific statistics, columns, or terminology.\n"
        "  - 'error': If question cannot be answered from the provided summary data.\n"
        "- Provide 2 to 3 concise, highly relevant analytical suggestions in 'suggestions'.\n"
        "- Respond with valid raw JSON only."
    )

    context_str = f"Summary Metrics:\n{json.dumps(summary_context, indent=2)}\n"
    if quality_context:
        context_str += f"\nData Quality Profile:\n{json.dumps(quality_context, indent=2)}\n"

    user_message = f"{context_str}\n\nUser Question: {question}"

    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.2,
        "max_tokens": 1200,
        "response_format": {"type": "json_object"}
    }

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json=payload,
                headers=headers
            )
            if response.status_code == 200:
                result = response.json()
                raw_content = result["choices"][0]["message"]["content"]
                
                parsed_json = _extract_json(raw_content)
                if parsed_json and isinstance(parsed_json, dict):
                    try:
                        structured = StructuredAIResponse(**parsed_json)
                        formatted_markdown = _format_markdown_from_structured(structured)
                        return formatted_markdown, structured
                    except Exception as val_err:
                        logger.warning(f"Validation error on Groq structured response: {val_err}")
                        # Fallback with raw content
                        structured = StructuredAIResponse(
                            response_type="explanation",
                            message=parsed_json.get("message", raw_content),
                            raw_markdown=raw_content,
                            suggestions=parsed_json.get("suggestions", [
                                "What are the most notable patterns in this dataset?",
                                "Show data quality issues"
                            ])
                        )
                        return raw_content, structured

                # Fallback if non-JSON
                structured = StructuredAIResponse(
                    response_type="explanation",
                    message=raw_content,
                    raw_markdown=raw_content,
                    suggestions=[
                        "What is the overall shape and completeness of the data?",
                        "Which variables show the highest variance?"
                    ]
                )
                return raw_content, structured
            else:
                logger.warning(f"Groq API returned error status {response.status_code}: {response.text}")
                return None, None
    except Exception as e:
        logger.error(f"Groq API call exception: {e}")
        return None, None

