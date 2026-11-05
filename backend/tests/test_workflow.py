"""Tests de la machine à états.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO :
  [ ] Tester chaque transition avec un acteur autorisé.
  [ ] Tester la concurrence sur la prise en charge.
  [ ] Tester les effets de bord audit/outbox.
"""

import pytest

from app.core.errors import AppError
from app.models import Demande, Role, StatutDemande, User
from app.services.workflow_service import (
    allowed_actions,
    apply_transition,
    assert_transition,
    can_transition,
)


def _user(role: Role) -> User:
    return User(
        id=1,
        email=f"{role.value}@test.com",
        password_hash="x",
        first_name="Test",
        last_name="User",
        role=role,
    )


def test_can_transition():
    assert can_transition(StatutDemande.DEMANDEE, "prendre_en_charge")
    assert can_transition(StatutDemande.EN_VALIDATION, "approuver")
    assert not can_transition(StatutDemande.DEMANDEE, "approuver")


def test_allowed_actions():
    assert "prendre_en_charge" in allowed_actions(StatutDemande.DEMANDEE)
    assert "signer" not in allowed_actions(StatutDemande.DEMANDEE)


def test_agent_can_take_charge():
    target = assert_transition(
        StatutDemande.DEMANDEE,
        "prendre_en_charge",
        _user(Role.AGENT),
    )
    assert target == StatutDemande.EN_INSTRUCTION


def test_citizen_cannot_take_charge():
    with pytest.raises(AppError) as exc:
        assert_transition(
            StatutDemande.DEMANDEE,
            "prendre_en_charge",
            _user(Role.CITOYEN),
        )
    assert exc.value.status_code == 403


def test_invalid_transition():
    with pytest.raises(AppError) as exc:
        assert_transition(StatutDemande.DEMANDEE, "signer", _user(Role.VALIDATEUR))
    assert exc.value.status_code == 409


def test_apply_transition_updates_status_and_audit(session, users):
    demande = Demande(
        numero="2026-00002",
        type_acte_id=1,
        demandeur_id=users[Role.CITOYEN].id or 0,
        statut=StatutDemande.DEMANDEE,
    )
    session.add(demande)
    session.commit()
    session.refresh(demande)

    result = apply_transition(
        session,
        demande,
        "prendre_en_charge",
        users[Role.AGENT],
        {"branch_name": "acte/2026-00002"},
    )

    assert result.statut == StatutDemande.EN_INSTRUCTION
    assert result.assigned_agent_id == users[Role.AGENT].id
    assert result.branch_name == "acte/2026-00002"
