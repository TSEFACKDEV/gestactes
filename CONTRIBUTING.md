# Contribuer à GestActes

> **Nouveau sur le projet ?** Lis d'abord `docs/onboarding.md`, puis reviens
> ici pour les commandes et le processus de PR.

Ce document est la référence courte. Les détails sont dans :

- `docs/repartition-taches.md` — qui fait quoi, branches, fichiers.
- `docs/guide-contribution.md` — commandes Git pas à pas.
- `docs/github-setup.md` — labels, protections, webhook.
- `docs/api-contract.md` — contrat API gelé.
- `docs/design-system.md` — règles UI.

---

## 1. Règle absolue : un fichier, un propriétaire

Chaque fichier a **un seul propriétaire**. Vous ne modifiez que les fichiers de
votre périmètre. Si vous avez besoin d'un changement dans un fichier partagé :

1. Ouvrez une issue avec le label `aide`.
2. Mentionnez le propriétaire.
3. Attendez la modification. Ne poussez pas vous-même.

Les fichiers partagés (routeur, client API, types, configuration, `main.py`,
`core/`) sont gelés par l'intégrateur.

---

## 2. Branches

```bash
git checkout develop
git pull origin develop
git checkout -b feat/<domaine>-<sujet>
```

Exemples :

- `feat/front-citizen-request`
- `feat/back-auth`
- `fix/back-workflow-transition`
- `chore/ci-backend`

Une branche = une tâche = une PR. Durée de vie maximale : 5 jours.

---

## 3. Commits

Format **Conventional Commits** avec scope :

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

- Message à l'impératif, en français, sans point final.
- Un commit = un changement cohérent.
- Référencer l'issue : `Refs #12`.
- Ne jamais committer `.env`, `node_modules`, `__pycache__`, `dist`.

---

## 4. Avant d'ouvrir une PR

```bash
# Se mettre à jour
git fetch origin
git rebase origin/develop

# Back-end
cd backend
ruff check .
mypy app
pytest

# Front-end
cd frontend
npm run lint
npm run typecheck
npm run test
npm run build
```

Si le rebase produit un conflit dans un fichier qui ne vous appartient pas :
**arrêtez** et contactez le propriétaire ou TSEFACK.

---

## 5. Pull Request

- Titre : `feat(auth): inscription et connexion citoyen`
- Base : `develop` (jamais `main`).
- Description : quoi, pourquoi, comment tester, capture si UI.
- Issue liée : `Closes #12`.
- Checklist remplie.
- CI verte.
- Revue de TSEFACK obligatoire.

Modèle : `.github/pull_request_template.md`.

---

## 6. Definition of Done

Une tâche est terminée quand :

- [ ] Le code compile et l'application démarre.
- [ ] Les tests de la fonctionnalité passent.
- [ ] Les tests existants passent.
- [ ] Le lint et le typage passent.
- [ ] Les cas d'erreur sont gérés (401, 403, 404, 409, 422).
- [ ] Les états de chargement, vide et erreur sont affichés (UI).
- [ ] L'accessibilité de base est respectée (labels, focus, clavier).
- [ ] Aucun secret ni donnée personnelle n'est commité.
- [ ] La documentation ou le contrat API est mis à jour si nécessaire.
- [ ] La PR est relue et fusionnée par TSEFACK.

---

## 7. Style de code

### Python

- Ruff pour le lint et le format.
- mypy pour le typage.
- Noms en `snake_case`, classes en `PascalCase`.
- Pas de `print` : utiliser `logging`.
- Pas de logique métier dans les routes.
- Docstrings courtes sur les fonctions publiques.

### TypeScript / React

- ESLint + Prettier.
- Composants en `PascalCase`, hooks en `useCamelCase`.
- Pas de `any` non justifié.
- Pas de style inline sauf valeur dynamique.
- Utiliser les composants UI partagés, ne pas recréer un bouton.
- Icônes : `react-icons/lu`, pas d'emoji.
- Textes en français.

### CSS / Tailwind

- Utiliser les tokens du design system.
- Pas de couleur hexadécimale dans les composants.
- Pas de `!important`.
- Classes conditionnelles via `cn()`.
- Respecter `prefers-reduced-motion`.

---

## 8. Tests

- Back-end : `pytest`, fixtures dans `backend/tests/conftest.py`.
- Front-end : Vitest + React Testing Library.
- Chaque bug corrigé ajoute un test de régression.
- Les tests critiques ne sont jamais supprimés.
- Les tests GitHub utilisent `respx`, jamais le vrai GitHub.

---

## 9. Communication

- Une question = une issue, pas un message perdu.
- Un blocage de plus de 2 heures = signalement immédiat à TSEFACK.
- Un changement de contrat API = issue + validation avant codage.
- Un changement de design system = issue + validation de GUEMOGNE.
- Un changement de fichier partagé = issue + validation de TSEFACK.

---

## 10. Ce qu'il ne faut jamais faire

- Push direct sur `main` ou `develop`.
- Merge d'une PR sans revue.
- Modification d'un fichier hors périmètre.
- Commit d'un secret, d'un mot de passe ou d'un token.
- Suppression d'un test pour faire passer la CI.
- Ajout d'une dépendance sans validation.
- Renommage massif de fichiers.
- Formatage global de tout le dépôt.
- Copier-coller de code sans comprendre.
