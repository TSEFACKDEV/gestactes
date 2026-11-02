"""Tests de la machine à états.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO :
  [ ] Tester chaque transition avec un acteur autorisé.
  [ ] Tester la concurrence sur la prise en charge.
  [ ] Tester les effets de bord audit/outbox.
"""

import pytest

from app.core.errors import AppError
from app.models import Role, StatutDemande, User
from app.services.workflow_service import (
    allowed_actions,
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
