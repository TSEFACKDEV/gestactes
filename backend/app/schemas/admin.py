"""Schémas d'administration.

Propriétaire : KOUODZO ZANGUE REGINA
Rôle : corps et réponses des routes /admin (utilisateurs, audit, statistiques).
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator

from app.models.enums import Role
from app.schemas.common import ORMModel
from app.schemas.user import CleanName, NormalizedEmail, StrongPassword, UserSummary


class AdminUserCreate(BaseModel):
    """Création d'un compte interne : agent, validateur ou administrateur.

    Les citoyens s'inscrivent eux-mêmes via /auth/register.
    """

    first_name: CleanName = Field(min_length=1, max_length=100)
    last_name: CleanName = Field(min_length=1, max_length=100)
    email: NormalizedEmail
    password: StrongPassword = Field(min_length=8, max_length=128)
    role: Role = Role.AGENT

    @field_validator("role")
    @classmethod
    def _internal_role_only(cls, value: Role) -> Role:
        if value == Role.CITOYEN:
            raise ValueError("Le rôle doit être agent, validateur ou admin.")
        return value


class AdminUserUpdate(BaseModel):
    first_name: CleanName | None = Field(default=None, min_length=1, max_length=100)
    last_name: CleanName | None = Field(default=None, min_length=1, max_length=100)
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
