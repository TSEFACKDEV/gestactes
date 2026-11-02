# Répartition des tâches et propriété des fichiers

**Propriétaire du document :** TSEFACK CALVIN KLEIN
**Version :** 1.0
**Principe :** un fichier = un propriétaire. Les fichiers partagés sont gelés.

---

## 1. Règles de fonctionnement

1. **TSEFACK est le seul intégrateur.** Il crée les contrats, relit les PR,
   fusionne dans `develop` et publie `main`.
2. **Les autres membres codent.** Chacun possède un périmètre exclusif.
3. **Aucune PR directe vers `main`.** Les PR ciblent `develop`.
4. **Aucune PR sans issue.** Chaque PR référence une issue.
5. **Une branche = une tâche = une PR.** Durée maximale : 5 jours.
6. **Un fichier partagé ne se modifie pas.** On ouvre une issue et on attend.
7. **La CI doit être verte.** Lint, types, tests et build.
8. **TSEFACK fusionne en squash merge.** Le titre de la PR devient le message.
9. **`main` ne reçoit que des releases.** `develop` est la branche d'intégration.
10. **Les secrets ne sont jamais commités.** `.env` est ignoré.

---

## 2. Équipe et domaines

| Membre | Domaine | Branches principales |
|---|---|---|
| TSEFACK CALVIN KLEIN | Intégration, contrats, CI, releases | `chore/*`, `docs/*`, `release/*` |
| GUEMOGNE GERALDINE ESTHER | Design system, auth, public, partagé | `feat/front-design-system`, `feat/front-auth`, `feat/front-public`, `feat/front-shared` |
| JEUDIEU TSAGUE AUDREY DANIELLE | Parcours citoyen | `feat/front-citizen-*` |
| KOUODZO ZANGUE REGINA | Auth back, utilisateurs, audit | `feat/back-auth-*`, `feat/back-admin-*` |
| LEUKAM TCHEUMALEU MAXIME | Parcours agent | `feat/front-agent-*` |
| METAMMO TEUMA DANIELA CLEDYA | Parcours validateur | `feat/front-validator-*` |
| NDOUNGUE ESSOH ABEL THOMAS | Actes, demandes, workflow | `feat/back-domain-*`, `feat/back-demandes-*`, `feat/back-workflow-*` |
| NOLACK KAWUNJIBI FRANGE PARKER | GitHub, worker, notifications, PDF | `feat/back-github-*`, `feat/back-worker-*`, `feat/back-pdf`, `feat/back-webhooks` |
| NZEUTEM DOMOE EUNICE FELIXTINE | Administration front, suivi projet | `feat/front-admin-*` |
| VOUMIA OUALA DILANE | Qualité, tests, seed, recette, démo | `chore/test-*`, `chore/seed-*`, `docs/recette`, `docs/demo` |

---

## 3. Matrice de propriété

> Les globs sont exclusifs. Si un fichier n'apparaît pas, il appartient à
> TSEFACK (fichier partagé) et ne doit pas être modifié sans issue.

### 3.1 Racine et outillage

| Périmètre | Propriétaire |
|---|---|
| `.github/**` | TSEFACK |
| `.env.example`, `.gitignore`, `.editorconfig` | TSEFACK |
| `docker-compose.yml`, `Makefile` | TSEFACK |
| `README.md`, `CONTRIBUTING.md` | TSEFACK |
| `scripts/setup-github.sh`, `backend/scripts/export_openapi.py` | TSEFACK |
| `scripts/simulate_webhook.py`, `scripts/data-repo/**` | NOLACK |
| `data/demo/**` | VOUMIA |

### 3.2 Backend — socle partagé

| Périmètre | Propriétaire |
|---|---|
| `backend/pyproject.toml`, `backend/Dockerfile`, `backend/.dockerignore` | TSEFACK |
| `backend/app/main.py`, `backend/app/db.py` | TSEFACK |
| `backend/app/core/**` | TSEFACK |
| `backend/app/models/__init__.py`, `base.py`, `enums.py` | TSEFACK |
| `backend/app/schemas/__init__.py`, `common.py` | TSEFACK |
| `backend/app/api/__init__.py`, `router.py`, `routes/__init__.py`, `routes/health.py` | TSEFACK |
| `backend/app/services/__init__.py` | TSEFACK |
| `backend/app/worker/__init__.py` | TSEFACK |
| `backend/tests/test_health.py` | TSEFACK |

