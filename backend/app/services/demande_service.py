"""Service des demandes et de leur contenu.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO :
  [ ] Implémenter la création avec validation du formulaire et des pièces.
  [ ] Implémenter la liste filtrée et l'autorisation objet.
  [ ] Brancher les transitions sur workflow_service.
  [ ] Ajouter l'export CSV et l'historique.
  [ ] Tester les cas 401/403/404/409/422.
"""

import json
from typing import Any

from sqlmodel import Session, select

from app.core.errors import AppError
from app.models import Demande, PieceJointe, Role, StatutDemande, TypeActe, User
from app.schemas.acte import SignatureManifest
from app.schemas.demande import (
    DecisionRequest,
    DemandeContentUpdate,
    DemandeDiff,
    DemandeListItem,
    DemandeRead,
    HistoriqueItem,
    PieceJointeRead,
)
from app.schemas.type_acte import TypeActeSummary
from app.schemas.user import UserSummary


def _type_summary(session: Session, type_id: int) -> TypeActeSummary:
    type_acte = session.get(TypeActe, type_id)
    if type_acte is None:
        raise AppError("Type d'acte introuvable.", status_code=404, code="NOT_FOUND")
    return TypeActeSummary.model_validate(type_acte)


def _user_summary(session: Session, user_id: int | None) -> UserSummary | None:
    if user_id is None:
        return None
    user = session.get(User, user_id)
    return UserSummary.model_validate(user) if user is not None else None


def build_list_item(session: Session, demande: Demande) -> DemandeListItem:
    """Construit la vue légère d'une demande."""

    demandeur = session.get(User, demande.demandeur_id)
    if demandeur is None:
        raise AppError("Demandeur introuvable.", status_code=404, code="NOT_FOUND")

    return DemandeListItem(
        id=demande.id or 0,
        numero=demande.numero,
        type=_type_summary(session, demande.type_acte_id),
        demandeur=UserSummary.model_validate(demandeur),
        statut=demande.statut,
        assigned_agent=_user_summary(session, demande.assigned_agent_id),
        pr_url=demande.pr_url,
        created_at=demande.created_at,
        updated_at=demande.updated_at,
    )


def build_read(session: Session, demande: Demande) -> DemandeRead:
    """Construit la vue complète d'une demande."""

    item = build_list_item(session, demande)
    pieces = list(
        session.exec(
            select(PieceJointe)
            .where(PieceJointe.demande_id == demande.id)
            .order_by(PieceJointe.created_at)  # type: ignore[arg-type]
        ).all()
    )
    signature = (
        SignatureManifest.model_validate(demande.signature_manifest)
        if demande.signature_manifest
        else None
    )
    return DemandeRead(
        **item.model_dump(),
        donnees=demande.donnees,
        acte_md=demande.acte_md,
        issue_number=demande.issue_number,
        issue_url=demande.issue_url,
        branch_name=demande.branch_name,
        pr_number=demande.pr_number,
        assigned_validator=_user_summary(session, demande.assigned_validator_id),
        complement_attendu=demande.complement_attendu,
        complement_message=demande.complement_message,
        rejection_reason=demande.rejection_reason,
        signature=signature,
        signed_at=demande.signed_at,
        merge_commit_sha=demande.merge_commit_sha,
        tag_name=demande.tag_name,
        pieces=[PieceJointeRead.model_validate(piece) for piece in pieces],
    )


def get_demande_or_404(session: Session, demande_id: int) -> Demande:
    demande = session.get(Demande, demande_id)
    if demande is None:
        raise AppError("Demande introuvable.", status_code=404, code="NOT_FOUND")
    return demande


def assert_can_view(demande: Demande, user: User) -> None:
    """Autorisation objet : un citoyen ne voit que ses demandes."""

    if user.role == Role.ADMIN:
        return
    if user.role == Role.CITOYEN:
        if demande.demandeur_id != user.id:
            raise AppError("Accès refusé.", status_code=403, code="FORBIDDEN")
        return
    if user.role == Role.AGENT:
        if demande.statut == StatutDemande.DEMANDEE:
            return
        if demande.assigned_agent_id == user.id:
            return
        raise AppError("Accès refusé.", status_code=403, code="FORBIDDEN")
    if user.role == Role.VALIDATEUR:
        if demande.statut in {
            StatutDemande.EN_VALIDATION,
            StatutDemande.VALIDEE,
            StatutDemande.SIGNEE,
            StatutDemande.ARCHIVEE,
        }:
            return
        raise AppError("Accès refusé.", status_code=403, code="FORBIDDEN")


def get_demande(session: Session, demande_id: int, user: User) -> Demande:
    demande = get_demande_or_404(session, demande_id)
    assert_can_view(demande, user)
    return demande


