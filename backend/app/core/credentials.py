import hashlib
import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
import uuid
from app.core.config import settings
from app.services.supabase.db import get_supabase_client, invalidate_owner_cache
from app.services.supabase.storage import delete_session_storage_folder

logger = logging.getLogger(__name__)

# In-memory store for session & key verification (local development & high-performance caching)
_MEMORY_SESSIONS: Dict[str, Dict[str, Any]] = {}
_MEMORY_API_KEYS: Dict[str, Dict[str, Any]] = {}

# Presence tracking stores:
# _ACTIVE_TABS: session_hash -> { tab_id: last_heartbeat_datetime }
_ACTIVE_TABS: Dict[str, Dict[str, datetime]] = {}
# _DISCONNECTED_AT: session_hash -> datetime when all tabs closed / disappeared
_DISCONNECTED_AT: Dict[str, datetime] = {}
# _LAST_DB_HEARTBEAT: session_hash -> last datetime Supabase DB was updated for presence
_LAST_DB_HEARTBEAT: Dict[str, datetime] = {}
# _VALID_OWNER_IDS: in-memory cache of verified Supabase auth.users UUIDs
_VALID_OWNER_IDS: set = set()

TAB_HEARTBEAT_TIMEOUT_SECONDS = 45
GRACE_PERIOD_MINUTES = settings.SESSION_INACTIVITY_MINUTES  # default: 30 minutes
INDEFINITE_ACTIVE_DAYS = 365



