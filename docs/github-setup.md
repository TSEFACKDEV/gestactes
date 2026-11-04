# Mise en place GitHub

**Propriétaire :** TSEFACK CALVIN KLEIN
**Public :** toute l'équipe
**Objectif :** configurer les dépôts, branches, labels, protections, token et
webhook avant le premier commit de fonctionnalité.

---

## 1. Dépôts

| Dépôt | Visibilité | Rôle |
|---|---|---|
| `gestactes` | privé ou public | Code, documentation, CI. |
| `gestactes-data` | **privé** | Actes, pièces, archives, modèles. |

Créer les deux dépôts sur GitHub, puis cloner le dépôt de code.

```bash
git clone git@github.com:<organisation>/gestactes.git
cd gestactes
```

Le dépôt de données est géré par l'API et le worker. Il n'est pas cloné par les
développeurs pour le développement courant.

---

## 2. Branches

| Branche | Rôle | Qui écrit |
|---|---|---|
| `main` | Version stable, livrée. | Personne directement. TSEFACK merge depuis `develop`. |
| `develop` | Intégration continue. | Personne directement. Les membres passent par des PR. |
| `feat/<domaine>-<sujet>` | Fonctionnalité. | Le propriétaire du fichier. |
| `fix/<domaine>-<sujet>` | Correction. | Le propriétaire du fichier. |
| `chore/<sujet>` | Outillage, CI, docs. | TSEFACK ou le propriétaire concerné. |
| `release/v1.0.0` | Préparation de release. | TSEFACK. |

Création initiale :

```bash
git init -b main
git add .
git commit -m "chore: initialisation du projet"
git branch develop
git checkout develop
```

> Le squelette fourni contient déjà `.gitignore`, `.env.example`, la CI et les
> templates. Ne pas committer `.env`.

Si le dépôt local a déjà été initialisé (cas du squelette livré), il suffit de
le relier à GitHub :

```bash
git remote add origin git@github.com:<organisation>/gestactes.git
git push -u origin main
git push -u origin develop
```

Configurer les protections de branches **après** ce premier push.

---

## 2 bis. Inviter les collaborateurs

1. Ouvrir le dépôt `gestactes` sur GitHub.
2. **Settings → Collaborators → Add people**.
3. Ajouter chaque membre avec le rôle **Write**.
4. Ne pas donner **Admin** : seul TSEFACK administre les branches et les secrets.
5. Chaque membre reçoit une invitation par e-mail ou notification GitHub.
6. Après acceptation, il clone le dépôt et suit `docs/onboarding.md`.

Pendant le projet, mettre `develop` comme branche par défaut :

**Settings → General → Default branch → `develop`**.

Ainsi, un nouveau clone démarre directement sur la branche de travail. À la
release finale, repasser la branche par défaut sur `main`.

### Créer les issues initiales

Après avoir créé les labels :

```bash
./scripts/setup-github.sh <owner>/gestactes
./scripts/create-issues.sh <owner>/gestactes
```

Les issues sont créées sans assignation. Les assigner dans GitHub Projects,
puis vérifier que chaque issue a :

- un propriétaire ;
- une branche ;
- des fichiers ;
- des tests ;
- une Definition of Done.

---

## 3. Labels

Créer les labels avec `gh` (adapter `owner/repo`) :

