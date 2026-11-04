# Intégration GitHub — notes d'implémentation

**Propriétaire :** NOLACK KAWUNJIBI FRANGE PARKER  
**Statut :** Implémenté, testé et validé  
**Références :** `docs/api-contract.md`, `docs/workflow.md`, `docs/github-setup.md`

---

## 1. Périmètre

Le service GitHub est le **seul** composant autorisé à interagir directement avec l'API GitHub. Il est sollicité à la fois par l'API (pour les phases de signature et de validation) et par le worker d'arrière-plan (pour le provisionnement, les commits, la gestion des Pull Requests, les fusions et l'archivage).

Le dépôt de données distant est privé : `gestactes-data`.

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

---

## 2. Client bas niveau (`github_client.py`)

Implémenté à l'aide de `httpx` asynchrone avec un client REST minimal :

* **Configuration** : validation de la présence du token, du dépôt et de l'URL de base.
* **Sécurité** : les en-têtes injectent le jeton d'accès sans jamais l'exposer dans les logs applicatifs.
* **Gestion des erreurs** : mappage strict des codes HTTP vers des exceptions métiers personnalisées :
  * `404 Not Found` → `GitHubNotFound`
  * `409 Conflict` → `GitHubConflict`
  * autres erreurs HTTP ≥ 400 → `GitHubError`

---

## 3. Service métier (`github_service.py`)

Centralise la logique d'automatisation administrative de manière strictement **idempotente** :

* `provision_demande` : crée l'issue de suivi et initialise la branche dédiée de la demande.
* `commit_acte` : commit les fichiers `acte.json` et `acte.md` sur la branche de travail.
* `open_validation_pr` : ouvre automatiquement une Pull Request vers la branche `main`.
* `merge_signature` : ajoute le manifeste de signature (`signature.json`), fusionne la PR de validation et retourne le SHA du commit de merge.
* `archive_acte` : archive le PDF officiel dans le dossier `archives/` sur la branche principale et pose un tag Git annoté.
* `handle_webhook` : route et traite les événements asynchrones reçus de GitHub.

---

## 4. Worker et Outbox (`jobs.py`, `worker/main.py`)

Gère l'exécution asynchrone des tâches en arrière-plan :

* Réclamation des jobs `pending` avec sécurisation par verrou PostgreSQL.
* Exécution robuste des handlers de manière idempotente.
* Gestion des statuts (`mark_done`, `mark_failed` avec stratégie de backoff) garantissant qu'un job en échec ne stoppe pas la boucle du worker.

---

## 5. Processus de signature

L'ordonnancement de la signature respecte la séquence suivante :

1. Vérification que la demande est au statut `validee`.
2. Lecture de `acte.json` et `acte.md` depuis la branche.
3. Canonicalisation de `acte.json` (tri des clés, UTF-8, sans espaces superflus) pour calculer les empreintes SHA-256 (`sha256_acte_json` et `sha256_acte_md`).
4. Écriture de `signature.json` (le fichier de signature ne fait jamais partie du hash de l'acte).
5. Fusion de la Pull Request et récupération du SHA du commit de merge.
6. Enregistrement des données de signature et passage de la demande à `signee`, avec mise en file du job de génération PDF.

---

## 6. Réception et sécurité des webhooks (`webhooks.py`)

Exposé sur l'endpoint `POST /api/v1/webhooks/github` :

* **Validation HMAC** : vérification stricte de l'en-tête `X-Hub-Signature-256` par rapport au secret configuré, avec `hmac.compare_digest`.
* **Idempotence** : contrôle d'unicité de l'en-tête `X-GitHub-Delivery`, stocké dans la table `WebhookEvents`.
  * Doublon détecté → réponse `200 OK` (statut `ignored`).
  * Nouvel événement → réponse `202 Accepted` (statut `accepted`) et déclenchement du traitement métier.

---

## 7. Génération PDF et QR code (`pdf_service.py`)

Réalisée à l'aide de **ReportLab** et **qrcode** :

* Construction d'un document PDF dont le binaire commence obligatoirement par l'en-tête `%PDF`.
* Intégration du numéro de l'acte, de la date, des informations du signataire et d'un QR code de vérification pointant vers l'URL publique du front-office.

---

## 8. Commandes de validation et tests

Pour exécuter la suite de tests et les contrôles statiques :

```bash
# Tests unitaires et d'intégration (pytest avec respx)
python -m pytest tests/ -v

# Vérification du style de code (Ruff)
ruff check .

# Vérification du typage statique (Mypy)
mypy app
```