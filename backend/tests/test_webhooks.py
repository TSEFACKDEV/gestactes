"""Tests des webhooks GitHub.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
TODO :
  [ ] Tester les événements `issues` et `pull_request_review`.
  [ ] Tester le rejeu et la signature invalide.
  [ ] Tester le traitement idempotent.
"""

import hashlib
import hmac
import json

from app.core.config import settings


def _signature(body: bytes) -> str:
    return "sha256=" + hmac.new(
        settings.github_webhook_secret.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()


def test_webhook_requires_delivery_id(client):
    response = client.post("/api/v1/webhooks/github", json={})
    assert response.status_code == 400


def test_webhook_requires_signature(client):
    response = client.post(
        "/api/v1/webhooks/github",
        json={},
        headers={"X-GitHub-Event": "issues", "X-GitHub-Delivery": "d-1"},
    )
    assert response.status_code == 401


def test_webhook_accepts_valid_signature_and_is_idempotent(client):
    payload = {"action": "closed", "pull_request": {"merged": True}}
    body = json.dumps(payload).encode("utf-8")
    headers = {
        "X-GitHub-Event": "pull_request",
        "X-GitHub-Delivery": "delivery-test-1",
        "X-Hub-Signature-256": _signature(body),
        "Content-Type": "application/json",
    }

    first = client.post("/api/v1/webhooks/github", content=body, headers=headers)
    assert first.status_code == 202
    assert first.json()["status"] == "accepted"

    second = client.post("/api/v1/webhooks/github", content=body, headers=headers)
    assert second.status_code == 200
    assert second.json()["status"] == "ignored"
