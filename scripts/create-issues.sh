#!/usr/bin/env bash
# Crée les issues initiales du projet GestActes.
# Propriétaire : TSEFACK CALVIN KLEIN
# Prérequis : gh CLI authentifié, labels créés avec scripts/setup-github.sh.
# Usage : ./scripts/create-issues.sh [owner/repo]
set -euo pipefail

REPO="${1:-}"
if [ -z "$REPO" ]; then
  REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI introuvable. Installer GitHub CLI ou créer les issues manuellement."
  exit 1
fi

if ! gh label list --repo "$REPO" --limit 100 2>/dev/null | grep -q "priorite:haute"; then
  echo "Labels absents. Exécuter d'abord : ./scripts/setup-github.sh $REPO"
  exit 1
fi

create_issue() {
  local title="$1"
  local label="$2"
  local body="$3"

  if gh issue list --repo "$REPO" --state all --search "$title in:title" \
    --json title -q '.[].title' 2>/dev/null | grep -Fxq "$title"; then
    echo "  existe déjà : $title"
    return
  fi

  gh issue create --repo "$REPO" --title "$title" --body "$body" --label "$label" >/dev/null
  echo "  créée : $title"
}

echo "Création des issues initiales pour ${REPO}"

create_issue \
  "[TSEFACK] Configurer GitHub et protéger les branches" \
  "priorite:haute" \
  "$(cat <<'EOF'
## Objectif
Configurer le dépôt pour que l'équipe puisse travailler sans conflit.

## Checklist
- [ ] Remplacer le handle dans `.github/CODEOWNERS`.
- [ ] Protéger `main` et `develop` (PR obligatoire, 1 revue, CI verte).
- [ ] Créer les labels avec `scripts/setup-github.sh`.
- [ ] Configurer le webhook GitHub.
- [ ] Mettre `develop` comme branche par défaut pendant le projet.
- [ ] Vérifier qu'un membre peut ouvrir une PR vers `develop`.

## Références
`docs/github-setup.md`, `docs/guide-contribution.md`.
EOF
)"

create_issue \
  "[TSEFACK] Intégrer les PR et préparer la release v1.0.0" \
  "priorite:haute" \
  "$(cat <<'EOF'
## Objectif
Relire, fusionner et publier une version stable.

## Checklist
- [ ] Relire chaque PR selon la checklist.
- [ ] Fusionner en squash dans `develop`.
- [ ] Vérifier `make check` sur `develop`.
- [ ] Créer `release/v1.0.0`.
- [ ] Fusionner `develop` → `main`.
- [ ] Taguer `v1.0.0`.
- [ ] Reporter `main` → `develop`.

## Références
`docs/repartition-taches.md`, section 5.1 et 12.
EOF
)"

create_issue \
  "[GUEMOGNE] Finaliser le design system" \
  "priorite:haute" \
  "$(cat <<'EOF'
## Objectif
Fournir des composants soft, accessibles et cohérents.

## Branche
`feat/front-design-system`

## Fichiers
`frontend/tailwind.config.ts`, `frontend/src/styles/**`, `frontend/src/components/ui/**`, `frontend/src/components/layout/**`.

## Checklist
- [ ] Finaliser les tokens et les composants UI.
- [ ] Vérifier le responsive 375 px.
- [ ] Vérifier le focus clavier et les labels.
- [ ] Ajouter les tests de composants critiques.
- [ ] Mettre à jour `docs/design-system.md`.

## Tests
`cd frontend && npm run test && npm run build`
EOF
)"

create_issue \
  "[GUEMOGNE] Finaliser auth, pages publiques et partagées" \
  "priorite:haute" \
  "$(cat <<'EOF'
## Objectif
Finaliser les pages de connexion, d'inscription, de vérification, le profil et les notifications.

## Branches
`feat/front-auth`, `feat/front-public`, `feat/front-shared`

## Fichiers
`frontend/src/features/auth/**`, `frontend/src/features/public/**`, `frontend/src/features/shared/**`.

## Checklist
- [ ] Tester les erreurs 401/403/409.
- [ ] Vérifier la redirection selon le rôle.
- [ ] Tester la vérification publique.
- [ ] Tester le profil et les notifications.
- [ ] Vérifier le rendu mobile.

## Tests
`cd frontend && npm run test -- src/features/auth src/features/public src/features/shared`
EOF
)"

