import logging
import uuid
import datetime
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
    column_summary: Any,
    storage_path: Optional[str] = None,
    file_size_bytes: Optional[int] = None,
    browser_session_id: Optional[str] = None,
    dataset_id: Optional[str] = None,
    status: str = "ready"
) -> Dict[str, Any]:
    """
    Persists dataset metadata to Supabase PostgreSQL.
    Enforces owner_id = verified anonymous user UUID in auth.users.
    Supports extra temporary cloud storage metadata inside column_summary JSONB for schema flexibility.
    """
    client = get_supabase_client()
    ds_id = dataset_id or str(uuid.uuid4())

    # Package column_summary with storage metadata for robust JSONB storage
    if isinstance(column_summary, list):
        summary_payload = {
            "columns": column_summary,
            "storage_path": storage_path,
            "file_size_bytes": file_size_bytes,
            "browser_session_id": browser_session_id,
            "status": status
        }
    elif isinstance(column_summary, dict):
        summary_payload = column_summary
        if storage_path:
            summary_payload["storage_path"] = storage_path
        if file_size_bytes:
            summary_payload["file_size_bytes"] = file_size_bytes
        if browser_session_id:
            summary_payload["browser_session_id"] = browser_session_id
        if status:
            summary_payload["status"] = status
    else:
        summary_payload = {"columns": [], "storage_path": storage_path}

    record = {
        "id": ds_id,
        "owner_id": owner_id,
        "name": name,
        "original_filename": original_filename,
        "file_format": file_format,
        "row_count": row_count,
        "column_count": column_count,
        "column_summary": summary_payload
    }

    if client:
        try:
            res = client.table("dataset_metadata").insert(record).execute()
            if res.data:
                ret = res.data[0]
                # Attach flattened helpers
                ret["storage_path"] = storage_path
                ret["file_size_bytes"] = file_size_bytes
                ret["browser_session_id"] = browser_session_id
                ret["status"] = status
                return ret
        except Exception as e:
            logger.error(f"Error saving dataset_metadata to Supabase: {e}")

    # Fallback response
    record["created_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    record["storage_path"] = storage_path
    record["file_size_bytes"] = file_size_bytes
    record["browser_session_id"] = browser_session_id
    record["status"] = status
    return record


async def get_saved_datasets_for_user(owner_id: str) -> List[Dict[str, Any]]:
    """Retrieves saved metadata records belonging to the current user."""
    client = get_supabase_client()
    if client:
        try:
            res = client.table("dataset_metadata").select("*").eq("owner_id", owner_id).order("created_at", desc=True).execute()
            rows = res.data or []
            for r in rows:
                cs = r.get("column_summary")
                if isinstance(cs, dict):
                    r["storage_path"] = cs.get("storage_path")
                    r["file_size_bytes"] = cs.get("file_size_bytes")
                    r["browser_session_id"] = cs.get("browser_session_id")
                    r["status"] = cs.get("status", "ready")
            return rows
        except Exception as e:
            logger.error(f"Error reading from Supabase: {e}")
            return []
    return []


async def get_dataset_by_id(owner_id: str, dataset_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single dataset metadata record by id."""
    client = get_supabase_client()
    if client:
        try:
            res = client.table("dataset_metadata").select("*").eq("id", dataset_id).eq("owner_id", owner_id).execute()
            if res.data:
                r = res.data[0]
                cs = r.get("column_summary")
                if isinstance(cs, dict):
                    r["storage_path"] = cs.get("storage_path")
                    r["file_size_bytes"] = cs.get("file_size_bytes")
                    r["browser_session_id"] = cs.get("browser_session_id")
                    r["status"] = cs.get("status", "ready")
                return r
        except Exception as e:
            logger.error(f"Error retrieving dataset {dataset_id}: {e}")
    return None


async def delete_saved_dataset(owner_id: str, dataset_id: str) -> bool:
    """Deletes a metadata record, its storage file, and analysis history."""
    client = get_supabase_client()
    if client:
        try:
            # 1. Check storage path
            ds = await get_dataset_by_id(owner_id, dataset_id)
            if ds and ds.get("storage_path"):
                from app.services.supabase.storage import delete_dataset_file
                delete_dataset_file(ds["storage_path"])

            # 2. Delete analysis history
            client.table("analysis_history").delete().eq("dataset_id", dataset_id).eq("owner_id", owner_id).execute()

            # 3. Delete metadata
            client.table("dataset_metadata").delete().eq("id", dataset_id).eq("owner_id", owner_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting dataset {dataset_id} from Supabase: {e}")
            return False
    return True


async def save_analysis_history(
    owner_id: str,
    dataset_id: str,
    analysis_type: str,
    parameters: Dict[str, Any],
    result_summary: Dict[str, Any],
    browser_session_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Saves an analytical execution run into analysis_history.
    Includes parameters, quality audit, charts, and insights in result_summary JSONB.
    """
    client = get_supabase_client()
    analysis_id = str(uuid.uuid4())
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    record = {
        "id": analysis_id,
        "owner_id": owner_id,
        "dataset_id": dataset_id,
        "analysis_type": analysis_type,
        "parameters": parameters or {},
        "result_summary": result_summary or {},
        "created_at": now
    }

    if client:
        try:
            res = client.table("analysis_history").insert(record).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            logger.error(f"Error saving analysis_history: {e}")

    return record


async def get_analyses_for_user(owner_id: str, dataset_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves all analysis history runs for a user, optionally filtered by dataset."""
    client = get_supabase_client()
    if client:
        try:
            query = client.table("analysis_history").select("*").eq("owner_id", owner_id)
            if dataset_id:
                query = query.eq("dataset_id", dataset_id)
            res = query.order("created_at", desc=True).execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Error retrieving analysis_history: {e}")
            return []
    return []


async def get_analysis_by_id(owner_id: str, analysis_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a specific analysis history run."""
    client = get_supabase_client()
    if client:
        try:
            res = client.table("analysis_history").select("*").eq("id", analysis_id).eq("owner_id", owner_id).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            logger.error(f"Error retrieving analysis {analysis_id}: {e}")
    return None
