import hashlib
import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
import uuid
from app.core.config import settings
from app.services.supabase.db import get_supabase_client
from app.services.supabase.storage import delete_session_storage_folder

logger = logging.getLogger(__name__)

# In-memory store for session & key verification (local development & high-performance caching)
_MEMORY_SESSIONS: Dict[str, Dict[str, Any]] = {}
_MEMORY_API_KEYS: Dict[str, Dict[str, Any]] = {}


def hash_token(raw_token: str) -> str:
    """Computes SHA-256 hash of a session token or API key."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def generate_secure_token(prefix: str = "", length: int = 32) -> str:
    """Generates a cryptographically secure random token string."""
    random_part = secrets.token_urlsafe(length)
    return f"{prefix}{random_part}" if prefix else random_part


def ensure_supabase_owner_id(owner_id: Optional[str]) -> str:
    """
    Ensures owner_id is an authentic Supabase auth.users UUID.
    If owner_id is empty or mock, creates a lightweight anonymous user via Supabase auth admin.
    """
    client = get_supabase_client()
    if not client:
        return owner_id or str(uuid.uuid4())

    if owner_id and owner_id != "00000000-0000-0000-0000-000000000000":
        try:
            user = client.auth.admin.get_user_by_id(owner_id)
            if user and user.user:
                return owner_id
        except Exception:
            pass

    try:
        anon_user = client.auth.admin.create_user({
            "email": f"anon_{uuid.uuid4().hex[:12]}@sochiq.internal",
            "email_confirm": True,
            "user_metadata": {"is_anonymous": True}
        })
        return anon_user.user.id
    except Exception as e:
        logger.warning(f"Could not provision Supabase anonymous user: {e}")
        return owner_id or str(uuid.uuid4())


def delete_workspace_data(owner_id: str, session_id: Optional[str] = None):
    """
    Purges all temporary cloud data for an expired workspace:
    1. Removes files from private Supabase Storage
    2. Deletes analysis_history rows
    3. Deletes dataset_metadata rows
    4. Deletes developer_api_keys rows
    5. Deletes browser_sessions row
    6. Removes temporary anonymous user from auth.users
    """
    client = get_supabase_client()
    if not client:
        return

    logger.info(f"Purging expired workspace data for owner_id={owner_id}, session_id={session_id}")
    try:
        if session_id:
            delete_session_storage_folder(owner_id, session_id)

        # Cascading deletes
        client.table("analysis_history").delete().eq("owner_id", owner_id).execute()
        client.table("dataset_metadata").delete().eq("owner_id", owner_id).execute()
        client.table("developer_api_keys").delete().eq("owner_id", owner_id).execute()
        client.table("browser_sessions").delete().eq("owner_id", owner_id).execute()

        # Clean up anonymous auth user
        if owner_id != "00000000-0000-0000-0000-000000000000":
            try:
                client.auth.admin.delete_user(owner_id)
            except Exception:
                pass
    except Exception as e:
        logger.error(f"Error purging workspace data for owner {owner_id}: {e}")


def cleanup_expired_workspaces():
    """
    Scheduled cleanup routine that purges workspaces exceeding 30 minutes of inactivity.
    """
    client = get_supabase_client()
    now = datetime.now(timezone.utc)

    # 1. Purge in-memory expired sessions
    for s_hash, s_data in list(_MEMORY_SESSIONS.items()):
        exp = s_data.get("expires_at")
        if exp:
            exp_dt = datetime.fromisoformat(exp.replace("Z", "+00:00"))
            if now > exp_dt:
                _MEMORY_SESSIONS.pop(s_hash, None)

    # 2. Query expired sessions in Supabase
    if client:
        try:
            res = client.table("browser_sessions").select("id, owner_id, expires_at").lt("expires_at", now.isoformat()).execute()
            if res.data:
                for row in res.data:
                    delete_workspace_data(row["owner_id"], row["id"])
                logger.info(f"Cleaned up {len(res.data)} expired browser workspaces from Supabase.")
        except Exception as e:
            logger.warning(f"Error in cleanup_expired_workspaces: {e}")


# --- Browser Session Management ---

def create_browser_session(owner_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Creates a new browser-scoped session credential.
    Returns: { "raw_token": str, "session_id": str, "owner_id": str, "expires_at": datetime }
    """
    real_owner_id = ensure_supabase_owner_id(owner_id)
    raw_token = generate_secure_token(prefix="dl_sess_")
    session_hash = hash_token(raw_token)
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.SESSION_INACTIVITY_MINUTES)

    session_record = {
        "id": session_id,
        "owner_id": real_owner_id,
        "session_hash": session_hash,
        "created_at": now.isoformat(),
        "last_activity_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "revoked_at": None,
        "status": "active"
    }

    _MEMORY_SESSIONS[session_hash] = session_record

    client = get_supabase_client()
    if client:
        try:
            client.table("browser_sessions").insert(session_record).execute()
        except Exception as e:
            logger.error(f"Error inserting browser_sessions record: {e}")

    return {
        "raw_token": raw_token,
        "session_id": session_id,
        "owner_id": real_owner_id,
        "expires_at": expires_at
    }


