"""File de jobs persistante (outbox).

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
TODO :
  [ ] Implémenter le verrouillage PostgreSQL (`FOR UPDATE SKIP LOCKED`).
  [ ] Ajouter le backoff exponentiel.
  [ ] Ajouter la purge des jobs terminés.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from app.models.base import utcnow
from app.models.enums import OutboxStatus


class OutboxJob(SQLModel, table=True):
    __tablename__ = "outbox_jobs"

    id: int | None = Field(default=None, primary_key=True)
    job_type: str = Field(index=True, max_length=80)
    payload: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSON, nullable=False),
    )
    status: OutboxStatus = Field(default=OutboxStatus.PENDING, index=True)
    attempts: int = Field(default=0)
    last_error: str | None = Field(default=None, max_length=2000)
    run_at: datetime = Field(default_factory=utcnow, index=True)
    locked_at: datetime | None = Field(default=None)
    locked_by: str | None = Field(default=None, max_length=100)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
