from typing import List, Optional
from pydantic import BaseModel, Field


class SessionInitResponse(BaseModel):
    status: str = "active"
    session_id: str
    owner_id: str
    expires_at: str
    message: str = "Browser session active (30-minute inactivity expiration)"


class APIKeyGenerateRequest(BaseModel):
    scopes: Optional[List[str]] = Field(
        default=["datasets:read", "analytics:read", "insights:read", "exports:create"],
        description="Permissions granted to this temporary API key"
    )


class APIKeyGenerateResponse(BaseModel):
    api_key: str = Field(..., description="Display once! Original temporary Developer API Key")
    key_id: str
    key_prefix: str
    scopes: List[str]
    expires_at: str
    warning: str = "This key is displayed only once. It will expire after 30 minutes of inactivity."


class APIKeyInfo(BaseModel):
    id: str
    key_prefix: str
    scopes: List[str]
    status: str
    created_at: str
    expires_at: str


class APIKeyRevokeResponse(BaseModel):
    status: str = "revoked"
    message: str

