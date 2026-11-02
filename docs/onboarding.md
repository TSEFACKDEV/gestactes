# Onboarding — premier jour dans GestActes

**Public :** tout membre invité sur le dépôt
**Temps de mise en route :** 30 à 45 minutes
**Objectif :** cloner, lancer, comprendre son périmètre, créer sa première branche
et ouvrir sa première PR sans bloquer l'équipe.

---

## 1. Ce que tu vas faire aujourd'hui

1. Accepter l'invitation GitHub.
2. Cloner le dépôt et passer sur la branche `develop`.
3. Lancer l'application avec Docker.
4. Charger les données de démonstration.
5. Lire ton périmètre dans `docs/repartition-taches.md`.
6. Créer ta première branche.
7. Coder une petite tâche.
8. Ouvrir une PR vers `develop`.
9. Attendre la revue de TSEFACK.

---

## 2. Ordre de lecture

| Ordre | Document | Pourquoi |
|---|---|---|
| 1 | `README.md` | Comprendre le projet, les fonctionnalités et l'architecture. |
| 2 | `docs/onboarding.md` | Savoir quoi faire maintenant. |
| 3 | `docs/repartition-taches.md` | Trouver ton nom, tes fichiers, tes branches et tes tâches. |
| 4 | `docs/guide-contribution.md` | Connaître les commandes Git et le processus de PR. |
| 5 | `docs/api-contract.md` | Si tu touches au backend ou au frontend connecté. |
| 6 | `docs/design-system.md` | Si tu touches à l'interface. |
| 7 | `docs/workflow.md` | Si tu touches au cycle de vie d'un acte. |
| 8 | `docs/tests.md` | Savoir comment tester. |

Ne lis pas tout d'un coup. Les documents 1 à 4 suffisent pour le premier jour.

---

## 3. Jour 1 — checklist

### 3.1 Accepter l'invitation

- [ ] Ouvrir l'e-mail ou la notification GitHub.
- [ ] Accepter l'invitation au dépôt `gestactes`.
- [ ] Vérifier que tu vois le dépôt dans GitHub.

Rôle donné par TSEFACK : **Write**. Tu peux créer des branches et ouvrir des
PR, mais pas pousser directement sur `main` ou `develop`.

### 3.2 Cloner et se placer sur develop

```bash
git clone git@github.com:<organisation>/gestactes.git
cd gestactes
git checkout develop
git pull origin develop
```

> La branche de travail est **`develop`**. `main` est réservée aux releases.
> Si tu clones et que tu es sur `main`, fais `git checkout develop`.

### 3.3 Configurer ton identité

```bash
git config user.name "PRENOM NOM"
git config user.email "ton.email@example.com"
```

Utilise la même adresse que ton compte GitHub.

### 3.4 Créer ton fichier d'environnement

```bash
cp .env.example .env
```

Ne commite jamais `.env`. Il est déjà dans `.gitignore`.

### 3.5 Lancer l'application

```bash
docker compose up --build
```

Dans un second terminal :

```bash
docker compose exec api python -m app.seed
```

Ouvrir :

- Frontend : http://localhost:8080
- API / Swagger : http://localhost:8000/docs
- Mailpit : http://localhost:8025

Se connecter avec `citoyen@gestactes.com` / `Demo1234!`.

### 3.6 Vérifier que tout fonctionne

```bash
./scripts/verify-setup.sh
```

Ou manuellement :

```bash
curl http://localhost:8000/health
curl -I http://localhost:8080
```

Tu dois voir `200 OK`.

### 3.7 Lire ton périmètre

Ouvrir `docs/repartition-taches.md` et chercher ton nom.

Tu y trouveras :

- tes dossiers et fichiers exclusifs ;
- tes branches par étape ;
- tes tâches en checklist ;
- tes commandes de test ;
- tes critères de conformité.

### 3.8 Créer ta première branche

Utiliser la branche indiquée dans le tableau du premier jour ci-dessous.

```bash
git checkout develop
git pull origin develop
git checkout -b feat/<ton-domaine>-<ton-sujet>
```