def create_demande(
    session: Session,
    *,
    type_code: str,
    donnees: dict[str, Any],
    files: list[Any],
    demandeur: User,
    idempotency_key: str | None,
) -> Demande:
    """Crée une demande, ses pièces et les jobs GitHub.

    TODO NDOUNGUE :
      - charger le type actif ;
      - valider `donnees` contre `form_schema` ;
      - valider les fichiers (taille, type, nombre) ;
      - insérer la demande, flush, générer `numero` ;
      - enregistrer les pièces et le hash ;
      - écrire l'audit et les jobs outbox ;
      - gérer l'idempotence.
    """

    raise AppError(
        "La création de demande n'est pas encore implémentée.",
        status_code=501,
        code="NOT_IMPLEMENTED",
    )


def list_demandes(
    session: Session,
    *,
    user: User,
    statut: StatutDemande | None,
    type_code: str | None,
    q: str | None,
    date_from=None,
    date_to=None,
    page: int,
    page_size: int,
) -> tuple[list[Demande], int]:
    """Liste paginée avec périmètre par rôle.

    TODO NDOUNGUE : construire les filtres et le comptage.
    """

    raise AppError(
        "La liste des demandes n'est pas encore implémentée.",
        status_code=501,
        code="NOT_IMPLEMENTED",
    )


def take_charge(session: Session, demande_id: int, user: User) -> Demande:
    """Prend en charge une demande et crée la branche.

    TODO NDOUNGUE : transition `demandee -> en_instruction`, assignation,
    audit, job GitHub.
    """

    raise AppError(
        "La prise en charge n'est pas encore implémentée.",
        status_code=501,
        code="NOT_IMPLEMENTED",
    )


def cancel_demande(session: Session, demande_id: int, user: User) -> Demande:
    """Annule une demande à l'état `demandee`.

    TODO NDOUNGUE : vérifier le propriétaire, la transition, l'Issue GitHub.
    """

    raise AppError(
        "L'annulation n'est pas encore implémentée.",
        status_code=501,
        code="NOT_IMPLEMENTED",
    )


def update_content(
    session: Session,
    demande_id: int,
    user: User,
    payload: DemandeContentUpdate,
) -> Demande:
    """Met à jour le brouillon et crée un commit.

    TODO NDOUNGUE : vérifier l'agent assigné, valider, commit GitHub, audit.
    """

    raise AppError(
        "La modification du brouillon n'est pas encore implémentée.",
        status_code=501,
        code="NOT_IMPLEMENTED",
    )


def request_complement(
    session: Session,
    demande_id: int,
    user: User,
    message: str,
) -> Demande:
    """Demande un complément au citoyen."""

    raise AppError(
        "La demande de complément n'est pas encore implémentée.",
        status_code=501,
        code="NOT_IMPLEMENTED",
    )


def submit_demande(
    session: Session,
    demande_id: int,
    user: User,
    comment: str | None,
) -> Demande:
    """Soumet l'acte à validation et ouvre une PR."""

    raise AppError(
        "La soumission n'est pas encore implémentée.",
        status_code=501,
        code="NOT_IMPLEMENTED",
    )


def decide_demande(
    session: Session,
    demande_id: int,
    user: User,
    payload: DecisionRequest,
) -> Demande:
    """Approuve, demande des corrections ou rejette."""

    raise AppError(
        "La décision n'est pas encore implémentée.",
        status_code=501,
        code="NOT_IMPLEMENTED",
    )


def sign_demande(
    session: Session,
    demande_id: int,
    user: User,
) -> Demande:
    """Signe l'acte et fusionne la PR."""

    raise AppError(
        "La signature n'est pas encore implémentée.",
        status_code=501,
        code="NOT_IMPLEMENTED",
    )


def get_history(session: Session, demande_id: int, user: User) -> list[HistoriqueItem]:
    """Retourne la timeline commits + audit."""

    raise AppError(
        "L'historique n'est pas encore implémenté.",
        status_code=501,
        code="NOT_IMPLEMENTED",
    )


def get_diff(session: Session, demande_id: int, user: User) -> DemandeDiff:
    """Compare les données sources au contenu rédigé.

    TODO NDOUNGUE/NOLACK : remplacer `before` par la version précédente de
    `acte.md` récupérée depuis GitHub (commits du fichier).
    """

    demande = get_demande(session, demande_id, user)
    return DemandeDiff(
        before=json.dumps(demande.donnees, indent=2, ensure_ascii=False),
        after=demande.acte_md or "",
    )


def get_piece(
    session: Session,
    demande_id: int,
    piece_id: int,
    user: User,
) -> tuple[PieceJointe, bytes]:
    """Retourne le fichier d'une pièce."""

    raise AppError(
        "Le téléchargement des pièces n'est pas encore implémenté.",
        status_code=501,
        code="NOT_IMPLEMENTED",
    )


def get_pdf(session: Session, demande_id: int, user: User) -> bytes:
    """Retourne le PDF signé."""

    raise AppError(
        "Le téléchargement du PDF n'est pas encore implémenté.",
        status_code=501,
        code="NOT_IMPLEMENTED",
    )


def export_csv(
    session: Session,
    *,
    user: User,
    statut: StatutDemande | None,
    type_code: str | None,
    q: str | None,
) -> str:
    """Retourne le CSV des demandes filtrées."""

    raise AppError(
        "L'export CSV n'est pas encore implémenté.",
        status_code=501,
        code="NOT_IMPLEMENTED",
    )
