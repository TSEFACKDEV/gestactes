"""Tokens de réinitialisation de mot de passe.

Propriétaire : KOUODZO ZANGUE REGINA
TODO :
  [ ] Génération et envoi dans auth_service.
  [ ] Usage unique et expiration 30 minutes.
  [ ] Révocation de toutes les sessions après reset.
"""

from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models.base import utcnow


class PasswordResetToken(SQLModel, table=True):
    __tablename__ = "password_reset_tokens"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    token_hash: str = Field(index=True, unique=True, max_length=64)
    expires_at: datetime
    used_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=utcnow)
