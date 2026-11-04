"""Tokens de réinitialisation de mot de passe.

Propriétaire : KOUODZO ZANGUE REGINA
Rôle : lien de réinitialisation à usage unique, valable 30 minutes. Seul le
hash SHA-256 est stocké ; le token en clair part uniquement dans l'e-mail.

La génération, l'envoi, la consommation et la révocation de toutes les
sessions après reset sont portés par `auth_service`.
"""

from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models.base import utcnow


class PasswordResetToken(SQLModel, table=True):
    __tablename__ = "password_reset_tokens"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    token_hash: str = Field(index=True, unique=True, max_length=64)
    expires_at: datetime = Field(index=True)
    used_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=utcnow)
