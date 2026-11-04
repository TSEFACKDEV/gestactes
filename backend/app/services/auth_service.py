"""Service d'authentification.

Propriétaire : KOUODZO ZANGUE REGINA
Rôle : inscription, connexion, sessions (refresh tokens), profil, mot de passe
oublié, changement de mot de passe.

Principes :
  - les services font `flush`, les routes font `commit` ;
  - le mot de passe est haché avec bcrypt, les tokens opaques sont stockés
    hachés (SHA-256), jamais en clair ;
  - un refresh token ne sert qu'une fois (rotation) ; le rejeu d'un token déjà
    consommé révoque toutes les sessions de l'utilisateur ;
  - après trop d'échecs de connexion, le compte est verrouillé temporairement
    (HTTP 429) ;
  - les messages d'erreur ne révèlent jamais si un e-mail existe ;
  - chaque événement de sécurité est écrit dans le journal d'audit, sans mot de
    passe, token ni e-mail en clair.

Important pour les routes : quand une fonction lève une `AppError` après avoir
écrit un événement d'audit (échec de connexion, rejeu de token), la route doit
faire `session.commit()` avant de relancer l'erreur, sinon la trace est perdue.
"""

from datetime import timedelta
from functools import lru_cache
from typing import NoReturn

from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, col, select

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
from app.models.user import normalize_email
from app.schemas.auth import RegisterRequest, UpdateProfileRequest
from app.services import audit_service, outbox_service

# Verrouillage progressif de la connexion.
MAX_FAILED_LOGINS = 5
LOCKOUT_WINDOW = timedelta(minutes=15)

# Mot de passe oublié.
RESET_TOKEN_MINUTES = 30
MAX_RESET_REQUESTS_PER_HOUR = 3

# Un refresh token consommé il y a moins de ce délai n'est pas un rejeu mais
# probablement deux onglets qui renouvellent en même temps.
REUSE_GRACE = timedelta(seconds=10)

# Les tokens expirés sont purgés après ce délai.
EXPIRED_TOKEN_RETENTION = timedelta(days=30)


@lru_cache
def _dummy_hash() -> str:
    """Hash factice : égalise le temps de réponse quand l'e-mail est inconnu."""

    return hash_password("mot-de-passe-factice-0")


def get_user_by_email(session: Session, email: str) -> User | None:
    return session.exec(select(User).where(User.email == normalize_email(email))).first()


# --------------------------------------------------------------------------- #
# Inscription et profil
# --------------------------------------------------------------------------- #


def register_user(session: Session, payload: RegisterRequest) -> User:
    """Crée un compte citoyen."""

    email = normalize_email(payload.email)
    if get_user_by_email(session, email) is not None:
        raise _email_already_used()

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=Role.CITOYEN,
    )
    session.add(user)
    try:
        session.flush()
    except IntegrityError as exc:  # inscription simultanée avec le même e-mail
        session.rollback()
        raise _email_already_used() from exc

    audit_service.record(session, "auth.register", actor_id=user.id)
    return user


def _email_already_used() -> AppError:
    return AppError(
        "Cet e-mail est déjà utilisé.",
        status_code=409,
        code="EMAIL_ALREADY_USED",
    )


def update_profile(session: Session, user: User, payload: UpdateProfileRequest) -> User:
    """Met à jour le prénom et/ou le nom. Les champs absents ou nuls sont ignorés."""

    data = {
        field: value
        for field, value in payload.model_dump(exclude_unset=True).items()
        if value is not None
    }
    if not data:
        return user

    for field, value in data.items():
        setattr(user, field, value)
    user.updated_at = utcnow()
    session.add(user)
    session.flush()
    audit_service.record(
        session,
        "auth.profile.update",
        actor_id=user.id,
        details={"fields": sorted(data)},
    )
    return user


# --------------------------------------------------------------------------- #
# Connexion
# --------------------------------------------------------------------------- #


def _ensure_not_locked(session: Session, subject: str) -> None:
    """Refuse la connexion si trop d'échecs récents (depuis le dernier succès)."""

    now = utcnow()
    window_start = audit_service.ensure_utc(now - LOCKOUT_WINDOW)

    last_success = audit_service.last_event_at(
        session, "auth.login.success", subject=subject, since=window_start
    )
    start = max(window_start, last_success) if last_success else window_start

    failures = audit_service.count_events(
        session, "auth.login.failed", subject=subject, since=start
    )
    if failures < MAX_FAILED_LOGINS:
        return

    last_failure = audit_service.last_event_at(
        session, "auth.login.failed", subject=subject, since=start
    )
    retry_after = 1
    if last_failure is not None:
        unlock_at = last_failure + LOCKOUT_WINDOW
        retry_after = max(1, int((unlock_at - audit_service.ensure_utc(now)).total_seconds()))
    raise AppError(
        "Trop de tentatives de connexion. Réessayez plus tard.",
        status_code=429,
        code="RATE_LIMITED",
        details={"retry_after_seconds": str(retry_after)},
    )


