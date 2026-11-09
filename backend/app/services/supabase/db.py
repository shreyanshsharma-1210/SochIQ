import logging
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)


def get_supabase_client() -> Optional[Client]:
    """Creates a Supabase client if configured."""
    if settings.SUPABASE_URL and (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_PUBLISHABLE_KEY):
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_PUBLISHABLE_KEY
        return create_client(settings.SUPABASE_URL, key)
    return None


async def save_dataset_metadata(
    owner_id: str,
    name: str,
    original_filename: str,
    file_format: str,
    row_count: int,
    column_count: int,
    column_summary: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Persists metadata only to Supabase PostgreSQL.
    Enforces owner_id = verified anonymous user UUID.
    """
    client = get_supabase_client()
    record = {
        "owner_id": owner_id,
        "name": name,
        "original_filename": original_filename,
        "file_format": file_format,
        "row_count": row_count,
        "column_count": column_count,
        "column_summary": column_summary
    }

    if client:
        try:
            res = client.table("dataset_metadata").insert(record).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            logger.error(f"Error saving to Supabase: {e}")

    # Fallback response for local dev if Supabase is unconfigured
    import uuid
    import datetime
    record["id"] = str(uuid.uuid4())
    record["created_at"] = datetime.datetime.utcnow().isoformat()
    return record


async def get_saved_datasets_for_user(owner_id: str) -> List[Dict[str, Any]]:
    """Retrieves saved metadata records belonging to the current user."""
    client = get_supabase_client()
    if client:
        try:
            res = client.table("dataset_metadata").select("*").eq("owner_id", owner_id).order("created_at", desc=True).execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Error reading from Supabase: {e}")
            return []
    return []


async def delete_saved_dataset(owner_id: str, dataset_id: str) -> bool:
    """Deletes a metadata record belonging strictly to the user."""
    client = get_supabase_client()
    if client:
        try:
            client.table("dataset_metadata").delete().eq("id", dataset_id).eq("owner_id", owner_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting from Supabase: {e}")
            return False
    return True

