"""Utilitaires partagés des modèles.

Propriétaire : TSEFACK CALVIN KLEIN (socle partagé, gelé).
TODO : maintenir le socle et ajouter les tests de non-régression.
"""

from datetime import UTC, datetime
from enum import Enum

from sqlalchemy import Column
from sqlalchemy import Enum as SAEnum


def utcnow() -> datetime:
    """Horodatage UTC utilisé par tous les modèles."""

    return datetime.now(UTC)


def enum_column(
    enum_class: type[Enum],
    *,
    nullable: bool = False,
    index: bool = False,
) -> Column:
    """Colonne d'énumération qui stocke les valeurs, pas les noms Python.

    `native_enum=False` garde un VARCHAR + contrainte, plus simple à faire
    évoluer qu'un type ENUM PostgreSQL pour ce projet.
    """

    return Column(
        SAEnum(
            enum_class,
            values_callable=lambda cls: [member.value for member in cls],
            native_enum=False,
            validate_strings=True,
            name=enum_class.__name__.lower(),
        ),
        nullable=nullable,
        index=index,
    )
