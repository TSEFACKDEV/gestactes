"""Tests d'administration.

Propriétaire : KOUODZO ZANGUE REGINA
TODO :
  [ ] Tester la création/modification/désactivation.
  [ ] Tester le dernier administrateur.
  [ ] Tester la pagination et les filtres.
"""

from app.models import Role


def test_admin_routes_require_authentication(client):
    assert client.get("/api/v1/admin/utilisateurs").status_code == 401


def test_citizen_cannot_access_admin(client, auth_headers):
    response = client.get(
        "/api/v1/admin/utilisateurs",
        headers=auth_headers(Role.CITOYEN),
    )
    assert response.status_code == 403


def test_admin_can_list_users(client, auth_headers):
    response = client.get(
        "/api/v1/admin/utilisateurs",
        headers=auth_headers(Role.ADMIN),
    )
    assert response.status_code == 200
    assert "items" in response.json()


def test_admin_can_create_agent(client, auth_headers):
    response = client.post(
        "/api/v1/admin/utilisateurs",
        headers=auth_headers(Role.ADMIN),
        json={
            "first_name": "Nouvel",
            "last_name": "Agent",
            "email": "nouvel.agent@example.com",
            "password": "Demo1234!",
            "role": "agent",
        },
    )
    assert response.status_code == 201
    assert response.json()["role"] == "agent"


def test_admin_statistics(client, auth_headers):
    response = client.get(
        "/api/v1/admin/statistiques",
        headers=auth_headers(Role.ADMIN),
    )
    assert response.status_code == 200
    assert "total" in response.json()
