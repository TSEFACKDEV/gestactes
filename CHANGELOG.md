# Changelog

Toutes les évolutions notables de GestActes sont documentées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

### Added

- Squelette complet du projet : frontend React, API FastAPI, worker, PostgreSQL,
  Nginx, Docker Compose.
- Design system soft : Tailwind, Manrope/Inter, icônes Lucide, animations
  discrètes.
- Authentification de base : inscription, connexion, refresh, logout, profil.
- Catalogue des types d'actes et données de démonstration.
- Contrat API, workflow, architecture, design system, tests, recette et guide
  de contribution.
- CI GitHub Actions pour le backend et le frontend.
- Script de simulation de webhook GitHub.
- Modèle de dépôt de données `gestactes-data`.

### TODO

- Implémenter les parcours demandes, instruction, validation, signature.
- Brancher GitHub : Issues, branches, PR, reviews, merge, tags.
- Implémenter le worker outbox, les notifications et le PDF.
- Finaliser l'administration, l'audit et les statistiques.
- Compléter les tests et la recette.

## [0.1.0] - 2026-11-02

### Added

- Initialisation du dépôt, de la structure et de la documentation.
- Branches `main` et `develop`.
