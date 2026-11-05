"""Service de gestion de la file de jobs (outbox) avec verrouillage SKIP LOCKED et backoff.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
"""

from datetime import timedelta
from sqlmodel import Session, select

from app.models.outbox import OutboxJob
from app.models.enums import OutboxStatus
from app.models.base import utcnow


def claim_next_job(session: Session, worker_id: str) -> OutboxJob | None:
    """Réclame le prochain job disponible en utilisant FOR UPDATE SKIP LOCKED."""
    now = utcnow()
    
    # Requête pour trouver un job en attente et le verrouiller atomiquement
    statement = (
        select(OutboxJob)
        .where(OutboxJob.status == OutboxStatus.PENDING)
        .where(OutboxJob.run_at <= now)
        .with_for_update(skip_locked=True)
        .limit(1)
    )
    job = session.exec(statement).first()

    if job:
        job.status = OutboxStatus.RUNNING
        job.locked_at = now
        job.locked_by = worker_id
        job.attempts += 1
        job.updated_at = now
        session.add(job)
        session.commit()
        session.refresh(job)

    return job


def mark_done(session: Session, job: OutboxJob) -> None:
    """Marque un job comme terminé avec succès."""
    job.status = OutboxStatus.DONE
    job.locked_at = None
    job.locked_by = None
    job.updated_at = utcnow()
    session.add(job)
    session.commit()


def mark_failed(session: Session, job: OutboxJob, error_message: str) -> None:
    """Marque un job en échec et applique un backoff exponentiel pour le ré-exécuter."""
    job.last_error = error_message[:2000]
    job.locked_at = None
    job.locked_by = None
    job.updated_at = utcnow()

    # Stratégie de backoff exponentiel (2^attempts secondes avant la prochaine tentative, plafonné à 1 heure).
    max_backoff_seconds = 3600
    backoff_seconds = min(max_backoff_seconds, 2 ** job.attempts)

    job.status = OutboxStatus.PENDING
    job.run_at = utcnow() + timedelta(seconds=backoff_seconds)

    session.add(job)
    session.commit()