### 3.3 Backend — domaines

| Périmètre | Propriétaire |
|---|---|
| `backend/app/models/user.py`, `refresh_token.py`, `password_reset.py`, `audit.py` | KOUODZO |
| `backend/app/schemas/auth.py`, `user.py`, `admin.py` | KOUODZO |
| `backend/app/api/routes/auth.py`, `admin.py` | KOUODZO |
| `backend/app/services/auth_service.py`, `user_service.py`, `audit_service.py`, `stats_service.py` | KOUODZO |
| `backend/tests/test_auth.py`, `test_admin.py` | KOUODZO |
| `backend/app/models/type_acte.py`, `demande.py`, `piece.py` | NDOUNGUE |
| `backend/app/schemas/demande.py`, `acte.py`, `type_acte.py` | NDOUNGUE |
| `backend/app/api/routes/demandes.py`, `types_actes.py` | NDOUNGUE |
| `backend/app/services/demande_service.py`, `workflow_service.py`, `numbering.py`, `type_acte_service.py` | NDOUNGUE |
| `backend/tests/test_demandes.py`, `test_workflow.py` | NDOUNGUE |
| `backend/app/models/notification.py`, `outbox.py`, `webhook_event.py` | NOLACK |
| `backend/app/schemas/notification.py`, `github.py`, `verification.py` | NOLACK |
| `backend/app/api/routes/notifications.py`, `verification.py`, `webhooks.py` | NOLACK |
| `backend/app/services/github_client.py`, `github_service.py`, `notification_service.py`, `outbox_service.py`, `pdf_service.py` | NOLACK |
| `backend/app/worker/main.py`, `jobs.py` | NOLACK |
| `backend/tests/test_github.py`, `test_notifications.py`, `test_webhooks.py` | NOLACK |

### 3.4 Backend — qualité

| Périmètre | Propriétaire |
|---|---|
| `backend/app/seed.py` | VOUMIA |
| `backend/tests/conftest.py`, `test_e2e_api.py` | VOUMIA |
| `data/demo/**` | VOUMIA |
| `docs/tests.md`, `docs/recette.md`, `docs/demo.md` | VOUMIA |

### 3.5 Frontend — socle partagé

| Périmètre | Propriétaire |
|---|---|
| `frontend/package.json`, `package-lock.json` | TSEFACK |
| `frontend/vite.config.ts`, `vitest.config.ts`, `tsconfig.json` | TSEFACK |
| `frontend/postcss.config.js`, `eslint.config.js`, `.prettierrc` | TSEFACK |
| `frontend/index.html`, `Dockerfile`, `.dockerignore`, `nginx.conf`, `public/**` | TSEFACK |
| `frontend/src/main.tsx`, `App.tsx`, `router.tsx`, `vite-env.d.ts` | TSEFACK |
| `frontend/src/types/**`, `lib/**`, `context/**` | TSEFACK |
| `frontend/src/test/**` | VOUMIA |

### 3.6 Frontend — domaines

| Périmètre | Propriétaire |
|---|---|
| `frontend/tailwind.config.ts`, `src/styles/**` | GUEMOGNE |
| `frontend/src/components/ui/**`, `components/layout/**` | GUEMOGNE |
| `frontend/src/features/auth/**`, `features/public/**`, `features/shared/**` | GUEMOGNE |
| `docs/design-system.md` | GUEMOGNE |
| `frontend/src/features/citizen/**` | JEUDIEU |
| `frontend/src/features/agent/**` | LEUKAM |
| `frontend/src/features/validator/**` | METAMMO |
| `frontend/src/features/admin/**` | NZEUTEM |

### 3.7 Documentation

| Document | Propriétaire |
|---|---|
| `docs/revue-cdc.md`, `docs/cahier-des-charges-v2.md` | TSEFACK |
| `docs/repartition-taches.md`, `docs/guide-contribution.md` | TSEFACK |
| `docs/github-setup.md`, `docs/api-contract.md`, `docs/openapi.json` | TSEFACK |
| `CHANGELOG.md` | TSEFACK |
| `docs/architecture.md`, `docs/workflow.md` | NDOUNGUE |
| `docs/design-system.md` | GUEMOGNE |
| `docs/github-integration.md` | NOLACK |
| `docs/tests.md`, `docs/recette.md`, `docs/demo.md` | VOUMIA |

---