def hash_token(raw_token: str) -> str:
    """Computes SHA-256 hash of a session token or API key."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _resolve_session_hash(token_or_hash: str) -> str:
    """Resolves whether input is raw token (dl_sess_...) or already SHA-256 hash."""
    if len(token_or_hash) == 64 and all(c in "0123456789abcdefABCDEF" for c in token_or_hash):
        return token_or_hash.lower()
    return hash_token(token_or_hash)


def _prune_stale_tabs(session_hash: str, now: Optional[datetime] = None) -> int:
    """Removes tabs that have missed heartbeats for over TAB_HEARTBEAT_TIMEOUT_SECONDS."""
    if now is None:
        now = datetime.now(timezone.utc)
    tabs = _ACTIVE_TABS.get(session_hash, {})
    stale_tabs = [
        tid for tid, last_hb in tabs.items()
        if (now - last_hb).total_seconds() > TAB_HEARTBEAT_TIMEOUT_SECONDS
    ]
    for tid in stale_tabs:
        tabs.pop(tid, None)
    return len(tabs)


def record_tab_heartbeat(token_or_hash: str, tab_id: str) -> Dict[str, Any]:
    """
    Registers or extends presence for an active browser tab.
    - Cancels any running grace period.
    - Marks workspace status as active.
    - Sets expires_at to indefinite (1 year) while at least one tab is connected.
    """
    session_hash = _resolve_session_hash(token_or_hash)
    now = datetime.now(timezone.utc)

    # 1. Update active tabs
    tabs = _ACTIVE_TABS.setdefault(session_hash, {})
    tabs[tab_id] = now
    _prune_stale_tabs(session_hash, now)

    # 2. Cancel grace period
    _DISCONNECTED_AT.pop(session_hash, None)

    # 3. Update memory session
    session = _MEMORY_SESSIONS.get(session_hash)
    indefinite_exp = (now + timedelta(days=INDEFINITE_ACTIVE_DAYS)).isoformat()
    if session:
        session["status"] = "active"
        session["last_activity_at"] = now.isoformat()
        session["expires_at"] = indefinite_exp

    # 4. Update Supabase (throttled to at most once per 60 seconds to avoid unnecessary DB load)
    last_db = _LAST_DB_HEARTBEAT.get(session_hash)
    if not last_db or (now - last_db).total_seconds() >= 60:
        _LAST_DB_HEARTBEAT[session_hash] = now
        client = get_supabase_client()
        if client:
            try:
                client.table("browser_sessions").update({
                    "status": "active",
                    "last_activity_at": now.isoformat(),
                    "expires_at": indefinite_exp
                }).eq("session_hash", session_hash).execute()
            except Exception as e:
                logger.warning(f"Error extending session presence in Supabase: {e}")

    return {
        "status": "active",
        "is_active": True,
        "active_tab_count": len(tabs),
        "grace_period_remaining_seconds": None
    }


def record_tab_leave(token_or_hash: str, tab_id: str) -> Dict[str, Any]:
    """
    Notifies that a specific browser tab is closing or navigating away.
    If no other active tabs remain for this workspace, initiates the 30-minute grace period.
    """
    session_hash = _resolve_session_hash(token_or_hash)
    now = datetime.now(timezone.utc)

    tabs = _ACTIVE_TABS.get(session_hash, {})
    tabs.pop(tab_id, None)
    remaining_count = _prune_stale_tabs(session_hash, now)

    if remaining_count == 0:
        # All tabs closed! Start 30-minute grace period
        _DISCONNECTED_AT[session_hash] = now
        deadline = now + timedelta(minutes=GRACE_PERIOD_MINUTES)
        deadline_iso = deadline.isoformat()

        session = _MEMORY_SESSIONS.get(session_hash)
        if session:
            session["expires_at"] = deadline_iso
            session["last_activity_at"] = now.isoformat()

        client = get_supabase_client()
        if client:
            try:
                client.table("browser_sessions").update({
                    "last_activity_at": now.isoformat(),
                    "expires_at": deadline_iso
                }).eq("session_hash", session_hash).execute()
            except Exception as e:
                logger.warning(f"Error setting grace period deadline in Supabase: {e}")

        logger.info(f"Workspace {session_hash[:10]} entered 30m grace period (all tabs closed).")
        return {
            "status": "grace_period",
            "is_active": False,
            "active_tab_count": 0,
            "disconnected_at": now.isoformat(),
            "grace_period_remaining_seconds": GRACE_PERIOD_MINUTES * 60
        }

    return {
        "status": "active",
        "is_active": True,
        "active_tab_count": remaining_count,
        "grace_period_remaining_seconds": None
    }


def get_session_presence_state(token_or_hash: str) -> Dict[str, Any]:
    """Returns real-time presence status: active, or in grace period with remaining seconds."""
    session_hash = _resolve_session_hash(token_or_hash)
    now = datetime.now(timezone.utc)
    active_count = _prune_stale_tabs(session_hash, now)

    if active_count > 0:
        _DISCONNECTED_AT.pop(session_hash, None)
        return {
            "is_active": True,
            "active_tab_count": active_count,
            "disconnected_at": None,
            "grace_period_remaining_seconds": None
        }

    # No tabs currently connected
    if session_hash not in _DISCONNECTED_AT:
        # Detected disconnection via missing heartbeat timeout
        _DISCONNECTED_AT[session_hash] = now
        deadline_iso = (now + timedelta(minutes=GRACE_PERIOD_MINUTES)).isoformat()
        client = get_supabase_client()
        if client:
            try:
                client.table("browser_sessions").update({
                    "expires_at": deadline_iso
                }).eq("session_hash", session_hash).execute()
            except Exception:
                pass

    disc_at = _DISCONNECTED_AT[session_hash]
    elapsed = (now - disc_at).total_seconds()
    remaining = max(0, int(GRACE_PERIOD_MINUTES * 60 - elapsed))

    return {
        "is_active": False,
        "active_tab_count": 0,
        "disconnected_at": disc_at.isoformat(),
        "grace_period_remaining_seconds": remaining
    }


def generate_secure_token(prefix: str = "", length: int = 32) -> str:
    """Generates a cryptographically secure random token string."""
    random_part = secrets.token_urlsafe(length)
    return f"{prefix}{random_part}" if prefix else random_part


def ensure_supabase_owner_id(owner_id: Optional[str]) -> str:
    """
    Ensures owner_id is an authentic Supabase auth.users UUID.
    If owner_id is empty or mock, creates a lightweight anonymous user via Supabase auth admin.
    Cached in memory to eliminate repeated HTTP round-trips.
    """
    if owner_id and owner_id in _VALID_OWNER_IDS:
        return owner_id

    client = get_supabase_client()
    if not client:
        return owner_id or str(uuid.uuid4())

    if owner_id and owner_id != "00000000-0000-0000-0000-000000000000":
        try:
            user = client.auth.admin.get_user_by_id(owner_id)
            if user and user.user:
                _VALID_OWNER_IDS.add(owner_id)
                return owner_id
        except Exception:
            pass

    try:
        anon_user = client.auth.admin.create_user({
            "email": f"anon_{uuid.uuid4().hex[:12]}@sochiq.internal",
            "email_confirm": True,
            "user_metadata": {"is_anonymous": True}
        })
        new_id = anon_user.user.id
        _VALID_OWNER_IDS.add(new_id)
        return new_id
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
    7. Cleans presence stores
    """
    invalidate_owner_cache(owner_id)
    _VALID_OWNER_IDS.discard(owner_id)
    client = get_supabase_client()
    logger.info(f"Purging expired workspace data for owner_id={owner_id}, session_id={session_id}")

    # Remove presence state
    for s_hash, s_data in list(_MEMORY_SESSIONS.items()):
        if s_data.get("owner_id") == owner_id or s_data.get("id") == session_id:
            _MEMORY_SESSIONS.pop(s_hash, None)
            _ACTIVE_TABS.pop(s_hash, None)
            _DISCONNECTED_AT.pop(s_hash, None)

    for k_hash, k_data in list(_MEMORY_API_KEYS.items()):
        if k_data.get("owner_id") == owner_id or k_data.get("browser_session_id") == session_id:
            _MEMORY_API_KEYS.pop(k_hash, None)

    if not client:
        return

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
    Scheduled cleanup routine that purges workspaces whose 30-minute grace period has elapsed.
    Never purges a workspace that still has active browser tabs or was reactivated.
    """
    client = get_supabase_client()
    now = datetime.now(timezone.utc)

    # 1. Check in-memory sessions
    for s_hash, s_data in list(_MEMORY_SESSIONS.items()):
        active_tabs = _prune_stale_tabs(s_hash, now)
        if active_tabs > 0:
            # Active tabs open: never purge!
            _DISCONNECTED_AT.pop(s_hash, None)
            continue

        if s_hash not in _DISCONNECTED_AT:
            # First time noticing disconnection
            _DISCONNECTED_AT[s_hash] = now
            continue

        disc_at = _DISCONNECTED_AT[s_hash]
        if now > (disc_at + timedelta(minutes=GRACE_PERIOD_MINUTES)):
            logger.info(f"Grace period elapsed for workspace {s_data.get('id')}. Executing cleanup.")
            delete_workspace_data(s_data.get("owner_id", ""), s_data.get("id"))

    # 2. Query expired sessions in Supabase
    if client:
        try:
            res = client.table("browser_sessions").select("id, owner_id, session_hash, expires_at").eq("status", "active").lt("expires_at", now.isoformat()).execute()
            if res.data:
                for row in res.data:
                    s_hash = row.get("session_hash")
                    # Double-check: does this session have active tabs right now?
                    if s_hash and _prune_stale_tabs(s_hash, now) > 0:
                        logger.info(f"Skipping cleanup for reactivated workspace {row.get('id')}.")
                        continue
                    delete_workspace_data(row["owner_id"], row["id"])
                logger.info(f"Cleaned up {len(res.data)} expired browser workspaces from Supabase.")
        except Exception as e:
            logger.warning(f"Error in cleanup_expired_workspaces: {e}")


# --- Browser Session Management ---

def create_browser_session(owner_id: Optional[str] = None, tab_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Creates a new browser-scoped session credential.
    Sets expires_at to indefinite (1 year) because workspace lives as long as user keeps browser open.
    """
    real_owner_id = ensure_supabase_owner_id(owner_id)
    raw_token = generate_secure_token(prefix="dl_sess_")
    session_hash = hash_token(raw_token)
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    indefinite_expires = now + timedelta(days=INDEFINITE_ACTIVE_DAYS)

    session_record = {
        "id": session_id,
        "owner_id": real_owner_id,
        "session_hash": session_hash,
        "created_at": now.isoformat(),
        "last_activity_at": now.isoformat(),
        "expires_at": indefinite_expires.isoformat(),
        "revoked_at": None,
        "status": "active"
    }

    _MEMORY_SESSIONS[session_hash] = session_record

    record_tab_heartbeat(session_hash, tab_id or "default")

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
        "expires_at": indefinite_expires
    }


