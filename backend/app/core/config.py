"""Configuration applicative.

Propriétaire : TSEFACK CALVIN KLEIN (fichier partagé, gelé).
Toute nouvelle variable doit être ajoutée ici, dans .env.example et dans le
docker-compose si nécessaire.


TODO : maintenir le socle et ajouter les tests de non-régression.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Paramètres lus depuis l'environnement et le fichier .env."""

    # Application
    app_name: str = "GestActes API"
    version: str = "0.1.0"
    environment: str = "dev"
    api_prefix: str = "/api/v1"
    log_level: str = "INFO"
    frontend_url: str = "http://localhost:8080"

    # Base de données
    database_url: str = "postgresql+psycopg://gestactes:gestactes@db:5432/gestactes"

    # Authentification
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 7
    cookie_secure: bool = False
    refresh_cookie_name: str = "gestactes_refresh"
    refresh_cookie_path: str = "/api/v1/auth"

    # GitHub
    github_api_url: str = "https://api.github.com"
    github_repo: str = "owner/gestactes-data"
    github_token: str = ""
    github_webhook_secret: str = "change-me"

    # SMTP
    smtp_host: str = "mailpit"
    smtp_port: int = 1025
    smtp_from: str = "no-reply@gestactes.local"

    # Uploads
    max_upload_mb: int = 5
    max_files: int = 3

    # Données de démonstration
    auto_seed: bool = False
    seed_password: str = "Demo1234!"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Retourne la configuration mise en cache."""

    return Settings()


settings = get_settings()
