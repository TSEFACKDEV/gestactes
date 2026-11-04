"""Tests d'authentification.

Propriétaire : KOUODZO ZANGUE REGINA
Couvre : inscription, connexion, verrouillage, refresh (rotation, rejeu),
déconnexion, profil, mot de passe oublié, reset, changement de mot de passe,
audit des événements de sécurité.
"""

import re
from datetime import timedelta

from sqlmodel import select

from app.core.config import settings
from app.core.security import utcnow
from app.models import AuditEvent, OutboxJob, PasswordResetToken, RefreshToken, Role, User
from app.models.user import normalize_email
from app.services import audit_service, auth_service

API = "/api/v1/auth"
COOKIE = settings.refresh_cookie_name

VALID = {
    "first_name": "Awa",
    "last_name": "Ndiaye",
    "email": "awa@example.com",
    "password": "Demo1234!",
}


# --------------------------------------------------------------------------- #
# Aides
# --------------------------------------------------------------------------- #


def register(client, **overrides):
    return client.post(f"{API}/register", json={**VALID, **overrides})


def login(client, email="awa@example.com", password="Demo1234!"):
    return client.post(f"{API}/login", json={"email": email, "password": password})


def refresh_cookie(response) -> str:
    token = response.cookies.get(COOKIE)
    assert token, "le cookie de refresh doit être posé"
    return token


def use_refresh_token(client, token: str) -> None:
    """Simule un navigateur qui présente ce refresh token."""

    client.cookies.clear()
    client.cookies.set(COOKIE, token, path=settings.refresh_cookie_path)


def bearer(login_response) -> dict[str, str]:
    return {"Authorization": f"Bearer {login_response.json()['access_token']}"}


def reset_token_from_outbox(session) -> str:
    """Récupère le token de reset du dernier e-mail planifié."""

    jobs = session.exec(select(OutboxJob).where(OutboxJob.job_type == "email.send")).all()
    assert jobs, "un e-mail de reset aurait dû être planifié"
    match = re.search(r"token=([\w-]+)", jobs[-1].payload["body"])
    assert match
    return match.group(1)


def audit_actions(session) -> list[str]:
    return [e.action for e in session.exec(select(AuditEvent).order_by(AuditEvent.id)).all()]


# --------------------------------------------------------------------------- #
# Inscription
# --------------------------------------------------------------------------- #


def test_me_requires_authentication(client):
    assert client.get(f"{API}/me").status_code == 401


def test_register_login_and_me(client):
    response = register(client)
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "awa@example.com"
    assert body["role"] == "citoyen"
    assert "password" not in body and "password_hash" not in body

    response = login(client)
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "citoyen"
    assert data["access_token"]
    assert data["expires_in"] == settings.access_token_minutes * 60

    response = client.get(f"{API}/me", headers=bearer(response))
    assert response.status_code == 200
    assert response.json()["email"] == "awa@example.com"


def test_register_normalizes_email_and_names(client):
    response = register(client, email="  Awa@Example.COM ", first_name="  Awa   Marie ")
    assert response.status_code == 201
    assert response.json()["email"] == "awa@example.com"
    assert response.json()["first_name"] == "Awa Marie"
    # La connexion fonctionne quelle que soit la casse saisie.
    assert login(client, email="AWA@example.com").status_code == 200


def test_duplicate_email_is_rejected_case_insensitive(client):
    assert register(client).status_code == 201
    assert register(client).status_code == 409
    response = register(client, email="AWA@EXAMPLE.COM")
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "EMAIL_ALREADY_USED"


def test_register_race_on_unique_email_returns_409(client, monkeypatch):
    assert register(client).status_code == 201
    # Simule une inscription simultanée : la vérification préalable ne voit rien,
    # c'est la contrainte d'unicité de la base qui protège.
    monkeypatch.setattr(auth_service, "get_user_by_email", lambda *_: None)
    response = register(client)
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "EMAIL_ALREADY_USED"


def test_password_policy_is_enforced(client):
    assert register(client, password="court1").status_code == 422
    # bcrypt ignore tout ce qui dépasse 72 octets : on refuse plutôt que tronquer.
    assert register(client, password="a1" * 40).status_code == 422
    assert register(client, first_name="   ").status_code == 422
    assert register(client, first_name="1234").status_code == 422
    assert register(client, email="pas-un-email").status_code == 422


