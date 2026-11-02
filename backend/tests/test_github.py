"""Tests du client GitHub.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
TODO :
  [ ] Simuler les endpoints avec respx.
  [ ] Tester les retries, 404 et 409.
  [ ] Tester l'idempotence des créations.
"""

import pytest

from app.services.github_client import GitHubClient, GitHubError


def test_unconfigured_client():
    client = GitHubClient(token="", repo="", api_url="https://api.github.com")
    assert client.configured is False


@pytest.mark.asyncio
async def test_unconfigured_client_raises():
    client = GitHubClient(token="", repo="", api_url="https://api.github.com")
    with pytest.raises(GitHubError):
        await client._request("GET", "/repos/x/y")
