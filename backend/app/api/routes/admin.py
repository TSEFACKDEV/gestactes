"""Routes d'administration.

Propriétaire : KOUODZO ZANGUE REGINA
TODO :
  [ ] Ajouter la pagination réelle de l'audit.
  [ ] Journaliser toutes les actions admin.
  [ ] Tester la protection du dernier administrateur.
"""

from fastapi import APIRouter, Query, Response, status

from app.core.deps import AdminUser, SessionDep
from app.models import Role, User
from app.schemas.admin import (
    AdminUserCreate,
    AdminUserUpdate,
    AuditEventRead,
    StatsRead,
)
from app.schemas.common import Page
from app.schemas.type_acte import TypeActeCreate, TypeActeRead, TypeActeUpdate
from app.schemas.user import UserRead, UserSummary
from app.services import audit_service, stats_service, type_acte_service, user_service

router = APIRouter()


@router.get("/utilisateurs", response_model=Page[UserRead])
def list_users(
    _: AdminUser,
    session: SessionDep,
    role: Role | None = Query(default=None),
    q: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> Page[UserRead]:
    """Liste les utilisateurs."""

    items, total = user_service.list_users(
        session,
        role=role,
        q=q,
        page=page,
        page_size=page_size,
    )
    return Page.create(
        [UserRead.model_validate(user) for user in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/utilisateurs",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    payload: AdminUserCreate,
    admin: AdminUser,
    session: SessionDep,
) -> UserRead:
    """Crée un utilisateur avec un rôle."""

    user = user_service.create_user(session, payload)
    audit_service.record(
        session,
        "admin.user.create",
        actor_id=admin.id,
        details={"user_id": user.id, "role": user.role.value},
    )
    session.commit()
    session.refresh(user)
    return UserRead.model_validate(user)


@router.patch("/utilisateurs/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    admin: AdminUser,
    session: SessionDep,
) -> UserRead:
    """Modifie un utilisateur."""

    user = user_service.update_user(session, user_id, payload)
    audit_service.record(
        session,
        "admin.user.update",
        actor_id=admin.id,
        details={"user_id": user.id, "fields": list(payload.model_dump(exclude_unset=True))},
    )
    session.commit()
    session.refresh(user)
    return UserRead.model_validate(user)


@router.delete("/utilisateurs/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_user(
    user_id: int,
    admin: AdminUser,
    session: SessionDep,
) -> Response:
    """Désactive un utilisateur."""

    user_service.deactivate_user(session, user_id, admin)
    audit_service.record(
        session,
        "admin.user.deactivate",
        actor_id=admin.id,
        details={"user_id": user_id},
    )
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/types-actes", response_model=list[TypeActeRead])
def list_types(_: AdminUser, session: SessionDep) -> list[TypeActeRead]:
    """Liste tous les types, actifs et inactifs."""

    return [
        TypeActeRead.model_validate(type_acte)
        for type_acte in type_acte_service.list_all(session)
    ]


@router.post(
    "/types-actes",
    response_model=TypeActeRead,
    status_code=status.HTTP_201_CREATED,
)
def create_type(
    payload: TypeActeCreate,
    admin: AdminUser,
    session: SessionDep,
) -> TypeActeRead:
    """Crée un type d'acte."""

    type_acte = type_acte_service.create(session, payload)
    audit_service.record(
        session,
        "admin.type.create",
        actor_id=admin.id,
        details={"type_id": type_acte.id, "code": type_acte.code},
    )
    session.commit()
    session.refresh(type_acte)
    return TypeActeRead.model_validate(type_acte)


@router.patch("/types-actes/{type_id}", response_model=TypeActeRead)
def update_type(
    type_id: int,
    payload: TypeActeUpdate,
    admin: AdminUser,
    session: SessionDep,
) -> TypeActeRead:
    """Modifie un type d'acte."""

    type_acte = type_acte_service.update(session, type_id, payload)
    audit_service.record(
        session,
        "admin.type.update",
        actor_id=admin.id,
        details={"type_id": type_acte.id},
    )
    session.commit()
    session.refresh(type_acte)
    return TypeActeRead.model_validate(type_acte)


@router.delete("/types-actes/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_type(
    type_id: int,
    admin: AdminUser,
    session: SessionDep,
) -> Response:
    """Désactive un type d'acte."""

    type_acte_service.deactivate(session, type_id)
    audit_service.record(
        session,
        "admin.type.deactivate",
        actor_id=admin.id,
        details={"type_id": type_id},
    )
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/audit", response_model=Page[AuditEventRead])
def list_audit(
    _: AdminUser,
    session: SessionDep,
    actor_id: int | None = Query(default=None),
    action: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> Page[AuditEventRead]:
    """Liste les événements d'audit."""

    events = audit_service.list_events(
        session,
        actor_id=actor_id,
        action=action,
        limit=page_size,
    )
    items: list[AuditEventRead] = []
    for event in events:
        actor = session.get(User, event.actor_id) if event.actor_id else None
        items.append(
            AuditEventRead(
                id=event.id or 0,
                demande_id=event.demande_id,
                actor=UserSummary.model_validate(actor) if actor else None,
                action=event.action,
                details=event.details,
                commit_sha=event.commit_sha,
                created_at=event.created_at,
            )
        )
    return Page.create(items, total=len(items), page=page, page_size=page_size)


@router.get("/statistiques", response_model=StatsRead)
def get_stats(_: AdminUser, session: SessionDep) -> StatsRead:
    """Retourne les indicateurs du tableau de bord."""

    return stats_service.get_stats(session)
