"""Tests d'administration.

Propriétaire : KOUODZO ZANGUE REGINA
Couvre : gestion des utilisateurs (liste, filtres, création, modification,
désactivation, protection du dernier admin et de soi-même), journal d'audit
(filtres, pagination, append-only, minimisation) et statistiques.
"""

from datetime import timedelta

import pytest
from sqlmodel import select

from app.core.config import settings
from app.core.errors import AppError
from app.core.security import hash_password, utcnow
from app.models import AuditEvent, Demande, RefreshToken, Role, StatutDemande, User
from app.models.audit import AuditImmutableError
from app.schemas.admin import AdminUserUpdate
from app.services import audit_service, stats_service, user_service

USERS = "/api/v1/admin/utilisateurs"
AUDIT = "/api/v1/admin/audit"
STATS = "/api/v1/admin/statistiques"


# --------------------------------------------------------------------------- #
# Aides
# --------------------------------------------------------------------------- #


def make_user(session, email, role=Role.AGENT, first="Jean", last="Dupont", active=True) -> User:
    user = User(
        email=email,
        password_hash=hash_password("Test1234!"),
        first_name=first,
        last_name=last,
        role=role,
        is_active=active,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def new_agent_payload(**overrides):
    return {
        "first_name": "Nouvel",
        "last_name": "Agent",
        "email": "nouvel.agent@example.com",
        "password": "Demo1234!",
        "role": "agent",
        **overrides,
    }


def actions(session) -> list[str]:
    return [e.action for e in session.exec(select(AuditEvent).order_by(AuditEvent.id)).all()]


def make_demande(session, type_acte, numero, *, statut=StatutDemande.DEMANDEE, hours=None, **kw):
    owner = session.exec(select(User)).first()
    created = kw.pop("created_at", utcnow() - timedelta(days=2))
    demande = Demande(
        numero=numero,
        type_acte_id=type_acte.id,
        demandeur_id=owner.id,
        statut=statut,
        created_at=created,
        signed_at=created + timedelta(hours=hours) if hours is not None else None,
        **kw,
    )
    session.add(demande)
    session.commit()
    return demande


# --------------------------------------------------------------------------- #
# Contrôle d'accès
# --------------------------------------------------------------------------- #


def test_admin_routes_require_authentication(client):
    assert client.get(USERS).status_code == 401
    assert client.get(AUDIT).status_code == 401
    assert client.get(STATS).status_code == 401


@pytest.mark.parametrize("role", [Role.CITOYEN, Role.AGENT, Role.VALIDATEUR])
def test_non_admin_roles_are_forbidden(client, auth_headers, role):
    for url in (USERS, AUDIT, STATS):
        assert client.get(url, headers=auth_headers(role)).status_code == 403


def test_disabled_admin_token_is_rejected(client, session, auth_headers, users):
    headers = auth_headers(Role.ADMIN)
    admin = users[Role.ADMIN]
    admin.is_active = False
    session.add(admin)
    session.commit()
    assert client.get(USERS, headers=headers).status_code == 403


# --------------------------------------------------------------------------- #
# Liste des utilisateurs
# --------------------------------------------------------------------------- #


def test_admin_can_list_users(client, auth_headers):
    response = client.get(USERS, headers=auth_headers(Role.ADMIN))
    assert response.status_code == 200
    body = response.json()
    assert {"items", "total", "page", "page_size", "pages"} <= body.keys()
    assert body["total"] == len(Role)
    assert all("password" not in str(item).lower() for item in body["items"])


def test_list_users_is_paginated(client, session, auth_headers):
    for index in range(6):
        make_user(session, f"agent{index}@example.com")
    headers = auth_headers(Role.ADMIN)

    first = client.get(USERS, headers=headers, params={"page_size": 4, "page": 1}).json()
    second = client.get(USERS, headers=headers, params={"page_size": 4, "page": 2}).json()
    assert first["total"] == second["total"] == len(Role) + 6
    assert first["pages"] == 3
    assert len(first["items"]) == 4
    ids = {item["id"] for item in first["items"]} | {item["id"] for item in second["items"]}
    assert len(ids) == 8  # aucune ligne en double entre les pages


def test_list_users_filters_by_role(client, session, auth_headers):
    make_user(session, "v2@example.com", role=Role.VALIDATEUR)
    response = client.get(USERS, headers=auth_headers(Role.ADMIN), params={"role": "validateur"})
    items = response.json()["items"]
    assert response.json()["total"] == 2
    assert {item["role"] for item in items} == {"validateur"}


def test_list_users_search_ignores_case(client, session, auth_headers):
    make_user(session, "marie.curie@example.com", first="Marie", last="Curie")
    headers = auth_headers(Role.ADMIN)
    for query in ("MARIE", "curie", "Marie.Curie@EXAMPLE"):
        items = client.get(USERS, headers=headers, params={"q": query}).json()["items"]
        assert [item["email"] for item in items] == ["marie.curie@example.com"]


def test_list_users_search_treats_wildcards_literally(client, session, auth_headers):
    make_user(session, "normal@example.com")
    headers = auth_headers(Role.ADMIN)
    assert client.get(USERS, headers=headers, params={"q": "%"}).json()["total"] == 0
    assert client.get(USERS, headers=headers, params={"q": "_"}).json()["total"] == 0


def test_list_users_rejects_bad_paging(client, auth_headers):
    headers = auth_headers(Role.ADMIN)
    assert client.get(USERS, headers=headers, params={"page": 0}).status_code == 422
    assert client.get(USERS, headers=headers, params={"page_size": 101}).status_code == 422


# --------------------------------------------------------------------------- #
# Création
# --------------------------------------------------------------------------- #


def test_admin_can_create_agent(client, auth_headers, session):
    response = client.post(USERS, headers=auth_headers(Role.ADMIN), json=new_agent_payload())
    assert response.status_code == 201
    assert response.json()["role"] == "agent"
    assert response.json()["is_active"] is True
    assert "admin.user.create" in actions(session)

    # Le compte créé peut se connecter.
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "nouvel.agent@example.com", "password": "Demo1234!"},
    )
    assert login.status_code == 200
    assert login.json()["user"]["role"] == "agent"


