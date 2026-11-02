"""Réception des webhooks GitHub.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
TODO :
  [ ] Traiter les événements `issues`, `pull_request`, `pull_request_review`.
  [ ] Enfiler un job idempotent après insertion.
  [ ] Tester la signature invalide et le rejeu.
"""

import hashlib
import hmac
import json

from fastapi import APIRouter, Header, Request, Response, status
from sqlmodel import select

from app.core.config import settings
from app.core.deps import SessionDep
from app.core.errors import AppError
from app.models import WebhookEvent
from app.schemas.github import WebhookResponse

router = APIRouter()


@router.post(
    "/github",
    response_model=WebhookResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def github_webhook(
    request: Request,
    response: Response,
    session: SessionDep,
    x_github_event: str | None = Header(default=None, alias="X-GitHub-Event"),
    x_github_delivery: str | None = Header(default=None, alias="X-GitHub-Delivery"),
    x_hub_signature_256: str | None = Header(
        default=None, alias="X-Hub-Signature-256"
    ),
) -> WebhookResponse:
    """Vérifie la signature HMAC et enregistre l'événement."""

    if not x_github_delivery:
        raise AppError(
            "En-tête X-GitHub-Delivery manquant.",
            status_code=400,
            code="MISSING_DELIVERY_ID",
        )
    if not x_hub_signature_256:
        raise AppError(
            "Signature GitHub manquante.",
            status_code=401,
            code="MISSING_SIGNATURE",
        )

    body = await request.body()
    expected = "sha256=" + hmac.new(
        settings.github_webhook_secret.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, x_hub_signature_256):
        raise AppError(
            "Signature GitHub invalide.",
            status_code=401,
            code="INVALID_SIGNATURE",
        )

    existing = session.exec(
        select(WebhookEvent).where(WebhookEvent.delivery_id == x_github_delivery)
    ).first()
    if existing is not None:
        response.status_code = status.HTTP_200_OK
        return WebhookResponse(status="ignored", delivery_id=x_github_delivery)

    try:
        payload = json.loads(body)
    except json.JSONDecodeError as exc:
        raise AppError(
            "Payload JSON invalide.",
            status_code=400,
            code="INVALID_PAYLOAD",
        ) from exc

    event = WebhookEvent(
        delivery_id=x_github_delivery,
        event=x_github_event or "unknown",
        action=payload.get("action"),
        payload=payload,
    )
    session.add(event)
    session.commit()

    # TODO NOLACK : appeler github_service.handle_webhook ou enfiler un job.
    return WebhookResponse(status="accepted", delivery_id=x_github_delivery)
