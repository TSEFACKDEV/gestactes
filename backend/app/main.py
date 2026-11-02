"""Point d'entrée FastAPI.

Propriétaire : TSEFACK CALVIN KLEIN (socle partagé, gelé).


TODO : maintenir le socle et ajouter les tests de non-régression.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.api.router import api_router
from app.api.routes.health import router as health_router
from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.core.logging import RequestIDMiddleware, configure_logging
from app.db import engine, init_db


def create_app(*, init_database: bool = True) -> FastAPI:
    """Construit l'application. Les tests passent init_database=False."""

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        configure_logging(settings.log_level)
        if init_database:
            init_db()
            if settings.auto_seed:
                from app.seed import seed_all

                with Session(engine) as session:
                    seed_all(session)
        yield

    application = FastAPI(
        title=settings.app_name,
        version=settings.version,
        description=(
            "API de gestion des actes administratifs via GitHub. "
            "Contrat détaillé : docs/api-contract.md."
        ),
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    origins = {
        settings.frontend_url,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    }
    application.add_middleware(
        CORSMiddleware,
        allow_origins=sorted(origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_middleware(RequestIDMiddleware)

    register_exception_handlers(application)

    application.include_router(health_router)
    application.include_router(api_router, prefix=settings.api_prefix)

    @application.get("/", tags=["racine"])
    def root() -> dict[str, str]:
        return {
            "name": settings.app_name,
            "version": settings.version,
            "docs": "/docs",
            "health": "/health",
        }

    return application


app = create_app()
