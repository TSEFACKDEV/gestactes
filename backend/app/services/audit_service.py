"""Service d'audit.

Propriétaire : KOUODZO ZANGUE REGINA
Rôle : écrire le journal d'audit (`record`) et le consulter avec filtres et
pagination (`list_events`).

Garanties :
  - append-only : ce service n'expose ni mise à jour ni suppression, et le
    modèle `AuditEvent` refuse aussi les UPDATE/DELETE passant par l'ORM ;
  - minimisation : les clés sensibles (mot de passe, token, e-mail...) sont
    retirées des `details` avant écriture ;
  - corrélation : `commit_sha` relie un événement au commit GitHub, et le
    `request_id` de la requête HTTP est ajouté automatiquement ;
  - les services font `flush`, les routes font `commit`.
"""

import hashlib
import hmac
from collections.abc import Iterable
from datetime import UTC, date, datetime, time, timedelta
from typing import Any

from sqlalchemy import func
from sqlmodel import Session, col, select

from app.core.config import settings
from app.core.logging import request_id_ctx
from app.models import AuditEvent, User

# Clés qui ne doivent jamais se retrouver dans le journal.
SENSITIVE_KEYS = frozenset(
    {
        "password",
        "new_password",
        "current_password",
        "password_hash",
        "token",
        "access_token",
        "refresh_token",
        "secret",
        "authorization",
        "email",
    }
)


def scrub_details(value: Any) -> Any:
    """Retire récursivement les clés sensibles d'un dictionnaire de détails."""

    if isinstance(value, dict):
        return {
            key: scrub_details(item)
            for key, item in value.items()
            if str(key).lower() not in SENSITIVE_KEYS
        }
    if isinstance(value, list):
        return [scrub_details(item) for item in value]
    return value


def pseudonymize(value: str) -> str:
    """Empreinte courte et non réversible d'une valeur (ex. un e-mail).

    Permet de retrouver les échecs de connexion d'une même adresse sans stocker
    l'adresse elle-même dans le journal.
    """

    digest = hmac.new(
        settings.jwt_secret.encode("utf-8"),
        value.strip().lower().encode("utf-8"),
        hashlib.sha256,
    )
    return digest.hexdigest()[:16]


def ensure_utc(value: datetime) -> datetime:
    """Retourne un datetime avec fuseau UTC.

    Une date lue sans fuseau (ancienne version de SQLModel, base sans support
    des fuseaux) est considérée comme étant en UTC.
    """

    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


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

    if request_id is None:
        current = request_id_ctx.get()
        request_id = current if current != "-" else None

    event = AuditEvent(
        action=action,
        actor_id=actor_id,
        demande_id=demande_id,
        details=scrub_details(details or {}),
        commit_sha=commit_sha,
        request_id=request_id[:64] if request_id else None,
    )
    session.add(event)
    session.flush()
    return event


def list_events(
    session: Session,
    *,
    actor_id: int | None = None,
    action: str | None = None,
    demande_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[AuditEvent], int]:
    """Liste les événements, du plus récent au plus ancien, avec le total.

    `date_from` et `date_to` sont inclusives et interprétées en UTC.
    """

    conditions: list[Any] = []
    if actor_id is not None:
        conditions.append(AuditEvent.actor_id == actor_id)
    if action:
        conditions.append(AuditEvent.action == action)
    if demande_id is not None:
        conditions.append(AuditEvent.demande_id == demande_id)
    if date_from is not None:
        conditions.append(
            AuditEvent.created_at >= datetime.combine(date_from, time.min, tzinfo=UTC)
        )
    if date_to is not None:
        conditions.append(
            AuditEvent.created_at
            < datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=UTC)
        )

    count_statement = select(func.count()).select_from(AuditEvent)
    statement = select(AuditEvent).order_by(
        col(AuditEvent.created_at).desc(),
        col(AuditEvent.id).desc(),
    )
    for condition in conditions:
        count_statement = count_statement.where(condition)
        statement = statement.where(condition)

    total = int(session.exec(count_statement).one())
    events = list(session.exec(statement.offset((page - 1) * page_size).limit(page_size)).all())
    return events, total


def load_actors(session: Session, events: Iterable[AuditEvent]) -> dict[int, User]:
    """Charge en une seule requête les acteurs d'une liste d'événements."""

    actor_ids = {event.actor_id for event in events if event.actor_id is not None}
    if not actor_ids:
        return {}
    users = session.exec(select(User).where(col(User.id).in_(actor_ids))).all()
    return {user.id: user for user in users if user.id is not None}


def count_events(
    session: Session,
    action: str,
    *,
    subject: str,
    since: datetime,
) -> int:
    """Compte les événements d'une action pour un sujet pseudonymisé depuis `since`."""

    statement = (
        select(func.count())
        .select_from(AuditEvent)
        .where(
            AuditEvent.action == action,
            AuditEvent.created_at >= ensure_utc(since),
            AuditEvent.details["subject"].as_string() == subject,  # type: ignore[index]
        )
    )
    return int(session.exec(statement).one())


def last_event_at(
    session: Session,
    action: str,
    *,
    subject: str,
    since: datetime,
) -> datetime | None:
    """Date (UTC naïve) du dernier événement d'une action pour un sujet."""

    statement = select(func.max(AuditEvent.created_at)).where(
        AuditEvent.action == action,
        AuditEvent.created_at >= ensure_utc(since),
        AuditEvent.details["subject"].as_string() == subject,  # type: ignore[index]
    )
    latest = session.exec(statement).one()
    return ensure_utc(latest) if latest is not None else None