## 4. Calendrier et ordre d'intégration

| Phase | Semaine | Objectif | Branches à intégrer |
|---|---|---|---|
| 0 | 1 | Squelette, contrats, CI | `chore/bootstrap`, `chore/ci` |
| 1 | 1–2 | Socle back et design system | `feat/back-domain-models`, `feat/back-auth-core`, `feat/back-github-client`, `feat/front-design-system` |
| 2 | 3–4 | Parcours citoyen | `feat/back-demandes-create`, `feat/back-github-provision`, `feat/front-citizen-*`, `feat/front-auth`, `feat/front-public` |
| 3 | 5 | Parcours agent | `feat/back-workflow-*`, `feat/back-github-branch-pr`, `feat/front-agent-*` |
| 4 | 6 | Validation et signature | `feat/back-signature`, `feat/back-github-merge`, `feat/back-pdf`, `feat/back-webhooks`, `feat/front-validator-*` |
| 5 | 7 | Administration et qualité | `feat/back-admin-*`, `feat/front-admin-*`, `feat/front-shared-*`, `chore/test-*`, `chore/seed-*` |
| 6 | 8 | Recette et release | `docs/recette`, `docs/demo`, `release/v1.0.0` |

**Ordre indicatif d'intégration dans `develop` :**

1. `feat/back-domain-models`
2. `feat/back-auth-core`
3. `feat/back-github-client`
4. `feat/front-design-system`
5. `feat/front-auth`
6. `feat/back-demandes-create`
7. `feat/front-citizen-*`
8. `feat/back-workflow-*`
9. `feat/front-agent-*`
10. `feat/back-github-*`
11. `feat/front-validator-*`
12. `feat/back-signature`, `feat/back-pdf`, `feat/back-webhooks`
13. `feat/back-admin-*`, `feat/front-admin-*`
14. `feat/front-shared-*`
15. `chore/test-*`, `chore/seed-*`, docs
16. `release/v1.0.0`

TSEFACK peut réordonner selon les dépendances réelles. Les membres peuvent
coder en parallèle contre les contrats et les types déjà présents.

---

## 5. Fiches par membre

### 5.1 TSEFACK CALVIN KLEIN — intégrateur

**Mission :** garantir la cohérence, relire, fusionner, publier. Il ne code pas
les fonctionnalités métier.

**Fichiers :** voir sections 3.1, 3.2, 3.5 et 3.7.

**Branches :**

| Branche | Contenu |
|---|---|
| `chore/bootstrap` | Squelette, configs, Docker, CI, docs de pilotage. |
| `chore/contracts` | Mise à jour du contrat API et des types partagés. |
| `chore/ci` | Amélioration des workflows. |
| `docs/cdc-v2` | Cahier des charges corrigé et revue. |
| `release/v1.0.0` | Préparation de la livraison. |
| `fix/integration-<sujet>` | Correction transverse urgente. |

**Tâches :**

- [ ] Initialiser le dépôt, `main`, `develop`, labels, protections.
- [ ] Vérifier que `make check` passe sur `develop`.
- [ ] Relire chaque PR selon la checklist.
- [ ] Fusionner en squash dans `develop`.
- [ ] Maintenir `docs/api-contract.md` et `docs/openapi.json`.
- [ ] Organiser l'ordre d'intégration.
- [ ] Créer `release/v1.0.0`, mettre à jour la version et le changelog.
- [ ] Fusionner `develop` → `main`, taguer `v1.0.0`.
- [ ] Reporter `main` → `develop`.

**Commandes de contrôle :**

```bash
make check
cd backend && .venv/bin/pytest
cd frontend && npm run build
docker compose up --build
```

**Checklist de revue :**

- [ ] La PR cible `develop`.
- [ ] L'issue est liée.
- [ ] Les fichiers appartiennent au propriétaire.
- [ ] Aucun fichier partagé modifié sans accord.
- [ ] La CI est verte.
- [ ] Les cas d'erreur sont couverts.
- [ ] Aucun secret.
- [ ] Le contrat API est respecté.
- [ ] L'UI respecte le design system.
- [ ] Le titre de PR est propre (il devient le message de squash).

---

### 5.2 GUEMOGNE GERALDINE ESTHER — design system, auth, public

**Mission :** fournir les composants, la coque visuelle et les pages
d'authentification/publiques.

**Fichiers :**

