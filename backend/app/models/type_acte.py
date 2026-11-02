"""Types d'actes et schémas de formulaires.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO :
  [ ] Valider le schéma des champs à la création admin.
  [ ] Ajouter les trois types de démonstration dans seed.py.
  [ ] Tester la désactivation d'un type utilisé.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from app.models.base import utcnow


class TypeActe(SQLModel, table=True):
    __tablename__ = "types_actes"

    id: int | None = Field(default=None, primary_key=True)
    code: str = Field(index=True, unique=True, max_length=80)
    label: str = Field(max_length=150)
    description: str = Field(default="", max_length=1000)
    form_schema: list[dict[str, Any]] = Field(
        default_factory=list,
        sa_column=Column(JSON, nullable=False),
    )
    template_md: str = Field(default="")
    is_active: bool = Field(default=True, index=True)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
