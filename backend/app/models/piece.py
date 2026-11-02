"""Pièces justificatives.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO :
  [ ] Nettoyer les noms de fichiers.
  [ ] Vérifier le type MIME réel et la taille.
  [ ] Stocker le fichier dans GitHub et garder le chemin + hash.
"""

from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models.base import utcnow


class PieceJointe(SQLModel, table=True):
    __tablename__ = "pieces_jointes"

    id: int | None = Field(default=None, primary_key=True)
    demande_id: int = Field(foreign_key="demandes.id", index=True)
    filename: str = Field(max_length=255)
    github_path: str = Field(max_length=500)
    sha256: str = Field(max_length=64)
    size_bytes: int
    content_type: str = Field(max_length=100)
    created_at: datetime = Field(default_factory=utcnow)