def test_user_model_normalizes_email(session):
    user = User(email="  MiXed@Case.COM ", password_hash="x", first_name="A", last_name="B")
    session.add(user)
    session.commit()
    session.refresh(user)
    assert user.email == "mixed@case.com"

    user.email = "  AUTRE@Case.COM"
    session.add(user)
    session.commit()
    session.refresh(user)
    assert user.email == "autre@case.com"
    assert normalize_email(" X@Y.Z ") == "x@y.z"


# --------------------------------------------------------------------------- #
# Connexion
# --------------------------------------------------------------------------- #


def test_invalid_credentials(client):
    response = login(client, email="inconnu@example.com")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_unknown_email_and_wrong_password_look_identical(client):
    register(client)
    unknown = login(client, email="inconnu@example.com", password="Demo1234!")
    wrong = login(client, password="MauvaisMdp1")
    assert unknown.status_code == wrong.status_code == 401
    assert unknown.json()["error"]["code"] == wrong.json()["error"]["code"]
    assert unknown.json()["error"]["message"] == wrong.json()["error"]["message"]


def test_login_sets_httponly_refresh_cookie(client):
    register(client)
    response = login(client)
    set_cookie = response.headers["set-cookie"].lower()
    assert COOKIE in set_cookie
    assert "httponly" in set_cookie
    assert f"path={settings.refresh_cookie_path}" in set_cookie
    # Le token n'est jamais renvoyé dans le corps JSON.
    assert refresh_cookie(response) not in str(response.json())


def test_refresh_token_is_stored_hashed(client, session):
    register(client)
    raw = refresh_cookie(login(client))
    hashes = [t.token_hash for t in session.exec(select(RefreshToken)).all()]
    assert raw not in hashes
    assert len(hashes) == 1 and len(hashes[0]) == 64


def test_disabled_account_gets_403(client, session):
    register(client)
    user = session.exec(select(User)).one()
    user.is_active = False
    session.add(user)
    session.commit()

    response = login(client)
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "ACCOUNT_DISABLED"
    assert "auth.login.blocked" in audit_actions(session)


def test_login_is_locked_after_too_many_failures(client, session):
    register(client)
    for _ in range(auth_service.MAX_FAILED_LOGINS):
        assert login(client, password="Mauvais123").status_code == 401

    # Même avec le bon mot de passe, le compte est verrouillé temporairement.
    response = login(client)
    assert response.status_code == 429
    error = response.json()["error"]
    assert error["code"] == "RATE_LIMITED"
    assert int(error["details"]["retry_after_seconds"]) > 0


def test_lock_counts_only_failures_since_last_success(client):
    register(client)
    for _ in range(auth_service.MAX_FAILED_LOGINS - 1):
        assert login(client, password="Mauvais123").status_code == 401
    assert login(client).status_code == 200  # un succès remet le compteur à zéro
    for _ in range(auth_service.MAX_FAILED_LOGINS - 1):
        assert login(client, password="Mauvais123").status_code == 401
    assert login(client).status_code == 200


def test_lockout_expires_after_window(client, session):
    register(client)
    for _ in range(auth_service.MAX_FAILED_LOGINS):
        login(client, password="Mauvais123")
    assert login(client).status_code == 429

    # On vieillit les échecs au-delà de la fenêtre de verrouillage.
    old = utcnow() - auth_service.LOCKOUT_WINDOW - timedelta(minutes=1)
    for event in session.exec(select(AuditEvent)).all():
        session.connection().exec_driver_sql(
            "UPDATE audit_events SET created_at = ? WHERE id = ?",
            (old.strftime("%Y-%m-%d %H:%M:%S.%f"), event.id),
        )
    session.commit()
    session.expire_all()

    assert login(client).status_code == 200


def test_security_events_are_audited_without_personal_data(client, session):
    register(client)
    login(client, password="Mauvais123")
    login(client)

    actions = audit_actions(session)
    assert actions == ["auth.register", "auth.login.failed", "auth.login.success"]

    for event in session.exec(select(AuditEvent)).all():
        flat = str(event.details).lower()
        assert "awa@example.com" not in flat
        assert "demo1234" not in flat and "mauvais123" not in flat
    failed = session.exec(select(AuditEvent).where(AuditEvent.action == "auth.login.failed")).one()
    assert failed.details["subject"] == audit_service.pseudonymize("awa@example.com")


