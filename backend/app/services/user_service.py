"""Service de gestion des utilisateurs (administration).

Propriétaire : KOUODZO ZANGUE REGINA
Rôle : liste, création, modification et désactivation des comptes par un
administrateur.

Règles métier :
  - un administrateur ne peut pas se désactiver ni changer son propre rôle ;
  - le dernier administrateur actif ne peut être ni rétrogradé ni désactivé ;
  - désactiver un compte révoque immédiatement toutes ses sessions ;
  - chaque action est écrite dans le journal d'audit (sans donnée personnelle
    inutile : identifiants et noms de champs, pas de valeurs de nom ni d'e-mail) ;
  - les services font `flush`, les routes font `commit`.
"""

from typing import Any

from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, col, select

from app.core.errors import AppError
from app.core.security import hash_password, utcnow
from app.models import Role, User
from app.models.user import normalize_email
from app.schemas.admin import AdminUserCreate, AdminUserUpdate
from app.services import audit_service, auth_service


def get_user_or_404(session: Session, user_id: int) -> User:
    user = session.get(User, user_id)
    if user is None:
        raise AppError("Utilisateur introuvable.", status_code=404, code="NOT_FOUND")
    return user


def count_active_admins(session: Session) -> int:
    statement = (
        select(func.count())
        .select_from(User)
        .where(User.role == Role.ADMIN, (User.is_active).is_(True))
    )
    return int(session.exec(statement).one())


def _escape_like(value: str) -> str:
    """Neutralise les jokers SQL saisis par l'utilisateur."""

    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def list_users(
    session: Session,
    *,
    role: Role | None = None,
    q: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[User], int]:
    """Liste paginée, filtrable par rôle et par recherche (casse ignorée)."""

    conditions: list[Any] = []
    if role is not None:
        conditions.append(User.role == role)
    if q and q.strip():
        pattern = f"%{_escape_like(q.strip())}%"
        conditions.append(
            or_(
                (User.first_name).ilike(pattern, escape="\\"),
                (User.last_name).ilike(pattern, escape="\\"),
                (User.email).ilike(pattern, escape="\\"),
            )
        )

    count_statement = select(func.count()).select_from(User)
    statement = select(User).order_by(col(User.created_at).desc(), col(User.id).desc())
    for condition in conditions:
        count_statement = count_statement.where(condition)
        statement = statement.where(condition)

    total = int(session.exec(count_statement).one())
    items = list(session.exec(statement.offset((page - 1) * page_size).limit(page_size)).all())
    return items, total


def create_user(session: Session, payload: AdminUserCreate, acting_admin: User) -> User:
    """Crée un compte interne (agent, validateur ou admin)."""

    email = normalize_email(payload.email)
    if auth_service.get_user_by_email(session, email) is not None:
        raise _email_already_used()

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=payload.role,
    )
    session.add(user)
    try:
        session.flush()
    except IntegrityError as exc:  # création simultanée avec le même e-mail
        session.rollback()
        raise _email_already_used() from exc

    audit_service.record(
        session,
        "admin.user.create",
        actor_id=acting_admin.id,
        details={"user_id": user.id, "role": user.role.value},
    )
    return user


def _email_already_used() -> AppError:
    return AppError(
        "Cet e-mail est déjà utilisé.",
        status_code=409,
        code="EMAIL_ALREADY_USED",
    )


def _ensure_can_lose_admin_access(session: Session, user: User, acting_admin: User) -> None:
    """Vérifie qu'on peut retirer l'accès admin actif de `user` (désactivation)."""

    if user.id == acting_admin.id:
        raise AppError(
            "Vous ne pouvez pas désactiver votre propre compte.",
            status_code=409,
            code="SELF_DEACTIVATION",
        )
    if user.role == Role.ADMIN and user.is_active and count_active_admins(session) <= 1:
        raise AppError(
            "Impossible de désactiver le dernier administrateur.",
            status_code=409,
            code="LAST_ADMIN",
        )


def update_user(
    session: Session,
    user_id: int,
    payload: AdminUserUpdate,
    acting_admin: User,
) -> User:
    """Modifie nom, rôle ou état d'un compte. Les champs nuls sont ignorés."""

    user = get_user_or_404(session, user_id)
    data = {
        field: value
        for field, value in payload.model_dump(exclude_unset=True).items()
        if value is not None
    }

    new_role: Role | None = data.get("role")
    role_changes = new_role is not None and new_role != user.role
    deactivates = data.get("is_active") is False and user.is_active

    if role_changes and user.id == acting_admin.id:
        raise AppError(
            "Vous ne pouvez pas modifier votre propre rôle.",
            status_code=409,
            code="SELF_ROLE_CHANGE",
        )
    if deactivates:
        _ensure_can_lose_admin_access(session, user, acting_admin)
    if (
        role_changes
        and user.role == Role.ADMIN
        and user.is_active
        and count_active_admins(session) <= 1
    ):
        raise AppError(
            "Impossible de retirer le rôle du dernier administrateur.",
            status_code=409,
            code="LAST_ADMIN",
        )

    changes: dict[str, Any] = {"fields": sorted(data)}
    if role_changes and new_role is not None:
        changes["role"] = {"from": user.role.value, "to": new_role.value}
    if "is_active" in data and data["is_active"] != user.is_active:
        changes["is_active"] = {"from": user.is_active, "to": data["is_active"]}

    for field, value in data.items():
        setattr(user, field, value)
    user.updated_at = utcnow()
    session.add(user)
    session.flush()

    if deactivates:
        changes["revoked_sessions"] = auth_service.revoke_all_sessions(session, user.id or 0)

    audit_service.record(
        session,
        "admin.user.update",
        actor_id=acting_admin.id,
        details={"user_id": user.id, **changes},
    )
    return user


def deactivate_user(session: Session, user_id: int, acting_admin: User) -> None:
    """Désactivation logique : le compte reste en base, ses sessions sont révoquées."""

    user = get_user_or_404(session, user_id)
    _ensure_can_lose_admin_access(session, user, acting_admin)

    revoked = 0
    if user.is_active:
        user.is_active = False
        user.updated_at = utcnow()
        session.add(user)
        revoked = auth_service.revoke_all_sessions(session, user.id or 0)
        session.flush()

    audit_service.record(
        session,
        "admin.user.deactivate",
        actor_id=acting_admin.id,
        details={"user_id": user.id, "revoked_sessions": revoked},
    )
