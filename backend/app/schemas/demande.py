"""Schémas des demandes.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO réalisé :
  [x] Champs exposés alignés sur les vues demande et liste.
  [ ] Ajouter tous les exemples OpenAPI métier.
  [x] Modèles datetime compatibles avec la sérialisation UTC.
"""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.models.enums import StatutDemande
from app.schemas.acte import SignatureManifest
from app.schemas.common import ORMModel
from app.schemas.type_acte import TypeActeSummary
from app.schemas.user import UserSummary

DecisionType = Literal["approuver", "demander_corrections", "rejeter"]


class DemandeCreatePayload(BaseModel):
    type_code: str = Field(min_length=2, max_length=80)
    donnees: dict[str, Any] = Field(default_factory=dict)


class PieceJointeRead(ORMModel):
    id: int
    filename: str
    content_type: str
    size_bytes: int
    sha256: str
    created_at: datetime


class DemandeListItem(ORMModel):
    id: int
    numero: str
    type: TypeActeSummary
    demandeur: UserSummary
    statut: StatutDemande
    assigned_agent: UserSummary | None = None
    pr_url: str | None = None
    created_at: datetime
    updated_at: datetime


class DemandeRead(DemandeListItem):
    donnees: dict[str, Any]
    acte_md: str | None = None
    issue_number: int | None = None
    issue_url: str | None = None
    branch_name: str | None = None
    pr_number: int | None = None
    assigned_validator: UserSummary | None = None
    complement_attendu: bool = False
    complement_message: str | None = None
    rejection_reason: str | None = None
    signature: SignatureManifest | None = None
    signed_at: datetime | None = None
    merge_commit_sha: str | None = None
    tag_name: str | None = None
    pieces: list[PieceJointeRead] = Field(default_factory=list)


class DemandeContentUpdate(BaseModel):
    donnees: dict[str, Any] | None = None
    acte_md: str | None = None
    message: str | None = Field(default=None, max_length=200)


class ComplementRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class SoumissionRequest(BaseModel):
    comment: str | None = Field(default=None, max_length=2000)


class DecisionRequest(BaseModel):
    decision: DecisionType
    comment: str | None = Field(default=None, max_length=2000)


class SignatureRequest(BaseModel):
    confirmation: bool


class SignatureResult(BaseModel):
    demande: DemandeRead
    signature: SignatureManifest
    merge_commit_sha: str


class HistoriqueItem(BaseModel):
    type: Literal["commit", "audit"]
    action: str
    actor: str
    message: str
    sha: str | None = None
    created_at: datetime


class DemandeDiff(BaseModel):
    before: str
    after: str
