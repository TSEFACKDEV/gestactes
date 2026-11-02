"""Fixtures de test partagées.

Propriétaire : VOUMIA OUALA DILANE
TODO :
  [ ] Ajouter des fixtures de demandes à chaque état.
  [ ] Ajouter un faux client GitHub.
  [ ] Factoriser les données de démonstration.
"""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.core.security import create_access_token, hash_password
from app.db import get_session
from app.main import create_app
from app.models import Role, TypeActe, User


@pytest.fixture(name="engine")
def engine_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    import app.models  # noqa: F401

    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="session")
def session_fixture(engine) -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient, None, None]:
    application = create_app(init_database=False)

    def override_session():
        yield session

    application.dependency_overrides[get_session] = override_session
    with TestClient(application) as client:
        yield client


@pytest.fixture(name="users")
def users_fixture(session: Session) -> dict[Role, User]:
    users: dict[Role, User] = {}
    for role in Role:
        user = User(
            email=f"{role.value}@test.com",
            password_hash=hash_password("Test1234!"),
            first_name=role.value.capitalize(),
            last_name="Test",
            role=role,
        )
        session.add(user)
        users[role] = user
    session.commit()
    for user in users.values():
        session.refresh(user)
    return users


@pytest.fixture(name="auth_headers")
def auth_headers_fixture(users: dict[Role, User]):
    def factory(role: Role) -> dict[str, str]:
        user = users[role]
        token = create_access_token(user.id or 0, role.value)
        return {"Authorization": f"Bearer {token}"}

    return factory


@pytest.fixture(name="type_acte")
def type_acte_fixture(session: Session) -> TypeActe:
    type_acte = TypeActe(
        code="attestation-residence",
        label="Attestation de résidence",
        description="Test",
        form_schema=[
            {
                "name": "adresse",
                "label": "Adresse",
                "type": "textarea",
                "required": True,
            }
        ],
        template_md="# Attestation\n\n{{ numero }}",
    )
    session.add(type_acte)
    session.commit()
    session.refresh(type_acte)
    return type_acte
