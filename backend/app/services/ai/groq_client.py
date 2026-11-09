import logging
from typing import Dict, Any, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


async def query_groq_summary(
    question: str,
    summary_context: Dict[str, Any],
    quality_context: Optional[Dict[str, Any]] = None
) -> Optional[str]:
    """
    Calls Groq Cloud API using aggregate summary context only.
    ZERO raw dataset records are transmitted.
    """
    if not settings.GROQ_API_KEY:
        return None

    system_prompt = (
        "You are an expert Data Analyst assistant for DataLens. "
        "You answer questions about datasets based ONLY on the provided summary metrics, "
        "column schema, and data quality information. "
        "Do NOT invent numbers. If a metric is not present, explain what additional data would be needed. "
        "Keep responses clear, professional, concise, and structured with Markdown bullet points."
    )

    context_str = f"Summary Metrics:\n{summary_context}\n"
    if quality_context:
        context_str += f"\nData Quality Profile:\n{quality_context}\n"

    user_message = f"{context_str}\n\nUser Question: {question}"

    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.2,
        "max_tokens": 800
    }

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json=payload,
                headers=headers
            )
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            else:
                logger.warning(f"Groq API returned error status {response.status_code}: {response.text}")
                return None
    except Exception as e:
        logger.error(f"Groq API call exception: {e}")
        return None

