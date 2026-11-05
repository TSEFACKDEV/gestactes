"""Routes du catalogue des types d'actes.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO réalisé :
  [x] Catalogue actif et inactif couvert par le service.
  [x] Modèles OpenAPI documentés.
TODO :
  [ ] Tester le catalogue vide et les types inactifs.
  [ ] Ajouter les exemples OpenAPI.
"""

from fastapi import APIRouter

from app.core.deps import CurrentUser, SessionDep
from app.schemas.type_acte import TypeActeRead
from app.services import type_acte_service

router = APIRouter()


@router.get("", response_model=list[TypeActeRead])
def list_types(_: CurrentUser, session: SessionDep) -> list[TypeActeRead]:
    return [
        TypeActeRead.model_validate(type_acte)
        for type_acte in type_acte_service.list_active(session)
    ]


@router.get("/{code}", response_model=TypeActeRead)
def get_type(code: str, _: CurrentUser, session: SessionDep) -> TypeActeRead:
    return TypeActeRead.model_validate(type_acte_service.get_by_code(session, code))