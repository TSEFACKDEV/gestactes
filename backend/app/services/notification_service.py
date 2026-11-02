"""Notifications internes et e-mails.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
TODO :
  [ ] Utiliser un client SMTP async ou un pool.
  [ ] Ajouter les templates d'e-mail HTML.
  [ ] Gérer l'authentification et TLS en production.
  [ ] Tester avec Mailpit.
"""

import logging
import smtplib
from email.message import EmailMessage

from sqlmodel import Session

from app.core.config import settings
from app.models import Demande, JobType, Notification, User
from app.services import outbox_service

logger = logging.getLogger("gestactes")


def create_notification(
    session: Session,
    *,
    user_id: int,
    title: str,
    message: str,
    demande_id: int | None = None,
) -> Notification:
    """Crée une notification interne."""

    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        demande_id=demande_id,
    )
    session.add(notification)
    session.flush()
    return notification


def send_email(to: str, subject: str, body: str) -> None:
    """Envoie un e-mail simple via SMTP.

    En développement, Mailpit capture le message sur le port 1025.
    """

    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
            smtp.send_message(message)
    except OSError as exc:
        logger.warning("Envoi SMTP impossible vers %s : %s", to, exc)
        raise


def notify_status_change(
    session: Session,
    *,
    demande: Demande,
    user: User,
    title: str,
    message: str,
) -> None:
    """Crée la notification interne et planifie l'e-mail."""

    create_notification(
        session,
        user_id=user.id or 0,
        title=title,
        message=message,
        demande_id=demande.id,
    )
    outbox_service.enqueue(
        session,
        JobType.EMAIL_SEND,
        {
            "to": user.email,
            "subject": title,
            "body": message,
            "demande_id": demande.id,
        },
    )
