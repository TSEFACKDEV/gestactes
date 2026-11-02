# Guide de contribution Git

**Propriétaire :** TSEFACK CALVIN KLEIN
**Public :** toute l'équipe
**Objectif :** une seule méthode, des branches courtes, zéro conflit.

---

## 1. Installation locale

### 1.1 Cloner le dépôt

```bash
git clone git@github.com:<organisation>/gestactes.git
cd gestactes
```

### 1.2 Configurer son identité Git

```bash
git config user.name "PRENOM NOM"
git config user.email "prenom.nom@example.com"
```

Utiliser la même adresse que le compte GitHub.

### 1.3 Créer le fichier d'environnement

```bash
cp .env.example .env
```

Remplacer les secrets. Ne jamais committer `.env`.

### 1.4 Lancer l'application

```bash
docker compose up --build
```

- Frontend : http://localhost:8080
- API : http://localhost:8000/docs
- Mailpit : http://localhost:8025

Charger les comptes de démonstration :

```bash
docker compose exec api python -m app.seed
```

### 1.5 Développement local sans Docker

Backend :

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Frontend :

```bash
cd frontend
npm install
npm run dev
```

Le proxy Vite redirige `/api` vers `http://localhost:8000`.

---

## 2. Cycle d'une branche

```bash
# 1. Se mettre à jour
git checkout develop
git pull origin develop

# 2. Créer une branche courte
git checkout -b feat/front-citizen-request

# 3. Coder, tester, committer
git add <fichiers>
git commit -m "feat(citizen): formulaire dynamique de demande"

# 4. Se rebaser avant la PR
git fetch origin
git rebase origin/develop

# 5. Pousser
git push -u origin feat/front-citizen-request

# 6. Ouvrir la PR vers develop
gh pr create --base develop --head feat/front-citizen-request
```

La PR est relue et fusionnée par TSEFACK. Ne pas merger soi-même.

Après le merge :

```bash
git checkout develop
git pull origin develop
git branch -d feat/front-citizen-request
git push origin --delete feat/front-citizen-request
```

---

## 3. Nommage des branches

| Type | Format | Exemple |
|---|---|---|
| Fonctionnalité | `feat/<domaine>-<sujet>` | `feat/back-auth-core` |
| Correction | `fix/<domaine>-<sujet>` | `fix/front-citizen-upload` |
| Tests | `test/<domaine>-<sujet>` | `test/back-workflow` |
| Documentation | `docs/<sujet>` | `docs/recette` |
| Outillage | `chore/<sujet>` | `chore/ci-backend` |
| Release | `release/v<version>` | `release/v1.0.0` |

Règles :

- Minuscules, tirets, pas d'espaces.
- Une branche = une tâche = une PR.
- Durée de vie maximale : 5 jours.
- Toujours partir de `develop`, jamais de `main`.

---

## 4. Commits

Format Conventional Commits :

```text
<type>(<scope>): <description>
```

Types : `feat`, `fix`, `test`, `docs`, `style`, `refactor`, `chore`.

Exemples :

```bash
git commit -m "feat(auth): inscription citoyen avec validation Zod"
git commit -m "fix(workflow): empêcher la signature d'une demande non validée"
git commit -m "test(citizen): couvrir le formulaire dynamique"
git commit -m "docs(api): préciser le format de pagination"
```

Règles :

- Impératif, français, sans point final.
- Un commit = un changement cohérent.
- Référencer l'issue : `Refs #12`.
- Ne pas committer `.env`, `node_modules`, `dist`, `__pycache__`.

---

## 5. Pull Request

### 5.1 Création

```bash
gh pr create \
  --base develop \
  --title "feat(citizen): formulaire dynamique de demande" \
  --body "Closes #12. Ajoute le formulaire dynamique et l'upload des pièces."
```

### 5.2 Contenu attendu

- Titre au format Conventional Commits.
- Description : quoi, pourquoi, comment tester.
- Issue liée : `Closes #12`.
- Captures pour les changements UI.
- Checklist du template remplie.
- Aucun fichier hors périmètre.

### 5.3 Revue

TSEFACK vérifie :

