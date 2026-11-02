"""Schémas GitHub et webhooks.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
TODO :
  [ ] Typer les payloads utiles (pull_request, issues, review).
  [ ] Documenter la vérification HMAC.
"""

from pydantic import BaseModel


class WebhookResponse(BaseModel):
    status: str
    delivery_id: str | None = None