```bash
gh label create "statut:demandee"        --color "B7791F" --description "Demande déposée"
gh label create "statut:en-instruction"  --color "4A6FA5" --description "Instruction en cours"
gh label create "statut:en-validation"   --color "7C5CBF" --description "En attente de validation"
gh label create "statut:validee"         --color "3F7D5A" --description "Validée"
gh label create "statut:signee"          --color "2F6F68" --description "Signée"
gh label create "statut:archivee"        --color "4B5563" --description "Archivée"
gh label create "statut:rejetee"         --color "B45151" --description "Rejetée"
gh label create "statut:annulee"         --color "6B7280" --description "Annulée"
gh label create "type:attestation-residence"          --color "C9A66B" --description "Attestation de résidence"
gh label create "type:extrait-naissance"              --color "C9A66B" --description "Extrait d'acte de naissance"
gh label create "type:autorisation-administrative"    --color "C9A66B" --description "Autorisation administrative"
gh label create "complement:attendu"     --color "B7791F" --description "Complément demandé au citoyen"
gh label create "priorite:haute"         --color "B45151" --description "Priorité haute"
gh label create "priorite:moyenne"       --color "B7791F" --description "Priorité moyenne"
gh label create "priorite:basse"         --color "6B7280" --description "Priorité basse"
```

Un script est fourni : `scripts/setup-github.sh`.

---

## 4. Protection des branches

### `main`

- Require a pull request before merging.
- Require approvals : **1** (TSEFACK).
- Dismiss stale pull request approvals when new commits are pushed.
- Require review from Code Owners.
- Require status checks to pass : `backend`, `frontend`.
- Require branches to be up to date before merging.
- Do not allow bypassing the above settings.
- Restrict who can push : personne (ou TSEFACK uniquement).
- Allow force pushes : non.
- Allow deletions : non.

### `develop`

- Require a pull request before merging.
- Require approvals : **1** (TSEFACK).
- Require status checks : `backend`, `frontend`.
- Require branches to be up to date.
- Allow force pushes : non.
- Allow deletions : non.

### Automatisation `gh`

```bash
gh api -X PUT repos/<owner>/gestactes/branches/main/protection \
  -f required_status_checks.strict=true \
  -f required_status_checks.contexts[]=backend \
  -f required_status_checks.contexts[]=frontend \
  -f enforce_admins=true \
  -f required_pull_request_reviews.required_approving_review_count=1 \
  -f required_pull_request_reviews.dismiss_stale_reviews=true \
  -f restrictions= \
  -f allow_force_pushes=false \
  -f allow_deletions=false
```

Répéter pour `develop` avec les mêmes checks.

> GitHub peut refuser certaines options selon le plan. Dans ce cas, activer les
> protections manuellement dans **Settings → Branches**.

---

## 5. CODEOWNERS

Le fichier `.github/CODEOWNERS` demande une revue de TSEFACK sur tout le dépôt.
La propriété fine des fichiers est documentée dans
`docs/repartition-taches.md`.

```text
* @TSEFACK-KLEIN
```

Remplacer `@TSEFACK-KLEIN` par le vrai handle GitHub.

---

## 6. Token GitHub pour l'application

Créer un **fine-grained PAT** :

1. GitHub → Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token.
2. Resource owner : le compte ou l'organisation.
3. Repository access : **Only select repositories** → `gestactes-data`.
4. Permissions :
   - Contents : Read and write.
   - Issues : Read and write.
   - Pull requests : Read and write.
   - Metadata : Read.
5. Expiration : 90 jours maximum.
6. Copier le token dans `.env` :

```env
GITHUB_TOKEN=github_pat_xxx
GITHUB_REPO=<owner>/gestactes-data
```

Le token ne doit jamais être commité. Le `.gitignore` exclut `.env`.

---

## 7. Webhook

### 7.1 Production

Dans `gestactes-data` → Settings → Webhooks → Add webhook :

- Payload URL : `https://<domaine>/api/v1/webhooks/github`
- Content type : `application/json`
- Secret : la valeur de `GITHUB_WEBHOOK_SECRET`
- SSL verification : enabled
- Events :
  - Issues
  - Pull requests
  - Pull request reviews

### 7.2 Développement local

GitHub ne peut pas joindre `localhost`. Deux options :

**Option A — smee.io (recommandé)**

```bash
npx smee-client --url https://smee.io/<channel> --target http://localhost:8000/api/v1/webhooks/github
```

