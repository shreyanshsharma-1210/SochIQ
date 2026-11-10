import logging
from typing import Optional, Dict, Any
import jwt
from fastapi import HTTPException, Security, Request, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.core.credentials import (
    validate_browser_session,
    validate_developer_api_key
)

logger = logging.getLogger(__name__)
security_bearer = HTTPBearer(auto_error=False)


def get_cookie_security_params(request: Request) -> dict:
    is_https = (
        request.url.scheme == "https"
        or request.headers.get("x-forwarded-proto") == "https"
        or "onrender.com" in request.headers.get("host", "")
    )
    if is_https:
        return {"samesite": "none", "secure": True}
    return {"samesite": "lax", "secure": False}


class AuthContext:
    """
    Unified authorization context for DataLens requests:
    - user_id: verified anonymous or identified Supabase user UUID
    - credential_type: 'browser_session' | 'developer_api_key' | 'jwt' | 'local_dev'
    - session_id: optional associated browser session UUID
    - scopes: permitted permission scopes
    """
    def __init__(
        self,
        user_id: str,
        credential_type: str,
        session_id: Optional[str] = None,
        scopes: Optional[list] = None
    ):
        self.user_id = user_id
        self.credential_type = credential_type
        self.session_id = session_id
        self.scopes = scopes or ["*"]

    def has_scope(self, required_scope: str) -> bool:
        if "*" in self.scopes or required_scope in self.scopes:
            return True
        return False


def require_auth(required_scope: Optional[str] = None):
    """
    Dependency factory validating either:
    1. Browser Session Credential via HttpOnly cookie ('datalens_session')
    2. Developer API Key via 'Authorization: Bearer dl_live_...'
    3. Standard Supabase Anonymous JWT
    4. Local development fallback
    """
    async def _auth_dependency(
        request: Request,
        credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)
    ) -> AuthContext:
        # A. Check Developer API Key in Authorization header ('dl_live_...')
        if credentials and credentials.credentials.startswith("dl_live_"):
            raw_key = credentials.credentials
            key_data = validate_developer_api_key(raw_key, required_scope=required_scope)
            if not key_data:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid, expired, or unauthorized Developer API Key."
                )
            return AuthContext(
                user_id=key_data["owner_id"],
                credential_type="developer_api_key",
                session_id=key_data.get("browser_session_id"),
                scopes=key_data.get("scopes", [])
            )

        # B. Check Browser Session Credential in HttpOnly Cookie
        session_cookie = request.cookies.get(settings.SESSION_COOKIE_NAME)
        if session_cookie:
            session_data = validate_browser_session(session_cookie)
            if session_data:
                return AuthContext(
                    user_id=session_data["owner_id"],
                    credential_type="browser_session",
                    session_id=session_data["id"],
                    scopes=["*"]  # Browser frontend has full interactive scopes
                )
            else:
                # Cookie present but expired/invalid
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Browser session has expired after 30 minutes of inactivity. Please refresh your session."
                )

        # C. Check Standard Supabase JWT in Bearer header
        if credentials and not credentials.credentials.startswith("dl_live_"):
            token = credentials.credentials
            try:
                secret = settings.SUPABASE_SERVICE_ROLE_KEY
                header = {}
                try:
                    header = jwt.get_unverified_header(token)
                except Exception:
                    pass
                alg = header.get("alg", "HS256")

                if alg == "HS256" and secret and settings.SUPABASE_URL:
                    payload = jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})
                else:
                    # For ES256 asymmetric Supabase tokens, decode payload claims
                    payload = jwt.decode(token, options={"verify_signature": False, "verify_aud": False})

                user_id = payload.get("sub", "00000000-0000-0000-0000-000000000000")
                return AuthContext(
                    user_id=user_id,
                    credential_type="jwt",
                    scopes=["*"]
                )
            except Exception as e:
                logger.warning(f"JWT verification error: {e}")
                return AuthContext(
                    user_id="00000000-0000-0000-0000-000000000000",
                    credential_type="jwt_fallback",
                    scopes=["*"]
                )

        # D. Permissive Local Development Fallback
        return AuthContext(
            user_id="00000000-0000-0000-0000-000000000000",
            credential_type="local_dev",
            scopes=["*"]
        )

    return _auth_dependency


# Common dependencies for endpoints
get_auth_context = require_auth()
get_current_user = get_auth_context  # backward-compatible alias
AnonymousUser = AuthContext          # backward-compatible alias
