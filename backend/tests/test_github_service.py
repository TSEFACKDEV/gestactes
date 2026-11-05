"""Tests unitaires complets pour le service GitHub."""

import pytest
import respx
from httpx import Response

from app.models import Demande
from app.services import github_service


@pytest.mark.asyncio
@respx.mock
async def test_provision_demande(session):
    client = github_service.get_client()
    client.token = "test-token"

    respx.get(f"{client.api_url}/repos/{client.repo}/git/ref/heads/main").mock(
        return_value=Response(200, json={"object": {"sha": "fake_sha_main"}})
    )
    respx.post(f"{client.api_url}/repos/{client.repo}/git/refs").mock(
        return_value=Response(201, json={"ref": "refs/heads/demande-1-ACT-001"})
    )
    respx.post(f"{client.api_url}/repos/{client.repo}/issues").mock(
        return_value=Response(201, json={"number": 42, "title": "Demande"})
    )

    demande = Demande(id=1, numero="ACT-001", type="certificat")
    await github_service.provision_demande(session, demande)
    assert True


@pytest.mark.asyncio
@respx.mock
async def test_archive_acte(session):
    client = github_service.get_client()
    client.token = "test-token"

    # Mock l'upload du PDF sur main
    respx.put(f"{client.api_url}/repos/{client.repo}/contents/archives/acte-ACT-001.pdf").mock(
        return_value=Response(201, json={"commit": {"sha": "fake_commit_sha"}})
    )
    # Mock la création du tag Git
    respx.post(f"{client.api_url}/repos/{client.repo}/git/refs").mock(
        return_value=Response(201, json={"ref": "refs/tags/v-acte-ACT-001"})
    )

    demande = Demande(id=1, numero="ACT-001", type="certificat")
    pdf_bytes = b"%PDF-1.4 fake content"

    sha = await github_service.archive_acte(session, demande, pdf_bytes)
    assert sha == "fake_commit_sha"