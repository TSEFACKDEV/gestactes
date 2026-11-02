"""Schéma de vérification publique.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
TODO :
  [ ] Vérifier qu'aucune donnée personnelle ne fuit.
  [ ] Ajouter un rate limiting dédié.
"""

from datetime import datetime

from pydantic import BaseModel


class VerificationRead(BaseModel):
    valide: bool
    numero: str
    type: str
    statut: str
    signe_le: datetime | None = None
    signataire: str | None = None
    sha256: str | None = None
