"""Routes des notifications internes.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
TODO :
  [ ] Tester le compteur non lu.
  [ ] Ajouter la pagination.
"""

from fastapi import APIRouter, Query, Response, status
from sqlalchemy import func
from sqlmodel import select

from app.core.deps import CurrentUser, SessionDep
from app.core.errors import AppError
from app.models import Notification
from app.schemas.notification import NotificationList, NotificationRead

router = APIRouter()


@router.get("", response_model=NotificationList)
def list_notifications(
    user: CurrentUser,
    session: SessionDep,
    unread_only: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=100),
) -> NotificationList:
    """Liste les notifications de l'utilisateur courant."""

    statement = (
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by((Notification.created_at).desc())
        .limit(limit)
    )
    if unread_only:
        statement = statement.where((Notification.is_read).is_(False))

    items = list(session.exec(statement).all())
    unread_count = int(
        session.exec(
            select(func.count())
            .select_from(Notification)
            .where(
                Notification.user_id == user.id,
                (Notification.is_read).is_(False),
            )
        ).one()
    )
    return NotificationList(
        items=[NotificationRead.model_validate(item) for item in items],
        unread_count=unread_count,
    )


@router.patch("/{notification_id}/lue", status_code=status.HTTP_204_NO_CONTENT)
def mark_read(
    notification_id: int,
    user: CurrentUser,
    session: SessionDep,
) -> Response:
    """Marque une notification comme lue."""

    notification = session.get(Notification, notification_id)
    if notification is None:
        raise AppError("Notification introuvable.", status_code=404, code="NOT_FOUND")
    if notification.user_id != user.id:
        raise AppError("Accès refusé.", status_code=403, code="FORBIDDEN")

    notification.is_read = True
    session.add(notification)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/tout-lu", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(user: CurrentUser, session: SessionDep) -> Response:
    """Marque toutes les notifications comme lues."""

    notifications = list(
        session.exec(
            select(Notification).where(
                Notification.user_id == user.id,
                (Notification.is_read).is_(False),
            )
        ).all()
    )
    for notification in notifications:
        notification.is_read = True
        session.add(notification)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
