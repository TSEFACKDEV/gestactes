"""Tests du client GitHub avec respx."""

import pytest
import respx
from httpx import Response

from app.services.github_client import (
    GitHubClient,
    GitHubConflict,
    GitHubError,
)


def test_unconfigured_client():
    client = GitHubClient(token="", repo="", api_url="https://api.github.com")
    assert client.configured is False


@pytest.mark.asyncio
async def test_unconfigured_client_raises():
    client = GitHubClient(token="", repo="", api_url="https://api.github.com")
    with pytest.raises(GitHubError):
        await client._request("GET", "/repos/x/y")


@pytest.mark.asyncio
@respx.mock
async def test_get_file_success():
    client = GitHubClient(token="fake_token", repo="owner/repo", api_url="https://api.github.com")
    
    respx.get("https://api.github.com/repos/owner/repo/contents/test.txt?ref=main").mock(
        return_value=Response(200, json={"name": "test.txt", "content": "dGVzdA=="})
    )

    result = await client.get_file("test.txt")
    assert result is not None
    assert result["name"] == "test.txt"


@pytest.mark.asyncio
@respx.mock
async def test_get_file_not_found():
    client = GitHubClient(token="fake_token", repo="owner/repo", api_url="https://api.github.com")
    
    respx.get("https://api.github.com/repos/owner/repo/contents/unknown.txt?ref=main").mock(
        return_value=Response(404, json={"message": "Not Found"})
    )

    result = await client.get_file("unknown.txt")
    assert result is None


@pytest.mark.asyncio
@respx.mock
async def test_create_branch_conflict():
    client = GitHubClient(token="fake_token", repo="owner/repo", api_url="https://api.github.com")
    
    # Mock la récupération de la branche source main
    respx.get("https://api.github.com/repos/owner/repo/git/ref/heads/main").mock(
        return_value=Response(200, json={"object": {"sha": "123456"}})
    )
    # Mock la création de branche échouant par un conflit 409
    respx.post("https://api.github.com/repos/owner/repo/git/refs").mock(
        return_value=Response(409, json={"message": "Reference already exists"})
    )

    with pytest.raises(GitHubConflict):
        await client.create_branch("feature-branch")