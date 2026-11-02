"""Routes de santé.

Propriétaire : TSEFACK CALVIN KLEIN (socle partagé, gelé).


TODO : maintenir le socle et ajouter les tests de non-régression.
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import settings
from app.core.deps import SessionDep
from app.core.security import utcnow

router = APIRouter(tags=["santé"])


@router.get("/health")
def health() -> dict[str, str]:
    """État simple de l'API."""

    return {
        "status": "ok",
        "version": settings.version,
        "environment": settings.environment,
        "timestamp": utcnow().isoformat(),
    }


@router.get("/health/ready")
def readiness(session: SessionDep):
    """Vérifie que la base de données répond."""

    try:
        session.connection().execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "database": "unavailable"},
        )
    return {"status": "ready", "database": "ok"}