def test_pseudonymize_is_stable_and_not_the_email():
    first = audit_service.pseudonymize("Awa@Example.com ")
    assert first == audit_service.pseudonymize("awa@example.com")
    assert "awa" not in first
    assert first != audit_service.pseudonymize("autre@example.com")


# --------------------------------------------------------------------------- #
# Refresh, rotation, rejeu, déconnexion
# --------------------------------------------------------------------------- #


def test_refresh_without_cookie_is_401(client):
    response = client.post(f"{API}/refresh")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "MISSING_REFRESH_TOKEN"


def test_refresh_rotates_the_token(client):
    register(client)
    first = refresh_cookie(login(client))

    use_refresh_token(client, first)
    response = client.post(f"{API}/refresh")
    assert response.status_code == 200
    second = refresh_cookie(response)
    assert second != first
    assert response.json()["access_token"]

    # L'ancien token est consommé.
    use_refresh_token(client, first)
    assert client.post(f"{API}/refresh").status_code == 401

    # Le nouveau fonctionne.
    use_refresh_token(client, second)
    assert client.post(f"{API}/refresh").status_code == 200


def test_unknown_refresh_token_is_401(client):
    use_refresh_token(client, "n-importe-quoi")
    response = client.post(f"{API}/refresh")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_REFRESH_TOKEN"


def test_expired_refresh_token_is_401(client, session):
    register(client)
    token = refresh_cookie(login(client))
    stored = session.exec(select(RefreshToken)).one()
    stored.expires_at = utcnow() - timedelta(minutes=1)
    session.add(stored)
    session.commit()

    use_refresh_token(client, token)
    assert client.post(f"{API}/refresh").status_code == 401


def test_double_refresh_within_grace_does_not_kill_sessions(client):
    """Deux onglets qui renouvellent ensemble ne doivent pas se déconnecter."""

    register(client)
    first = refresh_cookie(login(client))

    use_refresh_token(client, first)
    second = refresh_cookie(client.post(f"{API}/refresh"))

    use_refresh_token(client, first)  # le second onglet rejoue le même token
    assert client.post(f"{API}/refresh").status_code == 401

    use_refresh_token(client, second)  # mais la session valide survit
    assert client.post(f"{API}/refresh").status_code == 200


def test_replay_of_old_refresh_token_revokes_every_session(client, session):
    register(client)
    other_device = refresh_cookie(login(client))
    first = refresh_cookie(login(client))

    use_refresh_token(client, first)
    second = refresh_cookie(client.post(f"{API}/refresh"))

    # On vieillit la révocation pour sortir du délai de grâce.
    for token in session.exec(select(RefreshToken)).all():
        if token.revoked_at is not None:
            token.revoked_at = utcnow() - timedelta(minutes=5)
            session.add(token)
    session.commit()

    use_refresh_token(client, first)  # rejeu : vol probable
    assert client.post(f"{API}/refresh").status_code == 401

    for token in (second, other_device):
        use_refresh_token(client, token)
        assert client.post(f"{API}/refresh").status_code == 401, (
            "toutes les sessions sont révoquées"
        )
    assert "auth.refresh.reuse_detected" in audit_actions(session)


def test_logout_revokes_the_session(client, session):
    register(client)
    token = refresh_cookie(login(client))

    use_refresh_token(client, token)
    assert client.post(f"{API}/logout").status_code == 204

    use_refresh_token(client, token)
    assert client.post(f"{API}/refresh").status_code == 401
    assert "auth.logout" in audit_actions(session)


def test_logout_without_cookie_is_still_204(client):
    assert client.post(f"{API}/logout").status_code == 204


def test_refresh_fails_when_account_is_disabled(client, session):
    register(client)
    token = refresh_cookie(login(client))
    user = session.exec(select(User)).one()
    user.is_active = False
    session.add(user)
    session.commit()

    use_refresh_token(client, token)
    assert client.post(f"{API}/refresh").status_code == 401


def test_purge_expired_tokens(client, session):
    register(client)
    login(client)
    login(client)
    tokens = session.exec(select(RefreshToken)).all()
    tokens[0].expires_at = utcnow() - auth_service.EXPIRED_TOKEN_RETENTION - timedelta(days=1)
    session.add(tokens[0])
    session.commit()

    assert auth_service.purge_expired_tokens(session) == 1
    session.commit()
    assert len(session.exec(select(RefreshToken)).all()) == 1


