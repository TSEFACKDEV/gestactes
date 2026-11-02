# Contrat API GestActes

**Propriétaire :** TSEFACK CALVIN KLEIN
**Version :** 1.0
**Base URL :** `/api/v1`
**Format :** JSON UTF-8, sauf upload multipart et téléchargements.
**Documentation interactive :** `http://localhost:8000/docs`

> Ce contrat est **gelé** avant le développement. Toute modification passe par
> une issue et une revue de l'intégrateur. Les types front-end doivent rester
> alignés sur ce document.

---

## 1. Authentification

- `Authorization: Bearer <access_token>` sur les routes protégées.
- Access token JWT, 15 minutes.
- Refresh token opaque dans un cookie `gestactes_refresh`, `HttpOnly`,
  `SameSite=Lax`, `Secure` en production.
- Le refresh tourne à chaque appel : l'ancien token est révoqué.
- Les routes publiques sont : `/auth/register`, `/auth/login`,
  `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`,
  `/verification/{numero}`, `/webhooks/github`, `/health`.

### Rôles

`citoyen`, `agent`, `validateur`, `admin`.

### Objets communs

```json
{
  "id": 1,
  "email": "citoyen@gestactes.com",
  "first_name": "Awa",
  "last_name": "Ndiaye",
  "role": "citoyen",
  "is_active": true,
  "created_at": "2026-10-12T09:00:00Z"
}
```

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "page_size": 20,
  "pages": 0
}
```

### Erreurs

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Les données de la demande sont invalides.",
    "details": { "adresse": "Champ requis" },
    "request_id": "req_01J8Z3"
  }
}
```

| Code HTTP | Code métier | Cas |
|---|---|---|
| 400 | `BAD_REQUEST` | Requête mal formée. |
| 401 | `UNAUTHENTICATED` | Token absent, expiré ou invalide. |
| 403 | `FORBIDDEN` | Rôle ou propriétaire incorrect. |
| 404 | `NOT_FOUND` | Ressource inconnue. |
| 409 | `CONFLICT` / `INVALID_TRANSITION` | Doublon ou transition interdite. |
| 413 | `FILE_TOO_LARGE` | Pièce > 5 Mo. |
| 422 | `VALIDATION_ERROR` | Champ invalide. |
| 429 | `RATE_LIMITED` | Trop de requêtes. |
| 502 | `GITHUB_UNAVAILABLE` | GitHub injoignable pendant une opération synchrone. |
| 500 | `INTERNAL_ERROR` | Erreur inattendue. |

---

## 2. Authentification

### POST `/auth/register`

Public. Crée un compte citoyen.

```json
{
  "first_name": "Awa",
  "last_name": "Ndiaye",
  "email": "awa.ndiaye@example.com",
  "password": "Demo1234!"
}
```

- `201` → `UserRead`.
- `409` → e-mail déjà utilisé.
- `422` → mot de passe trop court ou e-mail invalide.

### POST `/auth/login`

Public. Retourne l'access token et pose le cookie de refresh.

