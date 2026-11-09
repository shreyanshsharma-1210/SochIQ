import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Response, Request, HTTPException, status
from app.core.config import settings
from app.core.security import get_auth_context, AuthContext
from app.core.credentials import (
    create_browser_session,
    validate_browser_session,
    revoke_browser_session,
    record_tab_heartbeat,
    record_tab_leave,
    get_session_presence_state
)
from app.schemas.dataset import SessionStatusResponse, TabPresenceRequest
from app.services.supabase.db import get_saved_datasets_for_user, get_analyses_for_user

router = APIRouter()


@router.post("/initialize", response_model=SessionStatusResponse)
async def initialize_workspace_session(
    response: Response,
    request: Request,
    tab_id: Optional[str] = None,
    auth: AuthContext = Depends(get_auth_context)
):
    """
    Establishes or restores a browser-scoped anonymous workspace.
    - If user reloads or returns within 30 minutes, restores workspace seamlessly.
    - Workspace lives indefinitely while browser tabs remain open.
    - Sets secure HttpOnly cookie.
    """
    session_cookie = request.cookies.get(settings.SESSION_COOKIE_NAME)
    session_data = None
    raw_token = session_cookie

    if session_cookie:
        session_data = validate_browser_session(session_cookie, tab_id=tab_id)

    if not session_data:
        # Create fresh anonymous browser session
        created = create_browser_session(owner_id=auth.user_id, tab_id=tab_id)
        raw_token = created["raw_token"]
        session_data = {
            "id": created["session_id"],
            "owner_id": created["owner_id"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_activity_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": created["expires_at"].isoformat(),
            "status": "active"
        }
        # Set long-lived Secure HttpOnly SameSite cookie so session isn't killed while tab is open
        response.set_cookie(
            key=settings.SESSION_COOKIE_NAME,
            value=raw_token,
            max_age=365 * 24 * 3600,
            httponly=True,
            samesite="lax",
            secure=False
        )
    elif tab_id:
        record_tab_heartbeat(session_cookie, tab_id)

    presence = get_session_presence_state(raw_token) if raw_token else {"is_active": True, "active_tab_count": 1}
    datasets = await get_saved_datasets_for_user(session_data["owner_id"])
    analyses = await get_analyses_for_user(session_data["owner_id"])

    return SessionStatusResponse(
        status="active",
        session_id=session_data["id"],
        owner_id=session_data["owner_id"],
        created_at=session_data.get("created_at", datetime.now(timezone.utc).isoformat()),
        last_activity_at=session_data.get("last_activity_at", datetime.now(timezone.utc).isoformat()),
        expires_at=session_data.get("expires_at", ""),
        is_active=presence.get("is_active", True),
        active_tab_count=presence.get("active_tab_count", 1),
        disconnected_at=presence.get("disconnected_at"),
        grace_period_remaining_seconds=presence.get("grace_period_remaining_seconds"),
        remaining_seconds=None,
        dataset_count=len(datasets),
        analysis_count=len(analyses)
    )


@router.post("/heartbeat")
async def receive_tab_heartbeat(
    request: Request,
    payload: TabPresenceRequest
):
    """Periodic client heartbeat confirming that a specific tab is actively open."""
    session_cookie = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not session_cookie:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No active workspace session found for heartbeat."
        )

    res = record_tab_heartbeat(session_cookie, payload.tab_id)
    return res


@router.post("/leave")
async def receive_tab_leave(
    request: Request
):
    """
    Notifies server of tab closure or unload. Supports JSON body or raw Beacon payload.
    Starts 30-minute grace period if this was the last active browser tab.
    """
    session_cookie = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not session_cookie:
        return {"status": "ok"}

    tab_id = "unknown"
    try:
        body = await request.body()
        if body:
            data = json.loads(body.decode("utf-8"))
            tab_id = data.get("tab_id", "unknown")
    except Exception:
        pass

    res = record_tab_leave(session_cookie, tab_id)
    return res


@router.get("", response_model=SessionStatusResponse)
async def get_session_status(
    request: Request,
    auth: AuthContext = Depends(get_auth_context)
):
    """Returns current workspace session status, presence status, and resource counts."""
    session_cookie = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not session_cookie:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No active workspace session. Please initialize."
        )

    session_data = validate_browser_session(session_cookie)
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Workspace expired after 30-minute grace period elapsed."
        )

    presence = get_session_presence_state(session_cookie)
    datasets = await get_saved_datasets_for_user(session_data["owner_id"])
    analyses = await get_analyses_for_user(session_data["owner_id"])

    return SessionStatusResponse(
        status="active",
        session_id=session_data["id"],
        owner_id=session_data["owner_id"],
        created_at=session_data.get("created_at", datetime.now(timezone.utc).isoformat()),
        last_activity_at=session_data.get("last_activity_at", datetime.now(timezone.utc).isoformat()),
        expires_at=session_data.get("expires_at", ""),
        is_active=presence.get("is_active", True),
        active_tab_count=presence.get("active_tab_count", 1),
        disconnected_at=presence.get("disconnected_at"),
        grace_period_remaining_seconds=presence.get("grace_period_remaining_seconds"),
        remaining_seconds=None,
        dataset_count=len(datasets),
        analysis_count=len(analyses)
    )



@router.post("/activity")
async def record_user_activity(
    request: Request,
    auth: AuthContext = Depends(get_auth_context)
):
    """Meaningful user activity ping that extends 30-min inactivity expiration."""
    session_cookie = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if session_cookie:
        session = validate_browser_session(session_cookie)
        if session:
            return {"status": "extended", "expires_at": session["expires_at"]}
    return {"status": "ok"}


@router.post("/revoke")
async def revoke_workspace(
    response: Response,
    request: Request
):
    """Explicitly revokes the active browser workspace, purges all cloud data, and clears the cookie."""
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if token:
        revoke_browser_session(token)

    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        httponly=True,
        samesite="lax"
    )
    return {"status": "revoked", "message": "Workspace and temporary files successfully purged."}


@router.post("/cleanup")
async def trigger_manual_cleanup():
    """Triggers immediate sweep of expired workspaces (compatible with external cron/schedulers)."""
    from app.core.credentials import cleanup_expired_workspaces
    cleanup_expired_workspaces()
    return {"status": "success", "message": "Expired workspaces successfully purged."}

