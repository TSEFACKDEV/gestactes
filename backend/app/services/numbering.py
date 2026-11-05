"""Numérotation des actes.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
Les préfixes permettent d'identifier le type d'acte dès la lecture du numéro :
AR = attestation de résidence, EN = extrait d'acte de naissance,
AB = autorisation de bâtir.
"""

from datetime import UTC, datetime

TYPE_PREFIXES: dict[str, str] = {
    "attestation-residence": "AR",
    "extrait-naissance": "EN",
    "autorisation-batir": "AB",
}
DEFAULT_PREFIX = "ACTE"


def prefix_for_type(type_code: str) -> str:
    return TYPE_PREFIXES.get(type_code, DEFAULT_PREFIX)


def format_numero(year: int, demande_id: int, prefix: str = DEFAULT_PREFIX) -> str:
    """Construit le numéro public, unique et lisible."""
    return f"{prefix}-{year}-{demande_id:06d}"


def current_year() -> int:
    return datetime.now(UTC).year
