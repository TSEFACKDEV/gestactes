"""Worker GestActes avec arrêt propre et boucle robuste.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
"""

import asyncio
import logging
import os
import signal
import socket

from sqlmodel import Session

from app.core.config import settings
from app.core.logging import configure_logging
from app.db import engine, init_db
from app.services import outbox_service
from app.worker import jobs

logger = logging.getLogger("gestactes")
WORKER_ID = f"{socket.gethostname()}-{os.getpid()}"

# Variable globale pour contrôler l'arrêt propre du worker
_shutdown_event = asyncio.Event()


async def _wait_for_database() -> None:
    for attempt in range(1, 11):
        try:
            init_db()
            return
        except Exception as exc:  # pragma: no cover
            logger.warning("Base indisponible (tentative %s/10) : %s", attempt, exc)
            await asyncio.sleep(3)
    raise RuntimeError("La base de données est indisponible.")


async def run() -> None:
    configure_logging(settings.log_level)
    await _wait_for_database()
    logger.info("Worker %s démarré.", WORKER_ID)

    # Gestion des signaux pour un arrêt propre (SIGINT / SIGTERM)
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _shutdown_event.set)
        except NotImplementedError:
            # Les gestionnaires de signaux peuvent ne pas être supportés sur certaines boucles Windows
            pass

    while not _shutdown_event.is_set():
        with Session(engine) as session:
            job = outbox_service.claim_next_job(session, WORKER_ID)
            if job is None:
                try:
                    # Attendre 2 secondes ou jusqu'à ce qu'un signal d'arrêt soit reçu
                    await asyncio.wait_for(_shutdown_event.wait(), timeout=2.0)
                except TimeoutError:
                    continue
                break

            try:
                await jobs.handle_job(session, job)
                outbox_service.mark_done(session, job)
                logger.info("Job %s (%s) terminé.", job.id, job.job_type)
            except Exception as exc:  # pragma: no cover
                session.rollback()
                outbox_service.mark_failed(session, job, str(exc))
                logger.exception("Job %s (%s) en échec.", job.id, job.job_type)

    logger.info("Worker %s arrêté proprement.", WORKER_ID)


if __name__ == "__main__":
    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        logger.info("Worker arrêté par interruption clavier.")