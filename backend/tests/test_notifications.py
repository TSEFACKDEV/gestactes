"""Tests des notifications.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
TODO :
  [ ] Tester la création à chaque transition.
  [ ] Tester le marquage lu.
  [ ] Tester le compteur non lu.
"""

from app.models import Role


def test_notifications_require_authentication(client):
    assert client.get("/api/v1/notifications").status_code == 401


def test_empty_notifications(client, auth_headers):
    response = client.get(
        "/api/v1/notifications",
        headers=auth_headers(Role.CITOYEN),
    )
    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["unread_count"] == 0
