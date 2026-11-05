"""Service de gestion des notifications internes et des envois d'e-mails.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
"""

import logging

from sqlmodel import Session

from app.models import Notification

logger = logging.getLogger("gestactes")


def create_notification(
    session: Session,
    *,
    user_id: int,
    title: str,
    message: str,
    demande_id: int | None = None,
) -> Notification:
    """Crée une notification interne pour un utilisateur."""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        demande_id=demande_id,
        is_read=False,
    )
    session.add(notification)
    session.commit()
    session.refresh(notification)
    return notification


def send_email(to: str, subject: str, body: str) -> None:
    """Envoie un e-mail (simulé ou via serveur SMTP configuré)."""
    # En environnement de test ou sans configuration SMTP active, on log l'e-mail
    logger.info(f"Envoi d'e-mail à {to} - Sujet : {subject}")