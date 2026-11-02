"""Utilisateur et rôles.

Propriétaire : KOUODZO ZANGUE REGINA
TODO :
  [ ] Ajouter les contraintes métier (e-mail normalisé en minuscules).
  [ ] Ajouter les index nécessaires aux recherches admin.
  [ ] Écrire les tests de création/modification.
"""

from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models.base import enum_column, utcnow
from app.models.enums import Role


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True, max_length=255)
    password_hash: str = Field(max_length=255)
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    role: Role = Field(
        default=Role.CITOYEN,
        sa_column=enum_column(Role, index=True),
    )
    is_active: bool = Field(default=True, index=True)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
