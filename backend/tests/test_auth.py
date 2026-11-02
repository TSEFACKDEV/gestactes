"""Tests d'authentification.

Propriétaire : KOUODZO ZANGUE REGINA
TODO :
  [ ] Couvrir le reset de mot de passe.
  [ ] Couvrir le changement de mot de passe.
  [ ] Couvrir la révocation de toutes les sessions.
"""


def test_me_requires_authentication(client):
    assert client.get("/api/v1/auth/me").status_code == 401


def test_register_login_and_me(client):
    payload = {
        "first_name": "Awa",
        "last_name": "Ndiaye",
        "email": "awa@example.com",
        "password": "Demo1234!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    assert response.json()["email"] == "awa@example.com"

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "awa@example.com", "password": "Demo1234!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "citoyen"
    assert data["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {data['access_token']}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "awa@example.com"


def test_duplicate_email_is_rejected(client):
    payload = {
        "first_name": "Awa",
        "last_name": "Ndiaye",
        "email": "doublon@example.com",
        "password": "Demo1234!",
    }
    assert client.post("/api/v1/auth/register", json=payload).status_code == 201
    assert client.post("/api/v1/auth/register", json=payload).status_code == 409


def test_invalid_credentials(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "inconnu@example.com", "password": "Demo1234!"},
    )
    assert response.status_code == 401


def test_forgot_password_does_not_reveal_account(client):
    response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "inconnu@example.com"},
    )
    assert response.status_code == 202
