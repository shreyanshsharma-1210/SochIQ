import logging
from typing import Optional, List
from app.services.supabase.db import get_supabase_client

logger = logging.getLogger(__name__)

BUCKET_NAME = "sochiq-temporary-datasets"


_BUCKET_VERIFIED: bool = False


def ensure_storage_bucket() -> bool:
    """Ensures the private storage bucket exists in Supabase (cached after first verification)."""
    global _BUCKET_VERIFIED
    if _BUCKET_VERIFIED:
        return True

    client = get_supabase_client()
    if not client:
        return False
    try:
        buckets = client.storage.list_buckets()
        existing = [b.name for b in buckets]
        if BUCKET_NAME not in existing:
            client.storage.create_bucket(BUCKET_NAME, options={"public": False})
            logger.info(f"Created private storage bucket: {BUCKET_NAME}")
        _BUCKET_VERIFIED = True
        return True
    except Exception as e:
        logger.warning(f"Could not verify/create storage bucket {BUCKET_NAME}: {e}")
        return False


def upload_dataset_file(
    owner_id: str,
    browser_session_id: str,
    dataset_id: str,
    filename: str,
    file_bytes: bytes,
    content_type: str = "application/octet-stream"
) -> Optional[str]:
    """
    Uploads a dataset file to private Supabase Storage at:
    {owner_id}/{browser_session_id}/{dataset_id}/{filename}
    Returns the storage object path.
    """
    client = get_supabase_client()
    if not client:
        return None

    # Sanitize filename
    safe_filename = filename.replace("/", "_").replace("\\", "_")
    storage_path = f"{owner_id}/{browser_session_id}/{dataset_id}/{safe_filename}"

    try:
        ensure_storage_bucket()
        client.storage.from_(BUCKET_NAME).upload(
            storage_path,
            file_bytes,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        logger.info(f"Uploaded dataset to storage: {storage_path}")
        return storage_path
    except Exception as e:
        logger.error(f"Failed to upload dataset to storage: {e}")
        return None


def download_dataset_file(storage_path: str) -> Optional[bytes]:
    """Downloads dataset file bytes from private Supabase Storage."""
    client = get_supabase_client()
    if not client:
        return None

    try:
        return client.storage.from_(BUCKET_NAME).download(storage_path)
    except Exception as e:
        logger.error(f"Failed to download dataset from storage path {storage_path}: {e}")
        return None


def delete_dataset_file(storage_path: str) -> bool:
    """Deletes an individual dataset file from private Supabase Storage."""
    client = get_supabase_client()
    if not client:
        return False

    try:
        client.storage.from_(BUCKET_NAME).remove([storage_path])
        logger.info(f"Deleted dataset file from storage: {storage_path}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete storage path {storage_path}: {e}")
        return False


def delete_session_storage_folder(owner_id: str, browser_session_id: str) -> bool:
    """
    Deletes all storage files under {owner_id}/{browser_session_id}/
    Used for 30-minute inactivity session purge.
    """
    client = get_supabase_client()
    if not client:
        return False

    prefix = f"{owner_id}/{browser_session_id}"
    try:
        # List files in session folder
        files = client.storage.from_(BUCKET_NAME).list(prefix)
        paths_to_remove = []
        if files:
            for item in files:
                item_name = item.get("name")
                if item_name:
                    # Supabase list might return subfolders or files
                    paths_to_remove.append(f"{prefix}/{item_name}")
                    # Also check deeper nested dataset folders
                    subfiles = client.storage.from_(BUCKET_NAME).list(f"{prefix}/{item_name}")
                    if subfiles:
                        for sf in subfiles:
                            sf_name = sf.get("name")
                            if sf_name:
                                paths_to_remove.append(f"{prefix}/{item_name}/{sf_name}")

        if paths_to_remove:
            client.storage.from_(BUCKET_NAME).remove(paths_to_remove)
            logger.info(f"Purged {len(paths_to_remove)} files from storage for session {browser_session_id}")
        return True
    except Exception as e:
        logger.warning(f"Error purging storage folder for session {browser_session_id}: {e}")
        return False

