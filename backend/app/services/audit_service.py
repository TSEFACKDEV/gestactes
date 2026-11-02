"""Service d'audit.

Propriétaire : KOUODZO ZANGUE REGINA
TODO :
  [ ] Ajouter les filtres de consultation.
  [ ] Garantir l'append-only au niveau applicatif.
  [ ] Corréler avec les commits GitHub.
"""

from typing import Any

from sqlmodel import Session, select

from app.models import AuditEvent


def record(
    session: Session,
    action: str,
    *,
    actor_id: int | None = None,
    demande_id: int | None = None,
    details: dict[str, Any] | None = None,
    commit_sha: str | None = None,
    request_id: str | None = None,
) -> AuditEvent:
    """Écrit un événement d'audit dans la transaction courante."""

    event = AuditEvent(
        action=action,
        actor_id=actor_id,
        demande_id=demande_id,
        details=details or {},
        commit_sha=commit_sha,
        request_id=request_id,
    )
    session.add(event)
    session.flush()
    return event


def list_events(
    session: Session,
    *,
    actor_id: int | None = None,
    action: str | None = None,
    limit: int = 50,
) -> list[AuditEvent]:
    """Liste les événements, du plus récent au plus ancien.

    TODO KOUODZO : ajouter les filtres de date et la pagination.
    """

    statement = select(AuditEvent).order_by((AuditEvent.created_at).desc()).limit(limit)
    if actor_id is not None:
        statement = statement.where(AuditEvent.actor_id == actor_id)
    if action:
        statement = statement.where(AuditEvent.action == action)
    return list(session.exec(statement).all())