### 3.9 Coder, tester, committer

```bash
# Backend
cd backend
.venv/bin/ruff check .
.venv/bin/mypy app
.venv/bin/pytest

# Frontend
cd frontend
npm run lint
npm run typecheck
npm run test
npm run build
```

Puis :

```bash
git add <tes-fichiers>
git commit -m "feat(<scope>): <description>"
```

### 3.10 Ouvrir la PR

```bash
git fetch origin
git rebase origin/develop
git push -u origin feat/<ton-domaine>-<ton-sujet>
gh pr create --base develop --head feat/<ton-domaine>-<ton-sujet>
```

Ou via GitHub : **Compare & pull request**, base `develop`.

Remplir le template :

- résumé ;
- issue liée ;
- comment tester ;
- checklist ;
- confirmation que tu n'as touché que tes fichiers.

### 3.11 Attendre la revue

- Ne clique pas sur **Merge**.
- TSEFACK relit, commente, puis fusionne en squash si tout est bon.
- Si des changements sont demandés, pousse sur la même branche.
- Après le merge, supprime ta branche et remets `develop` à jour.

```bash
git checkout develop
git pull origin develop
git branch -d feat/<ton-domaine>-<ton-sujet>
git push origin --delete feat/<ton-domaine>-<ton-sujet>
```

---

## 4. Tableau du premier jour

| Membre | Première branche | Premiers fichiers | Premier test |
|---|---|---|---|
| TSEFACK | `chore/github-setup` | `.github/**`, `docs/github-setup.md` | `./scripts/setup-github.sh` |
| GUEMOGNE | `feat/front-design-system` | `frontend/src/components/ui/Button.tsx`, `Input.tsx`, `tailwind.config.ts` | `cd frontend && npm run test` |
| JEUDIEU | `feat/front-citizen-dashboard` | `frontend/src/features/citizen/pages/DashboardPage.tsx` | `npm run test -- src/features/citizen` |
| KOUODZO | `feat/back-auth-core` | `backend/app/services/auth_service.py`, `backend/tests/test_auth.py` | `.venv/bin/pytest tests/test_auth.py -q` |
| LEUKAM | `feat/front-agent-queue` | `frontend/src/features/agent/pages/QueuePage.tsx` | `npm run test -- src/features/agent` |
| METAMMO | `feat/front-validator-queue` | `frontend/src/features/validator/pages/QueuePage.tsx` | `npm run test -- src/features/validator` |
| NDOUNGUE | `feat/back-domain-models` | `backend/app/models/demande.py`, `backend/app/services/workflow_service.py` | `.venv/bin/pytest tests/test_workflow.py -q` |
| NOLACK | `feat/back-github-client` | `backend/app/services/github_client.py`, `backend/tests/test_github.py` | `.venv/bin/pytest tests/test_github.py -q` |
| NZEUTEM | `feat/front-admin-users` | `frontend/src/features/admin/pages/UsersPage.tsx` | `npm run test -- src/features/admin` |
| VOUMIA | `chore/test-fixtures` | `backend/tests/conftest.py`, `backend/app/seed.py`, `frontend/src/test/` | `.venv/bin/pytest` et `npm run test` |

> TSEFACK ne code pas les fonctionnalités métier. Il configure GitHub, relit
> les PR, fusionne et publie les releases.

---

## 5. Règles d'or

1. **Un fichier = un propriétaire.** Tu ne modifies que ton périmètre.
2. **La branche de travail est `develop`.** `main` est réservée aux releases.
3. **Une branche = une tâche = une PR.** Durée maximale : 5 jours.
4. **PR vers `develop` uniquement.** Jamais vers `main` sans TSEFACK.
5. **TSEFACK est le seul à fusionner.** Tu ne cliques pas sur Merge.
6. **Ne touche jamais aux fichiers partagés** : `router.tsx`, `types`, `lib`,
   `context`, `backend/app/main.py`, `core`, `models/__init__.py`.
