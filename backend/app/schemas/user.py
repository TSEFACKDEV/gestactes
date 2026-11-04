"""Schémas utilisateurs.

Propriétaire : KOUODZO ZANGUE REGINA
Rôle : formes publiques d'un utilisateur et briques de validation réutilisées
par les schémas d'authentification et d'administration (nom, e-mail, mot de
passe).
"""

from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, EmailStr

from app.models.enums import Role
from app.schemas.common import ORMModel

# bcrypt ne lit que les 72 premiers octets : au-delà, deux mots de passe
# différents seraient considérés comme identiques.
PASSWORD_MAX_BYTES = 72


def clean_name(value: str) -> str:
    """Nettoie un nom ou prénom : espaces normalisés, au moins une lettre."""

    cleaned = " ".join(value.split())
    if not any(char.isalpha() for char in cleaned):
        raise ValueError("Le nom doit contenir au moins une lettre.")
    return cleaned


def lower_email(value: str) -> str:
    """Met l'e-mail en minuscules et retire les espaces autour."""

    return value.strip().lower()


def check_password_policy(value: str) -> str:
    """Politique de mot de passe : 8 caractères minimum (Field), 72 octets maximum (bcrypt)."""

    if len(value.encode("utf-8")) > PASSWORD_MAX_BYTES:
        raise ValueError("Le mot de passe est trop long (72 octets maximum).")
    return value


CleanName = Annotated[str, AfterValidator(clean_name)]
NormalizedEmail = Annotated[EmailStr, AfterValidator(lower_email)]
StrongPassword = Annotated[str, AfterValidator(check_password_policy)]


class UserSummary(ORMModel):
    id: int
    first_name: str
    last_name: str
    role: Role


class UserRead(UserSummary):
    email: EmailStr
    is_active: bool
    created_at: datetime
