"""Schémas utilisateurs.

Propriétaire : KOUODZO ZANGUE REGINA
TODO :
  [ ] Ajouter les validations de nom/prénom.
  [ ] Tester la sérialisation des rôles.
"""

from datetime import datetime

from pydantic import EmailStr

from app.models.enums import Role
from app.schemas.common import ORMModel


class UserSummary(ORMModel):
    id: int
    first_name: str
    last_name: str
    role: Role


class UserRead(UserSummary):
    email: EmailStr
    is_active: bool
    created_at: datetime
