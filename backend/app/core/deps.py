"""Dépendances FastAPI partagées.

Propriétaire : TSEFACK CALVIN KLEIN (socle partagé, gelé).


TODO : maintenir le socle et ajouter les tests de non-régression.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from app.core.security import TokenError, decode_access_token
from app.db import get_session
from app.models import Role, User

bearer_scheme = HTTPBearer(auto_error=False)

SessionDep = Annotated[Session, Depends(get_session)]
BearerCredentials = Annotated[
    HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
]


def get_current_user(
    credentials: BearerCredentials,
    session: SessionDep,
) -> User:
    """Retourne l'utilisateur authentifié ou lève 401/403."""

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload["sub"])
    except (TokenError, KeyError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur inconnu.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé.",
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: Role):
    """Construit une dépendance exigeant l'un des rôles donnés."""

    def checker(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé pour ce rôle.",
            )
        return user

    return checker


AdminUser = Annotated[User, Depends(require_roles(Role.ADMIN))]
AgentUser = Annotated[User, Depends(require_roles(Role.AGENT))]
ValidatorUser = Annotated[User, Depends(require_roles(Role.VALIDATEUR))]
CitizenUser = Annotated[User, Depends(require_roles(Role.CITOYEN))]
StaffUser = Annotated[
    User,
    Depends(require_roles(Role.AGENT, Role.VALIDATEUR, Role.ADMIN)),
]
