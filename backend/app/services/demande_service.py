"""Service des demandes et de leur contenu.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO réalisé :
  [x] Création avec validation du formulaire et des pièces.
  [x] Liste filtrée et autorisation objet.
  [x] Transitions branchées sur workflow_service.
  [x] Export CSV et historique.
  [ ] Pièces et PDF: téléchargement effectif dépend du stockage GitHub/PDF.
  [x] Erreurs métier couvertes par AppError 403/404/409/422/413.
"""

import asyncio
import csv
import hashlib
import io
import json
import re
from pathlib import PurePath
from typing import Any

from sqlmodel import Session, select

from app.core.errors import AppError
from app.models import (
    AuditEvent,
    Demande,
    JobType,
    PieceJointe,
    Role,
    StatutDemande,
    TypeActe,
    User,
)
from app.models.base import utcnow
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
from app.services import audit_service, outbox_service, workflow_service
from app.services.numbering import current_year, format_numero, prefix_for_type


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
    """Crée une demande avec validation métier, pièces et effets transactionnels."""

    if idempotency_key:
        existing = session.exec(
            select(Demande).where(Demande.idempotency_key == idempotency_key)
        ).first()
        if existing is not None:
            if existing.demandeur_id != demandeur.id:
                raise AppError(
                    "Cette clé d'idempotence appartient à un autre demandeur.",
                    status_code=409,
                    code="IDEMPOTENCY_CONFLICT",
                )
            return existing

    type_acte = session.exec(
        select(TypeActe).where(TypeActe.code == type_code, TypeActe.is_active.is_(True))
    ).first()
    if type_acte is None:
        raise AppError("Type d'acte introuvable.", status_code=404, code="TYPE_ACTE_NOT_FOUND")

    for field in type_acte.form_schema:
        name = field.get("name")
        if not name:
            continue
        if field.get("required") and (name not in donnees or donnees[name] in (None, "")):
            raise AppError(
                f"Le champ '{name}' est obligatoire.",
                status_code=422,
                code="VALIDATION_ERROR",
                details={"field": name},
            )
        if field.get("type") == "select" and name in donnees:
            options = {option.get("value") for option in field.get("options") or []}
            if donnees[name] not in options:
                raise AppError(
                    f"La valeur du champ '{name}' est invalide.",
                    status_code=422,
                    code="VALIDATION_ERROR",
                    details={"field": name},
                )

    if len(files) > 3:
        raise AppError("Maximum 3 pièces justificatives.", status_code=413, code="TOO_MANY_FILES")

    allowed = {"application/pdf", "image/jpeg", "image/png"}
    piece_data: list[tuple[Any, bytes]] = []
    for uploaded in files:
        content_type = uploaded.content_type or "application/octet-stream"
        if content_type not in allowed:
            raise AppError(
                "Format de pièce non autorisé.",
                status_code=422,
                code="INVALID_FILE_TYPE",
            )
        content = uploaded.file.read()
        if len(content) > 5 * 1024 * 1024:
            raise AppError("Une pièce dépasse 5 Mo.", status_code=413, code="FILE_TOO_LARGE")
        piece_data.append((uploaded, content))

    demande = Demande(
        numero="TEMP",
        type_acte_id=type_acte.id or 0,
        demandeur_id=demandeur.id or 0,
        donnees=donnees,
        idempotency_key=idempotency_key,
    )
    session.add(demande)
    session.flush()
    demande.numero = format_numero(
        current_year(), demande.id or 0, prefix_for_type(type_acte.code)
    )

    for uploaded, content in piece_data:
        filename = re.sub(
            r"[^A-Za-z0-9._-]+",
            "_",
            PurePath(uploaded.filename or "piece").name,
        ).strip("._") or "piece"
        sha256 = hashlib.sha256(content).hexdigest()
        piece = PieceJointe(
            demande_id=demande.id or 0,
            filename=filename,
            github_path=f"actes/{type_acte.code}/{current_year()}/{demande.numero}/{filename}",
            sha256=sha256,
            size_bytes=len(content),
            content_type=uploaded.content_type or "application/octet-stream",
        )
        session.add(piece)
        outbox_service.enqueue(session, JobType.GITHUB_COMMIT_ACTE, {
            "demande_id": demande.id,
            "filename": filename,
            "sha256": sha256,
        })

    audit_service.record(session, "demande.creer", actor_id=demandeur.id, demande_id=demande.id)
    outbox_service.enqueue(session, JobType.GITHUB_PROVISION_DEMANDE, {"demande_id": demande.id})
    session.flush()
    return demande


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
    """Liste paginée avec périmètre par rôle."""

    statement = select(Demande)
    if user.role == Role.CITOYEN:
        statement = statement.where(Demande.demandeur_id == user.id)
    elif user.role == Role.AGENT:
        statement = statement.where(
            (Demande.statut == StatutDemande.DEMANDEE)
            | (Demande.assigned_agent_id == user.id)
        )
    elif user.role == Role.VALIDATEUR:
        statement = statement.where(
            Demande.statut.in_(
                [
                    StatutDemande.EN_VALIDATION,
                    StatutDemande.VALIDEE,
                    StatutDemande.SIGNEE,
                    StatutDemande.ARCHIVEE,
                ]
            )
        )

    if statut is not None:
        statement = statement.where(Demande.statut == statut)
    if type_code:
        type_acte = session.exec(select(TypeActe).where(TypeActe.code == type_code)).first()
        if type_acte is None:
            return [], 0
        statement = statement.where(Demande.type_acte_id == type_acte.id)
    if q:
        statement = statement.where(Demande.numero.contains(q))
    if date_from:
        statement = statement.where(Demande.created_at >= date_from)
    if date_to:
        statement = statement.where(Demande.created_at <= date_to)

    total = len(list(session.exec(statement).all()))
    statement = (
        statement.order_by(Demande.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = list(session.exec(statement).all())
    return items, total


def take_charge(session: Session, demande_id: int, user: User) -> Demande:
    demande = get_demande(session, demande_id, user)
    return workflow_service.apply_transition(
        session,
        demande,
        "prendre_en_charge",
        user,
        {"branch_name": f"acte/{demande.numero}"},
    )


def cancel_demande(session: Session, demande_id: int, user: User) -> Demande:
    demande = get_demande(session, demande_id, user)
    if demande.demandeur_id != user.id:
        raise AppError(
            "Seul le demandeur peut annuler la demande.",
            status_code=403,
            code="FORBIDDEN",
        )
    return workflow_service.apply_transition(session, demande, "annuler", user)


def update_content(
    session: Session,
    demande_id: int,
    user: User,
    payload: DemandeContentUpdate,
) -> Demande:
    demande = get_demande(session, demande_id, user)
    if demande.assigned_agent_id != user.id:
        raise AppError(
            "Cette demande n'est pas assignée à cet agent.",
            status_code=403,
            code="FORBIDDEN",
        )
    if payload.donnees is not None:
        demande.donnees = payload.donnees
    if payload.acte_md is not None:
        demande.acte_md = payload.acte_md
    demande.updated_at = utcnow()
    session.add(demande)
    audit_service.record(
        session,
        "demande.contenu_modifier",
        actor_id=user.id,
        demande_id=demande.id,
        details={"message": payload.message},
    )
    outbox_service.enqueue(session, JobType.GITHUB_COMMIT_ACTE, {"demande_id": demande.id})
    session.flush()
    return demande


def request_complement(
    session: Session,
    demande_id: int,
    user: User,
    message: str,
) -> Demande:
    demande = get_demande(session, demande_id, user)
    return workflow_service.apply_transition(
        session,
        demande,
        "demander_corrections",
        user,
        {"message": message},
    )


def submit_demande(
    session: Session,
    demande_id: int,
    user: User,
    comment: str | None,
) -> Demande:
    demande = get_demande(session, demande_id, user)
    if demande.assigned_agent_id != user.id:
        raise AppError(
            "Cette demande n'est pas assignée à cet agent.",
            status_code=403,
            code="FORBIDDEN",
        )
    if not demande.acte_md:
        raise AppError("Le contenu de l'acte est vide.", status_code=422, code="ACTE_CONTENT_EMPTY")
    return workflow_service.apply_transition(
        session, demande, "soumettre", user, {"comment": comment}
    )


def decide_demande(
    session: Session,
    demande_id: int,
    user: User,
    payload: DecisionRequest,
) -> Demande:
    demande = get_demande(session, demande_id, user)
    if payload.decision != "approuver" and not payload.comment:
        raise AppError("Un commentaire est obligatoire.", status_code=422, code="VALIDATION_ERROR")
    action = {
        "approuver": "approuver",
        "demander_corrections": "demander_corrections",
        "rejeter": "rejeter",
    }[payload.decision]
    if action == "demander_corrections" and demande.assigned_agent_id is not None:
        demande.assigned_agent_id = None
    return workflow_service.apply_transition(
        session,
        demande,
        action,
        user,
        {"comment": payload.comment},
    )


def sign_demande(
    session: Session,
    demande_id: int,
    user: User,
) -> Demande:
    demande = get_demande(session, demande_id, user)
    if demande.statut != StatutDemande.VALIDEE:
        raise AppError(
            "L'acte doit être validé avant signature.",
            status_code=409,
            code="INVALID_TRANSITION",
        )
    from app.schemas.acte import SignatureSignataire, canonicalize_json

    demandeur = session.get(User, demande.demandeur_id)
    if demandeur is None:
        raise AppError("Demandeur introuvable.", status_code=404, code="NOT_FOUND")
    signed_at = utcnow()
    signataire = SignatureSignataire(
        id=user.id or 0,
        nom=user.last_name,
        prenom=user.first_name,
        role=user.role,
    )
    demande = workflow_service.apply_transition(session, demande, "signer", user)
    demande.signed_at = signed_at
    demande.signature_sha256 = hashlib.sha256(canonicalize_json(demande.donnees)).hexdigest()
    demande.signature_manifest = {
        "numero": demande.numero,
        "sha256_acte_json": demande.signature_sha256,
        "sha256_acte_md": hashlib.sha256((demande.acte_md or "").encode("utf-8")).hexdigest(),
        "signataire": signataire.model_dump(mode="json"),
        "signe_le": signed_at.isoformat(),
        "algorithme": "SHA-256",
        "version": 1,
    }
    session.add(demande)
    session.flush()
    return demande


def get_history(session: Session, demande_id: int, user: User) -> list[HistoriqueItem]:
    demande = get_demande(session, demande_id, user)
    events = list(session.exec(
        select(AuditEvent)
        .where(AuditEvent.demande_id == demande.id)
        .order_by(AuditEvent.created_at.desc())
    ).all())
    result = []
    for event in events:
        actor = session.get(User, event.actor_id) if event.actor_id else None
        result.append(HistoriqueItem(
            type="audit",
            action=event.action,
            actor=f"{actor.first_name} {actor.last_name}" if actor else "Système",
            message=json.dumps(event.details, ensure_ascii=False),
            sha=event.commit_sha,
            created_at=event.created_at,
        ))
    return result


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
    demande = get_demande(session, demande_id, user)
    piece = session.get(PieceJointe, piece_id)
    if piece is None or piece.demande_id != demande.id:
        raise AppError("Pièce introuvable.", status_code=404, code="NOT_FOUND")
    from app.services import github_service

    try:
        content = asyncio.run(
            github_service.download_file(
                piece.github_path,
                demande.branch_name or "main",
            )
        )
    except Exception as exc:  # pragma: no cover - dépend de GitHub
        raise AppError(
            "La pièce n'est pas disponible dans le stockage GitHub.",
            status_code=502,
            code="GITHUB_UNAVAILABLE",
        ) from exc
    return piece, content


def get_pdf(session: Session, demande_id: int, user: User) -> bytes:
    """Retourne le PDF signé via le service PDF partagé."""

    demande = get_demande(session, demande_id, user)
    if demande.statut not in {StatutDemande.SIGNEE, StatutDemande.ARCHIVEE}:
        raise AppError(
            "Le PDF n'est disponible qu'après signature.",
            status_code=409,
            code="INVALID_TRANSITION",
        )
    from app.services import github_service

    try:
        return asyncio.run(github_service.get_pdf(session, demande))
    except Exception as exc:  # pragma: no cover - dépend de GitHub
        raise AppError(
            "Le PDF n'est pas encore disponible.",
            status_code=502,
            code="PDF_NOT_READY",
        ) from exc


def export_csv(
    session: Session,
    *,
    user: User,
    statut: StatutDemande | None,
    type_code: str | None,
    q: str | None,
) -> str:
    demandes, _ = list_demandes(
        session,
        user=user,
        statut=statut,
        type_code=type_code,
        q=q,
        page=1,
        page_size=10000,
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["numero", "statut", "created_at", "demandeur_id"])
    for demande in demandes:
        writer.writerow([
            demande.numero,
            demande.statut.value,
            demande.created_at.isoformat(),
            demande.demandeur_id,
        ])
    return output.getvalue()
