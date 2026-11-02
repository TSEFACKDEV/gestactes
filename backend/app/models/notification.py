"""Notifications internes.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
TODO :
  [ ] Créer la notification à chaque transition.
  [ ] Ajouter le compteur non lu.
  [ ] Tester le marquage lu.
"""

from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models.base import utcnow


class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    demande_id: int | None = Field(default=None, foreign_key="demandes.id", index=True)
    title: str = Field(max_length=150)
    message: str = Field(max_length=2000)
    is_read: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=utcnow, index=True)