```json
{ "email": "awa.ndiaye@example.com", "password": "Demo1234!" }
```

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 900,
  "user": { "id": 1, "role": "citoyen", "first_name": "Awa" }
}
```

- `200` → tokens.
- `401` → identifiants invalides.
- `403` → compte désactivé.

### POST `/auth/refresh`

Public (cookie). Retourne un nouvel access token et fait tourner le refresh.

- `200` → même forme que login.
- `401` → cookie absent, expiré ou révoqué.

### POST `/auth/logout`

Connecté. Révoque le refresh courant et supprime le cookie.

- `204`.

### GET `/auth/me`

Connecté. Retourne `UserRead`.

### PATCH `/auth/me`

Connecté. Met à jour le prénom et le nom.

```json
{ "first_name": "Awa", "last_name": "Ndiaye" }
```

- `200` → `UserRead`.

### POST `/auth/forgot-password`

Public. Répond toujours `202` pour ne pas révéler l'existence d'un compte.

```json
{ "email": "awa.ndiaye@example.com" }
```

### POST `/auth/reset-password`

Public.

```json
{ "token": "opaque-token", "new_password": "Nouveau1234!" }
```

- `204`.
- `400` → token invalide, expiré ou déjà utilisé.

### POST `/auth/change-password`

Connecté.

```json
{ "current_password": "Demo1234!", "new_password": "Nouveau1234!" }
```

- `204`.
- `401` → mot de passe actuel incorrect.

---

## 3. Types d'actes

### GET `/types-actes`

Connecté. Retourne les types actifs.

```json
[
  {
    "id": 1,
    "code": "attestation-residence",
    "label": "Attestation de résidence",
    "description": "Atteste du lieu de résidence du demandeur.",
    "form_schema": [
      {
        "name": "adresse",
        "label": "Adresse complète",
        "type": "textarea",
        "required": true,
        "placeholder": "12 rue des Lilas, 75000 Ville",
        "help": "Adresse actuelle du demandeur."
      },
      {
        "name": "residence_depuis",
        "label": "Résident depuis",
        "type": "date",
        "required": true
      }
    ],
    "template_md": "# Attestation de résidence\n\n...",
    "is_active": true
  }
]
```

### GET `/types-actes/{code}`

Connecté. Retourne un type par son code.

- `404` si inconnu ou inactif.

---

## 4. Demandes

### POST `/demandes`

Citoyen. `multipart/form-data`.

| Champ | Type | Description |
|---|---|---|
| `payload` | string JSON | `{ "type_code": "...", "donnees": { ... } }` |
| `files` | file[] | 0 à 3 pièces, 5 Mo max, PDF/JPEG/PNG. |

En-tête optionnel `Idempotency-Key` : si la même clé est rejouée, retourne la
demande existante au lieu d'en créer une seconde.

- `201` → `DemandeRead`.
- `413` → fichier trop lourd.
- `422` → champ manquant, type inconnu, type de fichier interdit.

### GET `/demandes`

Connecté. Filtres :

| Paramètre | Type | Description |
|---|---|---|
| `statut` | string | Un des états canoniques. |
| `type_code` | string | Code du type d'acte. |
| `q` | string | Numéro, nom du demandeur, libellé du type. |
| `date_from` | date | Date de création minimale. |
| `date_to` | date | Date de création maximale. |
| `page` | int | Défaut 1. |
| `page_size` | int | Défaut 20, max 100. |

Périmètre automatique :

- Citoyen : ses demandes.
- Agent : toutes les `demandee` + celles qui lui sont assignées.
- Validateur : `en_validation`, `validee`, `signee`, `archivee`.
- Admin : tout.

Retourne `Page<DemandeListItem>`.

```json
{
  "items": [
    {
      "id": 42,
      "numero": "2026-00042",
      "type": { "code": "attestation-residence", "label": "Attestation de résidence" },
      "demandeur": { "id": 17, "first_name": "Awa", "last_name": "Ndiaye" },
      "statut": "en_validation",
      "assigned_agent": { "id": 4, "first_name": "Maxime", "last_name": "Leukam" },
      "pr_url": "https://github.com/owner/gestactes-data/pull/12",
      "created_at": "2026-10-12T09:00:00Z",
      "updated_at": "2026-10-12T11:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "pages": 1
}
```

### GET `/demandes/{id}`

Connecté, selon le périmètre. Retourne `DemandeRead` :

```json
{
  "id": 42,
  "numero": "2026-00042",
  "type": { "id": 1, "code": "attestation-residence", "label": "Attestation de résidence" },
  "demandeur": { "id": 17, "first_name": "Awa", "last_name": "Ndiaye" },
  "statut": "en_validation",
  "donnees": { "adresse": "12 rue des Lilas", "residence_depuis": "2021-03-01" },
  "acte_md": "# Attestation de résidence\\n\\n...",
  "issue_number": 12,
  "issue_url": "https://github.com/owner/gestactes-data/issues/12",
  "branch_name": "acte/2026-00042",
  "pr_number": 13,
  "pr_url": "https://github.com/owner/gestactes-data/pull/13",
  "assigned_agent": { "id": 4, "first_name": "Maxime", "last_name": "Leukam" },
  "assigned_validator": null,
  "complement_attendu": false,
  "complement_message": null,
  "rejection_reason": null,
  "signature": null,
  "signed_at": null,
  "merge_commit_sha": null,
  "tag_name": null,
  "pieces": [
    {
      "id": 3,
      "filename": "justificatif-domicile.pdf",
      "content_type": "application/pdf",
      "size_bytes": 245000,
      "sha256": "9f2c...",
      "created_at": "2026-10-12T09:00:00Z"
    }
  ],
  "created_at": "2026-10-12T09:00:00Z",
  "updated_at": "2026-10-12T11:00:00Z"
}
```

### POST `/demandes/{id}/annulation`

Citoyen propriétaire, état `demandee` uniquement.

- `200` → `DemandeRead` avec `statut = "annulee"`.
- `409` → déjà prise en charge.

### GET `/demandes/{id}/historique`

Citoyen propriétaire, agent, validateur, admin.

```json
[
  {
    "type": "commit",
    "action": "instruction",
    "actor": "Maxime Leukam",
    "message": "correction de l'adresse",
    "sha": "abc123",
    "created_at": "2026-10-12T10:00:00Z"
  },
  {
    "type": "audit",
    "action": "soumission",
    "actor": "Maxime Leukam",
    "message": "PR #13 ouverte",
    "sha": null,
    "created_at": "2026-10-12T11:00:00Z"
  }
]
```

### GET `/demandes/{id}/pieces/{piece_id}`

Connecté, selon le périmètre. Retourne le fichier avec son `Content-Type`.

### POST `/demandes/{id}/prise-en-charge`

Agent. Aucun corps.

- `200` → `DemandeRead` avec `statut = "en_instruction"`.
- `409` → déjà prise en charge.

### PUT `/demandes/{id}/contenu`

Agent assigné.

```json
{
  "donnees": { "adresse": "12 rue des Lilas, 75000 Ville" },
  "acte_md": "# Attestation de résidence\n\n...",
  "message": "correction de l'adresse"
}
```

- `200` → `DemandeRead`.
- `409` → état incompatible.
- `422` → contenu invalide.

### POST `/demandes/{id}/complement`

Agent assigné.

```json
{ "message": "Merci de joindre un justificatif de domicile de moins de 3 mois." }
```

- `200` → `DemandeRead` avec `complement_attendu = true`.

### POST `/demandes/{id}/soumission`

Agent assigné.

```json
{ "comment": "Acte prêt pour validation." }
```

- `200` → `DemandeRead` avec `statut = "en_validation"`.
- `409` → contenu absent ou transition interdite.

### POST `/demandes/{id}/decision`

Validateur.

```json
{ "decision": "approuver", "comment": null }
```

Valeurs : `approuver`, `demander_corrections`, `rejeter`.

- `approuver` → `validee`.
- `demander_corrections` → `en_instruction`, commentaire obligatoire.
- `rejeter` → `rejetee`, commentaire obligatoire.

- `200` → `DemandeRead`.
- `422` → commentaire manquant.
- `409` → état incompatible.

### POST `/demandes/{id}/signature`

Validateur.

```json
{ "confirmation": true }
```

- `200` →

```json
{
  "demande": { "statut": "signee", "numero": "2026-00042" },
  "signature": {
    "numero": "2026-00042",
    "sha256_acte_json": "9f2c...",
    "sha256_acte_md": "41ab...",
    "signataire": { "id": 8, "nom": "NZEUTEM", "prenom": "Eunice", "role": "validateur" },
    "signe_le": "2026-10-20T10:15:00Z",
    "algorithme": "SHA-256",
    "version": 1
  },
  "merge_commit_sha": "def456"
}
```

- `409` → non validée ou PR absente.
- `502` → GitHub indisponible ; aucune signature partielle.

### GET `/demandes/{id}/pdf`

Citoyen propriétaire, agent, validateur, admin. Retourne `application/pdf`.
`404` si le PDF n'est pas encore généré.

### GET `/demandes/export.csv`

Agent, validateur, admin. Mêmes filtres que `GET /demandes`.
`text/csv; charset=utf-8` avec BOM.

---

## 5. Vérification publique

### GET `/verification/{numero}`

Public. Aucune donnée personnelle.

```json
{
  "valide": true,
  "numero": "2026-00042",
  "type": "Attestation de résidence",
  "statut": "archivee",
  "signe_le": "2026-10-20T10:15:00Z",
  "signataire": "Eunice NZEUTEM",
  "sha256": "9f2c..."
}
```

- `404` → numéro inconnu.
- `200` avec `valide: false` si l'acte n'est pas signé/archivé.

---

## 6. Notifications

### GET `/notifications`

Connecté.

```json
{
  "items": [
    {
      "id": 9,
      "title": "Acte signé",
      "message": "Votre attestation 2026-00042 est disponible.",
      "demande_id": 42,
      "is_read": false,
      "created_at": "2026-10-20T10:16:00Z"
    }
  ],
  "unread_count": 1
}
```

### PATCH `/notifications/{id}/lue`

Propriétaire. `204`.

### POST `/notifications/tout-lu`

Connecté. `204`.

---

## 7. Administration

### GET `/admin/utilisateurs`

Admin. Filtres `role`, `q`, `page`, `page_size`. Retourne `Page<UserRead>`.

### POST `/admin/utilisateurs`

Admin. Crée un agent, validateur ou admin.

```json
{
  "first_name": "Maxime",
  "last_name": "Leukam",
  "email": "agent@gestactes.com",
  "password": "Demo1234!",
  "role": "agent"
}
```

- `201` → `UserRead`.
- `409` → e-mail déjà utilisé.

### PATCH `/admin/utilisateurs/{id}`

Admin. Modifie le nom, le rôle ou l'état.

```json
{ "role": "validateur", "is_active": true }
```

- `409` → tentative de désactivation du dernier admin.

### DELETE `/admin/utilisateurs/{id}`

Admin. Désactivation logique. `204`.

### GET `/admin/types-actes`

Admin. Tous les types, actifs et inactifs.

### POST `/admin/types-actes`

Admin.

```json
{
  "code": "certificat-domicile",
  "label": "Certificat de domicile",
  "description": "Certificat simple.",
  "form_schema": [
    { "name": "adresse", "label": "Adresse", "type": "textarea", "required": true }
  ],
  "template_md": "# Certificat de domicile\n\n..."
}
```

- `201` → `TypeActeRead`.
- `409` → code déjà utilisé.

### PATCH `/admin/types-actes/{id}`

Admin. Mêmes champs, tous optionnels. `200` → `TypeActeRead`.

### DELETE `/admin/types-actes/{id}`

Admin. Désactivation logique. `204`.

### GET `/admin/audit`

Admin. Filtres `actor_id`, `action`, `date_from`, `date_to`, `page`.

```json
{
  "items": [
    {
      "id": 100,
      "demande_id": 42,
      "actor": { "id": 4, "first_name": "Maxime", "last_name": "Leukam" },
      "action": "soumission",
      "details": { "pr_number": 13 },
      "commit_sha": null,
      "created_at": "2026-10-12T11:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "pages": 1
}
```

### GET `/admin/statistiques`

Admin.

```json
{
  "total": 120,
  "par_statut": {
    "demandee": 10,
    "en_instruction": 8,
    "en_validation": 5,
    "validee": 2,
    "signee": 1,
    "archivee": 80,
    "rejetee": 10,
    "annulee": 4
  },
  "par_type": { "attestation-residence": 60, "extrait-naissance": 40, "autorisation-administrative": 20 },
  "delai_moyen_heures": 36.5
}
```

---

## 8. Webhook GitHub

### POST `/webhooks/github`

Public mais signature obligatoire.

En-têtes :

- `X-GitHub-Event`
- `X-GitHub-Delivery`
- `X-Hub-Signature-256`

Événements écoutés :

- `issues`
- `pull_request` (action `closed`, `merged`)
- `pull_request_review`

- `202` → accepté.
- `200` → déjà traité (idempotence).
- `401` → signature invalide.

---

## 9. Santé

### GET `/health`

```json
{ "status": "ok", "version": "1.0.0", "environment": "dev", "timestamp": "2026-11-02T10:00:00Z" }
```

### GET `/health/ready`

```json
{ "status": "ready", "database": "ok" }
```

- `503` si la base est indisponible.
