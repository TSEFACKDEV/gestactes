"""Schémas Pydantic partagés.

Propriétaire : TSEFACK CALVIN KLEIN (contrat gelé).


TODO : maintenir le socle et ajouter les tests de non-régression.
"""

from math import ceil
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ORMModel(BaseModel):
    """Base pour les schémas lus depuis des objets SQLModel."""

    model_config = ConfigDict(from_attributes=True)


class Page(BaseModel, Generic[T]):  # noqa: UP046
    """Enveloppe de pagination standard."""

    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int

    @classmethod
    def create(
        cls,
        items: list[T],
        total: int,
        page: int,
        page_size: int,
    ) -> "Page[T]":
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            pages=ceil(total / page_size) if page_size else 0,
        )


class MessageResponse(BaseModel):
    message: str


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: dict[str, str] = {}
    request_id: str


class ErrorResponse(BaseModel):
    error: ErrorDetail
