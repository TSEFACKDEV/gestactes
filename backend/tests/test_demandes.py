"""Tests des demandes.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO :
  [ ] Tester la création avec pièces.
  [ ] Tester les filtres et la pagination.
  [ ] Tester l'autorisation objet.
  [ ] Tester l'annulation et les transitions.
"""

from datetime import datetime

import pytest
from pydantic import ValidationError

from app.models import Demande, Role, StatutDemande, User
from app.schemas.type_acte import TypeActeCreate


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


def test_validator_can_get_diff(client, auth_headers, type_acte, users, session):
    demande = Demande(
        numero="2026-00001",
        type_acte_id=type_acte.id or 0,
        demandeur_id=users[Role.CITOYEN].id or 0,
        statut=StatutDemande.EN_VALIDATION,
        donnees={"adresse": "12 rue des Lilas"},
        acte_md="# Attestation de résidence",
    )
    session.add(demande)
    session.commit()
    session.refresh(demande)

    response = client.get(
        f"/api/v1/demandes/{demande.id}/diff",
        headers=auth_headers(Role.VALIDATEUR),
    )
    assert response.status_code == 200
    payload = response.json()
    assert "adresse" in payload["before"]
    assert payload["after"] == "# Attestation de résidence"


def test_citizen_can_create_demande(client, auth_headers, type_acte):
    response = client.post(
        "/api/v1/demandes",
        headers=auth_headers(Role.CITOYEN),
        data={
            "payload": (
                '{"type_code":"attestation-residence",'
                '"donnees":{"adresse":"12 rue des Lilas"}}'
            )
        },
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["numero"].startswith(f"{datetime.now().year}-")


def test_citizen_cannot_see_other_demande(client, auth_headers, type_acte, users, session):
    other_citizen = User(
        email="other-citizen@test.com",
        password_hash="x",
        first_name="Other",
        last_name="Citizen",
        role=Role.CITOYEN,
    )
    session.add(other_citizen)
    session.commit()
    session.refresh(other_citizen)
    demande = Demande(
        numero="2026-00003",
        type_acte_id=type_acte.id or 0,
        demandeur_id=other_citizen.id or 0,
        statut=StatutDemande.DEMANDEE,
        donnees={"adresse": "12 rue des Lilas"},
    )
    session.add(demande)
    session.commit()
    session.refresh(demande)

    response = client.get(
        f"/api/v1/demandes/{demande.id}",
        headers=auth_headers(Role.CITOYEN),
    )
    assert response.status_code == 403


def test_form_schema_select_requires_options():
    with pytest.raises(ValidationError, match="au moins une option"):
        TypeActeCreate(
            code="type-test",
            label="Type test",
            form_schema=[{"name": "choix", "label": "Choix", "type": "select"}],
        )


def test_form_schema_rejects_duplicate_names():
    field = {"name": "adresse", "label": "Adresse", "type": "text"}
    with pytest.raises(ValidationError, match="uniques"):
        TypeActeCreate(code="type-test", label="Type test", form_schema=[field, field])


def test_form_schema_json_serialization():
    payload = TypeActeCreate(
        code="type-test",
        label="Type test",
        form_schema=[{
            "name": "choix",
            "label": "Choix",
            "type": "select",
            "options": [{"value": "oui", "label": "Oui"}],
        }],
    )
    encoded = payload.model_dump_json()
    assert '"choix"' in encoded
    assert "oui" in encoded
