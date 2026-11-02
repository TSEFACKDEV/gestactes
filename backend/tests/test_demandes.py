"""Tests des demandes.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO :
  [ ] Tester la création avec pièces.
  [ ] Tester les filtres et la pagination.
  [ ] Tester l'autorisation objet.
  [ ] Tester l'annulation et les transitions.
"""

import pytest

from app.models import Role


def test_demandes_require_authentication(client):
    assert client.get("/api/v1/demandes").status_code == 401


def test_types_actes_require_authentication(client):
    assert client.get("/api/v1/types-actes").status_code == 401


def test_citizen_can_list_types(client, auth_headers, type_acte):
    response = client.get(
        "/api/v1/types-actes",
        headers=auth_headers(Role.CITOYEN),
    )
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["code"] == "attestation-residence"


@pytest.mark.skip(reason="À implémenter par NDOUNGUE")
def test_citizen_can_create_demande(client, auth_headers, type_acte):
    response = client.post(
        "/api/v1/demandes",
        headers=auth_headers(Role.CITOYEN),
        data={"payload": '{"type_code": "attestation-residence", "donnees": {}}'},
    )
    assert response.status_code == 201


@pytest.mark.skip(reason="À implémenter par NDOUNGUE")
def test_citizen_cannot_see_other_demande(client, auth_headers, type_acte):
    response = client.get(
        "/api/v1/demandes/1",
        headers=auth_headers(Role.CITOYEN),
    )
    assert response.status_code == 403