def authenticate(session: Session, email: str, password: str) -> User:
    """Vérifie les identifiants et retourne l'utilisateur.

    Écrit un événement d'audit à chaque issue (succès, échec, compte bloqué).
    """

    subject = audit_service.pseudonymize(email)
    _ensure_not_locked(session, subject)

    user = get_user_by_email(session, email)
    if user is None:
        # Même coût de calcul que pour un vrai compte : pas de différence de
        # temps de réponse qui révélerait l'existence de l'e-mail.
        verify_password(password, _dummy_hash())
        _fail_login(session, subject, actor_id=None)
    if not verify_password(password, user.password_hash):
        _fail_login(session, subject, actor_id=user.id)

    if not user.is_active:
        audit_service.record(
            session,
            "auth.login.blocked",
            actor_id=user.id,
            details={"subject": subject, "reason": "account_disabled"},
        )
        raise AppError(
            "Ce compte est désactivé.",
            status_code=403,
            code="ACCOUNT_DISABLED",
        )

    audit_service.record(
        session,
        "auth.login.success",
        actor_id=user.id,
        details={"subject": subject},
    )
    return user


def _fail_login(session: Session, subject: str, *, actor_id: int | None) -> NoReturn:
    audit_service.record(
        session,
        "auth.login.failed",
        actor_id=actor_id,
        details={"subject": subject},
    )
    raise AppError(
        "E-mail ou mot de passe incorrect.",
        status_code=401,
        code="INVALID_CREDENTIALS",
    )


# --------------------------------------------------------------------------- #
# Sessions : émission, rotation, révocation
# --------------------------------------------------------------------------- #


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
    """Révoque l'ancien refresh et en émet un nouveau.

    Si un token déjà révoqué est rejoué (hors délai de grâce), on considère qu'il
    a pu être volé : toutes les sessions de l'utilisateur sont révoquées.
    """

    stored = session.exec(
        select(RefreshToken).where(RefreshToken.token_hash == hash_opaque_token(raw_token))
    ).first()
    now = utcnow()

    if stored is None:
        raise _invalid_refresh_token()

    if stored.revoked_at is not None:
        if now - audit_service.ensure_utc(stored.revoked_at) > REUSE_GRACE:
            revoked = revoke_all_sessions(session, stored.user_id)
            audit_service.record(
                session,
                "auth.refresh.reuse_detected",
                actor_id=stored.user_id,
                details={"revoked_sessions": revoked},
            )
        raise _invalid_refresh_token()

    if audit_service.ensure_utc(stored.expires_at) <= now:
        raise _invalid_refresh_token()

    user = session.get(User, stored.user_id)
    if user is None or not user.is_active:
        raise _invalid_refresh_token()

    stored.revoked_at = now
    session.add(stored)
    access_token, refresh_token, expires_in = issue_tokens(session, user)
    return user, access_token, refresh_token, expires_in


def _invalid_refresh_token() -> AppError:
    return AppError(
        "Session expirée ou invalide.",
        status_code=401,
        code="INVALID_REFRESH_TOKEN",
    )


def revoke_refresh_token(session: Session, raw_token: str) -> int | None:
    """Révoque un refresh token s'il est actif. Retourne l'id de l'utilisateur."""

    stored = session.exec(
        select(RefreshToken).where(RefreshToken.token_hash == hash_opaque_token(raw_token))
    ).first()
    if stored is None or stored.revoked_at is not None:
        return None
    stored.revoked_at = utcnow()
    session.add(stored)
    audit_service.record(session, "auth.logout", actor_id=stored.user_id)
    return stored.user_id


def revoke_all_sessions(
    session: Session,
    user_id: int,
    *,
    keep_raw_token: str | None = None,
) -> int:
    """Révoque tous les refresh tokens actifs d'un utilisateur.

    `keep_raw_token` permet de conserver la session courante (changement de mot
    de passe). Retourne le nombre de sessions révoquées.
    """

    keep_hash = hash_opaque_token(keep_raw_token) if keep_raw_token else None
    revoked = 0
    active = session.exec(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            (RefreshToken.revoked_at).is_(None),  # type: ignore[union-attr]
        )
    ).all()
    for token in active:
        if keep_hash is not None and token.token_hash == keep_hash:
            continue
        token.revoked_at = utcnow()
        session.add(token)
        revoked += 1
    return revoked


