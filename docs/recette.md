# Recette fonctionnelle

**Propriétaire :** VOUMIA OUALA DILANE
**Références :** `docs/cahier-des-charges-v2.md`, `docs/tests.md`

---

## 1. Environnement de recette

```bash
cp .env.example .env
docker compose up --build
docker compose exec api python -m app.seed
```

- Frontend : http://localhost:8080
- API : http://localhost:8000/docs
- Mailpit : http://localhost:8025
- Base : PostgreSQL 16

## 2. Comptes

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Citoyen | citoyen@gestactes.com | Demo1234! |
| Agent | agent@gestactes.com | Demo1234! |
| Validateur | validateur@gestactes.com | Demo1234! |
| Admin | admin@gestactes.com | Demo1234! |

## 3. Scénarios

### R-01 — Inscription et connexion

| Étape | Résultat attendu |
|---|---|
| Ouvrir `/inscription`. | Formulaire affiché. |
| Saisir un e-mail déjà utilisé. | Message 409 clair. |
| Saisir un mot de passe de 7 caractères. | Message de validation. |
| Saisir des données valides. | Compte créé, redirection vers l'espace citoyen. |
| Se déconnecter puis se reconnecter. | Connexion réussie, cookie de refresh posé. |
| Tenter `/app/admin/utilisateurs` avec le rôle citoyen. | Page 403. |

### R-02 — Dépôt d'une demande

| Étape | Résultat attendu |
|---|---|
| Citoyen → Catalogue → Attestation de résidence. | Formulaire dynamique affiché. |
| Soumettre sans les champs requis. | Erreur 422 et champs signalés. |
| Joindre un PDF de 6 Mo. | Message « dépasse 5 Mo ». |
| Joindre 4 fichiers. | Message « 3 fichiers maximum ». |
| Remplir et soumettre. | Demande créée, numéro `2026-000xx`, redirection détail. |
| Vérifier le dossier GitHub. | Issue et dossier `actes/attestation-residence/2026/...` créés (si GitHub configuré). |
| Vérifier l'e-mail. | Confirmation reçue dans Mailpit. |

### R-03 — Suivi et annulation

| Étape | Résultat attendu |
|---|---|
| Ouvrir « Mes demandes ». | La demande apparaît avec le statut `demandee`. |
| Ouvrir le détail. | Timeline, données, pièces. |
| Annuler la demande. | Statut `annulee`, Issue fermée. |
| Tenter d'annuler une demande prise en charge. | Bouton absent ou erreur 409. |
| Filtrer par statut. | Résultats cohérents. |

### R-04 — Instruction agent

| Étape | Résultat attendu |
|---|---|
| Agent → File d'instruction. | Demande `demandee` visible. |
| Prendre en charge. | Statut `en_instruction`, branche créée, Issue assignée. |
| Modifier le brouillon et enregistrer. | Commit créé, message normalisé. |
| Demander un complément. | Statut reste `en_instruction`, citoyen notifié. |
| Soumettre à validation. | PR ouverte, statut `en_validation`. |
| Vérifier l'historique. | Commits et événements cohérents. |

### R-05 — Validation

| Étape | Résultat attendu |
|---|---|
| Validateur → File de validation. | Demande `en_validation` visible. |
| Ouvrir la revue. | Contenu, comparaison, historique. |
| Rejeter sans commentaire. | Bouton désactivé ou erreur 422. |
| Demander des corrections avec commentaire. | Statut `en_instruction`, PR conservée. |
| Agent corrige et soumet à nouveau. | Même PR mise à jour. |
| Validateur approuve. | Statut `validee`. |

### R-06 — Signature et archive

| Étape | Résultat attendu |
|---|---|
| Ouvrir l'acte validé. | Bouton « Signer l'acte ». |
| Confirmer la signature. | `signature.json` créé, PR fusionnée, SHA du merge enregistré. |
| Attendre le worker. | PDF généré, tag posé, statut `archivee`. |
| Télécharger le PDF. | PDF avec numéro, date, signataire, QR code. |
| Vérifier le QR code. | Ouvre `/verification/<numéro>`. |
| Vérifier la page publique. | Acte valide, type, date, signataire, hash ; aucune donnée personnelle. |

### R-07 — Sécurité

| Étape | Résultat attendu |
|---|---|
| Accéder à `/app` sans session. | Redirection vers `/connexion`. |
| Citoyen → demande d'un autre citoyen. | 403. |
| Agent → audit admin. | 403. |
| Validateur → prise en charge. | 403. |
| Webhook sans signature. | 401. |
| Webhook rejoué. | 200 ignored, pas de doublon. |
| Token expiré. | Refresh automatique ou redirection. |
| Commit contenant `.env`. | Refusé par la revue et le `.gitignore`. |

### R-08 — Résilience GitHub

| Étape | Résultat attendu |
|---|---|
| Rendre GitHub indisponible (token invalide). | La demande reste en base. |
| Vérifier l'outbox. | Job `pending` ou `failed` avec erreur. |
| Rétablir le token. | Le job est rejoué et termine. |
| Vérifier la demande. | Issue/dossier créés, aucune perte. |

### R-09 — Administration

| Étape | Résultat attendu |
|---|---|
| Admin → Utilisateurs. | Liste, recherche, filtre. |
| Créer un agent. | Compte actif, rôle `agent`. |
| Désactiver le dernier admin. | 409. |
| Se désactiver soi-même. | 409. |
| Créer un type d'acte. | Type visible dans le catalogue. |
| Désactiver un type. | Retiré du catalogue, demandes existantes intactes. |
| Consulter l'audit. | Actions tracées, filtres. |
| Consulter les statistiques. | Totaux cohérents. |

### R-10 — Export et notifications

| Étape | Résultat attendu |
|---|---|
| Agent → Export CSV. | Fichier UTF-8 avec BOM, filtres appliqués. |
| Cloche de notifications. | Compteur non lu. |
| Marquer une notification lue. | Compteur décrémenté. |
| Tout marquer lu. | Compteur à zéro. |

### R-11 — Responsive et accessibilité

| Étape | Résultat attendu |
|---|---|
| Mobile 375 px. | Navigation en tiroir, tableaux scrollables, boutons accessibles. |
| Navigation clavier. | Focus visible, ordre logique, modales fermables avec Échap. |
| Contraste. | Texte lisible, badges compréhensibles sans couleur seule. |
| `prefers-reduced-motion`. | Animations désactivées. |

## 4. Checklist de recette

- [ ] R-01 à R-11 exécutés.
- [ ] Aucun secret dans le dépôt.
- [ ] Aucune erreur 500 sur le parcours nominal.
- [ ] Les logs ne contiennent pas de token.
- [ ] Le PDF est lisible et le QR fonctionne.
- [ ] L'historique correspond aux actions.
- [ ] La CI est verte.
- [ ] `docker compose up --build` fonctionne sur une machine vierge.
- [ ] Le README permet à un nouveau venu de démarrer.
