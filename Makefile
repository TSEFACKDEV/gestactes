# ============================================================
# GestActes — commandes de développement
# ============================================================

.PHONY: help setup up down logs seed test test-back test-front lint lint-back lint-front check openapi clean

help:
	@echo "GestActes — commandes disponibles"
	@echo "  make setup       Copier .env.example vers .env si absent"
	@echo "  make up          Construire et démarrer Docker Compose"
	@echo "  make down        Arrêter les conteneurs"
	@echo "  make logs        Suivre les logs"
	@echo "  make seed        Charger les données de démonstration"
	@echo "  make test        Lancer tous les tests"
	@echo "  make test-back   Tests back-end"
	@echo "  make test-front  Tests front-end"
	@echo "  make lint        Lint back + front"
	@echo "  make check       Lint + tests + build"
	@echo "  make openapi     Exporter le contrat OpenAPI"
	@echo "  make clean       Nettoyer les artefacts locaux"

setup:
	@test -f .env || cp .env.example .env
	@echo "Fichier .env prêt. Remplacer les secrets avant utilisation."

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f --tail=100

seed:
	docker compose exec api python -m app.seed

test: test-back test-front

test-back:
	cd backend && pytest

test-front:
	cd frontend && npm run test

lint: lint-back lint-front

lint-back:
	cd backend && ruff check . && mypy app

lint-front:
	cd frontend && npm run lint && npm run typecheck

check: lint test
	cd frontend && npm run build

openapi:
	cd backend && python scripts/export_openapi.py

clean:
	find . -type d -name "__pycache__" -prune -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -prune -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -prune -exec rm -rf {} +
	rm -rf frontend/dist frontend/coverage backend/coverage .coverage
