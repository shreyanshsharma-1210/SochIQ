import logging
from typing import Optional, Dict, Any
import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

logger = logging.getLogger(__name__)

security_bearer = HTTPBearer(auto_error=False)


class AnonymousUser:
    """Represents an authenticated anonymous or identified user from Supabase JWT."""
    def __init__(self, user_id: str, email: Optional[str] = None, is_anonymous: bool = True):
        self.user_id = user_id
        self.email = email
        self.is_anonymous = is_anonymous


def decode_jwt_token(token: str) -> Dict[str, Any]:
    """
    Decodes Supabase JWT token.
    Validates algorithm and claims. If SUPABASE_JWT_ISSUER or secret is set, it checks them.
    Falls back gracefully in local dev mode if unconfigured.
    """
    try:
        # In Supabase, the JWT header typically specifies HS256 or RS256
        # When SUPABASE_SERVICE_ROLE_KEY or JWT Secret is present, decode with secret.
        # Otherwise, decode without signature verification strictly for local development testing.
        secret = settings.SUPABASE_SERVICE_ROLE_KEY
        if secret and settings.SUPABASE_URL:
            # Full signature verification
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
        else:
            # Local dev fallback when credentials aren't yet populated
            payload = jwt.decode(
                token,
                options={"verify_signature": False, "verify_aud": False}
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token has expired. Please refresh your session."
        )
    except Exception as e:
        logger.warning(f"JWT decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials."
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)
) -> AnonymousUser:
    """
    FastAPI dependency that extracts the verified anonymous user from the Authorization header.
    Allows guest fallback in local development if no auth token is provided.
    """
    if not credentials:
        # For development / testing convenience, allow default local anonymous user
        return AnonymousUser(user_id="00000000-0000-0000-0000-000000000000", is_anonymous=True)

    token = credentials.credentials
    payload = decode_jwt_token(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user subject ('sub') claim."
        )

    is_anonymous = payload.get("is_anonymous", True)
    email = payload.get("email")

    return AnonymousUser(user_id=user_id, email=email, is_anonymous=is_anonymous)

