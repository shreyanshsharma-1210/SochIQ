import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
import uuid
from app.core.config import settings
from app.services.supabase.db import get_supabase_client

# In-memory store for session & key verification (local development & high-performance caching)
# Structure: { session_hash: { id, owner_id, last_activity_at, expires_at, status, ... } }
_MEMORY_SESSIONS: Dict[str, Dict[str, Any]] = {}
_MEMORY_API_KEYS: Dict[str, Dict[str, Any]] = {}


def hash_token(raw_token: str) -> str:
    """Computes SHA-256 hash of a session token or API key."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def generate_secure_token(prefix: str = "", length: int = 32) -> str:
    """Generates a cryptographically secure random token string."""
    random_part = secrets.token_urlsafe(length)
    return f"{prefix}{random_part}" if prefix else random_part


# --- Browser Session Management ---

def create_browser_session(owner_id: str) -> Dict[str, Any]:
    """
    Creates a new browser-scoped session credential.
    Returns: { "raw_token": str, "session_id": str, "expires_at": datetime }
    """
    raw_token = generate_secure_token(prefix="dl_sess_")
    session_hash = hash_token(raw_token)
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.SESSION_INACTIVITY_MINUTES)

    session_record = {
        "id": session_id,
        "owner_id": owner_id,
        "session_hash": session_hash,
        "created_at": now.isoformat(),
        "last_activity_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "revoked_at": None,
        "status": "active"
    }

    # Store in memory cache
    _MEMORY_SESSIONS[session_hash] = session_record

    # Persist to Supabase if configured
    client = get_supabase_client()
    if client:
        try:
            client.table("browser_sessions").insert(session_record).execute()
        except Exception as e:
            pass

    return {
        "raw_token": raw_token,
        "session_id": session_id,
        "expires_at": expires_at
    }


def validate_browser_session(raw_token: str) -> Optional[Dict[str, Any]]:
    """
    Validates a browser session credential:
    Checks hash, status, and 30-minute inactivity expiration.
    Refreshes last_activity_at on authorized requests.
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

    # Check expiration
    expires_str = session.get("expires_at")
    if expires_str:
        expires_at = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
        if now > expires_at:
            session["status"] = "expired"
            return None

    # Refresh last_activity_at & extend 30 min expiration
    session["last_activity_at"] = now.isoformat()
    new_expires = now + timedelta(minutes=settings.SESSION_INACTIVITY_MINUTES)
    session["expires_at"] = new_expires.isoformat()

    return session


def revoke_browser_session(raw_token: str) -> bool:
    """Explicitly revokes a browser session and its child API keys."""
    session_hash = hash_token(raw_token)
    session = _MEMORY_SESSIONS.get(session_hash)
    now = datetime.now(timezone.utc).isoformat()

    if session:
        session["status"] = "revoked"
        session["revoked_at"] = now
        session_id = session.get("id")

        # Cascade revoke any API keys linked to this browser session
        for k_hash, k_data in list(_MEMORY_API_KEYS.items()):
            if k_data.get("browser_session_id") == session_id:
                k_data["status"] = "revoked"
                k_data["revoked_at"] = now

    client = get_supabase_client()
    if client:
        try:
            client.table("browser_sessions").update({
                "status": "revoked",
                "revoked_at": now
            }).eq("session_hash", session_hash).execute()
        except Exception:
            pass

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
    raw_key = generate_secure_token(prefix="dl_live_", length=32)
    key_hash = hash_token(raw_key)
    key_prefix = raw_key[:12] + "..."  # e.g. "dl_live_AbC1..."
    key_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.API_KEY_INACTIVITY_MINUTES)
    active_scopes = scopes or DEFAULT_SCOPES

    key_record = {
        "id": key_id,
        "owner_id": owner_id,
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
        except Exception:
            pass

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

    # Check expiration
    expires_str = key_data.get("expires_at")
    if expires_str:
        expires_at = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
        if now > expires_at:
            key_data["status"] = "expired"
            return None

    # Scope check
    if required_scope:
        permitted_scopes = key_data.get("scopes", [])
        if required_scope not in permitted_scopes:
            return None

    # Refresh last_activity_at & extend 30 min expiration
    key_data["last_activity_at"] = now.isoformat()
    new_expires = now + timedelta(minutes=settings.API_KEY_INACTIVITY_MINUTES)
    key_data["expires_at"] = new_expires.isoformat()

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
    keys = [
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
    return keys
