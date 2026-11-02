"""Événements webhook GitHub déjà reçus.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
TODO :
  [ ] Vérifier l'unicité de `delivery_id`.
  [ ] Marquer `processed_at` après traitement.
  [ ] Tester le rejeu d'un même événement.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from app.models.base import utcnow


class WebhookEvent(SQLModel, table=True):
    __tablename__ = "webhook_events"

    id: int | None = Field(default=None, primary_key=True)
    delivery_id: str = Field(index=True, unique=True, max_length=100)
    event: str = Field(max_length=80)
    action: str | None = Field(default=None, max_length=80)
    payload: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSON, nullable=False),
    )
    processed_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=utcnow, index=True)
