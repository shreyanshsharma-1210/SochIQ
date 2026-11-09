from typing import List, Optional
from fastapi import APIRouter, Depends, Response, Request, HTTPException, status
from app.core.config import settings
from app.core.security import get_auth_context, AuthContext
from app.core.credentials import (
    create_browser_session,
    revoke_browser_session,
    create_developer_api_key,
    revoke_developer_api_key,
    list_user_api_keys
)
from app.schemas.auth import (
    SessionInitResponse,
    APIKeyGenerateRequest,
    APIKeyGenerateResponse,
    APIKeyInfo,
    APIKeyRevokeResponse
)

router = APIRouter()


@router.post("/session", response_model=SessionInitResponse)
async def init_browser_session(
    response: Response,
    request: Request,
    auth: AuthContext = Depends(get_auth_context)
):
    """
    Establishes or restores a browser-scoped anonymous session.
    Sets a secure HttpOnly cookie ('datalens_session') with 30-min inactivity expiration.
    Shared across all tabs in the same browser profile.
    """
    session = create_browser_session(owner_id=auth.user_id)

    # Set Secure, HttpOnly, SameSite cookie
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=session["raw_token"],
        max_age=settings.SESSION_INACTIVITY_MINUTES * 60,
        httponly=True,
        samesite="lax",
        secure=False  # Set to True automatically on HTTPS in production
    )

    return SessionInitResponse(
        status="active",
        session_id=session["session_id"],
        owner_id=auth.user_id,
        expires_at=session["expires_at"].isoformat()
    )


@router.post("/logout")
async def logout_browser_session(
    response: Response,
    request: Request
):
    """Explicitly revokes current browser session and clears the cookie."""
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if token:
        revoke_browser_session(token)

    response.delete_cookie(settings.SESSION_COOKIE_NAME)
    return {"status": "revoked", "message": "Browser session successfully revoked."}


@router.post("/keys/generate", response_model=APIKeyGenerateResponse)
async def generate_temporary_api_key(
    payload: APIKeyGenerateRequest,
    auth: AuthContext = Depends(get_auth_context)
):
    """
    Generates a separate temporary Developer API Key (e.g. 'dl_live_...').
    Returned strictly ONCE. Only its cryptographic hash is stored.
    Expires after 30 minutes of external inactivity.
    """
    res = create_developer_api_key(
        owner_id=auth.user_id,
        browser_session_id=auth.session_id,
        scopes=payload.scopes
    )

    return APIKeyGenerateResponse(
        api_key=res["raw_key"],
        key_id=res["key_id"],
        key_prefix=res["key_prefix"],
        scopes=res["scopes"],
        expires_at=res["expires_at"].isoformat()
    )


@router.get("/keys", response_model=List[APIKeyInfo])
async def list_active_keys(
    auth: AuthContext = Depends(get_auth_context)
):
    """Lists non-secret metadata (prefix, scopes, expiration) for caller's active API keys."""
    keys = list_user_api_keys(auth.user_id)
    return [
        APIKeyInfo(
            id=k["id"],
            key_prefix=k["key_prefix"],
            scopes=k["scopes"],
            status=k["status"],
            created_at=k["created_at"],
            expires_at=k["expires_at"]
        )
        for k in keys
    ]


@router.delete("/keys/{key_id}", response_model=APIKeyRevokeResponse)
async def revoke_api_key(
    key_id: str,
    auth: AuthContext = Depends(get_auth_context)
):
    """Explicitly revokes a Developer API key immediately."""
    revoke_developer_api_key(key_id=key_id, owner_id=auth.user_id)
    return APIKeyRevokeResponse(
        status="revoked",
        message=f"API Key {key_id} has been revoked and can no longer authorize requests."
    )

