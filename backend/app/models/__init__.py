"""Point d'entrée des modèles SQLModel.

Propriétaire : TSEFACK CALVIN KLEIN (fichier partagé, gelé).
Tout nouveau modèle doit être ajouté ici pour être créé par `init_db`.
"""

from app.models.audit import AuditEvent
from app.models.demande import Demande
from app.models.enums import JobType, OutboxStatus, Role, StatutDemande
from app.models.notification import Notification
from app.models.outbox import OutboxJob
from app.models.password_reset import PasswordResetToken
from app.models.piece import PieceJointe
from app.models.refresh_token import RefreshToken
from app.models.type_acte import TypeActe
from app.models.user import User
from app.models.webhook_event import WebhookEvent

__all__ = [
    "AuditEvent",
    "Demande",
    "JobType",
    "Notification",
    "OutboxJob",
    "OutboxStatus",
    "PasswordResetToken",
    "PieceJointe",
    "RefreshToken",
    "Role",
    "StatutDemande",
    "TypeActe",
    "User",
    "WebhookEvent",
]
