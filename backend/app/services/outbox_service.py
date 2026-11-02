"""Outbox : file de jobs persistante.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
TODO :
  [ ] Remplacer le claim simple par `FOR UPDATE SKIP LOCKED`.
  [ ] Ajouter un identifiant de worker et un heartbeat.
  [ ] Ajouter la purge des jobs terminés.
"""

from datetime import timedelta
from typing import Any

from sqlmodel import Session, select

from app.models import JobType, OutboxJob, OutboxStatus
from app.models.base import utcnow

MAX_ATTEMPTS = 5


def enqueue(
    session: Session,
    job_type: JobType | str,
    payload: dict[str, Any],
    *,
    run_at=None,
) -> OutboxJob:
    """Ajoute un job dans la transaction courante."""

    job = OutboxJob(
        job_type=job_type.value if isinstance(job_type, JobType) else job_type,
        payload=payload,
        run_at=run_at or utcnow(),
    )
    session.add(job)
    session.flush()
    return job


def claim_next_job(session: Session, worker_id: str) -> OutboxJob | None:
    """Réclame le prochain job disponible.

    Version MVP mono-worker. Le TODO est le verrouillage PostgreSQL.
    """

    statement = (
        select(OutboxJob)
        .where(OutboxJob.status == OutboxStatus.PENDING)
        .where(OutboxJob.run_at <= utcnow())
        .order_by(OutboxJob.run_at)  # type: ignore[arg-type]
        .limit(1)
    )
    job = session.exec(statement).first()
    if job is None:
        return None

    job.status = OutboxStatus.PROCESSING
    job.attempts += 1
    job.locked_at = utcnow()
    job.locked_by = worker_id
    job.updated_at = utcnow()
    session.add(job)
    session.commit()
    session.refresh(job)
    return job


def mark_done(session: Session, job: OutboxJob) -> None:
    """Marque un job comme terminé."""

    job.status = OutboxStatus.DONE
    job.last_error = None
    job.locked_at = None
    job.locked_by = None
    job.updated_at = utcnow()
    session.add(job)
    session.commit()


def mark_failed(session: Session, job: OutboxJob, error: str) -> None:
    """Replanifie ou échoue un job après erreur."""

    job.last_error = error[:2000]
    job.locked_at = None
    job.locked_by = None
    job.updated_at = utcnow()
    if job.attempts >= MAX_ATTEMPTS:
        job.status = OutboxStatus.FAILED
    else:
        job.status = OutboxStatus.PENDING
        delay = min(300, 5 * (2 ** max(job.attempts - 1, 0)))
        job.run_at = utcnow() + timedelta(seconds=delay)
    session.add(job)
    session.commit()
