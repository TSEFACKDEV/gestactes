"""Sécurité : mots de passe, JWT, tokens opaques.

Propriétaire : TSEFACK CALVIN KLEIN (socle partagé, gelé).
Les services d'authentification utilisent ces primitives sans les modifier.


TODO : maintenir le socle et ajouter les tests de non-régression.
"""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_TOKEN_TYPE = "access"


class TokenError(Exception):
    """Token absent, expiré, invalide ou du mauvais type."""


def utcnow() -> datetime:
    """Retourne l'heure courante en UTC."""

    return datetime.now(UTC)


def hash_password(password: str) -> str:
    """Hache un mot de passe avec bcrypt."""

    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Vérifie un mot de passe contre son hash bcrypt."""

    try:
        return pwd_context.verify(password, password_hash)
    except ValueError:
        return False


def create_access_token(
    user_id: int,
    role: str,
    expires_delta: timedelta | None = None,
) -> str:
    """Crée un JWT d'accès signé."""

    now = utcnow()
    expires = now + (expires_delta or timedelta(minutes=settings.access_token_minutes))
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "role": role,
        "type": ACCESS_TOKEN_TYPE,
        "iat": int(now.timestamp()),
        "exp": int(expires.timestamp()),
        "jti": secrets.token_hex(8),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    """Décode et valide un JWT d'accès."""

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp", "sub", "type"]},
        )
    except jwt.PyJWTError as exc:
        raise TokenError("Token invalide ou expiré.") from exc

    if payload.get("type") != ACCESS_TOKEN_TYPE:
        raise TokenError("Type de token invalide.")
    if not payload.get("sub"):
        raise TokenError("Sujet du token manquant.")
    return payload


def generate_opaque_token() -> str:
    """Génère un token opaque pour le refresh ou le reset de mot de passe."""

    return secrets.token_urlsafe(48)


def hash_opaque_token(token: str) -> str:
    """Retourne le SHA-256 hexadécimal d'un token opaque."""

    return hashlib.sha256(token.encode("utf-8")).hexdigest()
