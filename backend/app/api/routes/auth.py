"""Routes d'authentification et de compte.

Propriétaire : KOUODZO ZANGUE REGINA
Rôle : couche HTTP de /auth. Les routes valident l'entrée, appellent
`auth_service`, font le `commit` et gèrent le cookie de refresh (HttpOnly).

Quand le service lève une erreur après avoir écrit une trace d'audit (échec de
connexion, rejeu de refresh token), la route commit avant de relancer l'erreur
pour que la trace survive.
"""

from fastapi import APIRouter, Request, Response, status

from app.core.config import settings
from app.core.deps import CurrentUser, SessionDep
from app.core.errors import AppError
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
    """Authentifie l'utilisateur et pose le cookie de refresh.

    401 identifiants invalides, 403 compte désactivé, 429 trop d'échecs récents.
    """

    try:
        user = auth_service.authenticate(session, payload.email, payload.password)
    except AppError:
        session.commit()  # conserve la trace d'audit de l'échec
        raise

    access_token, refresh_token, expires_in = auth_service.issue_tokens(session, user)
    auth_service.purge_expired_tokens(session)
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

    try:
        user, access_token, refresh_token, expires_in = auth_service.rotate_refresh_token(
            session, raw_token
        )
    except AppError:
        session.commit()  # conserve la révocation et la trace en cas de rejeu
        raise

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

    auth_service.update_profile(session, user, payload)
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
    """Consomme le token de reset (400 si invalide, expiré ou déjà utilisé)."""

    auth_service.reset_password(session, payload.token, payload.new_password)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    user: CurrentUser,
    session: SessionDep,
) -> Response:
    """Change le mot de passe ; les autres sessions sont révoquées."""

    auth_service.change_password(
        session,
        user,
        payload.current_password,
        payload.new_password,
        keep_raw_token=request.cookies.get(settings.refresh_cookie_name),
    )
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
