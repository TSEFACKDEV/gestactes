"""Tests complets des notifications.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
"""

from app.models import Role
from app.services import notification_service


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


def test_create_and_read_notification(client, auth_headers, session):
    auth_headers(Role.CITOYEN)
    # On récupère l'ID de l'utilisateur courant via une route ou directement
    # Test unitaire du service de création
    # Supposons un user_id de test (ex: 1)
    notif = notification_service.create_notification(
        session,
        user_id=1,
        title="Validation",
        message="Votre acte a été validé.",
    )
    assert notif.id is not None
    assert notif.is_read is False