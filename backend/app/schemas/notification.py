"""Schémas des notifications.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
TODO :
  [ ] Ajouter les liens vers la demande.
  [ ] Tester le compteur non lu.
"""

from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class NotificationRead(ORMModel):
    id: int
    title: str
    message: str
    demande_id: int | None = None
    is_read: bool
    created_at: datetime


class NotificationList(BaseModel):
    items: list[NotificationRead]
    unread_count: int