- La propriété des fichiers.
- La conformité au contrat API.
- Les tests et le lint.
- Les cas d'erreur.
- L'accessibilité et le design system.
- L'absence de secret.

### 5.4 Merge

TSEFACK fusionne en **squash merge** dans `develop`. Le message de squash
reprend le titre de la PR que vous avez choisi. C'est pourquoi le titre doit
être propre.

---

## 6. Rebase et conflits

Avant chaque PR :

```bash
git fetch origin
git rebase origin/develop
```

Si un conflit apparaît :

```bash
git status
# Ouvrir les fichiers en conflit
git add <fichiers résolus>
git rebase --continue
```

Règles :

- Conflit dans **vos** fichiers : vous résolvez.
- Conflit dans un **fichier partagé** : vous arrêtez et contactez TSEFACK.
- Ne jamais faire `git push --force` sur une branche partagée.
- Sur votre branche personnelle, `git push --force-with-lease` est autorisé après un rebase.

---

## 7. Mise à jour quotidienne

```bash
git checkout develop
git pull origin develop
git checkout feat/<votre-branche>
git rebase origin/develop
```

Faire ce cycle chaque matin avant de coder.

---

## 8. Tests avant de pousser

### Backend

```bash
cd backend
ruff check .
mypy app
pytest
```

Cibler un fichier :

```bash
pytest tests/test_auth.py -q
```

### Frontend

```bash
cd frontend
npm run lint
npm run typecheck
npm run test
npm run build
```

Cibler un test :

```bash
npm run test -- src/features/citizen
```

### Tout le projet

```bash
make check
```

---

## 9. Définition of Done

Une tâche est terminée quand :

- [ ] Le code compile et l'application démarre.
- [ ] Les tests de la fonctionnalité passent.
- [ ] Les tests existants passent.
- [ ] Le lint et le typage passent.
- [ ] Les cas 401/403/404/409/422 sont gérés.
- [ ] Les états chargement/vide/erreur sont affichés (UI).
- [ ] L'accessibilité de base est respectée.
- [ ] Aucun secret ni donnée personnelle n'est commité.
- [ ] Le contrat API ou la documentation est à jour.
- [ ] La PR est relue et fusionnée par TSEFACK.

---

## 10. Cas particuliers

### Besoin d'un changement dans un fichier partagé

1. Ouvrir une issue `aide`.
2. Mentionner le propriétaire.
3. Attendre la modification.
4. Rebaser votre branche.

Ne jamais modifier un fichier partagé soi-même.

### Besoin d'une nouvelle dépendance

1. Ouvrir une issue.
2. Justifier la dépendance.
3. Attendre la validation de TSEFACK.
4. Un seul membre modifie `package.json` ou `pyproject.toml` (TSEFACK).

### Bug urgent en production

```bash
git checkout main
git pull origin main
git checkout -b fix/hotfix-<sujet>
# corriger, tester
git push -u origin fix/hotfix-<sujet>
gh pr create --base main --title "fix: ..."
```

TSEFACK merge, tague une nouvelle version, puis reporte le correctif sur
`develop`.

### Blocage

- Plus de 2 heures bloqué : message à TSEFACK.
- Ne pas rester silencieux.
- Ne pas contourner un fichier partagé.

---

## 11. Commandes utiles

```bash
git status
git log --oneline --graph --decorate --all -20
git diff develop...HEAD
git diff --stat develop...HEAD
git branch -vv
git remote -v
gh pr status
gh pr view
gh pr checks
```

---

## 12. Erreurs fréquentes

| Erreur | Conséquence | Correction |
|---|---|---|
| Travailler directement sur `develop` | Push refusé, conflit | Créer une branche. |
| Modifier un fichier partagé | Conflit et revue bloquée | Demander au propriétaire. |
| Committer `.env` | Fuite de secret | Révoquer le secret, retirer du commit. |
| PR géante | Revue impossible | Découper en petites PR. |
| Pas de rebase | Conflits en fin de semaine | Rebaser chaque matin. |
| Supprimer un test | CI verte artificielle | Corriger le code, pas le test. |
| Renommer des fichiers | Conflits massifs | Demander à TSEFACK. |
