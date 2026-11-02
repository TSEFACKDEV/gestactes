"""Routes d'authentification et de compte.

Propriétaire : KOUODZO ZANGUE REGINA
TODO :
  [ ] Ajouter le rate limiting sur login et forgot-password.
  [ ] Journaliser les échecs de connexion.
  [ ] Tester la rotation et la révocation du refresh token.
"""

from fastapi import APIRouter, Request, Response, status

from app.core.config import settings
from app.core.deps import CurrentUser, SessionDep
from app.core.errors import AppError
from app.core.security import utcnow
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UpdateProfileRequest,
)
from app.schemas.common import MessageResponse
from app.schemas.user import UserRead
from app.services import auth_service

router = APIRouter()


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=token,
        max_age=settings.refresh_token_days * 24 * 3600,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path=settings.refresh_cookie_path,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=settings.refresh_cookie_path,
    )


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: RegisterRequest, session: SessionDep) -> UserRead:
    """Crée un compte citoyen."""

    user = auth_service.register_user(session, payload)
    session.commit()
    session.refresh(user)
    return UserRead.model_validate(user)


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    response: Response,
    session: SessionDep,
) -> TokenResponse:
    """Authentifie l'utilisateur et pose le cookie de refresh."""

    user = auth_service.authenticate(session, payload.email, payload.password)
    access_token, refresh_token, expires_in = auth_service.issue_tokens(session, user)
    session.commit()
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=access_token,
        expires_in=expires_in,
        user=UserRead.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    request: Request,
    response: Response,
    session: SessionDep,
) -> TokenResponse:
    """Renouvelle l'access token à partir du cookie de refresh."""

    raw_token = request.cookies.get(settings.refresh_cookie_name)
    if not raw_token:
        raise AppError(
            "Session absente.",
            status_code=401,
            code="MISSING_REFRESH_TOKEN",
        )

    user, access_token, refresh_token, expires_in = auth_service.rotate_refresh_token(
        session, raw_token
    )
    session.commit()
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=access_token,
        expires_in=expires_in,
        user=UserRead.model_validate(user),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, session: SessionDep) -> Response:
    """Révoque la session courante."""

    raw_token = request.cookies.get(settings.refresh_cookie_name)
    if raw_token:
        auth_service.revoke_refresh_token(session, raw_token)
        session.commit()

    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    _clear_refresh_cookie(response)
    return response


@router.get("/me", response_model=UserRead)
def me(user: CurrentUser) -> UserRead:
    """Retourne le profil courant."""

    return UserRead.model_validate(user)


@router.patch("/me", response_model=UserRead)
def update_me(
    payload: UpdateProfileRequest,
    user: CurrentUser,
    session: SessionDep,
) -> UserRead:
    """Met à jour le prénom et le nom."""

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(user, field, value)
    user.updated_at = utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    return UserRead.model_validate(user)


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def forgot_password(
    payload: ForgotPasswordRequest,
    session: SessionDep,
) -> MessageResponse:
    """Déclenche un reset si le compte existe, sans le révéler."""

    auth_service.request_password_reset(session, payload.email)
    session.commit()
    return MessageResponse(
        message="Si un compte existe, un e-mail de réinitialisation a été envoyé."
    )


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(payload: ResetPasswordRequest, session: SessionDep) -> Response:
    """Consomme le token de reset."""

    auth_service.reset_password(session, payload.token, payload.new_password)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: ChangePasswordRequest,
    user: CurrentUser,
    session: SessionDep,
) -> Response:
    """Change le mot de passe de l'utilisateur connecté."""

    auth_service.change_password(
        session,
        user,
        payload.current_password,
        payload.new_password,
    )
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
