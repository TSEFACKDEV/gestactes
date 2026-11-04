"""Refresh tokens opaques.

Propriétaire : KOUODZO ZANGUE REGINA
Rôle : une ligne = une session. Seul le hash SHA-256 du token est stocké ; le
token en clair n'existe que dans le cookie HttpOnly du navigateur.

La rotation, la révocation, la détection de rejeu et la purge des tokens
expirés sont portées par `auth_service`.
"""

from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models.base import utcnow


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    token_hash: str = Field(index=True, unique=True, max_length=64)
    expires_at: datetime = Field(index=True)
    revoked_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=utcnow)