create_issue \
  "[JEUDIEU] Dashboard et catalogue citoyen" \
  "priorite:haute" \
  "$(cat <<'EOF'
## Objectif
Afficher le tableau de bord et le catalogue des types d'actes.

## Branche
`feat/front-citizen-dashboard`

## Fichiers
`frontend/src/features/citizen/pages/DashboardPage.tsx`, `CataloguePage.tsx`.

## Checklist
- [ ] Brancher les données réelles.
- [ ] Gérer chargement, vide et erreur.
- [ ] Vérifier la navigation vers le formulaire.
- [ ] Tester le rendu mobile.

## Tests
`cd frontend && npm run test -- src/features/citizen`
EOF
)"

create_issue \
  "[JEUDIEU] Formulaire, suivi et détail de demande" \
  "priorite:haute" \
  "$(cat <<'EOF'
## Objectif
Permettre le dépôt, le suivi, l'annulation et le téléchargement d'une demande.

## Branche
`feat/front-citizen-request`

## Fichiers
`frontend/src/features/citizen/pages/NewRequestPage.tsx`, `RequestsPage.tsx`, `RequestDetailPage.tsx`, `components/**`.

## Checklist
- [ ] Formulaire dynamique et validation des champs requis.
- [ ] Upload 3 fichiers / 5 Mo / PDF-JPEG-PNG.
- [ ] Liste filtrée et paginée.
- [ ] Détail, timeline, pièces, PDF.
- [ ] Annulation uniquement au statut `demandee`.
- [ ] Tests.

## Références
`docs/api-contract.md`, `docs/design-system.md`.
EOF
)"

create_issue \
  "[KOUODZO] Auth back, reset et sécurité" \
  "priorite:haute" \
  "$(cat <<'EOF'
## Objectif
Finaliser l'authentification, la rotation des tokens et le reset de mot de passe.

## Branches
`feat/back-auth-core`, `feat/back-auth-reset`

## Fichiers
`backend/app/services/auth_service.py`, `backend/app/api/routes/auth.py`, `backend/tests/test_auth.py`.

## Checklist
- [ ] Inscription, connexion, refresh, logout.
- [ ] Reset de mot de passe à usage unique.
- [ ] Révocation de toutes les sessions.
- [ ] Tests 201/401/403/409/422.
- [ ] Aucun hash de mot de passe exposé.

## Tests
`cd backend && .venv/bin/pytest tests/test_auth.py -q`
EOF
)"

create_issue \
  "[KOUODZO] Administration utilisateurs, audit et statistiques" \
  "priorite:moyenne" \
  "$(cat <<'EOF'
## Objectif
Finaliser les écrans et endpoints d'administration.

## Branches
`feat/back-admin-users`, `feat/back-admin-audit`

## Fichiers
`backend/app/services/user_service.py`, `audit_service.py`, `stats_service.py`, `backend/app/api/routes/admin.py`, `backend/tests/test_admin.py`.

## Checklist
- [ ] CRUD utilisateurs.
- [ ] Protection du dernier admin et de soi-même.
- [ ] Filtres et pagination de l'audit.
- [ ] Statistiques par statut et par type.
- [ ] Tests.

## Tests
`cd backend && .venv/bin/pytest tests/test_admin.py -q`
EOF
)"

create_issue \
  "[LEUKAM] File agent et instruction" \
  "priorite:haute" \
  "$(cat <<'EOF'
## Objectif
Permettre à l'agent de prendre en charge, rédiger et soumettre un acte.

## Branches
`feat/front-agent-queue`, `feat/front-agent-instruction`

## Fichiers
`frontend/src/features/agent/**`.

## Checklist
- [ ] File, recherche, filtre, pagination.
- [ ] Prise en charge.
- [ ] Éditeur de brouillon et commit.
- [ ] Complément et soumission.
- [ ] Historique.
- [ ] Tests et gestion 409.

## Tests
`cd frontend && npm run test -- src/features/agent`
EOF
)"

create_issue \
  "[METAMMO] File validateur, revue et signature" \
  "priorite:haute" \
  "$(cat <<'EOF'
## Objectif
Permettre au validateur de contrôler, décider et signer.

## Branches
`feat/front-validator-queue`, `feat/front-validator-review`

## Fichiers
`frontend/src/features/validator/**`.