- `frontend/tailwind.config.ts`
- `frontend/src/styles/**`
- `frontend/src/components/ui/**`
- `frontend/src/components/layout/**`
- `frontend/src/features/auth/**`
- `frontend/src/features/public/**`
- `frontend/src/features/shared/**`
- `docs/design-system.md`

**Branches et étapes :**

1. `feat/front-design-system`
   - [ ] Finaliser les tokens Tailwind (couleurs, polices, ombres, animations).
   - [ ] Implémenter `Button`, `Input`, `Textarea`, `Select`, `Checkbox`.
   - [ ] Implémenter `Card`, `Badge`, `StatusBadge`, `Alert`, `Modal`.
   - [ ] Implémenter `Table`, `Pagination`, `EmptyState`, `Spinner`, `Skeleton`.
   - [ ] Implémenter `Timeline`, `Tabs`, `FileDropzone`, `Avatar`, `PageHeader`.
   - [ ] Implémenter `AppShell`, `Sidebar`, `Topbar`, `MobileNav`, `PublicLayout`.
   - [ ] Implémenter `ProtectedRoute`, `RoleRoute`.
   - [ ] Ajouter les tests des composants critiques.
   - [ ] Vérifier le rendu mobile 375 px et le focus clavier.

2. `feat/front-auth`
   - [ ] `AuthShell`, `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`.
   - [ ] Connexion avec `useAuth`, redirection selon le rôle.
   - [ ] Gestion des erreurs 401/403/409.
   - [ ] Tests de rendu et de validation.

3. `feat/front-public`
   - [ ] `LandingPage` (hero, fonctionnalités, étapes, CTA).
   - [ ] `VerificationPage` (numéro, résultat, hash, absence de données personnelles).
   - [ ] `NotFoundPage`, `ForbiddenPage`.

4. `feat/front-shared`
   - [ ] `ProfilePage` (nom, prénom, e-mail, rôle).
   - [ ] `NotificationsPage` (liste, compteur, marquage lu).
   - [ ] Tests de rendu.

**Tests :**

```bash
cd frontend
npm run test -- src/components
npm run test -- src/features/auth
npm run test -- src/features/public
npm run typecheck
npm run build
```

**Contraintes :**

- Ne pas modifier `router.tsx`, `lib/**`, `types/**` : demander à TSEFACK.
- Ne pas modifier les features des autres membres.
- Ne pas ajouter d'emoji ni de dégradé décoratif.
- Respecter `prefers-reduced-motion`.

---

### 5.3 JEUDIEU TSAGUE AUDREY DANIELLE — parcours citoyen

**Mission :** permettre au citoyen de consulter le catalogue, déposer une
demande, suivre son dossier et télécharger l'acte.

**Fichiers :** `frontend/src/features/citizen/**`.

**Branches et étapes :**

1. `feat/front-citizen-dashboard`
   - [ ] Tableau de bord, cartes de statistiques, demandes récentes.
   - [ ] États chargement/vide/erreur.
2. `feat/front-citizen-catalogue`
   - [ ] Catalogue des types, cartes, CTA vers le formulaire.
3. `feat/front-citizen-request`
   - [ ] `DynamicForm` pour `text`, `textarea`, `date`, `number`, `select`, `checkbox`.
   - [ ] `PieceUploader` (3 fichiers, 5 Mo, PDF/JPEG/PNG).
   - [ ] Validation des champs requis.
   - [ ] `createDemande` multipart.
   - [ ] Redirection vers le détail après succès.
4. `feat/front-citizen-detail`
   - [ ] Liste avec filtres et pagination.
   - [ ] Détail, données, pièces, timeline.
   - [ ] Annulation (statut `demandee`).
   - [ ] Téléchargement du PDF (statuts `signee`/`archivee`).
   - [ ] Téléchargement des pièces.

**Tests :**

```bash
cd frontend
npm run test -- src/features/citizen
npm run typecheck
npm run build
```

**Critères de conformité :**

- [ ] Un citoyen ne voit que ses demandes.
- [ ] Les erreurs 413/422 sont affichées clairement.
- [ ] Le formulaire est utilisable au clavier.
- [ ] Le bouton d'annulation n'apparaît qu'au statut `demandee`.
- [ ] Le PDF n'est proposé qu'après signature.

---

### 5.4 KOUODZO ZANGUE REGINA — auth back, utilisateurs, audit

**Mission :** sécuriser l'accès, gérer les comptes et le journal d'audit.

