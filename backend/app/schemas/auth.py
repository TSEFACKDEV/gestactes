"""Schémas d'authentification.

Propriétaire : KOUODZO ZANGUE REGINA
Rôle : corps des requêtes et réponses de /auth.

Politique de mot de passe (inscription, reset, changement) : 8 caractères
minimum, 72 octets maximum (limite bcrypt).
Le login n'applique pas cette politique : un ancien mot de passe doit toujours
pouvoir être saisi.

Erreurs documentées :
  - 401 : identifiants invalides, session absente ou expirée ;
  - 403 : compte désactivé ;
  - 409 : e-mail déjà utilisé ;
  - 422 : champ invalide (e-mail, politique de mot de passe) ;
  - 429 : trop d'échecs de connexion, réessayer plus tard.
"""

from pydantic import BaseModel, Field

from app.schemas.user import CleanName, NormalizedEmail, StrongPassword, UserRead


class RegisterRequest(BaseModel):
    first_name: CleanName = Field(min_length=1, max_length=100)
    last_name: CleanName = Field(min_length=1, max_length=100)
    email: NormalizedEmail
    password: StrongPassword = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: NormalizedEmail
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserRead


class UpdateProfileRequest(BaseModel):
    first_name: CleanName | None = Field(default=None, min_length=1, max_length=100)
    last_name: CleanName | None = Field(default=None, min_length=1, max_length=100)


class ForgotPasswordRequest(BaseModel):
    email: NormalizedEmail


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=10, max_length=200)
    new_password: StrongPassword = Field(min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: StrongPassword = Field(min_length=8, max_length=128)
