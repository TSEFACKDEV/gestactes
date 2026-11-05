"""Client bas niveau de l'API GitHub avec Retries et ETag.

Propriétaire : NOLACK KAWUNJIBI FRANGE PARKER
"""

import asyncio
import base64
from typing import Any

import httpx

from app.core.config import settings


class GitHubError(Exception):
    """Erreur GitHub générique."""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class GitHubNotFound(GitHubError):
    """Ressource GitHub inexistante."""


class GitHubConflict(GitHubError):
    """Conflit GitHub (branche, PR, fichier)."""


class GitHubClient:
    """Client REST minimal pour le dépôt de données."""

    def __init__(
        self,
        *,
        token: str | None = None,
        repo: str | None = None,
        api_url: str | None = None,
    ) -> None:
        self.token = token if token is not None else settings.github_token
        self.repo = repo or settings.github_repo
        self.api_url = (api_url or settings.github_api_url).rstrip("/")
        # Dictionnaire pour stocker les ETags en mémoire : {url: {"etag": etag, "data": json_response}}
        self._etag_cache: dict[str, dict[str, Any]] = {}

    @property
    def configured(self) -> bool:
        return bool(self.token and self.repo and "/" in self.repo)

    def _headers(self, etag: str | None = None) -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if etag:
            headers["If-None-Match"] = etag
        return headers

    def _repo_path(self, suffix: str) -> str:
        return f"/repos/{self.repo}{suffix}"

    async def _request(
        self, 
        method: str, 
        path: str, 
        max_retries: int = 3, 
        use_cache: bool = False,
        **kwargs: Any
    ) -> httpx.Response:
        """Effectue une requête HTTP avec gestion des exceptions, retries avec backoff et ETag."""
        if not self.configured:
            raise GitHubError("Le client GitHub n'est pas configuré.")

        url = f"{self.api_url}{path}"
        etag = self._etag_cache.get(url, {}).get("etag") if use_cache and method == "GET" else None

        headers = self._headers(etag=etag)
        if "headers" in kwargs:
            headers.update(kwargs.pop("headers"))

        # Gestion des retries avec backoff exponentiel (1s, 2s, 4s)
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.request(
                        method,
                        url,
                        headers=headers,
                        **kwargs,
                    )

                # Gestion du cache 304 Not Modified
                if response.status_code == 304 and url in self._etag_cache:
                    cached_resp = httpx.Response(
                        status_code=200, 
                        json=self._etag_cache[url]["data"]
                    )
                    return cached_resp

                # Stocker dans le cache si ETag présent en retour
                if response.status_code == 200 and "ETag" in response.headers and method == "GET":
                    self._etag_cache[url] = {
                        "etag": response.headers["ETag"],
                        "data": response.json(),
                    }

                # Si succès ou erreur client (4xx), on ne retry pas
                if response.status_code < 500:
                    break

            except (httpx.TimeoutException, httpx.NetworkError) as exc:
                if attempt == max_retries - 1:
                    raise GitHubError(
                        f"Échec de connexion à GitHub après {max_retries} tentatives: {exc}"
                    ) from exc

            # Backoff exponentiel avant la prochaine tentative sur 5xx / timeout
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)

        # Mappage des erreurs
        if response.status_code == 404:
            raise GitHubNotFound("Ressource GitHub introuvable.", 404)
        if response.status_code == 409:
            raise GitHubConflict("Conflit GitHub.", 409)
        if response.status_code >= 400:
            raise GitHubError(
                f"Erreur GitHub {response.status_code}: {response.text[:300]}",
                response.status_code,
            )
        return response

    async def get_file(self, path: str, ref: str = "main") -> dict[str, Any] | None:
        """Lit un fichier du dépôt de données."""
        try:
            response = await self._request(
                "GET",
                self._repo_path(f"/contents/{path}"),
                params={"ref": ref},
                use_cache=True,
            )
        except GitHubNotFound:
            return None
        return response.json()

    async def put_file(
        self,
        path: str,
        content: bytes | str,
        message: str,
        *,
        branch: str = "main",
        sha: str | None = None,
    ) -> dict[str, Any]:
        """Crée ou met à jour un fichier via l'API Contents."""
        raw = content.encode("utf-8") if isinstance(content, str) else content
        payload: dict[str, Any] = {
            "message": message,
            "content": base64.b64encode(raw).decode("ascii"),
            "branch": branch,
        }
        if sha:
            payload["sha"] = sha
        response = await self._request(
            "PUT",
            self._repo_path(f"/contents/{path}"),
            json=payload,
        )
        return response.json()

    async def download_file(self, path: str, ref: str = "main") -> bytes:
        """Télécharge le contenu binaire d'un fichier."""
        data = await self.get_file(path, ref=ref)
        if data is None or "content" not in data:
            raise GitHubNotFound(f"Fichier introuvable: {path}", 404)
        return base64.b64decode(data["content"])

    async def get_branch(self, branch: str) -> dict[str, Any] | None:
        try:
            response = await self._request(
                "GET", self._repo_path(f"/git/ref/heads/{branch}")
            )
        except GitHubNotFound:
            return None
        return response.json()

    async def create_branch(self, branch: str, from_branch: str = "main") -> None:
        """Crée une branche à partir d'une autre."""
        source = await self.get_branch(from_branch)
        if source is None:
            raise GitHubNotFound(f"Branche source introuvable: {from_branch}", 404)
        await self._request(
            "POST",
            self._repo_path("/git/refs"),
            json={"ref": f"refs/heads/{branch}", "sha": source["object"]["sha"]},
        )

    async def create_issue(
        self,
        title: str,
        body: str,
        labels: list[str] | None = None,
    ) -> dict[str, Any]:
        response = await self._request(
            "POST",
            self._repo_path("/issues"),
            json={"title": title, "body": body, "labels": labels or []},
        )
        return response.json()

    async def update_issue(self, number: int, **fields: Any) -> dict[str, Any]:
        response = await self._request(
            "PATCH",
            self._repo_path(f"/issues/{number}"),
            json=fields,
        )
        return response.json()

    async def add_labels(self, number: int, labels: list[str]) -> None:
        await self._request(
            "POST",
            self._repo_path(f"/issues/{number}/labels"),
            json={"labels": labels},
        )

    async def remove_label(self, number: int, label: str) -> None:
        try:
            await self._request(
                "DELETE",
                self._repo_path(f"/issues/{number}/labels/{label}"),
            )
        except GitHubNotFound:
            return

    async def create_pull_request(
        self,
        title: str,
        head: str,
        *,
        base: str = "main",
        body: str = "",
    ) -> dict[str, Any]:
        response = await self._request(
            "POST",
            self._repo_path("/pulls"),
            json={"title": title, "head": head, "base": base, "body": body},
        )
        return response.json()

    async def get_pull_request(self, number: int) -> dict[str, Any]:
        response = await self._request("GET", self._repo_path(f"/pulls/{number}"))
        return response.json()

    async def create_review(
        self,
        number: int,
        *,
        body: str,
        event: str,
    ) -> dict[str, Any]:
        """event : APPROVE, REQUEST_CHANGES ou COMMENT."""
        response = await self._request(
            "POST",
            self._repo_path(f"/pulls/{number}/reviews"),
            json={"body": body, "event": event},
        )
        return response.json()

    async def merge_pull_request(
        self,
        number: int,
        *,
        commit_title: str | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {"merge_method": "merge"}
        if commit_title:
            payload["commit_title"] = commit_title
        response = await self._request(
            "PUT",
            self._repo_path(f"/pulls/{number}/merge"),
            json=payload,
        )
        return response.json()

    async def create_tag(self, tag: str, message: str, sha: str) -> dict[str, Any]:
        """Crée un tag annoté sur un commit."""
        tag_response = await self._request(
            "POST",
            self._repo_path("/git/tags"),
            json={
                "tag": tag,
                "message": message,
                "object": sha,
                "type": "commit",
            },
        )
        tag_data = tag_response.json()
        await self._request(
            "POST",
            self._repo_path("/git/refs"),
            json={"ref": f"refs/tags/{tag}", "sha": tag_data["sha"]},
        )
        return tag_data

    async def get_commits(
        self,
        *,
        path: str | None = None,
        per_page: int = 30,
    ) -> list[dict[str, Any]]:
        params: dict[str, Any] = {"per_page": per_page}
        if path:
            params["path"] = path
        response = await self._request(
            "GET",
            self._repo_path("/commits"),
            params=params,
        )
        return response.json()