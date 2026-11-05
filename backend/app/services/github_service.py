"""Service métier GitHub pour l'automatisation des actes administratifs.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
"""

import json
from typing import Any

from sqlmodel import Session

from app.core.errors import AppError
from app.models import Demande
from app.schemas.acte import SignatureManifest
from app.services.github_client import GitHubClient, GitHubConflict, GitHubError

_client = GitHubClient()


def get_client() -> GitHubClient:
    return _client


def _branch_name(demande: Demande) -> str:
    """Génère le nom de la branche normalisé pour une demande."""
    return f"demande-{demande.id}-{demande.numero}"


async def provision_demande(session: Session, demande: Demande) -> None:
    """Crée l'Issue GitHub correspondante et initialise la branche dédiée de la demande."""
    client = get_client()
    branch = _branch_name(demande)

    # 1. Création idempotente de la branche à partir de main
    try:
        await client.create_branch(branch, from_branch="main")
    except GitHubConflict:
        # La branche existe déjà (idempotence)
        pass

    # Récupération sécurisée du type de la demande
    demande_type = getattr(demande, "type", getattr(demande, "acte_type", "document"))

    # 2. Création de l'Issue de suivi sur GitHub
    await client.create_issue(
        title=f"Demande #{demande.numero} - {demande_type}",
        body=f"Suivi de la demande administrative ID {demande.id}.",
        labels=["demande", str(demande_type)],
    )

async def commit_acte(session: Session, demande: Demande, message: str) -> str:
    """Commit `acte.json` et `acte.md` sur la branche de la demande de façon idempotente."""
    client = get_client()
    branch = _branch_name(demande)
    path_json = f"actes/{demande.numero}/acte.json"
    path_md = f"actes/{demande.numero}/acte.md"

    # Préparation des contenus (JSON canonique et Markdown associé)
    acte_data = {
        "numero": demande.numero,
        "type": getattr(demande, "type", f"type-{demande.type_acte_id}"),
        "demandeur": {"id": demande.demandeur_id, "nom": "", "prenom": ""},
        "donnees": demande.donnees,
        "instruction": {"agent_id": None},
    }
    json_content = json.dumps(acte_data, ensure_ascii=False, indent=2, sort_keys=True)
    md_content = f"# Acte Administratif : {demande.numero}\n\nType : {getattr(demande, "type", f"type-{demande.type_acte_id}")}\n"

    # Récupération des SHA existants si les fichiers existent déjà (nécessaire pour l'API GitHub Contents en PUT)
    existing_json = await client.get_file(path_json, ref=branch)
    sha_json = existing_json.get("sha") if existing_json else None

    existing_md = await client.get_file(path_md, ref=branch)
    sha_md = existing_md.get("sha") if existing_md else None

    # Commit du fichier JSON
    res_json = await client.put_file(
        path=path_json,
        content=json_content,
        message=f"feat(acte): mise à jour acte.json - {message}",
        branch=branch,
        sha=sha_json,
    )

    # Commit du fichier Markdown
    await client.put_file(
        path=path_md,
        content=md_content,
        message=f"feat(acte): mise à jour acte.md - {message}",
        branch=branch,
        sha=sha_md,
    )

    return res_json.get("commit", {}).get("sha", "")


async def open_validation_pr(session: Session, demande: Demande) -> None:
    """Ouvre une Pull Request de validation pour la demande."""
    client = get_client()
    branch = _branch_name(demande)

    try:
        await client.create_pull_request(
            title=f"Validation de l'acte #{demande.numero}",
            head=branch,
            base="main",
            body=f"PR automatique pour la validation et signature de la demande #{demande.numero}.",
        )
    except GitHubError as exc:
        # Ignore si la PR existe déjà
        if "A pull request already exists" not in str(exc):
            raise


async def merge_signature(
    session: Session,
    demande: Demande,
    manifest: SignatureManifest,
) -> str:
    """Écrit `signature.json`, fusionne la PR associée et retourne le SHA du commit de merge."""
    client = get_client()
    branch = _branch_name(demande)
    path_sig = f"actes/{demande.numero}/signature.json"

    # 1. Commit du manifeste de signature
    sig_content = manifest.model_dump_json(indent=2)
    existing_sig = await client.get_file(path_sig, ref=branch)
    sha_sig = existing_sig.get("sha") if existing_sig else None

    await client.put_file(
        path=path_sig,
        content=sig_content,
        message=f"chore(signature): ajout du manifeste de signature pour #{demande.numero}",
        branch=branch,
        sha=sha_sig,
    )

    # 2. Recherche de la Pull Request ouverte pour cette branche
    # (Par simplicité, on utilise l'API de merge si la PR est connue ou créée)
    prs = await client._request("GET", client._repo_path("/pulls"), params={"head": f"{client.repo.split('/')[0]}:{branch}", "state": "open"})
    pr_list = prs.json()
    
    if pr_list:
        pr_number = pr_list[0]["number"]
        merge_res = await client.merge_pull_request(pr_number, commit_title=f"Merge signature acte #{demande.numero}")
        return merge_res.get("sha", "")
    
    raise AppError("Aucune Pull Request ouverte trouvée pour fusionner la signature.", status_code=404)


async def archive_acte(session: Session, demande: Demande, pdf_bytes: bytes) -> str:
    """Copie l'acte dans `archives/`, commit le PDF sur main et pose un tag Git."""
    client = get_client()
    archive_path = f"archives/acte-{demande.numero}.pdf"

    # 1. Commit du PDF final sur la branche principale (main)
    res_pdf = await client.put_file(
        path=archive_path,
        content=pdf_bytes,
        message=f"archive(acte): archivage PDF officiel pour #{demande.numero}",
        branch="main",
    )
    commit_sha = res_pdf.get("commit", {}).get("sha", "")

    # 2. Création d'un tag Git annoté pour l'acte archivé
    if commit_sha:
        tag_name = f"v-acte-{demande.numero}"
        try:
            await client.create_tag(tag=tag_name, message=f"Acte officiel archivé #{demande.numero}", sha=commit_sha)
        except Exception:
            pass # Tag potentiellement existant

    return commit_sha


async def download_file(path: str, ref: str = "main") -> bytes:
    """Télécharge un fichier du dépôt de données."""
    return await get_client().download_file(path, ref=ref)


async def get_acte_content(session: Session, demande: Demande) -> tuple[dict[str, Any], str]:
    """Lit `acte.json` et `acte.md` depuis GitHub."""
    client = get_client()
    branch = _branch_name(demande)
    
    path_json = f"actes/{demande.numero}/acte.json"
    path_md = f"actes/{demande.numero}/acte.md"

    json_bytes = await client.download_file(path_json, ref=branch)
    md_bytes = await client.download_file(path_md, ref=branch)

    acte_json = json.loads(json_bytes.decode("utf-8"))
    acte_md = md_bytes.decode("utf-8")

    return acte_json, acte_md


async def get_pdf(session: Session, demande: Demande) -> bytes:
    """Télécharge le PDF archivé depuis le dossier `archives/`."""
    client = get_client()
    archive_path = f"archives/acte-{demande.numero}.pdf"
    return await client.download_file(archive_path, ref="main")


async def sync_status_label(session: Session, demande: Demande) -> None:
    """Synchronise le label GitHub de l'Issue avec le statut local de la demande."""
    # Optionnel selon l'avancement des issues
    pass


async def handle_webhook(session: Session, event: str, payload: dict[str, Any]) -> None:
    """Traite un événement webhook GitHub reçu."""
    # Logique de traitement des webhooks (ex: PR mergée -> déclencher la suite)
    pass