**Fichiers :**

- `backend/app/models/user.py`, `refresh_token.py`, `password_reset.py`, `audit.py`
- `backend/app/schemas/auth.py`, `user.py`, `admin.py`
- `backend/app/api/routes/auth.py`, `admin.py`
- `backend/app/services/auth_service.py`, `user_service.py`, `audit_service.py`, `stats_service.py`
- `backend/tests/test_auth.py`, `test_admin.py`

**Branches et étapes :**

1. `feat/back-auth-core`
   - [ ] Inscription citoyen, e-mail normalisé, mot de passe bcrypt.
   - [ ] Connexion, access token, refresh token opaque hashé.
   - [ ] Rotation et révocation du refresh.
   - [ ] `GET /auth/me`, `PATCH /auth/me`.
   - [ ] Tests 201/401/409.
2. `feat/back-auth-reset`
   - [ ] `POST /auth/forgot-password` (réponse constante).
   - [ ] `POST /auth/reset-password` (token 30 min, usage unique).
   - [ ] `POST /auth/change-password`.
   - [ ] Révocation de toutes les sessions après reset.
   - [ ] Tests.
3. `feat/back-admin-users`
   - [ ] Liste paginée, filtres rôle/recherche.
   - [ ] Création agent/validateur/admin.
   - [ ] Modification rôle/état.
   - [ ] Désactivation, protection du dernier admin et de soi-même.
   - [ ] Audit de chaque action.
   - [ ] Tests.
4. `feat/back-admin-audit`
   - [ ] Filtres acteur/action/date, pagination.
   - [ ] `stats_service` : total, par statut, par type, délai moyen.
   - [ ] Tests.
   - [ ] Vérifier l'absence de données personnelles inutiles dans les détails.

**Tests :**

```bash
cd backend
.venv/bin/pytest tests/test_auth.py tests/test_admin.py -q
.venv/bin/ruff check .
.venv/bin/mypy app
```

**Contraintes :**

- Utiliser `core/security.py` et `core/deps.py` sans les modifier.
- Les services `flush`, les routes `commit`.
- Ne jamais renvoyer un hash de mot de passe.
- Les messages d'erreur ne révèlent pas si un e-mail existe.

---

### 5.5 LEUKAM TCHEUMALEU MAXIME — parcours agent

**Mission :** permettre à l'agent de prendre en charge, rédiger et soumettre un
acte.

**Fichiers :** `frontend/src/features/agent/**`.

**Branches et étapes :**

1. `feat/front-agent-queue`
   - [ ] File d'instruction, recherche, filtre statut.
   - [ ] Tableau, pagination, états vide/erreur.
   - [ ] Prise en charge et redirection.
2. `feat/front-agent-instruction`
   - [ ] Éditeur `acte_md`, message de commit.
   - [ ] Enregistrement (commit), complément, soumission.
   - [ ] Affichage de l'historique.
   - [ ] Gestion des conflits 409.
   - [ ] Tests.

**Tests :**

```bash
cd frontend
npm run test -- src/features/agent
npm run typecheck
npm run build
```

**Critères de conformité :**

- [ ] L'agent ne peut agir que sur ses demandes assignées.
- [ ] Le bouton de soumission est désactivé si le contenu est vide.
- [ ] Le complément exige un message.
- [ ] Les actions affichent un retour (toast) et rafraîchissent la file.
- [ ] Aucune donnée d'un autre agent n'est visible.

---

### 5.6 METAMMO TEUMA DANIELA CLEDYA — parcours validateur

**Mission :** permettre au validateur de contrôler, approuver, corriger, rejeter
et signer.

**Fichiers :** `frontend/src/features/validator/**`.

**Branches et étapes :**

1. `feat/front-validator-queue`
   - [ ] File de validation, onglets par statut, recherche, pagination.
2. `feat/front-validator-review`
   - [ ] Contenu de l'acte, `DiffViewer` branché sur `GET /demandes/{id}/diff`.
   - [ ] `DecisionPanel` : approuver, corrections, rejet.
   - [ ] Commentaire obligatoire pour corrections/rejet.
   - [ ] Signature avec confirmation, affichage du hash et du merge.
   - [ ] Historique.
   - [ ] Tests.

**Tests :**

```bash
cd frontend
npm run test -- src/features/validator
npm run typecheck
npm run build
```

**Critères de conformité :**

