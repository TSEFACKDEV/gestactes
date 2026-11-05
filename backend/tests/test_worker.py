"""Tests unitaires pour le Worker et l'Outbox."""

import pytest
from sqlmodel import Session

from app.models.enums import OutboxStatus
from app.models.outbox import OutboxJob
from app.worker.jobs import handle_job


def test_outbox_job_creation():
    job = OutboxJob(job_type="test.job", payload={"foo": "bar"})
    assert job.status == OutboxStatus.PENDING
    assert job.attempts == 0


@pytest.mark.asyncio
async def test_handle_unknown_job_type(session: Session):
    """Vérifie qu'un type de job inconnu lève bien une ValueError."""
    job = OutboxJob(job_type="unknown.type", payload={})
    with pytest.raises(ValueError, match="Type de job inconnu"):
        await handle_job(session, job)