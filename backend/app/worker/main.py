"""Worker GestActes.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
TODO :
  [ ] Ajouter un heartbeat et un arrêt propre.
  [ ] Gérer plusieurs workers avec `SKIP LOCKED`.
  [ ] Ajouter la réconciliation périodique GitHub/base.
"""

import asyncio
import logging
import os
import socket

from sqlmodel import Session

from app.core.config import settings
from app.core.logging import configure_logging
from app.db import engine, init_db
from app.services import outbox_service
from app.worker import jobs

logger = logging.getLogger("gestactes")
WORKER_ID = f"{socket.gethostname()}-{os.getpid()}"


async def _wait_for_database() -> None:
    for attempt in range(1, 11):
        try:
            init_db()
            return
        except Exception as exc:  # pragma: no cover - dépend de l'infra
            logger.warning("Base indisponible (tentative %s/10) : %s", attempt, exc)
            await asyncio.sleep(3)
    raise RuntimeError("La base de données est indisponible.")


async def run() -> None:
    configure_logging(settings.log_level)
    await _wait_for_database()
    logger.info("Worker %s démarré.", WORKER_ID)

    while True:
        with Session(engine) as session:
            job = outbox_service.claim_next_job(session, WORKER_ID)
            if job is None:
                await asyncio.sleep(2)
                continue

            try:
                await jobs.handle_job(session, job)
                outbox_service.mark_done(session, job)
                logger.info("Job %s (%s) terminé.", job.id, job.job_type)
            except Exception as exc:  # pragma: no cover - dépend des jobs
                session.rollback()
                outbox_service.mark_failed(session, job, str(exc))
                logger.exception("Job %s (%s) en échec.", job.id, job.job_type)


if __name__ == "__main__":
    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        logger.info("Worker arrêté.")