- [ ] Le rejet est impossible sans commentaire.
- [ ] La signature n'apparaît qu'au statut `validee`.
- [ ] La confirmation de signature est explicite.
- [ ] Le hash est affiché en monospace et lisible.
- [ ] L'historique est cohérent avec les actions.

---

### 5.7 NDOUNGUE ESSOH ABEL THOMAS — actes, demandes, workflow

**Mission :** porter le domaine métier et la machine à états.

**Fichiers :**

- `backend/app/models/type_acte.py`, `demande.py`, `piece.py`
- `backend/app/schemas/demande.py`, `acte.py`, `type_acte.py`
- `backend/app/api/routes/demandes.py`, `types_actes.py`
- `backend/app/services/demande_service.py`, `workflow_service.py`, `numbering.py`, `type_acte_service.py`
- `backend/tests/test_demandes.py`, `test_workflow.py`
- `docs/architecture.md`, `docs/workflow.md`

**Branches et étapes :**

1. `feat/back-domain-models`
   - [ ] Finaliser les modèles et les schémas.
   - [ ] Valider le schéma de formulaire (champs uniques, options).
   - [ ] Numérotation : insertion, flush, `format_numero`.
   - [ ] Catalogue public et admin.
2. `feat/back-demandes-create`
   - [ ] Création avec validation du formulaire et des pièces.
   - [ ] Idempotence `Idempotency-Key`.
   - [ ] Écriture de la demande, des pièces, de l'audit et de l'outbox.
   - [ ] Liste filtrée et autorisation objet.
   - [ ] Détail, annulation.
   - [ ] Tests 201/403/409/413/422.
3. `feat/back-workflow-take-charge`
   - [ ] `apply_transition` dans `workflow_service`.
   - [ ] Prise en charge, assignation, branche, audit, job.
   - [ ] Complément, mise à jour du contenu (commit).
   - [ ] Verrouillage de la demande contre les doubles actions.
4. `feat/back-workflow-submit`
   - [ ] Soumission, ouverture de PR, label, reviewers.
   - [ ] Décisions, historique, diff données/contenu, export CSV.
   - [ ] Tests de chaque transition et des rôles.
5. `feat/back-signature`
   - [ ] Manifeste de signature, hash, merge, champs de signature.
   - [ ] Orchestration avec `github_service`.
   - [ ] Tests de non-régression.

**Tests :**

```bash
cd backend
.venv/bin/pytest tests/test_demandes.py tests/test_workflow.py -q
.venv/bin/ruff check .
.venv/bin/mypy app
```

**Contraintes :**

- Toutes les transitions passent par `workflow_service`.
- Ne pas appeler GitHub directement : déléguer à `github_service`.
- Ne pas stocker le contenu binaire en base.
- Les erreurs métier utilisent `AppError` avec un code stable.
- Les tests de concurrence utilisent deux sessions.

---

### 5.8 NOLACK KAWUNJIBI FRANGE PARKER — GitHub, worker, notifications, PDF

**Mission :** intégrer GitHub, exécuter les jobs, notifier et produire le PDF.

**Fichiers :**

- `backend/app/models/notification.py`, `outbox.py`, `webhook_event.py`
- `backend/app/schemas/notification.py`, `github.py`, `verification.py`
- `backend/app/api/routes/notifications.py`, `verification.py`, `webhooks.py`
- `backend/app/services/github_client.py`, `github_service.py`, `notification_service.py`, `outbox_service.py`, `pdf_service.py`
- `backend/app/worker/main.py`, `jobs.py`
- `backend/tests/test_github.py`, `test_notifications.py`, `test_webhooks.py`
- `scripts/simulate_webhook.py`, `scripts/data-repo/**`
- `docs/github-integration.md`

**Branches et étapes :**

1. `feat/back-github-client`
   - [ ] `GitHubClient` : contents, branches, issues, labels, PR, reviews, merge, tags, commits.
   - [ ] Gestion 404/409/timeouts, headers, token.
   - [ ] Tests `respx`.
2. `feat/back-outbox-worker`
   - [ ] Claim, backoff, `mark_done`, `mark_failed`.
   - [ ] Worker loop, arrêt propre, logs.
   - [ ] Job e-mail et notification.
   - [ ] Tests.
3. `feat/back-github-provision`
   - [ ] Issue + dossier `actes/<type>/<année>/<numéro>/`.
   - [ ] Branche `acte/<année>-<numéro>`, assignment.
   - [ ] Idempotence.
