# Intégration GitHub — notes d'implémentation

**Propriétaire :** NOLACK KAWUNJIBI FRANGE PARKER
**Statut :** squelette à compléter
**Références :** `docs/api-contract.md`, `docs/workflow.md`, `docs/github-setup.md`

---

## 1. Périmètre

Le service GitHub est le **seul** composant autorisé à appeler l'API GitHub.
Il est utilisé par l'API (signature) et par le worker (provisioning, commits,
PR, merge, archive).

Le dépôt de données est privé : `gestactes-data`.

```text
actes/<type>/<année>/<numéro>/
  acte.json
  acte.md
  signature.json
  pieces/<fichier>
archives/<année>/<numéro>/
  acte.json
  acte.md
  signature.json
  acte.pdf
```

## 2. Client bas niveau

Fichier : `backend/app/services/github_client.py`.

Méthodes attendues :

| Méthode | Endpoint GitHub |
|---|---|
| `get_file` | `GET /repos/{repo}/contents/{path}` |
| `put_file` | `PUT /repos/{repo}/contents/{path}` |
| `download_file` | Contents API + base64 |
| `get_branch` / `create_branch` | Git refs |
| `create_issue` / `update_issue` | Issues |
| `add_labels` / `remove_label` | Labels |
| `create_pull_request` / `get_pull_request` | Pulls |
| `create_review` | Pull reviews |
| `merge_pull_request` | Pull merge |
| `create_tag` | Git tags + refs |
| `get_commits` | Commits |

Règles :

- Timeout 10 s.
- Erreurs 404 → `GitHubNotFound`, 409 → `GitHubConflict`, autres → `GitHubError`.
- Ne jamais logger le token.
- Ajouter les retries avec backoff sur 5xx et timeouts.
- Ajouter le cache ETag pour les lectures répétées.

## 3. Service métier

Fichier : `backend/app/services/github_service.py`.

| Fonction | Effet |
|---|---|
| `provision_demande` | Crée l'Issue et le dossier si absents. |
| `commit_acte` | Commit `acte.json`, `acte.md`, pièces sur la branche. |
| `open_validation_pr` | Ouvre la PR vers `main` et demande la revue. |
| `merge_signature` | Écrit `signature.json`, merge la PR, retourne le SHA. |
| `archive_acte` | Commit le PDF dans `archives/`, pose le tag. |
| `sync_status_label` | Met à jour le label `statut:*`. |
| `handle_webhook` | Traite les événements GitHub. |

Chaque fonction est **idempotente** :

- vérifier l'existence de l'Issue avant de la créer ;
- vérifier l'existence de la branche avant de la créer ;
- vérifier l'existence de la PR avant de l'ouvrir ;
- vérifier si `signature.json` existe déjà ;
- vérifier si le tag existe déjà.

## 4. Worker

Fichiers : `backend/app/worker/main.py`, `backend/app/worker/jobs.py`.

Boucle :

1. Réclamer un job `pending` (verrou PostgreSQL à implémenter).
2. Exécuter le handler.
3. `mark_done` ou `mark_failed` avec backoff.
4. Dormir 2 s si la file est vide.

Jobs :

| Job | Handler |
|---|---|
| `github.provision_demande` | Issue + dossier |
| `github.commit_acte` | Commit du contenu |
| `github.open_pr` | PR de validation |
| `github.merge_pr` | Signature + merge |
| `github.archive` | PDF + tag + archive |
| `email.send` | SMTP |
| `notification.create` | Notification interne |
| `pdf.generate` | PDF + QR |

Le worker ne doit jamais planter sur un job : il capture, journalise et
replanifie.

## 5. Signature

Ordre exact :

1. Vérifier que la demande est `validee`.
2. Lire `acte.json` et `acte.md` depuis la branche.
3. Canonicaliser `acte.json` (JSON trié, UTF-8, sans espaces inutiles).
4. Calculer `sha256_acte_json` et `sha256_acte_md`.
5. Écrire `signature.json` sur la branche.
6. Merger la PR.
7. Récupérer le SHA du merge.
8. Enregistrer le SHA, le manifeste et le signataire en base.
9. Passer à `signee` et enfiler `pdf.generate`.

Ne jamais inclure `signature.json` dans le hash de `acte.json`.

## 6. Webhooks

Route : `POST /api/v1/webhooks/github`.

- Vérifier `X-Hub-Signature-256` avec HMAC SHA-256 et `compare_digest`.
- Vérifier `X-GitHub-Delivery` et l'unicité dans `webhook_events`.
- Événements utiles :
  - `pull_request` avec `action=closed` et `pull_request.merged=true` ;
  - `pull_request_review` avec `action=submitted` ;
  - `issues` avec `action=closed` ou `labeled`.
- En cas de doublon : `200 ignored`.
- En cas de nouveau : `202 accepted`, puis traitement/enfilage.
- Ne jamais faire confiance au payload sans vérifier la signature.

## 7. Test local

```bash
export GITHUB_WEBHOOK_SECRET=change-me
python scripts/simulate_webhook.py \
  --event pull_request \
  --delivery local-001 \
  --payload data/demo/webhook_pr_merged.json
```

Pour un vrai webhook local, utiliser smee.io (voir `docs/github-setup.md`).

## 8. Checklist

- [ ] Tous les appels GitHub passent par `github_client`.
- [ ] Les jobs sont idempotents.
- [ ] Les erreurs sont mappées vers `AppError`.
- [ ] Le token n'est jamais loggé.
- [ ] Les tests `respx` couvrent 200/404/409/500.
- [ ] Le webhook rejette une signature invalide.
- [ ] Le PDF commence par `%PDF`.
- [ ] Le tag est posé après le merge.
- [ ] La documentation du dépôt de données est à jour.
