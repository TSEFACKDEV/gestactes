"""Service métier GitHub.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
TODO :
  [ ] Implémenter provision_demande (Issue + dossier).
  [ ] Implémenter commit_acte (acte.json, acte.md, pieces).
  [ ] Implémenter open_validation_pr.
  [ ] Implémenter merge_signature et archive_acte.
  [ ] Rendre chaque opération idempotente.
  [ ] Tester avec respx.
"""

from typing import Any

from sqlmodel import Session

from app.core.errors import AppError
from app.models import Demande
from app.schemas.acte import SignatureManifest
from app.services.github_client import GitHubClient

_client = GitHubClient()


def get_client() -> GitHubClient:
    return _client


def _not_implemented(action: str) -> AppError:
    return AppError(
        f"L'action GitHub '{action}' n'est pas encore implémentée.",
        status_code=501,
        code="NOT_IMPLEMENTED",
    )


async def provision_demande(session: Session, demande: Demande) -> None:
    """Crée l'Issue et le dossier de l'acte dans GitHub."""

    raise _not_implemented("provision_demande")


async def commit_acte(session: Session, demande: Demande, message: str) -> str:
    """Commit `acte.json`, `acte.md` et les pièces sur la branche."""

    raise _not_implemented("commit_acte")


async def open_validation_pr(session: Session, demande: Demande) -> None:
    """Ouvre la Pull Request de validation."""

    raise _not_implemented("open_validation_pr")


async def merge_signature(
    session: Session,
    demande: Demande,
    manifest: SignatureManifest,
) -> str:
    """Écrit `signature.json`, fusionne la PR et retourne le SHA du merge."""

    raise _not_implemented("merge_signature")


async def archive_acte(session: Session, demande: Demande, pdf_bytes: bytes) -> str:
    """Copie l'acte dans `archives/`, commit le PDF et pose le tag."""

    raise _not_implemented("archive_acte")


async def get_acte_content(session: Session, demande: Demande) -> tuple[dict[str, Any], str]:
    """Lit `acte.json` et `acte.md` depuis GitHub."""

    raise _not_implemented("get_acte_content")


async def get_pdf(session: Session, demande: Demande) -> bytes:
    """Télécharge le PDF archivé."""

    raise _not_implemented("get_pdf")


async def sync_status_label(session: Session, demande: Demande) -> None:
    """Synchronise le label GitHub avec le statut local."""

    raise _not_implemented("sync_status_label")


async def handle_webhook(session: Session, event: str, payload: dict[str, Any]) -> None:
    """Traite un événement GitHub reçu."""

    raise _not_implemented("handle_webhook")
