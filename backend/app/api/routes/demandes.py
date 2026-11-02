"""Routes des demandes.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO :
  [ ] Brancher chaque route sur demande_service.
  [ ] Ajouter les tests d'autorisation objet.
  [ ] Vérifier les codes 409/413/422.
"""

from datetime import date

from fastapi import APIRouter, File, Form, Header, Query, Response, UploadFile, status
from pydantic import ValidationError

from app.core.deps import (
    AgentUser,
    CitizenUser,
    CurrentUser,
    SessionDep,
    StaffUser,
    ValidatorUser,
)
from app.core.errors import AppError
from app.models import StatutDemande
from app.schemas.acte import SignatureManifest
from app.schemas.common import Page
from app.schemas.demande import (
    ComplementRequest,
    DecisionRequest,
    DemandeContentUpdate,
    DemandeCreatePayload,
    DemandeListItem,
    DemandeRead,
    HistoriqueItem,
    SignatureRequest,
    SignatureResult,
    SoumissionRequest,
)
from app.services import demande_service

router = APIRouter()


@router.post("", response_model=DemandeRead, status_code=status.HTTP_201_CREATED)
def create_demande(
    user: CitizenUser,
    session: SessionDep,
    payload: str = Form(..., description="JSON {type_code, donnees}"),
    files: list[UploadFile] = File(default=[]),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
) -> DemandeRead:
    """Dépose une demande avec ses pièces justificatives."""

    try:
        parsed = DemandeCreatePayload.model_validate_json(payload)
    except ValidationError as exc:
        raise AppError(
            "Le formulaire de demande est invalide.",
            status_code=422,
            code="VALIDATION_ERROR",
            details={"payload": str(exc.errors()[0].get("msg", "JSON invalide"))},
        ) from exc

    demande = demande_service.create_demande(
        session,
        type_code=parsed.type_code,
        donnees=parsed.donnees,
        files=list(files),
        demandeur=user,
        idempotency_key=idempotency_key,
    )
    session.commit()
    session.refresh(demande)
    return demande_service.build_read(session, demande)


