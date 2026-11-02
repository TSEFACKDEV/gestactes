"""Erreurs applicatives et handlers HTTP.

Propriétaire : TSEFACK CALVIN KLEIN (socle partagé, gelé).


TODO : maintenir le socle et ajouter les tests de non-régression.
"""

import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.logging import request_id_ctx

logger = logging.getLogger("gestactes")

STATUS_CODES: dict[int, str] = {
    400: "BAD_REQUEST",
    401: "UNAUTHENTICATED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    413: "FILE_TOO_LARGE",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMITED",
    500: "INTERNAL_ERROR",
    502: "GITHUB_UNAVAILABLE",
    503: "SERVICE_UNAVAILABLE",
}


class AppError(Exception):
    """Erreur métier avec code stable et détails optionnels."""

    def __init__(
        self,
        message: str,
        status_code: int = 400,
        code: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code or STATUS_CODES.get(status_code, "ERROR")
        self.details = details or {}


def error_body(
    code: str,
    message: str,
    details: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Construit l'enveloppe d'erreur standard."""

    return {
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
            "request_id": request_id_ctx.get(),
        }
    }


def register_exception_handlers(app: FastAPI) -> None:
    """Enregistre les handlers globaux."""

    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=error_body(exc.code, exc.message, exc.details),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        _: Request, exc: RequestValidationError
    ) -> JSONResponse:
        details: dict[str, str] = {}
        for error in exc.errors():
            location = ".".join(str(part) for part in error.get("loc", []) if part != "body")
            details[location or "corps"] = error.get("msg", "Valeur invalide.")
        return JSONResponse(
            status_code=422,
            content=error_body(
                "VALIDATION_ERROR",
                "Certaines données sont invalides.",
                details,
            ),
        )

    @app.exception_handler(HTTPException)
    async def http_error_handler(_: Request, exc: HTTPException) -> JSONResponse:
        message = exc.detail if isinstance(exc.detail, str) else "Erreur HTTP."
        return JSONResponse(
            status_code=exc.status_code,
            content=error_body(
                STATUS_CODES.get(exc.status_code, "HTTP_ERROR"),
                message,
            ),
            headers=exc.headers,
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Erreur non gérée sur %s", request.url.path, exc_info=exc)
        return JSONResponse(
            status_code=500,
            content=error_body(
                "INTERNAL_ERROR",
                "Une erreur interne est survenue. Réessayez plus tard.",
            ),
        )
