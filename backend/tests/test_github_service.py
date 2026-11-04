"""Tests unitaires pour le service GitHub."""

import pytest
import respx
from httpx import Response

from app.models import Demande
from app.services import github_service


@pytest.mark.asyncio
@respx.mock
async def test_provision_demande(session):
    client = github_service.get_client()

    # 1. Mock la récupération de la branche source main (nécessaire pour create_branch)
    respx.get(f"{client.api_url}/repos/{client.repo}/git/ref/heads/main").mock(
        return_value=Response(200, json={"object": {"sha": "fake_sha_main"}})
    )

    # 2. Mock la création de la nouvelle branche de la demande
    respx.post(f"{client.api_url}/repos/{client.repo}/git/refs").mock(
        return_value=Response(201, json={"ref": "refs/heads/demande-1-ACT-001"})
    )

    # 3. Mock la création d'issue
    respx.post(f"{client.api_url}/repos/{client.repo}/issues").mock(
        return_value=Response(201, json={"number": 42, "title": "Demande"})
    )

    demande = Demande(id=1, numero="ACT-001", type="certificat")
    
    # Appel de la fonction à tester
    await github_service.provision_demande(session, demande)
    assert True