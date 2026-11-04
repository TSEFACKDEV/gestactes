"""Schémas GitHub et webhooks.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
"""

from typing import Any
from pydantic import BaseModel, Field


class GitHubUser(BaseModel):
    id: int
    login: str


class GitHubPullRequest(BaseModel):
    id: int
    number: int
    title: str
    state: str
    merged: bool | None = None
    head: dict[str, Any]
    base: dict[str, Any]


class WebhookPayload(BaseModel):
    action: str | None = None
    pull_request: GitHubPullRequest | None = None
    issue: dict[str, Any] | None = None
    repository: dict[str, Any] | None = None
    sender: GitHubUser | None = None


class WebhookResponse(BaseModel):
    status: str
    delivery_id: str | None = None