def purge_expired_tokens(session: Session) -> int:
    """Supprime les tokens (refresh et reset) expirés depuis longtemps."""

    limit = utcnow() - EXPIRED_TOKEN_RETENTION
    refresh_result = session.execute(
        delete(RefreshToken).where(col(RefreshToken.expires_at) < limit)
    )
    reset_result = session.execute(
        delete(PasswordResetToken).where(col(PasswordResetToken.expires_at) < limit)
    )
    return int(refresh_result.rowcount or 0) + int(reset_result.rowcount or 0)  # type: ignore[attr-defined]


# --------------------------------------------------------------------------- #
# Mot de passe oublié, reset, changement
# --------------------------------------------------------------------------- #


def request_password_reset(session: Session, email: str) -> None:
    """Crée un token de reset et planifie l'e-mail.

    La réponse HTTP reste identique que l'e-mail existe ou non, que le compte
    soit actif ou que la limite de demandes soit atteinte.
    """

    user = get_user_by_email(session, email)
    if user is None or not user.is_active:
        return

    now = utcnow()
    recent = session.exec(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.created_at >= audit_service.ensure_utc(now - timedelta(hours=1)),
        )
    ).all()
    if len(recent) >= MAX_RESET_REQUESTS_PER_HOUR:
        return

    _expire_pending_reset_tokens(session, user.id or 0)

    raw_token = generate_opaque_token()
    session.add(
        PasswordResetToken(
            user_id=user.id or 0,
            token_hash=hash_opaque_token(raw_token),
            expires_at=now + timedelta(minutes=RESET_TOKEN_MINUTES),
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
                f"{RESET_TOKEN_MINUTES} minutes : {reset_url}"
            ),
        },
    )
    audit_service.record(session, "auth.password.reset_requested", actor_id=user.id)


def _expire_pending_reset_tokens(session: Session, user_id: int) -> None:
    """Invalide les liens de reset encore en attente (un seul lien valide à la fois)."""

    now = utcnow()
    pending = session.exec(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user_id,
            (PasswordResetToken.used_at).is_(None),  # type: ignore[union-attr]
            PasswordResetToken.expires_at > audit_service.ensure_utc(now),
        )
    ).all()
    for token in pending:
        token.expires_at = now
        session.add(token)


def reset_password(session: Session, raw_token: str, new_password: str) -> None:
    """Consomme un token de reset et révoque toutes les sessions."""

    stored = session.exec(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == hash_opaque_token(raw_token)
        )
    ).first()
    invalid = AppError(
        "Lien de réinitialisation invalide ou expiré.",
        status_code=400,
        code="INVALID_RESET_TOKEN",
    )
    if (
        stored is None
        or stored.used_at is not None
        or audit_service.ensure_utc(stored.expires_at) <= utcnow()
    ):
        raise invalid

    user = session.get(User, stored.user_id)
    if user is None or not user.is_active:
        raise invalid

    now = utcnow()
    user.password_hash = hash_password(new_password)
    user.updated_at = now
    stored.used_at = now
    session.add(user)
    session.add(stored)
    _expire_pending_reset_tokens(session, user.id or 0)

    revoked = revoke_all_sessions(session, user.id or 0)
    session.flush()
    audit_service.record(
        session,
        "auth.password.reset",
        actor_id=user.id,
        details={"revoked_sessions": revoked},
    )


def change_password(
    session: Session,
    user: User,
    current_password: str,
    new_password: str,
    *,
    keep_raw_token: str | None = None,
) -> None:
    """Change le mot de passe d'un utilisateur connecté.

    Les autres sessions sont révoquées ; la session courante (`keep_raw_token`,
    le refresh token du navigateur) est conservée.
    """

    if not verify_password(current_password, user.password_hash):
        raise AppError(
            "Le mot de passe actuel est incorrect.",
            status_code=401,
            code="INVALID_CREDENTIALS",
        )
    if verify_password(new_password, user.password_hash):
        raise AppError(
            "Le nouveau mot de passe doit être différent de l'actuel.",
            status_code=422,
            code="PASSWORD_UNCHANGED",
        )

    user.password_hash = hash_password(new_password)
    user.updated_at = utcnow()
    session.add(user)
    revoked = revoke_all_sessions(session, user.id or 0, keep_raw_token=keep_raw_token)
    session.flush()
    audit_service.record(
        session,
        "auth.password.change",
        actor_id=user.id,
        details={"revoked_sessions": revoked},
    )
