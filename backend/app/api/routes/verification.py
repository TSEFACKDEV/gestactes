"""Vérification publique d'un acte.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
TODO :
  [ ] Limiter le débit de cette route.
  [ ] Vérifier le hash du manifeste.
  [ ] Tester l'absence de données personnelles.
"""

from fastapi import APIRouter
from sqlmodel import select

from app.core.deps import SessionDep
from app.core.errors import AppError
from app.models import Demande, StatutDemande, TypeActe, User
from app.schemas.verification import VerificationRead

router = APIRouter()


@router.get("/{numero}", response_model=VerificationRead)
def verify(numero: str, session: SessionDep) -> VerificationRead:
    """Retourne l'état public d'un acte, sans données personnelles."""

    demande = session.exec(select(Demande).where(Demande.numero == numero)).first()
    if demande is None:
        raise AppError("Acte introuvable.", status_code=404, code="NOT_FOUND")

    type_acte = session.get(TypeActe, demande.type_acte_id)
    signer = session.get(User, demande.signed_by_id) if demande.signed_by_id else None
    valide = (
        demande.statut in {StatutDemande.SIGNEE, StatutDemande.ARCHIVEE}
        and bool(demande.signature_sha256)
    )
    return VerificationRead(
        valide=valide,
        numero=demande.numero,
        type=type_acte.label if type_acte else "Type inconnu",
        statut=demande.statut.value,
        signe_le=demande.signed_at,
        signataire=f"{signer.first_name} {signer.last_name}" if signer else None,
        sha256=demande.signature_sha256,
    )
