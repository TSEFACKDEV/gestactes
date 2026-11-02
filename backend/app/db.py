"""Connexion à la base de données.

Propriétaire : TSEFACK CALVIN KLEIN (socle partagé, gelé).


TODO : maintenir le socle et ajouter les tests de non-régression.
"""

from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

connect_args: dict[str, object] = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
    connect_args=connect_args,
)


def get_session() -> Generator[Session, None, None]:
    """Dépendance FastAPI fournissant une session SQLModel."""

    with Session(engine) as session:
        yield session


def init_db() -> None:
    """Crée les tables manquantes au démarrage du MVP."""

    import app.models  # noqa: F401  (enregistre les tables dans les métadonnées)

    SQLModel.metadata.create_all(engine)
