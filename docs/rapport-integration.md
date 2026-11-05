# Rapport d'intégration — 5 novembre 2026

**Auteur :** TSEFACK CALVIN KLEIN
**Branche d'intégration :** `develop`
**Commit :** `739bc6b` (puis commit de ce rapport)
**Objectif :** réconcilier les travaux de l'équipe, corriger les contrats et
vérifier le parcours complet.

---

## 1. Travaux récupérés

- `origin/develop` : branches citoyen, agent, validateur, administration,
  authentification, design, GitHub, worker, notifications, webhooks.
- `origin/main` : catalogue citoyen, revue validateur, tests associés.
- Fusion de `origin/main` dans `develop` avec résolution du conflit sur
  `QueuePage.test.tsx` en conservant les filtres de date de `develop`.

## 2. Corrections d'intégration

### Authentification

- Un seul contexte d'authentification pour toutes les pages.
- Compatibilité avec l'API réelle : cookie `HttpOnly` pour le refresh,
  access token en mémoire.
- Mapping des champs backend (`first_name`, `last_name`, `is_active`) vers les
  pages design (`prenom`, `nom`, `actif`).
- Rôle backend `admin` aligné avec l'interface.
- Synchronisation des deux clients Axios sur le même token.

### Frontend

- `App.tsx` relie désormais :
  - le design public, l'authentification et le tableau de bord citoyen ;
  - le formulaire de demande et le détail citoyen ;
  - la file et l'instruction agent ;
  - la file, la revue et la signature validateur ;
  - l'administration (utilisateurs, types, audit, statistiques) ;
  - le profil et les notifications.
- L'ancienne coquille et la nouvelle coquille partagent le même contexte.
- `AppLayout` pointe vers les vraies routes par rôle.
- Mapping des contrats API : `Page<Demande>` → liste citoyen, statuts
  `en_instruction` → `en-instruction`, vérification publique.
- Validation des numéros `2026-00042` et `ACTE-2026-00042`.
- Libellés d'audit humanisés dans les timelines.
- Champs dynamiques dotés d'un attribut `name` pour l'accessibilité et les tests.
- Police unifiée sur Plus Jakarta Sans.

### Backend

- `outbox_service.enqueue` restauré ; `RUNNING` remplacé par `PROCESSING`.
- `GitHubError` importé ; service GitHub nettoyé.
- Téléchargement des pièces et du PDF branché sur le client GitHub.
- Filtre validateur ajouté à la liste des demandes.
- Nom de branche corrigé (`acte/2026-000042`).
- Idempotence de création protégée par demandeur.
- Lint Ruff, mypy et tests corrigés.

## 3. Vérifications

| Vérification | Résultat |
|---|---|
| Backend Ruff | OK |
| Backend mypy | OK, 63 fichiers |
| Backend pytest | 45 tests passent, 1 skip |
| Frontend ESLint | OK |
| Frontend TypeScript | OK |
| Frontend Vitest | 83 tests passent, 3 todo |
| Frontend build | OK |
| Docker Compose | API, worker, web, db, Mailpit démarrent |
| Parcours citoyen | Dépôt, détail, annulation disponibles |
| Parcours agent | Prise en charge, contenu, soumission |
| Parcours validateur | Revue, décision, signature |
| Vérification publique | Acte signé reconnu valide |
| Administration | Utilisateurs, types, audit, statistiques |
| Responsive | Vérifié à 390 px et 1280 px |

## 4. Points restants

- Provisioning GitHub réel avec un token valide.
- Génération PDF et QR code en production.
- Traitement complet des webhooks et réconciliation.
- Test E2E avec un vrai dépôt `gestactes-data`.
- Recette finale et démonstration.

## 5. Commandes de contrôle

```bash
cd backend
.venv/bin/ruff check .
.venv/bin/mypy app
.venv/bin/pytest

cd ../frontend
npm run lint
npm run typecheck
npm run test
npm run build

cd ..
docker compose up --build
docker compose exec api python -m app.seed
```
