"""Demande d'acte administratif.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO :
  [x] Vérifier la génération du numéro (flush + id) et l'unicité.
  [x] Ajouter les transitions de statut dans workflow_service.
  [ ] Tester la concurrence sur la prise en charge avec deux sessions.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from app.models.base import utcnow
from app.models.enums import StatutDemande


class Demande(SQLModel, table=True):
    __tablename__ = "demandes"

    id: int | None = Field(default=None, primary_key=True)
    numero: str = Field(index=True, unique=True, max_length=20)
    type_acte_id: int = Field(foreign_key="types_actes.id", index=True)
    demandeur_id: int = Field(foreign_key="users.id", index=True)
    statut: StatutDemande = Field(default=StatutDemande.DEMANDEE, index=True)

    donnees: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSON, nullable=False),
    )
    acte_md: str | None = Field(default=None)

    issue_number: int | None = Field(default=None)
    issue_url: str | None = Field(default=None, max_length=500)
    branch_name: str | None = Field(default=None, max_length=100)
    pr_number: int | None = Field(default=None)
    pr_url: str | None = Field(default=None, max_length=500)

    assigned_agent_id: int | None = Field(
        default=None, foreign_key="users.id", index=True
    )
    assigned_validator_id: int | None = Field(
        default=None, foreign_key="users.id", index=True
    )

    complement_attendu: bool = Field(default=False)
    complement_message: str | None = Field(default=None, max_length=2000)
    rejection_reason: str | None = Field(default=None, max_length=2000)

    signature_sha256: str | None = Field(default=None, max_length=64)
    signature_manifest: dict[str, Any] | None = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
    )
    signed_by_id: int | None = Field(default=None, foreign_key="users.id")
    signed_at: datetime | None = Field(default=None)
    merge_commit_sha: str | None = Field(default=None, max_length=64)
    tag_name: str | None = Field(default=None, max_length=100)
    archived_at: datetime | None = Field(default=None)

    last_commit_sha: str | None = Field(default=None, max_length=64)
    idempotency_key: str | None = Field(
        default=None, index=True, unique=True, max_length=100
    )

    created_at: datetime = Field(default_factory=utcnow, index=True)
    updated_at: datetime = Field(default_factory=utcnow)