@pytest.mark.parametrize("role", ["validateur", "admin"])
def test_admin_can_create_other_internal_roles(client, auth_headers, role):
    response = client.post(
        USERS,
        headers=auth_headers(Role.ADMIN),
        json=new_agent_payload(role=role, email=f"{role}@example.com"),
    )
    assert response.status_code == 201
    assert response.json()["role"] == role


def test_create_user_rejects_citizen_role(client, auth_headers):
    response = client.post(
        USERS, headers=auth_headers(Role.ADMIN), json=new_agent_payload(role="citoyen")
    )
    assert response.status_code == 422


def test_create_user_duplicate_email_is_409_case_insensitive(client, auth_headers):
    headers = auth_headers(Role.ADMIN)
    assert client.post(USERS, headers=headers, json=new_agent_payload()).status_code == 201
    response = client.post(
        USERS, headers=headers, json=new_agent_payload(email="NOUVEL.AGENT@example.com")
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "EMAIL_ALREADY_USED"


def test_create_user_validates_input(client, auth_headers):
    headers = auth_headers(Role.ADMIN)
    assert (
        client.post(USERS, headers=headers, json=new_agent_payload(password="abc")).status_code
        == 422
    )
    assert client.post(USERS, headers=headers, json=new_agent_payload(email="x")).status_code == 422


# --------------------------------------------------------------------------- #
# Modification
# --------------------------------------------------------------------------- #


def test_admin_can_update_role_and_names(client, session, auth_headers):
    agent = make_user(session, "a@example.com")
    response = client.patch(
        f"{USERS}/{agent.id}",
        headers=auth_headers(Role.ADMIN),
        json={"role": "validateur", "first_name": "Paul"},
    )
    assert response.status_code == 200
    assert response.json()["role"] == "validateur"
    assert response.json()["first_name"] == "Paul"

    event = session.exec(select(AuditEvent).where(AuditEvent.action == "admin.user.update")).one()
    assert event.details["role"] == {"from": "agent", "to": "validateur"}
    assert "Paul" not in str(event.details)  # pas de valeur personnelle dans l'audit


def test_update_ignores_null_fields(client, session, auth_headers):
    agent = make_user(session, "a@example.com")
    response = client.patch(
        f"{USERS}/{agent.id}",
        headers=auth_headers(Role.ADMIN),
        json={"is_active": None, "role": None, "first_name": "Paul"},
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is True
    assert response.json()["role"] == "agent"


def test_update_unknown_user_is_404(client, auth_headers):
    response = client.patch(
        f"{USERS}/9999", headers=auth_headers(Role.ADMIN), json={"role": "agent"}
    )
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_update_cannot_email_or_password(client, session, auth_headers):
    agent = make_user(session, "a@example.com")
    client.patch(
        f"{USERS}/{agent.id}",
        headers=auth_headers(Role.ADMIN),
        json={"email": "pirate@example.com", "password": "Pirate1234"},
    )
    session.refresh(agent)
    assert agent.email == "a@example.com"


def test_deactivating_via_patch_revokes_sessions_and_blocks_login(client, session, auth_headers):
    agent = make_user(session, "a@example.com")
    login = client.post(
        "/api/v1/auth/login", json={"email": "a@example.com", "password": "Test1234!"}
    )
    assert login.status_code == 200
    token = login.cookies.get(settings.refresh_cookie_name)

    response = client.patch(
        f"{USERS}/{agent.id}", headers=auth_headers(Role.ADMIN), json={"is_active": False}
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False

    revoked = session.exec(select(RefreshToken).where(RefreshToken.user_id == agent.id)).all()
    assert revoked and all(t.revoked_at is not None for t in revoked)
    assert (
        client.post(
            "/api/v1/auth/login", json={"email": "a@example.com", "password": "Test1234!"}
        ).status_code
        == 403
    )

    client.cookies.clear()
    client.cookies.set(settings.refresh_cookie_name, token, path=settings.refresh_cookie_path)
    assert client.post("/api/v1/auth/refresh").status_code == 401

    # Réactivation possible.
    response = client.patch(
        f"{USERS}/{agent.id}", headers=auth_headers(Role.ADMIN), json={"is_active": True}
    )
    assert response.json()["is_active"] is True


# --------------------------------------------------------------------------- #
# Désactivation, soi-même, dernier administrateur
# --------------------------------------------------------------------------- #


def test_admin_can_deactivate_a_user(client, session, auth_headers):
    agent = make_user(session, "a@example.com")
    response = client.delete(f"{USERS}/{agent.id}", headers=auth_headers(Role.ADMIN))
    assert response.status_code == 204
    session.refresh(agent)
    assert agent.is_active is False  # désactivation logique : la ligne existe toujours
    assert "admin.user.deactivate" in actions(session)


def test_deactivate_is_idempotent_and_404_when_unknown(client, session, auth_headers):
    agent = make_user(session, "a@example.com", active=False)
    headers = auth_headers(Role.ADMIN)
    assert client.delete(f"{USERS}/{agent.id}", headers=headers).status_code == 204
    assert client.delete(f"{USERS}/9999", headers=headers).status_code == 404


def test_admin_cannot_deactivate_self(client, users, auth_headers):
    admin = users[Role.ADMIN]
    response = client.delete(f"{USERS}/{admin.id}", headers=auth_headers(Role.ADMIN))
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "SELF_DEACTIVATION"

    response = client.patch(
        f"{USERS}/{admin.id}", headers=auth_headers(Role.ADMIN), json={"is_active": False}
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "SELF_DEACTIVATION"


def test_admin_cannot_change_own_role(client, users, auth_headers):
    admin = users[Role.ADMIN]
    response = client.patch(
        f"{USERS}/{admin.id}", headers=auth_headers(Role.ADMIN), json={"role": "agent"}
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "SELF_ROLE_CHANGE"


def test_admin_can_edit_own_name_without_triggering_protections(client, users, auth_headers):
    admin = users[Role.ADMIN]
    response = client.patch(
        f"{USERS}/{admin.id}",
        headers=auth_headers(Role.ADMIN),
        json={"first_name": "Chef", "role": "admin", "is_active": True},
    )
    assert response.status_code == 200
    assert response.json()["first_name"] == "Chef"


def test_last_admin_cannot_be_demoted_or_deactivated(session, users):
    """Défense en profondeur : le service refuse même si l'appelant n'est pas la cible."""

    last_admin = users[Role.ADMIN]
    caller = users[Role.AGENT]  # un appelant qui n'est pas le dernier admin
    assert user_service.count_active_admins(session) == 1

    with pytest.raises(AppError) as demote:
        user_service.update_user(session, last_admin.id, AdminUserUpdate(role=Role.AGENT), caller)
    assert demote.value.code == "LAST_ADMIN"

    with pytest.raises(AppError) as disable:
        user_service.update_user(session, last_admin.id, AdminUserUpdate(is_active=False), caller)
    assert disable.value.code == "LAST_ADMIN"

    with pytest.raises(AppError) as delete:
        user_service.deactivate_user(session, last_admin.id, caller)
    assert delete.value.code == "LAST_ADMIN"


def test_second_admin_can_be_demoted_by_the_first(client, session, auth_headers):
    other = make_user(session, "admin2@example.com", role=Role.ADMIN)
    response = client.patch(
        f"{USERS}/{other.id}", headers=auth_headers(Role.ADMIN), json={"role": "agent"}
    )
    assert response.status_code == 200
    assert user_service.count_active_admins(session) == 1


# --------------------------------------------------------------------------- #
# Audit
# --------------------------------------------------------------------------- #


def seed_events(session, users):
    """Cinq soumissions étalées sur cinq jours, puis une création admin (la plus récente).

    Le journal est en ajout seul : les dates sont donc fixées à la création.
    """

    admin, agent = users[Role.ADMIN], users[Role.AGENT]
    now = utcnow()
    for index in range(5):
        session.add(
            AuditEvent(
                action="demande.soumission",
                actor_id=agent.id,
                demande_id=10 + index,
                details={"pr_number": index},
                commit_sha=f"sha{index}",
                created_at=now - timedelta(days=index),
            )
        )
    session.add(AuditEvent(action="admin.user.create", actor_id=admin.id, created_at=now))
    session.commit()


def test_audit_list_default_order_and_actor(client, session, users, auth_headers):
    seed_events(session, users)
    body = client.get(AUDIT, headers=auth_headers(Role.ADMIN)).json()
    assert body["total"] == 6
    assert body["items"][0]["action"] == "admin.user.create"  # le plus récent d'abord
    assert body["items"][0]["actor"]["role"] == "admin"
    assert body["items"][1]["commit_sha"] == "sha0"
    dates = [item["created_at"] for item in body["items"]]
    assert dates == sorted(dates, reverse=True)


def test_audit_list_is_really_paginated(client, session, users, auth_headers):
    seed_events(session, users)
    headers = auth_headers(Role.ADMIN)
    page1 = client.get(AUDIT, headers=headers, params={"page_size": 4, "page": 1}).json()
    page2 = client.get(AUDIT, headers=headers, params={"page_size": 4, "page": 2}).json()
    assert page1["total"] == page2["total"] == 6
    assert page1["pages"] == 2
    assert len(page1["items"]) == 4 and len(page2["items"]) == 2
    assert not {i["id"] for i in page1["items"]} & {i["id"] for i in page2["items"]}


def test_audit_filters(client, session, users, auth_headers):
    seed_events(session, users)
    headers = auth_headers(Role.ADMIN)

    by_actor = client.get(AUDIT, headers=headers, params={"actor_id": users[Role.AGENT].id}).json()
    assert by_actor["total"] == 5

    by_action = client.get(AUDIT, headers=headers, params={"action": "admin.user.create"}).json()
    assert by_action["total"] == 1

    # Filtre interne au service (non exposé par l'API).
    events, total = audit_service.list_events(session, demande_id=12)
    assert total == 1 and events[0].demande_id == 12

    today = utcnow().date()
    params = {"date_from": (today - timedelta(days=1)).isoformat()}
    assert client.get(AUDIT, headers=headers, params=params).json()["total"] == 3  # j-1, j, create

    params = {"date_to": (today - timedelta(days=3)).isoformat()}
    assert client.get(AUDIT, headers=headers, params=params).json()["total"] == 2  # j-3 et j-4

    params = {"date_from": today.isoformat(), "date_to": today.isoformat()}
    assert client.get(AUDIT, headers=headers, params=params).json()["total"] == 2  # borne incluse


def test_audit_filters_combine(client, session, users, auth_headers):
    seed_events(session, users)
    params = {"actor_id": users[Role.ADMIN].id, "action": "demande.soumission"}
    body = client.get(AUDIT, headers=auth_headers(Role.ADMIN), params=params).json()
    assert body["total"] == 0


def test_audit_rejects_bad_dates_and_paging(client, auth_headers):
    headers = auth_headers(Role.ADMIN)
    assert client.get(AUDIT, headers=headers, params={"date_from": "hier"}).status_code == 422
    assert client.get(AUDIT, headers=headers, params={"page_size": 500}).status_code == 422


def test_audit_event_without_known_actor_has_null_actor(client, session, auth_headers):
    audit_service.record(session, "auth.login.failed", actor_id=None, details={"subject": "abc"})
    session.commit()
    items = client.get(AUDIT, headers=auth_headers(Role.ADMIN)).json()["items"]
    assert items[0]["actor"] is None


def test_audit_is_append_only(session, users):
    event = audit_service.record(session, "test.action", actor_id=users[Role.ADMIN].id)
    session.commit()

    event.action = "falsifie"
    session.add(event)
    with pytest.raises(AuditImmutableError):
        session.commit()
    session.rollback()

    session.delete(session.get(AuditEvent, event.id))
    with pytest.raises(AuditImmutableError):
        session.commit()
    session.rollback()

    assert session.get(AuditEvent, event.id).action == "test.action"


def test_audit_record_scrubs_sensitive_details(session):
    event = audit_service.record(
        session,
        "test.action",
        details={
            "password": "Secret123",
            "nested": {"token": "abc", "email": "a@b.cc", "keep": 1},
            "items": [{"refresh_token": "x", "ok": True}],
            "user_id": 4,
        },
    )
    assert event.details == {"nested": {"keep": 1}, "items": [{"ok": True}], "user_id": 4}


def test_admin_actions_never_store_personal_data(client, session, auth_headers):
    client.post(USERS, headers=auth_headers(Role.ADMIN), json=new_agent_payload())
    event = session.exec(select(AuditEvent).where(AuditEvent.action == "admin.user.create")).one()
    flat = str(event.details).lower()
    assert "nouvel" not in flat and "example.com" not in flat and "demo1234" not in flat
    assert event.details["role"] == "agent"


def test_audit_record_keeps_commit_sha_and_request_id(client, session, auth_headers, users):
    audit_service.record(
        session,
        "demande.commit",
        actor_id=users[Role.AGENT].id,
        commit_sha="abc123",
        request_id="req-1",
    )
    session.commit()
    item = client.get(AUDIT, headers=auth_headers(Role.ADMIN)).json()["items"][0]
    assert item["commit_sha"] == "abc123"
    stored = session.exec(select(AuditEvent)).one()
    assert stored.request_id == "req-1"


# --------------------------------------------------------------------------- #
# Statistiques
# --------------------------------------------------------------------------- #


def test_admin_statistics_on_empty_database(client, auth_headers):
    response = client.get(STATS, headers=auth_headers(Role.ADMIN))
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 0
    assert body["par_type"] == {}
    assert body["delai_moyen_heures"] == 0.0
    assert set(body["par_statut"]) == {s.value for s in StatutDemande}
    assert set(body["par_statut"].values()) == {0}


def test_statistics_counts_by_status_and_type(client, session, users, type_acte, auth_headers):
    make_demande(session, type_acte, "2026-00001", statut=StatutDemande.DEMANDEE)
    make_demande(session, type_acte, "2026-00002", statut=StatutDemande.DEMANDEE)
    make_demande(session, type_acte, "2026-00003", statut=StatutDemande.ARCHIVEE, hours=10)
    make_demande(session, type_acte, "2026-00004", statut=StatutDemande.SIGNEE, hours=20)

    body = client.get(STATS, headers=auth_headers(Role.ADMIN)).json()
    assert body["total"] == 4
    assert body["par_statut"]["demandee"] == 2
    assert body["par_statut"]["archivee"] == 1
    assert body["par_statut"]["signee"] == 1
    assert body["par_statut"]["rejetee"] == 0
    assert body["par_type"] == {"attestation-residence": 4}
    assert body["delai_moyen_heures"] == 15.0  # (10 h + 20 h) / 2


def test_statistics_period_filter(session, users, type_acte):
    """Filtre de période interne au service (non exposé par l'API)."""

    now = utcnow()
    make_demande(session, type_acte, "2026-00001", created_at=now - timedelta(days=10))
    make_demande(session, type_acte, "2026-00002", created_at=now - timedelta(days=1))
    make_demande(session, type_acte, "2026-00003", created_at=now)

    assert stats_service.get_stats(session).total == 3

    recent = stats_service.get_stats(session, date_from=(now - timedelta(days=2)).date())
    assert recent.total == 2

    window = stats_service.get_stats(
        session,
        date_from=(now - timedelta(days=11)).date(),
        date_to=(now - timedelta(days=5)).date(),
    )
    assert window.total == 1


def test_statistics_unknown_type_is_labelled_inconnu(session, users):
    owner = users[Role.CITOYEN]
    session.add(
        Demande(numero="2026-00009", type_acte_id=12345, demandeur_id=owner.id, created_at=utcnow())
    )
    session.commit()
    stats = stats_service.get_stats(session)
    assert stats.par_type == {"inconnu": 1}
