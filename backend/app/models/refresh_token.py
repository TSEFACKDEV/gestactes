"""Refresh tokens opaques.

Propriétaire : KOUODZO ZANGUE REGINA
TODO :
  [ ] Rotation et révocation dans auth_service.
  [ ] Purge des tokens expirés.
  [ ] Tests de rejeu et de révocation.
"""

from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models.base import utcnow


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    token_hash: str = Field(index=True, unique=True, max_length=64)
    expires_at: datetime
    revoked_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=utcnow)