def validate_browser_session(raw_token: str) -> Optional[Dict[str, Any]]:
    """
    Validates a browser session credential:
    Checks hash, status, and 30-minute inactivity expiration.
    If expired, permanently purges the temporary workspace from Supabase.
    If valid, extends last_activity_at and expires_at in Supabase.
    """
    session_hash = hash_token(raw_token)
    now = datetime.now(timezone.utc)

    # 1. Check in-memory cache first
    session = _MEMORY_SESSIONS.get(session_hash)

    # 2. If not in memory, query Supabase
    if not session:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("browser_sessions").select("*").eq("session_hash", session_hash).execute()
                if res.data:
                    session = res.data[0]
                    _MEMORY_SESSIONS[session_hash] = session
            except Exception:
                pass

    if not session or session.get("status") != "active":
        return None

    # Check 30-minute expiration
    expires_str = session.get("expires_at")
    if expires_str:
        expires_at = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
        if now > expires_at:
            session["status"] = "expired"
            _MEMORY_SESSIONS.pop(session_hash, None)
            # Permanent cleanup of expired workspace
            delete_workspace_data(session.get("owner_id", ""), session.get("id"))
            return None

    # Refresh last_activity_at & extend 30 min expiration
    new_expires = now + timedelta(minutes=settings.SESSION_INACTIVITY_MINUTES)
    session["last_activity_at"] = now.isoformat()
    session["expires_at"] = new_expires.isoformat()

    # Update in Supabase
    client = get_supabase_client()
    if client:
        try:
            client.table("browser_sessions").update({
                "last_activity_at": session["last_activity_at"],
                "expires_at": session["expires_at"]
            }).eq("session_hash", session_hash).execute()
        except Exception as e:
            logger.warning(f"Error updating session activity in Supabase: {e}")

    return session


def revoke_browser_session(raw_token: str) -> bool:
    """Explicitly revokes and deletes a browser session and its cloud data."""
    session_hash = hash_token(raw_token)
    session = _MEMORY_SESSIONS.pop(session_hash, None)

    if not session:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("browser_sessions").select("*").eq("session_hash", session_hash).execute()
                if res.data:
                    session = res.data[0]
            except Exception:
                pass

    if session:
        delete_workspace_data(session.get("owner_id", ""), session.get("id"))

    return True


# --- Developer API Key Management ---

DEFAULT_SCOPES = [
    "datasets:read",
    "analytics:read",
    "insights:read",
    "exports:create"
]

