"""Agrégation des routes de l'API.

Propriétaire : TSEFACK CALVIN KLEIN (fichier partagé, gelé).


TODO : maintenir le socle et ajouter les tests de non-régression.
"""

from fastapi import APIRouter

from app.api.routes import (
    admin,
    auth,
    demandes,
    health,
    notifications,
    types_actes,
    verification,
    webhooks,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/auth", tags=["authentification"])
api_router.include_router(types_actes.router, prefix="/types-actes", tags=["types d'actes"])
api_router.include_router(demandes.router, prefix="/demandes", tags=["demandes"])
api_router.include_router(admin.router, prefix="/admin", tags=["administration"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(verification.router, prefix="/verification", tags=["vérification"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
