"""Utilisateur et rôles.

Propriétaire : KOUODZO ZANGUE REGINA
Rôle : compte de connexion (citoyen, agent, validateur, admin).

Règles portées par le modèle :
  - l'e-mail est toujours stocké normalisé (minuscules, sans espaces autour),
    quel que soit le chemin d'écriture (API, seed, tests) : un écouteur
    normalise juste avant chaque INSERT/UPDATE, car les validateurs SQLAlchemy
    ne se déclenchent pas dans le constructeur des modèles SQLModel ;
  - des index composites accélèrent les recherches de l'administration.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Index, event
from sqlalchemy.orm import validates
from sqlmodel import Field, SQLModel

from app.models.base import utcnow
from app.models.enums import Role


def normalize_email(email: str) -> str:
    """Normalise une adresse e-mail (minuscules, sans espaces autour)."""

    return email.strip().lower()


class User(SQLModel, table=True):
    __tablename__ = "users"
    __table_args__ = (
        # Filtre « rôle + actif » de la liste admin et comptage des admins actifs.
        Index("ix_users_role_is_active", "role", "is_active"),
        # Tri par défaut de la liste admin.
        Index("ix_users_created_at", "created_at"),
    )

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True, max_length=255)
    password_hash: str = Field(max_length=255)
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    role: Role = Field(default=Role.CITOYEN, index=True)
    is_active: bool = Field(default=True, index=True)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    @validates("email")
    def _normalize_email(self, _key: str, value: str) -> str:
        return normalize_email(value)


def _normalize_before_write(_mapper: Any, _connection: Any, target: User) -> None:
    target.email = normalize_email(target.email)


event.listen(User, "before_insert", _normalize_before_write)
event.listen(User, "before_update", _normalize_before_write)