def validate_browser_session(raw_token: str, tab_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Validates a browser session credential:
    - If browser tab is open, session is ALWAYS valid (no auto-expiry).
    - If user reloads or revisits within the 30-minute grace period, restores and reactivates.
    - If 30-minute grace period has passed without user returning, purges data and returns None.
    """
    session_hash = hash_token(raw_token)
    now = datetime.now(timezone.utc)

    # 1. Check memory cache first
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

    # Check presence & grace period
    active_tabs = _prune_stale_tabs(session_hash, now)

    # If tab_id provided, record its presence
    if tab_id:
        record_tab_heartbeat(session_hash, tab_id)
        active_tabs = len(_ACTIVE_TABS.get(session_hash, {}))

    # Check whether the session was in a grace period
    if session_hash in _DISCONNECTED_AT:
        disc_at = _DISCONNECTED_AT[session_hash]
        if now > (disc_at + timedelta(minutes=GRACE_PERIOD_MINUTES)):
            # 30-minute grace period expired! Purge
            session["status"] = "expired"
            _MEMORY_SESSIONS.pop(session_hash, None)
            delete_workspace_data(session.get("owner_id", ""), session.get("id"))
            return None
        else:
            # User returned within 30 minutes! Reactivate workspace
            logger.info(f"User returned to workspace {session.get('id')} within grace period. Reactivating.")
            _DISCONNECTED_AT.pop(session_hash, None)

    # If no active tabs in memory and not in _DISCONNECTED_AT, check DB expires_at
    if active_tabs == 0 and session.get("expires_at"):
        exp_dt = datetime.fromisoformat(session["expires_at"].replace("Z", "+00:00"))
        # If DB expires_at is in the past (and wasn't the 1-year indefinite date)
        if exp_dt < (now + timedelta(days=30)) and now > exp_dt:
            # Expired past grace period
            session["status"] = "expired"
            _MEMORY_SESSIONS.pop(session_hash, None)
            delete_workspace_data(session.get("owner_id", ""), session.get("id"))
            return None

    # Workspace is active! Keep indefinite expiration while open
    indefinite_expires = (now + timedelta(days=INDEFINITE_ACTIVE_DAYS)).isoformat()
    session["status"] = "active"
    session["last_activity_at"] = now.isoformat()
    session["expires_at"] = indefinite_expires

    # Update in Supabase
    client = get_supabase_client()
    if client:
        try:
            client.table("browser_sessions").update({
                "status": "active",
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
    # Developer API keys remain valid as long as parent workspace is active
    expires_at = now + timedelta(days=INDEFINITE_ACTIVE_DAYS)
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

    # Refresh key last_activity_at
    key_data["last_activity_at"] = now.isoformat()

    client = get_supabase_client()
    if client:
        try:
            client.table("developer_api_keys").update({
                "last_activity_at": key_data["last_activity_at"]
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