# --------------------------------------------------------------------------- #
# Profil
# --------------------------------------------------------------------------- #


def test_update_profile(client, session):
    register(client)
    headers = bearer(login(client))

    response = client.patch(
        f"{API}/me", headers=headers, json={"first_name": " Awa ", "last_name": "Diop"}
    )
    assert response.status_code == 200
    assert response.json()["first_name"] == "Awa"
    assert response.json()["last_name"] == "Diop"
    assert "auth.profile.update" in audit_actions(session)


def test_update_profile_ignores_null_and_empty_body(client):
    register(client)
    headers = bearer(login(client))

    # Un null ne doit pas écraser le nom (colonne NOT NULL) ni provoquer d'erreur 500.
    response = client.patch(f"{API}/me", headers=headers, json={"first_name": None})
    assert response.status_code == 200
    assert response.json()["first_name"] == "Awa"
    assert client.patch(f"{API}/me", headers=headers, json={}).status_code == 200


def test_update_profile_rejects_blank_name(client):
    register(client)
    headers = bearer(login(client))
    assert client.patch(f"{API}/me", headers=headers, json={"first_name": "  "}).status_code == 422


def test_profile_cannot_change_role_or_email(client):
    register(client)
    headers = bearer(login(client))
    client.patch(f"{API}/me", headers=headers, json={"role": "admin", "email": "x@y.zz"})
    me = client.get(f"{API}/me", headers=headers).json()
    assert me["role"] == "citoyen"
    assert me["email"] == "awa@example.com"


# --------------------------------------------------------------------------- #
# Mot de passe oublié et reset
# --------------------------------------------------------------------------- #


def test_forgot_password_does_not_reveal_account(client, session):
    register(client)
    unknown = client.post(f"{API}/forgot-password", json={"email": "inconnu@example.com"})
    assert unknown.status_code == 202
    assert session.exec(select(OutboxJob)).all() == []

    known = client.post(f"{API}/forgot-password", json={"email": "awa@example.com"})
    assert known.status_code == 202
    assert known.json() == unknown.json()  # réponse strictement identique
    assert len(session.exec(select(OutboxJob)).all()) == 1


def test_forgot_password_stores_only_a_hash(client, session):
    register(client)
    client.post(f"{API}/forgot-password", json={"email": "awa@example.com"})
    raw = reset_token_from_outbox(session)
    stored = session.exec(select(PasswordResetToken)).one()
    assert stored.token_hash != raw and len(stored.token_hash) == 64
    window = stored.expires_at - stored.created_at
    assert timedelta(minutes=29) < window <= timedelta(minutes=31)


def test_forgot_password_is_throttled_silently(client, session):
    register(client)
    for _ in range(auth_service.MAX_RESET_REQUESTS_PER_HOUR + 2):
        response = client.post(f"{API}/forgot-password", json={"email": "awa@example.com"})
        assert response.status_code == 202
    jobs = session.exec(select(OutboxJob)).all()
    assert len(jobs) == auth_service.MAX_RESET_REQUESTS_PER_HOUR


def test_forgot_password_skips_disabled_accounts(client, session):
    register(client)
    user = session.exec(select(User)).one()
    user.is_active = False
    session.add(user)
    session.commit()
    assert (
        client.post(f"{API}/forgot-password", json={"email": "awa@example.com"}).status_code == 202
    )
    assert session.exec(select(OutboxJob)).all() == []


def test_reset_password_full_flow(client, session):
    register(client)
    old_session = refresh_cookie(login(client))
    client.post(f"{API}/forgot-password", json={"email": "awa@example.com"})
    token = reset_token_from_outbox(session)

    response = client.post(
        f"{API}/reset-password", json={"token": token, "new_password": "Nouveau1234!"}
    )
    assert response.status_code == 204

    assert login(client, password="Demo1234!").status_code == 401
    assert login(client, password="Nouveau1234!").status_code == 200

    # Toutes les anciennes sessions sont révoquées.
    use_refresh_token(client, old_session)
    assert client.post(f"{API}/refresh").status_code == 401
    assert "auth.password.reset" in audit_actions(session)


