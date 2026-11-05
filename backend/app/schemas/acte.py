"""Contenu d'un acte et manifeste de signature.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO réalisé :
  [x] Canonicalisation JSON exacte définie par `canonicalize_json`.
  [x] Vérification hors ligne documentée dans `docs/workflow.md`.
"""

import json
from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.models.enums import Role


class ActeDemandeur(BaseModel):
    id: int
    nom: str
    prenom: str


class ActeInstruction(BaseModel):
    agent_id: int | None = None
    date_prise_en_charge: datetime | None = None


class ActeContent(BaseModel):
    numero: str
    type: str
    demandeur: ActeDemandeur
    donnees: dict[str, Any]
    instruction: ActeInstruction


class SignatureSignataire(BaseModel):
    id: int
    nom: str
    prenom: str
    role: Role


class SignatureManifest(BaseModel):
    numero: str
    sha256_acte_json: str
    sha256_acte_md: str
    signataire: SignatureSignataire
    signe_le: datetime
    algorithme: str = "SHA-256"
    version: int = 1


def canonicalize_json(value: Any) -> bytes:
    """Serialize JSON canonically for offline SHA-256 verification."""

    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    ).encode("utf-8")