## Checklist
- [ ] File et onglets par statut.
- [ ] Revue, diff, historique.
- [ ] Approuver / corrections / rejet motivé.
- [ ] Signature avec confirmation.
- [ ] Affichage du hash et du merge.
- [ ] Tests.

## Tests
`cd frontend && npm run test -- src/features/validator`
EOF
)"

create_issue \
  "[NDOUNGUE] Modèles, demandes et workflow" \
  "priorite:haute" \
  "$(cat <<'EOF'
## Objectif
Implémenter le domaine et la machine à états.

## Branches
`feat/back-domain-models`, `feat/back-demandes-create`, `feat/back-workflow-*`, `feat/back-signature`

## Fichiers
`backend/app/models/{type_acte,demande,piece}.py`, `backend/app/services/{demande_service,workflow_service,numbering,type_acte_service}.py`, `backend/app/api/routes/demandes.py`, `types_actes.py`.

## Checklist
- [ ] Création avec validation et pièces.
- [ ] Liste filtrée et autorisation objet.
- [ ] Prise en charge, complément, contenu.
- [ ] Soumission, décision, historique, diff, CSV.
- [ ] Signature et manifeste.
- [ ] Tests de transitions et de concurrence.

## Tests
`cd backend && .venv/bin/pytest tests/test_demandes.py tests/test_workflow.py -q`
EOF
)"

create_issue \
  "[NOLACK] GitHub, worker, notifications, PDF et webhooks" \
  "priorite:haute" \
  "$(cat <<'EOF'
## Objectif
Brancher GitHub, les jobs, les notifications et le PDF.

## Branches
`feat/back-github-client`, `feat/back-outbox-worker`, `feat/back-github-*`, `feat/back-notifications`, `feat/back-webhooks`, `feat/back-pdf`

## Fichiers
`backend/app/services/github_client.py`, `github_service.py`, `notification_service.py`, `outbox_service.py`, `pdf_service.py`, `backend/app/worker/**`, `backend/app/api/routes/webhooks.py`.

## Checklist
- [ ] Client GitHub et erreurs.
- [ ] Worker outbox et backoff.
- [ ] Issue, branche, commit, PR, merge, tag.
- [ ] Notifications et e-mails.
- [ ] Webhooks HMAC idempotents.
- [ ] PDF et QR code.
- [ ] Tests respx.

## Tests
`cd backend && .venv/bin/pytest tests/test_github.py tests/test_notifications.py tests/test_webhooks.py -q`
EOF
)"

create_issue \
  "[NZEUTEM] Administration front et suivi projet" \
  "priorite:moyenne" \
  "$(cat <<'EOF'
## Objectif
Finaliser l'interface d'administration et tenir le tableau de bord.

## Branches
`feat/front-admin-users`, `feat/front-admin-types`, `feat/front-admin-dashboard`, `feat/front-admin-audit`

## Fichiers
`frontend/src/features/admin/**`.

## Checklist
- [ ] Utilisateurs : liste, création, modification, désactivation.
- [ ] Types d'actes : CRUD et éditeur JSON.
- [ ] Statistiques.
- [ ] Audit.
- [ ] Mise à jour hebdomadaire de GitHub Projects.
- [ ] Tests.

## Tests
`cd frontend && npm run test -- src/features/admin`
EOF
)"

create_issue \
  "[VOUMIA] Tests, seed, recette et démonstration" \
  "priorite:moyenne" \
  "$(cat <<'EOF'
## Objectif
Rendre le projet vérifiable et démontrable.

## Branches
`chore/test-fixtures`, `chore/seed-demo`, `chore/e2e-scenario`, `docs/recette`, `docs/demo`

## Fichiers
`backend/tests/conftest.py`, `backend/tests/test_e2e_api.py`, `backend/app/seed.py`, `frontend/src/test/**`, `data/demo/**`, `docs/tests.md`, `docs/recette.md`, `docs/demo.md`.

## Checklist
- [ ] Fixtures et base de test.
- [ ] Seed idempotent.
- [ ] Scénario E2E API.
- [ ] Tests de sécurité.
- [ ] Recette R-01 à R-11.
- [ ] Script de démonstration.

## Tests
`cd backend && .venv/bin/pytest` et `cd frontend && npm run test`
EOF
)"

echo
echo "Issues initiales traitées."
echo "Prochaine étape : les assigner dans GitHub Projects et vérifier les labels."
