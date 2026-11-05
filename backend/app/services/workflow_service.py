"""Machine à états du workflow.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO réalisé :
  [x] Implémenter `apply_transition` avec audit + outbox.
  [x] Verrouiller la demande (`SELECT FOR UPDATE`) avant transition.
  [ ] Ajouter les tests de concurrence sur deux sessions.
"""

from typing import Any

from sqlmodel import Session, select

from app.core.errors import AppError
from app.models import Demande, JobType, Role, StatutDemande, User
from app.services import audit_service, outbox_service

TRANSITIONS: dict[tuple[StatutDemande, str], StatutDemande] = {
    (StatutDemande.DEMANDEE, "prendre_en_charge"): StatutDemande.EN_INSTRUCTION,
    (StatutDemande.DEMANDEE, "annuler"): StatutDemande.ANNULEE,
    (StatutDemande.EN_INSTRUCTION, "soumettre"): StatutDemande.EN_VALIDATION,
    (StatutDemande.EN_VALIDATION, "demander_corrections"): StatutDemande.EN_INSTRUCTION,
    (StatutDemande.EN_VALIDATION, "approuver"): StatutDemande.VALIDEE,
    (StatutDemande.EN_VALIDATION, "rejeter"): StatutDemande.REJETEE,
    (StatutDemande.VALIDEE, "signer"): StatutDemande.SIGNEE,
    (StatutDemande.SIGNEE, "archiver"): StatutDemande.ARCHIVEE,
}

ACTION_ROLES: dict[str, set[Role]] = {
    "prendre_en_charge": {Role.AGENT},
    "annuler": {Role.CITOYEN},
    "soumettre": {Role.AGENT},
    "demander_corrections": {Role.VALIDATEUR},
    "approuver": {Role.VALIDATEUR},
    "rejeter": {Role.VALIDATEUR},
    "signer": {Role.VALIDATEUR},
    "archiver": set(),
}

FINAL_STATES = {
    StatutDemande.ARCHIVEE,
    StatutDemande.REJETEE,
    StatutDemande.ANNULEE,
}


def can_transition(current: StatutDemande, action: str) -> bool:
    """Indique si la transition existe dans la table."""

    return (current, action) in TRANSITIONS


def allowed_actions(current: StatutDemande) -> list[str]:
    return [action for (statut, action) in TRANSITIONS if statut == current]


def assert_transition(current: StatutDemande, action: str, actor: User) -> StatutDemande:
    """Vérifie l'état et le rôle, puis retourne l'état cible."""

    target = TRANSITIONS.get((current, action))
    if target is None:
        raise AppError(
            f"Transition '{action}' impossible depuis l'état '{current.value}'.",
            status_code=409,
            code="INVALID_TRANSITION",
        )
    if actor.role not in ACTION_ROLES[action]:
        raise AppError(
            "Votre rôle ne permet pas cette action.",
            status_code=403,
            code="FORBIDDEN",
        )
    return target


def apply_transition(
    session: Session,
    demande: Demande,
    action: str,
    actor: User,
    payload: dict[str, Any] | None = None,
) -> Demande:
    """Verrouille et applique une transition dans la transaction courante."""

    if demande.id is None:
        raise AppError("La demande n'est pas persistée.", status_code=409, code="INVALID_STATE")

    statement = select(Demande).where(Demande.id == demande.id).with_for_update()
    locked = session.exec(statement).first()
    if locked is None:
        raise AppError("Demande introuvable.", status_code=404, code="NOT_FOUND")

    previous_statut = locked.statut
    target = assert_transition(previous_statut, action, actor)
    values = payload or {}

    locked.statut = target
    if action == "prendre_en_charge":
        locked.assigned_agent_id = actor.id
        locked.branch_name = str(values.get("branch_name") or "") or None
    elif action == "annuler":
        locked.assigned_agent_id = None
    elif action == "demander_corrections":
        locked.complement_attendu = True
        locked.complement_message = str(values.get("comment") or values.get("message") or "")
    elif action == "approuver":
        locked.assigned_validator_id = actor.id
    elif action == "rejeter":
        locked.rejection_reason = str(values.get("comment") or "") or None
    elif action == "signer":
        locked.signed_by_id = actor.id
        locked.assigned_validator_id = actor.id

    session.add(locked)
    audit_service.record(
        session,
        action=f"demande.{action}",
        actor_id=actor.id,
        demande_id=locked.id,
        details={"from": previous_statut.value, "to": target.value, **values},
    )

    job_type_by_action = {
        "prendre_en_charge": JobType.GITHUB_PROVISION_DEMANDE,
        "annuler": JobType.NOTIFICATION_CREATE,
        "soumettre": JobType.GITHUB_OPEN_PR,
        "demander_corrections": JobType.NOTIFICATION_CREATE,
        "approuver": JobType.NOTIFICATION_CREATE,
        "rejeter": JobType.NOTIFICATION_CREATE,
        "signer": JobType.GITHUB_MERGE_PR,
        "archiver": JobType.GITHUB_ARCHIVE,
    }
    outbox_service.enqueue(
        session,
        job_type_by_action[action],
        {"demande_id": locked.id, "action": action, **values},
    )
    session.flush()
    return locked
