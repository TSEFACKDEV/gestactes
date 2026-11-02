"""Machine à états du workflow.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO :
  [ ] Implémenter `apply_transition` avec audit + outbox.
  [ ] Verrouiller la demande (`SELECT FOR UPDATE`) avant transition.
  [ ] Ajouter les tests de concurrence.
"""

from typing import Any

from sqlmodel import Session

from app.core.errors import AppError
from app.models import Demande, Role, StatutDemande, User

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
    """Applique une transition et ses effets.

    TODO NDOUNGUE : mettre à jour le statut, les champs, l'audit, l'outbox
    et les notifications dans une seule transaction.
    """

    raise AppError(
        "La machine à états n'est pas encore implémentée.",
        status_code=501,
        code="NOT_IMPLEMENTED",
    )
