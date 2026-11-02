"""Traitement des jobs de l'outbox.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
TODO :
  [ ] Brancher tous les jobs GitHub.
  [ ] Rendre chaque handler idempotent.
  [ ] Ajouter les métriques et les alertes.
"""

import logging

from sqlmodel import Session

from app.models import Demande, JobType, OutboxJob
from app.schemas.acte import ActeContent, SignatureManifest
from app.services import github_service, notification_service, pdf_service

logger = logging.getLogger("gestactes")


def _demande(session: Session, payload: dict) -> Demande:
    demande_id = payload.get("demande_id")
    if demande_id is None:
        raise ValueError("Payload sans demande_id.")
    demande = session.get(Demande, int(demande_id))
    if demande is None:
        raise ValueError(f"Demande {demande_id} introuvable.")
    return demande


async def handle_job(session: Session, job: OutboxJob) -> None:
    """Exécute un job selon son type."""

    payload = job.payload

    if job.job_type == JobType.EMAIL_SEND.value:
        notification_service.send_email(
            to=payload["to"],
            subject=payload["subject"],
            body=payload["body"],
        )
        return

    if job.job_type == JobType.NOTIFICATION_CREATE.value:
        notification_service.create_notification(
            session,
            user_id=int(payload["user_id"]),
            title=payload["title"],
            message=payload["message"],
            demande_id=payload.get("demande_id"),
        )
        return

    if job.job_type == JobType.GITHUB_PROVISION_DEMANDE.value:
        await github_service.provision_demande(session, _demande(session, payload))
        return

    if job.job_type == JobType.GITHUB_COMMIT_ACTE.value:
        await github_service.commit_acte(
            session,
            _demande(session, payload),
            payload.get("message", "instruction"),
        )
        return

    if job.job_type == JobType.GITHUB_OPEN_PR.value:
        await github_service.open_validation_pr(session, _demande(session, payload))
        return

    if job.job_type == JobType.GITHUB_MERGE_PR.value:
        demande = _demande(session, payload)
        manifest = SignatureManifest.model_validate(demande.signature_manifest or {})
        await github_service.merge_signature(session, demande, manifest)
        return

    if job.job_type == JobType.GITHUB_ARCHIVE.value:
        demande = _demande(session, payload)
        acte_json, acte_md = await github_service.get_acte_content(session, demande)
        acte = ActeContent.model_validate(acte_json)
        manifest = SignatureManifest.model_validate(demande.signature_manifest or {})
        pdf_bytes = pdf_service.generate_pdf(acte, acte_md, manifest)
        await github_service.archive_acte(session, demande, pdf_bytes)
        return

    if job.job_type == JobType.PDF_GENERATE.value:
        demande = _demande(session, payload)
        acte_json, acte_md = await github_service.get_acte_content(session, demande)
        acte = ActeContent.model_validate(acte_json)
        manifest = SignatureManifest.model_validate(demande.signature_manifest or {})
        pdf_bytes = pdf_service.generate_pdf(acte, acte_md, manifest)
        await github_service.archive_acte(session, demande, pdf_bytes)
        return

    raise ValueError(f"Type de job inconnu : {job.job_type}")