4. `feat/back-github-pr`
   - [ ] Commit `acte.json`, `acte.md`, pièces.
   - [ ] PR, review, merge, tag, archive.
   - [ ] Gestion des erreurs et relances.
5. `feat/back-notifications`
   - [ ] Notification interne + e-mail à chaque transition.
   - [ ] Templates de messages.
   - [ ] Tests.
6. `feat/back-webhooks`
   - [ ] HMAC `X-Hub-Signature-256`, idempotence `X-GitHub-Delivery`.
   - [ ] `pull_request.closed` merged, `pull_request_review`, `issues`.
   - [ ] Traitement/enfilage.
   - [ ] Tests de rejeu.
7. `feat/back-pdf`
   - [ ] ReportLab, numéro, date, signataire, QR code.
   - [ ] Test : le PDF commence par `%PDF`.
   - [ ] Archive + tag.

**Tests :**

```bash
cd backend
.venv/bin/pytest tests/test_github.py tests/test_notifications.py tests/test_webhooks.py -q
.venv/bin/ruff check .
.venv/bin/mypy app
```

**Contraintes :**

- Ne jamais logger le token GitHub.
- Ne jamais appeler GitHub hors du service.
- Les jobs sont idempotents.
- Le worker ne doit pas planter sur un job en échec.
- Les webhooks sont publics mais signés.

---

### 5.9 NZEUTEM DOMOE EUNICE FELIXTINE — administration front et suivi projet

**Mission :** fournir l'interface d'administration et tenir le tableau de bord
de projet.

**Fichiers :** `frontend/src/features/admin/**`.

**Branches et étapes :**

1. `feat/front-admin-users`
   - [ ] Liste, recherche, filtre rôle, pagination.
   - [ ] Création agent/validateur/admin.
   - [ ] Modification, désactivation.
   - [ ] Gestion des erreurs 409.
2. `feat/front-admin-types`
   - [ ] Liste des types, création, modification, désactivation.
   - [ ] Éditeur JSON du schéma + aperçu.
   - [ ] Validation JSON côté client.
3. `feat/front-admin-dashboard`
   - [ ] Statistiques, barres par statut et par type.
   - [ ] Délai moyen.
4. `feat/front-admin-audit`
   - [ ] Journal, filtre action, pagination.
5. **Suivi projet (hors code)**
   - [ ] Mettre à jour GitHub Projects chaque lundi.
   - [ ] Vérifier que chaque issue a un propriétaire et une branche.
   - [ ] Signaler les blocages à TSEFACK.

**Tests :**

```bash
cd frontend
npm run test -- src/features/admin
npm run typecheck
npm run build
```

**Critères de conformité :**

- [ ] L'admin ne peut pas se désactiver lui-même.
- [ ] Le dernier admin est protégé.
- [ ] Les formulaires affichent les erreurs 409/422.
- [ ] Le JSON du schéma est validé avant envoi.
- [ ] Les tableaux sont lisibles sur mobile.

---

### 5.10 VOUMIA OUALA DILANE — qualité, tests, seed, recette

**Mission :** rendre le projet vérifiable et démontrable.

**Fichiers :**

- `backend/app/seed.py`
- `backend/tests/conftest.py`, `test_e2e_api.py`
- `frontend/src/test/**`
- `data/demo/**`
- `docs/tests.md`, `docs/recette.md`, `docs/demo.md`

**Branches et étapes :**

1. `chore/test-fixtures`
   - [ ] Base SQLite en mémoire, override `get_session`.
   - [ ] Fixtures utilisateurs par rôle, headers JWT, type d'acte.
   - [ ] Fabriques de demandes à chaque statut.
2. `chore/seed-demo`
   - [ ] Comptes de démonstration.
   - [ ] Trois types d'actes.
   - [ ] Demandes fictives (optionnel, à partir de la phase 3).
   - [ ] Vérifier l'idempotence du seed.
3. `chore/e2e-scenario`
   - [ ] Scénario API complet : citoyen → agent → validateur → signature.
   - [ ] Vérifier les commits simulés, le PDF, le tag.
   - [ ] Test de sécurité 401/403.
4. `docs/recette`
   - [ ] Scénarios de recette, résultats attendus.
   - [ ] Checklist de démonstration.