def test_reset_token_is_single_use(client, session):
    register(client)
    client.post(f"{API}/forgot-password", json={"email": "awa@example.com"})
    token = reset_token_from_outbox(session)
    body = {"token": token, "new_password": "Nouveau1234!"}

    assert client.post(f"{API}/reset-password", json=body).status_code == 204
    response = client.post(f"{API}/reset-password", json=body)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_RESET_TOKEN"


def test_reset_token_expires(client, session):
    register(client)
    client.post(f"{API}/forgot-password", json={"email": "awa@example.com"})
    token = reset_token_from_outbox(session)
    stored = session.exec(select(PasswordResetToken)).one()
    stored.expires_at = utcnow() - timedelta(minutes=1)
    session.add(stored)
    session.commit()

    response = client.post(
        f"{API}/reset-password", json={"token": token, "new_password": "Nouveau1234!"}
    )
    assert response.status_code == 400


def test_unknown_reset_token_is_400(client):
    response = client.post(
        f"{API}/reset-password",
        json={"token": "jeton-totalement-inconnu", "new_password": "Nouveau1234!"},
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_RESET_TOKEN"


def test_reset_applies_password_policy(client, session):
    register(client)
    client.post(f"{API}/forgot-password", json={"email": "awa@example.com"})
    token = reset_token_from_outbox(session)
    response = client.post(f"{API}/reset-password", json={"token": token, "new_password": "court1"})
    assert response.status_code == 422


def test_new_reset_request_invalidates_previous_link(client, session):
    register(client)
    client.post(f"{API}/forgot-password", json={"email": "awa@example.com"})
    first = reset_token_from_outbox(session)
    client.post(f"{API}/forgot-password", json={"email": "awa@example.com"})
    second = reset_token_from_outbox(session)
    assert first != second

    stale = client.post(
        f"{API}/reset-password", json={"token": first, "new_password": "Nouveau1234!"}
    )
    assert stale.status_code == 400
    fresh = client.post(
        f"{API}/reset-password", json={"token": second, "new_password": "Nouveau1234!"}
    )
    assert fresh.status_code == 204


def test_reset_is_refused_for_disabled_account(client, session):
    register(client)
    client.post(f"{API}/forgot-password", json={"email": "awa@example.com"})
    token = reset_token_from_outbox(session)
    user = session.exec(select(User)).one()
    user.is_active = False
    session.add(user)
    session.commit()

    response = client.post(
        f"{API}/reset-password", json={"token": token, "new_password": "Nouveau1234!"}
    )
    assert response.status_code == 400


# --------------------------------------------------------------------------- #
# Changement de mot de passe
# --------------------------------------------------------------------------- #


def test_change_password_requires_authentication(client):
    response = client.post(
        f"{API}/change-password",
        json={"current_password": "Demo1234!", "new_password": "Nouveau1234!"},
    )
    assert response.status_code == 401


def test_change_password_rejects_wrong_current_password(client):
    register(client)
    headers = bearer(login(client))
    response = client.post(
        f"{API}/change-password",
        headers=headers,
        json={"current_password": "Mauvais123", "new_password": "Nouveau1234!"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_change_password_rejects_same_password(client):
    register(client)
    headers = bearer(login(client))
    response = client.post(
        f"{API}/change-password",
        headers=headers,
        json={"current_password": "Demo1234!", "new_password": "Demo1234!"},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "PASSWORD_UNCHANGED"


def test_change_password_keeps_current_session_and_revokes_others(client, session):
    register(client)
    other_device = refresh_cookie(login(client))
    current = login(client)
    current_token = refresh_cookie(current)

    use_refresh_token(client, current_token)
    response = client.post(
        f"{API}/change-password",
        headers=bearer(current),
        json={"current_password": "Demo1234!", "new_password": "Nouveau1234!"},
    )
    assert response.status_code == 204

    use_refresh_token(client, other_device)
    assert client.post(f"{API}/refresh").status_code == 401
    use_refresh_token(client, current_token)
    assert client.post(f"{API}/refresh").status_code == 200

    assert login(client, password="Demo1234!").status_code == 401
    assert login(client, password="Nouveau1234!").status_code == 200
    assert "auth.password.change" in audit_actions(session)


def test_password_hash_is_never_exposed(client, auth_headers):
    response = client.get(f"{API}/me", headers=auth_headers(Role.CITOYEN))
    assert response.status_code == 200
    assert "password" not in str(response.json()).lower()
