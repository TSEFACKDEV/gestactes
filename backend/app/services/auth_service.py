"""Service d'authentification.

Propriétaire : KOUODZO ZANGUE REGINA
TODO :
  [ ] Revue de sécurité : rotation, verrouillage progressif, audit.
  [ ] Ajouter le rate limiting applicatif sur le login.
  [ ] Tester le reset de mot de passe et la révocation des sessions.
"""

from datetime import timedelta

from sqlmodel import Session, select

from app.core.config import settings
from app.core.errors import AppError
from app.core.security import (
    create_access_token,
    generate_opaque_token,
    hash_opaque_token,
    hash_password,
    utcnow,
    verify_password,
)
from app.models import (
    JobType,
    PasswordResetToken,
    RefreshToken,
    Role,
    User,
)
from app.schemas.auth import RegisterRequest
from app.services import outbox_service


def get_user_by_email(session: Session, email: str) -> User | None:
    return session.exec(select(User).where(User.email == email.lower().strip())).first()


def register_user(session: Session, payload: RegisterRequest) -> User:
    """Crée un compte citoyen."""

    email = payload.email.lower().strip()
    if get_user_by_email(session, email) is not None:
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
        role=Role.CITOYEN,
    )
    session.add(user)
    session.flush()
    return user


def authenticate(session: Session, email: str, password: str) -> User:
    """Vérifie les identifiants et retourne l'utilisateur."""

    user = get_user_by_email(session, email)
    if user is None or not verify_password(password, user.password_hash):
        raise AppError(
            "E-mail ou mot de passe incorrect.",
            status_code=401,
            code="INVALID_CREDENTIALS",
        )
    if not user.is_active:
        raise AppError(
            "Ce compte est désactivé.",
            status_code=403,
            code="ACCOUNT_DISABLED",
        )
    return user


def issue_tokens(session: Session, user: User) -> tuple[str, str, int]:
    """Crée un access token et un refresh token opaque."""

    access_token = create_access_token(user.id or 0, user.role.value)
    refresh_token = generate_opaque_token()
    session.add(
        RefreshToken(
            user_id=user.id or 0,
            token_hash=hash_opaque_token(refresh_token),
            expires_at=utcnow() + timedelta(days=settings.refresh_token_days),
        )
    )
    session.flush()
    return access_token, refresh_token, settings.access_token_minutes * 60


def rotate_refresh_token(session: Session, raw_token: str) -> tuple[User, str, str, int]:
    """Révoque l'ancien refresh et en émet un nouveau."""

    token_hash = hash_opaque_token(raw_token)
    stored = session.exec(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    ).first()
    if stored is None or stored.revoked_at is not None or stored.expires_at <= utcnow():
        raise AppError(
            "Session expirée ou invalide.",
            status_code=401,
            code="INVALID_REFRESH_TOKEN",
        )

    user = session.get(User, stored.user_id)
    if user is None or not user.is_active:
        raise AppError(
            "Compte introuvable ou désactivé.",
            status_code=401,
            code="INVALID_REFRESH_TOKEN",
        )

    stored.revoked_at = utcnow()
    session.add(stored)
    access_token, refresh_token, expires_in = issue_tokens(session, user)
    return user, access_token, refresh_token, expires_in


def revoke_refresh_token(session: Session, raw_token: str) -> None:
    """Révoque un refresh token s'il existe."""

    token_hash = hash_opaque_token(raw_token)
    stored = session.exec(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    ).first()
    if stored is not None and stored.revoked_at is None:
        stored.revoked_at = utcnow()
        session.add(stored)


def request_password_reset(session: Session, email: str) -> None:
    """Crée un token de reset et planifie l'e-mail.

    La réponse HTTP reste identique que l'e-mail existe ou non.
    """

    user = get_user_by_email(session, email)
    if user is None:
        return

    raw_token = generate_opaque_token()
    session.add(
        PasswordResetToken(
            user_id=user.id or 0,
            token_hash=hash_opaque_token(raw_token),
            expires_at=utcnow() + timedelta(minutes=30),
        )
    )
    reset_url = f"{settings.frontend_url}/reinitialiser?token={raw_token}"
    outbox_service.enqueue(
        session,
        JobType.EMAIL_SEND,
        {
            "to": user.email,
            "subject": "Réinitialisation de votre mot de passe GestActes",
            "body": (
                "Pour réinitialiser votre mot de passe, ouvrez ce lien dans les "
                f"30 minutes : {reset_url}"
            ),
        },
    )


def reset_password(session: Session, raw_token: str, new_password: str) -> None:
    """Consomme un token de reset et révoque toutes les sessions."""

    token_hash = hash_opaque_token(raw_token)
    stored = session.exec(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
    ).first()
    if (
        stored is None
        or stored.used_at is not None
        or stored.expires_at <= utcnow()
    ):
        raise AppError(
            "Lien de réinitialisation invalide ou expiré.",
            status_code=400,
            code="INVALID_RESET_TOKEN",
        )

    user = session.get(User, stored.user_id)
    if user is None:
        raise AppError("Compte introuvable.", status_code=404, code="NOT_FOUND")

    user.password_hash = hash_password(new_password)
    user.updated_at = utcnow()
    stored.used_at = utcnow()
    session.add(user)
    session.add(stored)

    for refresh in session.exec(
        select(RefreshToken).where(
            RefreshToken.user_id == user.id,
            (RefreshToken.revoked_at).is_(None),  # type: ignore[union-attr]
        )
    ).all():
        refresh.revoked_at = utcnow()
        session.add(refresh)


def change_password(
    session: Session,
    user: User,
    current_password: str,
    new_password: str,
) -> None:
    """Change le mot de passe d'un utilisateur connecté."""

    if not verify_password(current_password, user.password_hash):
        raise AppError(
            "Le mot de passe actuel est incorrect.",
            status_code=401,
            code="INVALID_CREDENTIALS",
        )
    user.password_hash = hash_password(new_password)
    user.updated_at = utcnow()
    session.add(user)
