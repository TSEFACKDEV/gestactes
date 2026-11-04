"""Tests complets des webhooks GitHub.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
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


def test_webhook_invalid_signature(client):
    payload = {"action": "opened"}
    body = json.dumps(payload).encode("utf-8")
    headers = {
        "X-GitHub-Event": "issues",
        "X-GitHub-Delivery": "delivery-invalid-sig",
        "X-Hub-Signature-256": "sha256=invalidhash",
        "Content-Type": "application/json",
    }
    response = client.post("/api/v1/webhooks/github", content=body, headers=headers)
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


def test_webhook_issues_and_reviews(client):
    # Test événement issues
    payload_issue = {"action": "opened", "issue": {"number": 10}}
    body_issue = json.dumps(payload_issue).encode("utf-8")
    headers_issue = {
        "X-GitHub-Event": "issues",
        "X-GitHub-Delivery": "delivery-issue-1",
        "X-Hub-Signature-256": _signature(body_issue),
        "Content-Type": "application/json",
    }
    res = client.post("/api/v1/webhooks/github", content=body_issue, headers=headers_issue)
    assert res.status_code == 202

    # Test événement pull_request_review
    payload_review = {"action": "submitted", "review": {"state": "approved"}}
    body_review = json.dumps(payload_review).encode("utf-8")
    headers_review = {
        "X-GitHub-Event": "pull_request_review",
        "X-GitHub-Delivery": "delivery-review-1",
        "X-Hub-Signature-256": _signature(body_review),
        "Content-Type": "application/json",
    }
    res_rev = client.post("/api/v1/webhooks/github", content=body_review, headers=headers_review)
    assert res_rev.status_code == 202