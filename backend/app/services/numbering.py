"""Numérotation des actes.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO :
  [ ] Vérifier l'unicité en cas d'insertions concurrentes.
  [ ] Documenter la stratégie de numérotation.
"""

from datetime import UTC, datetime


def format_numero(year: int, demande_id: int) -> str:
    """Construit le numéro public à partir de l'identifiant technique.

    Le numéro reste unique car l'identifiant de la demande est global.
    """

    return f"{year}-{demande_id:06d}"


def current_year() -> int:
    return datetime.now(UTC).year
