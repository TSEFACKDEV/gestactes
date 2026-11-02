"""Service de gestion des utilisateurs (administration).

Propriétaire : KOUODZO ZANGUE REGINA
TODO :
  [ ] Ajouter la journalisation d'audit sur chaque modification.
  [ ] Tester la protection du dernier administrateur.
  [ ] Ajouter la recherche insensible à la casse.
"""

from typing import Any

from sqlalchemy import func, or_
from sqlmodel import Session, select

from app.core.errors import AppError
from app.core.security import hash_password, utcnow
from app.models import RefreshToken, Role, User
from app.schemas.admin import AdminUserCreate, AdminUserUpdate


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


def list_users(
    session: Session,
    *,
    role: Role | None = None,
    q: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[User], int]:
    conditions: list[Any] = []
    if role is not None:
        conditions.append(User.role == role)
    if q:
        pattern = f"%{q.strip()}%"
        conditions.append(
            or_(
                (User.first_name).ilike(pattern),
                (User.last_name).ilike(pattern),
                (User.email).ilike(pattern),
            )
        )

    count_statement = select(func.count()).select_from(User)
    statement = select(User).order_by((User.created_at).desc())
    for condition in conditions:
        count_statement = count_statement.where(condition)
        statement = statement.where(condition)

    total = int(session.exec(count_statement).one())
    items = list(
        session.exec(statement.offset((page - 1) * page_size).limit(page_size)).all()
    )
    return items, total


def create_user(session: Session, payload: AdminUserCreate) -> User:
    email = payload.email.lower().strip()
    existing = session.exec(select(User).where(User.email == email)).first()
    if existing is not None:
        raise AppError(
            "Cet e-mail est déjà utilisé.",
            status_code=409,
            code="EMAIL_ALREADY_USED",
        )

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        role=payload.role,
    )
    session.add(user)
    session.flush()
    return user


def update_user(
    session: Session,
    user_id: int,
    payload: AdminUserUpdate,
) -> User:
    user = get_user_or_404(session, user_id)
    data = payload.model_dump(exclude_unset=True)

    new_role = data.get("role")
    if (
        user.role == Role.ADMIN
        and new_role is not None
        and new_role != Role.ADMIN
        and count_active_admins(session) <= 1
    ):
        raise AppError(
            "Impossible de retirer le rôle du dernier administrateur.",
            status_code=409,
            code="LAST_ADMIN",
        )

    for field, value in data.items():
        setattr(user, field, value)
    user.updated_at = utcnow()
    session.add(user)
    session.flush()
    return user


def deactivate_user(session: Session, user_id: int, acting_admin: User) -> None:
    user = get_user_or_404(session, user_id)
    if user.id == acting_admin.id:
        raise AppError(
            "Vous ne pouvez pas désactiver votre propre compte.",
            status_code=409,
            code="SELF_DEACTIVATION",
        )
    if user.role == Role.ADMIN and count_active_admins(session) <= 1:
        raise AppError(
            "Impossible de désactiver le dernier administrateur.",
            status_code=409,
            code="LAST_ADMIN",
        )

    user.is_active = False
    user.updated_at = utcnow()
    session.add(user)

    for token in session.exec(
        select(RefreshToken).where(
            RefreshToken.user_id == user.id,
            (RefreshToken.revoked_at).is_(None),  # type: ignore[union-attr]
        )
    ).all():
        token.revoked_at = utcnow()
        session.add(token)