def create_developer_api_key(owner_id: str, browser_session_id: Optional[str] = None, scopes: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Generates a cryptographically secure temporary Developer API Key.
    Display original key once; only hash is stored.
    Format: dl_live_<32_random_bytes>
    """
    real_owner_id = ensure_supabase_owner_id(owner_id)
    raw_key = generate_secure_token(prefix="dl_live_", length=32)
    key_hash = hash_token(raw_key)
    key_prefix = raw_key[:12] + "..."  # e.g. "dl_live_AbC1..."
    key_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.API_KEY_INACTIVITY_MINUTES)
    active_scopes = scopes or DEFAULT_SCOPES

    key_record = {
        "id": key_id,
        "owner_id": real_owner_id,
        "browser_session_id": browser_session_id,
        "key_hash": key_hash,
        "key_prefix": key_prefix,
        "scopes": active_scopes,
        "created_at": now.isoformat(),
        "last_activity_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "revoked_at": None,
        "status": "active"
    }

    _MEMORY_API_KEYS[key_hash] = key_record

    client = get_supabase_client()
    if client:
        try:
            client.table("developer_api_keys").insert(key_record).execute()
        except Exception as e:
            logger.error(f"Error inserting developer_api_keys record: {e}")

    return {
        "raw_key": raw_key,             # ONLY RETURNED ONCE TO CALLER
        "key_id": key_id,
        "key_prefix": key_prefix,
        "scopes": active_scopes,
        "expires_at": expires_at
    }


def validate_developer_api_key(raw_key: str, required_scope: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Validates a Developer API Key:
    - Checks hash
    - Checks active status & 30-min inactivity timeout
    - Checks required scope
    - Extends 30-min timeout upon successful activity
    - Validates that parent browser workspace has not expired
    """
    if not raw_key.startswith("dl_live_"):
        return None

    key_hash = hash_token(raw_key)
    now = datetime.now(timezone.utc)

    key_data = _MEMORY_API_KEYS.get(key_hash)
    if not key_data:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("developer_api_keys").select("*").eq("key_hash", key_hash).execute()
                if res.data:
                    key_data = res.data[0]
                    _MEMORY_API_KEYS[key_hash] = key_data
            except Exception:
                pass

    if not key_data or key_data.get("status") != "active":
        return None

    # Check key expiration
    expires_str = key_data.get("expires_at")
    if expires_str:
        expires_at = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
        if now > expires_at:
            key_data["status"] = "expired"
            _MEMORY_API_KEYS.pop(key_hash, None)
            return None

    # Verify parent browser session is still active
    parent_sess_id = key_data.get("browser_session_id")
    if parent_sess_id:
        client = get_supabase_client()
        if client:
            try:
                p_res = client.table("browser_sessions").select("status, expires_at").eq("id", parent_sess_id).execute()
                if not p_res.data or p_res.data[0].get("status") != "active":
                    key_data["status"] = "revoked"
                    return None
                p_exp = datetime.fromisoformat(p_res.data[0]["expires_at"].replace("Z", "+00:00"))
                if now > p_exp:
                    key_data["status"] = "expired"
                    return None
            except Exception:
                pass

    # Scope check
    if required_scope:
        permitted_scopes = key_data.get("scopes", [])
        if required_scope not in permitted_scopes:
            return None

    # Refresh key last_activity_at & extend 30 min expiration
    new_expires = now + timedelta(minutes=settings.API_KEY_INACTIVITY_MINUTES)
    key_data["last_activity_at"] = now.isoformat()
    key_data["expires_at"] = new_expires.isoformat()

    client = get_supabase_client()
    if client:
        try:
            client.table("developer_api_keys").update({
                "last_activity_at": key_data["last_activity_at"],
                "expires_at": key_data["expires_at"]
            }).eq("key_hash", key_hash).execute()
        except Exception:
            pass

    return key_data


def revoke_developer_api_key(key_id: str, owner_id: str) -> bool:
    """Revokes a specific API key belonging to the owner."""
    now = datetime.now(timezone.utc).isoformat()
    for k_hash, k_data in list(_MEMORY_API_KEYS.items()):
        if k_data.get("id") == key_id and k_data.get("owner_id") == owner_id:
            k_data["status"] = "revoked"
            k_data["revoked_at"] = now

    client = get_supabase_client()
    if client:
        try:
            client.table("developer_api_keys").update({
                "status": "revoked",
                "revoked_at": now
            }).eq("id", key_id).eq("owner_id", owner_id).execute()
            return True
        except Exception:
            pass

    return True


def list_user_api_keys(owner_id: str) -> List[Dict[str, Any]]:
    """Returns metadata (prefix, status, expires_at) for user's keys. Never plaintext."""
    client = get_supabase_client()
    if client:
        try:
            res = client.table("developer_api_keys").select("*").eq("owner_id", owner_id).eq("status", "active").execute()
            if res.data:
                return [
                    {
                        "id": k["id"],
                        "key_prefix": k.get("key_prefix", "dl_live_..."),
                        "scopes": k.get("scopes", []),
                        "status": k.get("status", "active"),
                        "created_at": k.get("created_at"),
                        "expires_at": k.get("expires_at")
                    }
                    for k in res.data
                ]
        except Exception:
            pass

    return [
        {
            "id": k["id"],
            "key_prefix": k["key_prefix"],
            "scopes": k["scopes"],
            "status": k["status"],
            "created_at": k["created_at"],
            "expires_at": k["expires_at"]
        }
        for k in _MEMORY_API_KEYS.values()
        if k.get("owner_id") == owner_id and k.get("status") == "active"
    ]