5. `docs/demo`
   - [ ] Script de démonstration de 10 minutes.
   - [ ] Comptes, parcours, points à montrer.

**Tests :**

```bash
cd backend
.venv/bin/pytest --cov=app --cov-report=term-missing
cd ../frontend
npm run test
npm run build
```

**Critères de conformité :**

- [ ] Le seed est reproductible et idempotent.
- [ ] Les tests ne dépendent pas du vrai GitHub.
- [ ] Le scénario E2E passe sur une base vide.
- [ ] La recette couvre les critères du cahier des charges.
- [ ] La démonstration tient en 10 minutes.

---

## 6. Workflow Git résumé

```bash
# Démarrer
git checkout develop
git pull origin develop
git checkout -b feat/<domaine>-<sujet>

# Coder et tester
# ...

# Committer
git add <fichiers>
git commit -m "feat(<scope>): <description>"

# Rebaser
git fetch origin
git rebase origin/develop

# Pousser
git push -u origin feat/<domaine>-<sujet>

# Ouvrir la PR
gh pr create --base develop --head feat/<domaine>-<sujet>
```

Détails : `docs/guide-contribution.md`.

---

## 7. Processus de PR et de merge

1. Le membre ouvre la PR vers `develop`.
2. La CI s'exécute.
3. TSEFACK relit.
4. Si des changements sont demandés, le membre pousse sur la même branche.
5. TSEFACK fusionne en squash.
6. Le membre supprime sa branche et se remet à jour.

**TSEFACK ne fusionne jamais :**

- une PR qui touche un fichier d'un autre propriétaire ;
- une PR sans issue ;
- une PR avec la CI rouge ;
- une PR qui contient un secret ;
- une PR qui modifie le contrat API sans mise à jour des types et de la doc.

---

## 8. Definition of Done commune

- [ ] La fonctionnalité fonctionne sur les données de démonstration.
- [ ] Les tests de la feature passent.
- [ ] Les tests existants passent.
- [ ] `ruff`, `mypy`, `eslint`, `tsc` passent.
- [ ] Les cas 401/403/404/409/413/422 sont gérés.
- [ ] Les états chargement/vide/erreur existent (UI).
- [ ] L'accessibilité de base est respectée.
- [ ] Aucun secret ni donnée personnelle inutile.
- [ ] La documentation/le contrat est à jour.
- [ ] La PR est relue et fusionnée par TSEFACK.

---

## 9. Cadence hebdomadaire

| Jour | Action |
|---|---|
| Lundi | Revue du tableau de bord, mise à jour des issues, rebase. |
| Mardi–jeudi | Développement, PR courtes, revues au fil de l'eau. |
| Vendredi | Intégration, `make check`, démonstration interne, bilan. |
| Dimanche | TSEFACK vérifie `develop`, prépare la semaine. |

---

## 10. Protocole de conflit

1. `git status` pour identifier les fichiers.
2. Si le conflit est dans **vos** fichiers : résoudre, `git add`, `git rebase --continue`.
3. Si le conflit est dans un **fichier partagé** : `git rebase --abort`, ouvrir une issue, mentionner TSEFACK.
4. Ne jamais forcer un push sur `develop` ou `main`.
5. Ne jamais résoudre un conflit en supprimant le travail d'un autre.

---

## 11. Checklist de l'intégrateur avant chaque merge

- [ ] La PR cible `develop`.
- [ ] L'issue est liée.
- [ ] Le propriétaire des fichiers est respecté.
- [ ] Aucun fichier partagé modifié sans accord.
- [ ] La CI est verte.
- [ ] Les tests couvrent le cas nominal et les erreurs.
- [ ] Le contrat API est respecté.
- [ ] Les types front correspondent aux schémas back.
- [ ] L'UI respecte le design system.
- [ ] Aucun secret.
- [ ] Le titre de PR est propre.
- [ ] Le squash merge est utilisé.

---

## 12. Release

1. `develop` est stable et vert.
2. TSEFACK crée `release/v1.0.0`.
3. Il met à jour `README.md`, la version et le changelog.
4. PR `release/v1.0.0` → `main`.
5. Merge commit (pas squash) pour conserver la release.
6. Tag :

```bash
git checkout main
git pull origin main
git tag -a v1.0.0 -m "GestActes v1.0.0"
git push origin v1.0.0
```

7. Reporter `main` → `develop`.
8. Publier la release GitHub avec les notes.
