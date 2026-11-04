"""Journal d'audit append-only.

Propriétaire : KOUODZO ZANGUE REGINA
Rôle : trace de qui a fait quoi, quand, et (si pertinent) sur quel commit
GitHub. Le journal ne se modifie ni ne se supprime : toute tentative de
UPDATE ou de DELETE passant par l'ORM est refusée par les écouteurs ci-dessous.

Corrélation GitHub : `commit_sha` reçoit le SHA du commit lié à l'action, ce qui
permet de retrouver l'événement d'audit à partir d'un commit et inversement.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Column, Index, event
from sqlmodel import Field, SQLModel

from app.models.base import utcnow


class AuditEvent(SQLModel, table=True):
    __tablename__ = "audit_events"
    __table_args__ = (
        # Consultation admin : filtre acteur/action trié par date.
        Index("ix_audit_events_actor_created", "actor_id", "created_at"),
        Index("ix_audit_events_action_created", "action", "created_at"),
        # Retrouver l'événement d'un commit GitHub.
        Index("ix_audit_events_commit_sha", "commit_sha"),
    )

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


class AuditImmutableError(RuntimeError):
    """Levée quand le code tente de modifier ou supprimer un événement d'audit."""


def _refuse_update(*_: Any) -> None:
    raise AuditImmutableError("Le journal d'audit est en ajout seul : modification interdite.")


def _refuse_delete(*_: Any) -> None:
    raise AuditImmutableError("Le journal d'audit est en ajout seul : suppression interdite.")


event.listen(AuditEvent, "before_update", _refuse_update)
event.listen(AuditEvent, "before_delete", _refuse_delete)
