# Stratégie de tests

**Propriétaire :** VOUMIA OUALA DILANE
**Références :** `docs/cahier-des-charges-v2.md`, `docs/recette.md`

---

## 1. Objectif

Prouver que le parcours principal fonctionne, que les erreurs sont gérées et que
les rôles sont respectés, sans dépendre d'un vrai dépôt GitHub.

## 2. Niveaux de test

| Niveau | Outil | Cible |
|---|---|---|
| Unitaire back | pytest | Workflow, sécurité, validation, hash, numérotation. |
| Intégration back | pytest + SQLite | Routes, base, services, erreurs 401/403/409/422. |
| GitHub simulé | respx | 200/404/409/500, idempotence, timeouts. |
| Contrat | OpenAPI + types | Aucune divergence front/back. |
| Composants front | Vitest + RTL | Formulaires, badges, états vides, erreurs. |
| E2E API | pytest | Citoyen → agent → validateur → signature. |
| Sécurité | pytest | 401, 403, upload, webhook, reset. |
| Accessibilité | Lighthouse + revue | Contrastes, focus, labels, clavier. |

## 3. Commandes

### Backend

```bash
cd backend
source .venv/bin/activate
pytest
pytest tests/test_workflow.py -q
pytest --cov=app --cov-report=term-missing
ruff check .
mypy app
```

### Frontend

```bash
cd frontend
npm run test
npm run test -- src/features/citizen
npm run typecheck
npm run lint
npm run build
```

### Tout

```bash
make check
```

## 4. Fixtures back

`backend/tests/conftest.py` fournit :

- `engine` : SQLite en mémoire, `StaticPool`.
- `session` : session SQLModel.
- `client` : `TestClient` avec `get_session` surchargé.
- `users` : un utilisateur par rôle.
- `auth_headers` : fabrique de headers JWT.
- `type_acte` : type d'acte de test.

Règles :

- Chaque test est isolé.
- Les tests ne touchent jamais le vrai GitHub.
- Les tests ne dépendent pas de l'ordre d'exécution.
- Les dates sont contrôlées ou tolérantes.

## 5. Ce qu'il faut tester par domaine

### Auth

- Inscription 201, doublon 409, mot de passe court 422.
- Login 200, mauvais mot de passe 401, compte désactivé 403.
- Refresh valide, refresh expiré, refresh révoqué.
- Logout révoque.
- Reset : token valide, token expiré, token réutilisé.
- `me` sans token 401.

### Demandes

- Création valide 201.
- Type inconnu 404.
- Champ requis manquant 422.
- Fichier trop lourd 413, type interdit 422.
- Idempotence : même clé → même demande.
- Citoyen ne voit pas la demande d'un autre (403).
- Agent ne voit que la file et ses assignments.
- Annulation seulement à `demandee` (409 sinon).

### Workflow

- Chaque transition autorisée avec le bon rôle.
- Chaque transition interdite renvoie 409.
- Chaque rôle interdit renvoie 403.
- Double prise en charge : un seul gagnant.
- Signature seulement après `validee`.
- Archive seulement après `signee`.
- Acte archivé non modifiable.

### GitHub

- 404 → `GitHubNotFound`.
- 409 → `GitHubConflict`.
- 500 → retry/échec propre.
- Provision idempotente.
- Merge retourne un SHA.
- Tag posé après merge.
- PDF commence par `%PDF`.

### Webhooks

- Sans signature → 401.
- Signature invalide → 401.
- Signature valide → 202.
- Rejeu → 200 ignored.
- Payload invalide → 400.
- Événement inconnu → ignoré sans crash.

### Frontend

- Bouton affiche son libellé et son état loading.
- Formulaire affiche les erreurs de champ.
- `StatusBadge` affiche le bon libellé.
- Liste vide affiche `EmptyState`.
- Erreur API affiche `Alert`.
- Modal se ferme avec Échap.
- Upload refuse un fichier trop lourd.
- Navigation clavier sur les formulaires.

## 6. Couverture

Cible MVP :

- 70 % sur `workflow_service`, `auth_service`, `github_client`, `demande_service`.
- 50 % global back.
- Les composants UI critiques ont au moins un test de rendu.
- Le scénario E2E est obligatoire avant la release.

La couverture est un indicateur, pas une fin. Un test qui ne vérifie rien ne
compte pas.

## 7. CI

Le workflow `.github/workflows/ci.yml` exécute :

- Backend : `ruff`, `mypy`, `pytest`.
- Frontend : `eslint`, `tsc`, `vitest`, `build`.

Une PR ne peut pas être fusionnée si la CI est rouge.

## 8. Données de test

- Comptes : `backend/app/seed.py`.
- Webhooks : `data/demo/webhook_*.json`.
- Acte exemple : `data/demo/acte_example.json`.
- Les données sont fictives.
- Ne jamais utiliser de vraies données personnelles.

## 9. Rapport de tests

Le rapport final contient :

- la commande exécutée ;
- le nombre de tests ;
- la couverture ;
- les tests ignorés et pourquoi ;
- les scénarios de recette passés ;
- les limites connues.
