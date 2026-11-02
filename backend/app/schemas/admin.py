"""Schémas d'administration.

Propriétaire : KOUODZO ZANGUE REGINA
TODO :
  [ ] Ajouter les statistiques par période.
  [ ] Tester les filtres d'audit.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import Role
from app.schemas.common import ORMModel
from app.schemas.user import UserSummary


class AdminUserCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Role = Role.AGENT


class AdminUserUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    role: Role | None = None
    is_active: bool | None = None


class AuditEventRead(ORMModel):
    id: int
    demande_id: int | None = None
    actor: UserSummary | None = None
    action: str
    details: dict[str, Any] = Field(default_factory=dict)
    commit_sha: str | None = None
    created_at: datetime


class StatsRead(BaseModel):
    total: int
    par_statut: dict[str, int]
    par_type: dict[str, int]
    delai_moyen_heures: float
