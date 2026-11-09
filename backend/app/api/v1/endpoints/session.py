from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Response, Request, HTTPException, status
from app.core.config import settings
from app.core.security import get_auth_context, AuthContext
from app.core.credentials import (
    create_browser_session,
    validate_browser_session,
    revoke_browser_session
)
from app.schemas.dataset import SessionStatusResponse
from app.services.supabase.db import get_saved_datasets_for_user, get_analyses_for_user

router = APIRouter()


@router.post("/initialize", response_model=SessionStatusResponse)
async def initialize_workspace_session(
    response: Response,
    request: Request,
    auth: AuthContext = Depends(get_auth_context)
):
    """
    Establishes or restores a browser-scoped anonymous workspace.
    Survives page reloads via HttpOnly cookie.
    Sets 30-minute inactivity expiration.
    """
    session_cookie = request.cookies.get(settings.SESSION_COOKIE_NAME)
    session_data = None

    if session_cookie:
        session_data = validate_browser_session(session_cookie)

    if not session_data:
        # Create fresh anonymous browser session
        created = create_browser_session(owner_id=auth.user_id)
        session_data = {
            "id": created["session_id"],
            "owner_id": created["owner_id"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_activity_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": created["expires_at"].isoformat(),
            "status": "active"
        }
        # Set Secure HttpOnly SameSite cookie
        response.set_cookie(
            key=settings.SESSION_COOKIE_NAME,
            value=created["raw_token"],
            max_age=settings.SESSION_INACTIVITY_MINUTES * 60,
            httponly=True,
            samesite="lax",
            secure=False
        )

    # Compute remaining time
    now = datetime.now(timezone.utc)
    exp_dt = datetime.fromisoformat(session_data["expires_at"].replace("Z", "+00:00"))
    remaining_secs = max(0, int((exp_dt - now).total_seconds()))

    datasets = await get_saved_datasets_for_user(session_data["owner_id"])
    analyses = await get_analyses_for_user(session_data["owner_id"])

    return SessionStatusResponse(
        status="active",
        session_id=session_data["id"],
        owner_id=session_data["owner_id"],
        created_at=session_data.get("created_at", now.isoformat()),
        last_activity_at=session_data.get("last_activity_at", now.isoformat()),
        expires_at=session_data["expires_at"],
        remaining_seconds=remaining_secs,
        dataset_count=len(datasets),
        analysis_count=len(analyses)
    )


@router.get("", response_model=SessionStatusResponse)
async def get_session_status(
    request: Request,
    auth: AuthContext = Depends(get_auth_context)
):
    """Returns current workspace session status, expiration countdown, and resource counts."""
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
            detail="Workspace expired after 30 minutes of inactivity."
        )

    now = datetime.now(timezone.utc)
    exp_dt = datetime.fromisoformat(session_data["expires_at"].replace("Z", "+00:00"))
    remaining_secs = max(0, int((exp_dt - now).total_seconds()))

    datasets = await get_saved_datasets_for_user(session_data["owner_id"])
    analyses = await get_analyses_for_user(session_data["owner_id"])

    return SessionStatusResponse(
        status="active",
        session_id=session_data["id"],
        owner_id=session_data["owner_id"],
        created_at=session_data.get("created_at", now.isoformat()),
        last_activity_at=session_data.get("last_activity_at", now.isoformat()),
        expires_at=session_data["expires_at"],
        remaining_seconds=remaining_secs,
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

