"""Journal d'audit append-only.

Propriétaire : KOUODZO ZANGUE REGINA
TODO :
  [ ] Ne jamais exposer de mise à jour/suppression de cette table.
  [ ] Ajouter les filtres de consultation admin.
  [ ] Vérifier la corrélation avec les commits GitHub.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from app.models.base import utcnow


class AuditEvent(SQLModel, table=True):
    __tablename__ = "audit_events"

    id: int | None = Field(default=None, primary_key=True)
    demande_id: int | None = Field(default=None, foreign_key="demandes.id", index=True)
    actor_id: int | None = Field(default=None, foreign_key="users.id", index=True)
    action: str = Field(index=True, max_length=100)
    details: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSON, nullable=False),
    )
    commit_sha: str | None = Field(default=None, max_length=64)
    request_id: str | None = Field(default=None, max_length=64)
    created_at: datetime = Field(default_factory=utcnow, index=True)
