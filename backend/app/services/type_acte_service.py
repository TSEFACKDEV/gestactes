"""Service des types d'actes.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO :
  [ ] Valider les schémas de formulaire.
  [ ] Empêcher la suppression d'un type utilisé.
  [ ] Ajouter les tests admin.
"""

from sqlmodel import Session, select

from app.core.errors import AppError
from app.core.security import utcnow
from app.models import TypeActe
from app.schemas.type_acte import TypeActeCreate, TypeActeUpdate


def list_active(session: Session) -> list[TypeActe]:
    return list(
        session.exec(
            select(TypeActe)
            .where((TypeActe.is_active).is_(True))
            .order_by(TypeActe.label)
        ).all()
    )


def list_all(session: Session) -> list[TypeActe]:
    return list(session.exec(select(TypeActe).order_by(TypeActe.label)).all())


def get_by_id(session: Session, type_id: int) -> TypeActe:
    type_acte = session.get(TypeActe, type_id)
    if type_acte is None:
        raise AppError("Type d'acte introuvable.", status_code=404, code="NOT_FOUND")
    return type_acte


def get_by_code(session: Session, code: str, *, active_only: bool = True) -> TypeActe:
    statement = select(TypeActe).where(TypeActe.code == code)
    if active_only:
        statement = statement.where((TypeActe.is_active).is_(True))
    type_acte = session.exec(statement).first()
    if type_acte is None:
        raise AppError("Type d'acte introuvable.", status_code=404, code="NOT_FOUND")
    return type_acte


def create(session: Session, payload: TypeActeCreate) -> TypeActe:
    existing = session.exec(select(TypeActe).where(TypeActe.code == payload.code)).first()
    if existing is not None:
        raise AppError(
            "Ce code de type d'acte existe déjà.",
            status_code=409,
            code="TYPE_CODE_EXISTS",
        )

    type_acte = TypeActe(
        code=payload.code,
        label=payload.label,
        description=payload.description,
        form_schema=[field.model_dump() for field in payload.form_schema],
        template_md=payload.template_md,
    )
    session.add(type_acte)
    session.flush()
    return type_acte


def update(session: Session, type_id: int, payload: TypeActeUpdate) -> TypeActe:
    type_acte = get_by_id(session, type_id)
    data = payload.model_dump(exclude_unset=True)
    if "form_schema" in data and data["form_schema"] is not None:
        data["form_schema"] = [
            field.model_dump() if hasattr(field, "model_dump") else field
            for field in payload.form_schema or []
        ]
    for field, value in data.items():
        setattr(type_acte, field, value)
    type_acte.updated_at = utcnow()
    session.add(type_acte)
    session.flush()
    return type_acte


def deactivate(session: Session, type_id: int) -> None:
    type_acte = get_by_id(session, type_id)
    type_acte.is_active = False
    type_acte.updated_at = utcnow()
    session.add(type_acte)