7. **Aucun secret dans Git.** Pas de `.env`, pas de token, pas de mot de passe.
8. **La CI doit être verte.** Lint, types, tests, build.
9. **Rebase chaque matin.** `git fetch origin && git rebase origin/develop`.
10. **Bloqué plus de 2 heures : demande de l'aide.** Issue `aide` + TSEFACK.

---

## 6. Ce que tu ne fais pas

- Push direct sur `main` ou `develop`.
- Merge d'une PR sans revue.
- Modification d'un fichier d'un autre membre.
- Suppression d'un test pour faire passer la CI.
- Renommage massif de fichiers.
- Formatage global de tout le dépôt.
- Ajout d'une dépendance sans validation.
- Commit d'un `.env`, d'un token ou d'une donnée personnelle.

---

## 7. Si Docker ne fonctionne pas

### Option A — Backend local

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

### Option B — Frontend local

```bash
cd frontend
npm install
npm run dev
```

Le proxy Vite redirige `/api` vers `http://localhost:8000`.

### Option C — Tu n'as ni Docker ni Python/Node

Signale-le à TSEFACK. Tu peux commencer par la documentation, les tests ou les
données de démonstration, mais tu auras besoin d'un environnement pour coder.

### Ports occupés

Si `8080`, `8000`, `8025` ou `1025` sont déjà utilisés, arrête le service
concerné ou modifie les ports dans `docker-compose.yml` après accord de
TSEFACK.

---

## 8. FAQ

**Je clone et je suis sur `main` ?**
Fais `git checkout develop`.

**Je n'ai pas de token GitHub.**
Ce n'est pas bloquant pour l'authentification, le catalogue et l'interface.
Le token est nécessaire pour les tests d'intégration GitHub réels. Les tests
automatisés utilisent `respx`.

**La CI est rouge.**
Exécute le lint et les tests en local, corrige, pousse à nouveau. Ne demande
pas de merge avec une CI rouge.

**J'ai un conflit.**
Si le conflit est dans tes fichiers, résous-le. Si c'est dans un fichier
partagé, `git rebase --abort` et contacte TSEFACK.

**Je veux modifier un fichier partagé.**
Ouvre une issue `aide`, mentionne TSEFACK, attends.

**Je ne sais pas quoi faire.**
Ouvre une issue `aide` avec ton nom, ta branche et le blocage. TSEFACK répond.

**Est-ce que je peux travailler sur plusieurs tâches ?**
Oui, mais une branche à la fois. Termine et fais merger avant d'en ouvrir une
autre.

**Est-ce que je dois créer les issues ?**
TSEFACK crée les issues initiales avec `scripts/create-issues.sh`. Tu peux
ouvrir une issue pour un bug, une question ou une tâche non prévue.

---

## 9. Comment savoir que ton premier jour est réussi

- [ ] Tu as accepté l'invitation.
- [ ] Tu es sur `develop`.
- [ ] `docker compose up --build` fonctionne.
- [ ] Le seed est chargé.
- [ ] Tu t'es connecté avec un compte de démonstration.
- [ ] Tu as trouvé ton nom dans `docs/repartition-taches.md`.
- [ ] Tu as créé ta première branche.
- [ ] Tu as lancé au moins un test.
- [ ] Tu as ouvert une PR vers `develop`.
- [ ] Tu n'as touché aucun fichier hors de ton périmètre.

---

## 10. Qui contacter

| Sujet | Contact |
|---|---|
| GitHub, branches, PR, conflits | TSEFACK CALVIN KLEIN |
| Design system, composants UI | GUEMOGNE GERALDINE ESTHER |
| Contrat API, workflow | NDOUNGUE ESSOH ABEL THOMAS |
| GitHub, worker, PDF | NOLACK KAWUNJIBI FRANGE PARKER |
| Tests, seed, recette | VOUMIA OUALA DILANE |
| Suivi projet, tableau de bord | NZEUTEM DOMOE EUNICE FELIXTINE |

Pour un blocage technique, ouvre une issue avec le label `aide` et mentionne la
personne concernée. Ne reste pas bloqué en silence.