@router.get("", response_model=Page[DemandeListItem])
def list_demandes(
    user: CurrentUser,
    session: SessionDep,
    statut: StatutDemande | None = Query(default=None),
    type_code: str | None = Query(default=None),
    q: str | None = Query(default=None, max_length=100),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> Page[DemandeListItem]:
    """Liste les demandes selon le rôle et les filtres."""

    items, total = demande_service.list_demandes(
        session,
        user=user,
        statut=statut,
        type_code=type_code,
        q=q,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )
    return Page.create(
        [demande_service.build_list_item(session, demande) for demande in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/export.csv", response_class=Response)
def export_csv(
    user: StaffUser,
    session: SessionDep,
    statut: StatutDemande | None = Query(default=None),
    type_code: str | None = Query(default=None),
    q: str | None = Query(default=None, max_length=100),
) -> Response:
    """Exporte la liste filtrée en CSV."""

    content = demande_service.export_csv(
        session,
        user=user,
        statut=statut,
        type_code=type_code,
        q=q,
    )
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="demandes.csv"'},
    )


@router.get("/{demande_id}", response_model=DemandeRead)
def get_demande(
    demande_id: int,
    user: CurrentUser,
    session: SessionDep,
) -> DemandeRead:
    """Retourne le détail d'une demande autorisée."""

    demande = demande_service.get_demande(session, demande_id, user)
    return demande_service.build_read(session, demande)


@router.post("/{demande_id}/annulation", response_model=DemandeRead)
def cancel_demande(
    demande_id: int,
    user: CitizenUser,
    session: SessionDep,
) -> DemandeRead:
    """Annule une demande non prise en charge."""

    demande = demande_service.cancel_demande(session, demande_id, user)
    session.commit()
    session.refresh(demande)
    return demande_service.build_read(session, demande)


@router.get("/{demande_id}/historique", response_model=list[HistoriqueItem])
def get_history(
    demande_id: int,
    user: CurrentUser,
    session: SessionDep,
) -> list[HistoriqueItem]:
    """Retourne la timeline de la demande."""

    return demande_service.get_history(session, demande_id, user)


@router.get("/{demande_id}/pieces/{piece_id}", response_class=Response)
def get_piece(
    demande_id: int,
    piece_id: int,
    user: CurrentUser,
    session: SessionDep,
) -> Response:
    """Télécharge une pièce justificative."""

    piece, content = demande_service.get_piece(session, demande_id, piece_id, user)
    return Response(
        content=content,
        media_type=piece.content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{piece.filename}"',
        },
    )


@router.post("/{demande_id}/prise-en-charge", response_model=DemandeRead)
def take_charge(
    demande_id: int,
    user: AgentUser,
    session: SessionDep,
) -> DemandeRead:
    """Prend en charge une demande."""

    demande = demande_service.take_charge(session, demande_id, user)
    session.commit()
    session.refresh(demande)
    return demande_service.build_read(session, demande)


@router.put("/{demande_id}/contenu", response_model=DemandeRead)
def update_content(
    demande_id: int,
    payload: DemandeContentUpdate,
    user: AgentUser,
    session: SessionDep,
) -> DemandeRead:
    """Enregistre le brouillon et crée un commit."""

    demande = demande_service.update_content(session, demande_id, user, payload)
    session.commit()
    session.refresh(demande)
    return demande_service.build_read(session, demande)


@router.post("/{demande_id}/complement", response_model=DemandeRead)
def request_complement(
    demande_id: int,
    payload: ComplementRequest,
    user: AgentUser,
    session: SessionDep,
) -> DemandeRead:
    """Demande un complément au citoyen."""

    demande = demande_service.request_complement(
        session, demande_id, user, payload.message
    )
    session.commit()
    session.refresh(demande)
    return demande_service.build_read(session, demande)


@router.post("/{demande_id}/soumission", response_model=DemandeRead)
def submit_demande(
    demande_id: int,
    payload: SoumissionRequest,
    user: AgentUser,
    session: SessionDep,
) -> DemandeRead:
    """Soumet l'acte à validation."""

    demande = demande_service.submit_demande(
        session, demande_id, user, payload.comment
    )
    session.commit()
    session.refresh(demande)
    return demande_service.build_read(session, demande)


@router.post("/{demande_id}/decision", response_model=DemandeRead)
def decide_demande(
    demande_id: int,
    payload: DecisionRequest,
    user: ValidatorUser,
    session: SessionDep,
) -> DemandeRead:
    """Approuve, demande des corrections ou rejette."""

    demande = demande_service.decide_demande(session, demande_id, user, payload)
    session.commit()
    session.refresh(demande)
    return demande_service.build_read(session, demande)


@router.post("/{demande_id}/signature", response_model=SignatureResult)
def sign_demande(
    demande_id: int,
    payload: SignatureRequest,
    user: ValidatorUser,
    session: SessionDep,
) -> SignatureResult:
    """Signe l'acte et fusionne la PR."""

    if not payload.confirmation:
        raise AppError(
            "La signature doit être confirmée explicitement.",
            status_code=422,
            code="SIGNATURE_NOT_CONFIRMED",
        )

    demande = demande_service.sign_demande(session, demande_id, user)
    session.commit()
    session.refresh(demande)
    manifest = SignatureManifest.model_validate(demande.signature_manifest or {})
    return SignatureResult(
        demande=demande_service.build_read(session, demande),
        signature=manifest,
        merge_commit_sha=demande.merge_commit_sha or "",
    )


@router.get("/{demande_id}/pdf", response_class=Response)
def get_pdf(
    demande_id: int,
    user: CurrentUser,
    session: SessionDep,
) -> Response:
    """Télécharge le PDF signé."""

    content = demande_service.get_pdf(session, demande_id, user)
    return Response(
        content=content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="acte-{demande_id}.pdf"',
        },
    )