Créer un canal sur https://smee.io, puis mettre l'URL smee comme Payload URL.
Le secret reste celui de `.env`.

**Option B — script de simulation**

```bash
python scripts/simulate_webhook.py \
  --event pull_request \
  --delivery local-001 \
  --payload data/demo/webhook_pr_merged.json
```

Le script calcule la signature HMAC avec `GITHUB_WEBHOOK_SECRET` et poste sur
`http://localhost:8000/api/v1/webhooks/github`.

---

## 8. Dépôt de données `gestactes-data`

Créer l'arborescence minimale :

```text
gestactes-data/
  actes/
    attestation-residence/.gitkeep
    extrait-naissance/.gitkeep
    autorisation-administrative/.gitkeep
  archives/.gitkeep
  modeles/
    attestation-residence.json
    extrait-naissance.json
    autorisation-administrative.json
  .github/
    workflows/
      validate-acte.yml
    CODEOWNERS
  README.md
```

Le workflow `validate-acte.yml` est fourni dans
`scripts/data-repo/.github/workflows/validate-acte.yml`. Il vérifie :

- la présence de `acte.json` et `acte.md` ;
- la validité JSON ;
- la présence du numéro et du type ;
- l'absence d'e-mail dans `acte.json` ;
- la taille des pièces.

Il ne génère pas le PDF et ne pousse rien sur `main`.

### Protection de `main` dans `gestactes-data`

- PR obligatoire.
- 1 approbation (TSEFACK ou le bot).
- Checks `validate-acte` obligatoires.
- Pas de push direct.
- Pas de force push.

### Compte technique

Pour le MVP, le PAT appartient à un compte dédié ou à TSEFACK. Le worker agit
avec ce token. L'identité réelle de l'agent est portée par les métadonnées et
les messages de commit, pas par le compte GitHub.

---

## 9. GitHub Actions

Le workflow de code `.github/workflows/ci.yml` exécute :

- `backend` : Ruff, mypy, pytest.
- `frontend` : ESLint, tsc, Vitest, build Vite.

Il ne déploie rien et ne nécessite aucun secret. Les tests GitHub utilisent
`respx` et un faux dépôt.

Le workflow de données `validate-acte.yml` vit dans `gestactes-data`, pas dans
le dépôt de code.

---

## 10. GitHub Projects

Créer un projet `GestActes` avec les colonnes :

| Colonne | Contenu |
|---|---|
| Backlog | Idées et tâches non prêtes. |
| Ready | Tâche prête, fichier propriétaire identifié. |
| In progress | Branche créée. |
| Review | PR ouverte vers `develop`. |
| Done | PR fusionnée par TSEFACK. |

Chaque tâche est une Issue avec :

- un titre `[domaine] action` ;
- une description ;
- le propriétaire ;
- les fichiers concernés ;
- la Definition of Done ;
- le label de priorité.

---

## 11. Release `develop` → `main`

1. Tous les checks de `develop` sont verts.
2. TSEFACK crée `release/v1.0.0` depuis `develop`.
3. Il met à jour la version et le changelog.
4. Il ouvre une PR `release/v1.0.0` → `main`.
5. Revue et validation.
6. Merge (merge commit, pas squash, pour conserver l'historique de release).
7. Tag :

```bash
git checkout main
git pull origin main
git tag -a v1.0.0 -m "GestActes v1.0.0"
git push origin v1.0.0
```

8. Mettre à jour `develop` avec `main` :

```bash
git checkout develop
git merge main
git push origin develop
```

---

## 12. Règles d'or

- Aucun push direct sur `main` ou `develop`.
- Aucune PR sans issue liée.
- Aucune PR sans description et sans preuve de test.
- Aucun secret dans le dépôt.
- Aucun fichier hors de sa propriété.
- Aucun merge sans CI verte et revue de TSEFACK.
- Une branche = une tâche = une PR.
- Une branche est supprimée après merge.
