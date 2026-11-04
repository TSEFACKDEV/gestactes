#!/usr/bin/env bash
# Vérifie l'environnement de développement GestActes.
# Propriétaire : TSEFACK CALVIN KLEIN
# Usage : ./scripts/verify-setup.sh
set -uo pipefail

ok=0
fail=0

pass() {
  echo "  OK   $1"
  ok=$((ok + 1))
}

warn() {
  echo "  WARN $1"
}

error() {
  echo "  FAIL $1"
  fail=$((fail + 1))
}

echo "GestActes — vérification de l'environnement"
echo

echo "Outils"
for command in git docker node npm python3; do
  if command -v "$command" >/dev/null 2>&1; then
    pass "$command"
  else
    error "$command introuvable"
  fi
done

if docker compose version >/dev/null 2>&1; then
  pass "docker compose"
else
  error "docker compose indisponible"
fi

echo
echo "Configuration"
if [ -f .env ]; then
  pass ".env présent"
else
  error ".env absent — exécuter : cp .env.example .env"
fi

if docker compose config --quiet >/dev/null 2>&1; then
  pass "docker-compose.yml valide"
else
  error "docker-compose.yml invalide"
fi

echo
echo "Services"
if docker compose ps --services --filter status=running 2>/dev/null | grep -qx "api"; then
  pass "conteneur api démarré"
else
  warn "conteneur api non démarré — exécuter : docker compose up -d"
fi

if docker compose ps --services --filter status=running 2>/dev/null | grep -qx "web"; then
  pass "conteneur web démarré"
else
  warn "conteneur web non démarré — exécuter : docker compose up -d"
fi

if command -v curl >/dev/null 2>&1; then
  if curl -fsS http://localhost:8000/health >/dev/null 2>&1; then
    pass "API /health répond"
  else
    warn "API /health ne répond pas encore"
  fi

  if curl -fsS -o /dev/null http://localhost:8080 2>/dev/null; then
    pass "frontend répond"
  else
    warn "frontend ne répond pas encore"
  fi
else
  warn "curl absent — vérification HTTP ignorée"
fi

echo
echo "Dépendances locales (optionnel si Docker est utilisé)"
if [ -d backend/.venv ]; then
  pass "backend/.venv présent"
else
  warn "backend/.venv absent — voir README pour l'installation locale"
fi

if [ -d frontend/node_modules ]; then
  pass "frontend/node_modules présent"
else
  warn "frontend/node_modules absent — exécuter : cd frontend && npm install"
fi

echo
echo "Résultat : ${ok} OK, ${fail} erreur(s)."

if [ "$fail" -gt 0 ]; then
  echo
  echo "Corrige les erreurs ci-dessus, puis relance ce script."
  exit 1
fi

echo
echo "Environnement prêt."
echo "Prochaines étapes :"
echo "  1. docker compose up -d"
echo "  2. docker compose exec api python -m app.seed"
echo "  3. Ouvrir http://localhost:8080"
echo "  4. Lire docs/onboarding.md"
