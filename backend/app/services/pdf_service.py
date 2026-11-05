"""Génération du PDF et du QR code.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
TODO :
  [ ] Mettre en page le PDF avec ReportLab.
  [ ] Ajouter le numéro, la date, le signataire et le QR code.
  [ ] Tester la génération et la lisibilité du QR.
"""

from app.core.config import settings
from app.schemas.acte import ActeContent, SignatureManifest


def verification_url(numero: str) -> str:
    """URL publique encodée dans le QR code."""

    return f"{settings.frontend_url}/verifier/{numero}"


def generate_pdf(
    acte: ActeContent,
    acte_md: str,
    signature: SignatureManifest,
) -> bytes:
    """Génère le PDF final.

    TODO NOLACK : utiliser ReportLab pour le document et qrcode pour le
    QR code de vérification.
    """

    raise NotImplementedError("La génération PDF n'est pas encore implémentée.")
