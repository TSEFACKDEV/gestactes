"""Utilitaires partagés des modèles.

Propriétaire : TSEFACK CALVIN KLEIN (socle partagé, gelé).


TODO : maintenir le socle et ajouter les tests de non-régression.
"""

from datetime import UTC, datetime


def utcnow() -> datetime:
    """Horodatage UTC utilisé par tous les modèles."""

    return datetime.now(UTC)
