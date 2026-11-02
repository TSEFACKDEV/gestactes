# Démonstration de 10 minutes

**Propriétaire :** VOUMIA OUALA DILANE
**Public :** encadrant et équipe
**Objectif :** montrer le cycle complet, la traçabilité et la vérification.

---

## 1. Préparation (la veille)

```bash
cp .env.example .env
docker compose up --build -d
docker compose exec api python -m app.seed
```

Vérifier :

- http://localhost:8080
- http://localhost:8000/docs
- http://localhost:8025
- Le dépôt `gestactes-data` est configuré avec le token et le webhook.
- Les comptes de démonstration fonctionnent.
- Une demande de secours existe à l'état `demandee`.

## 2. Plan de démonstration

| Temps | Séquence | Message |
|---|---|---|
| 0:00–1:00 | Accueil, problème, promesse. | « Un acte administratif doit être traçable, relu et vérifiable. » |
| 1:00–2:30 | Connexion citoyen, catalogue, dépôt. | « Le formulaire s'adapte au type d'acte. » |
| 2:30–4:00 | Agent : file, prise en charge, brouillon, soumission. | « Chaque enregistrement crée un commit. » |
| 4:00–5:30 | GitHub : Issue, branche, commits, PR. | « GitHub est le référentiel de confiance. » |
| 5:30–7:00 | Validateur : revue, corrections, approbation. | « Le contrôle est séparé de l'instruction. » |
| 7:00–8:30 | Signature, PDF, QR, archive. | « La signature produit une empreinte et un PDF vérifiable. » |
| 8:30–9:30 | Vérification publique. | « N'importe qui peut vérifier l'acte sans voir les données personnelles. » |
| 9:30–10:00 | Architecture, tests, CI, conclusion. | « Simple, réparti, testé, documenté. » |

## 3. Script détaillé

### 3.1 Introduction

- GestActes gère trois types d'actes.
- Le contenu est stocké dans GitHub.
- L'état du workflow est en base.
- Les rôles sont séparés : citoyen, agent, validateur, admin.

### 3.2 Citoyen

1. Se connecter avec `citoyen@gestactes.com`.
2. Ouvrir « Demander un acte ».
3. Choisir « Attestation de résidence ».
4. Remplir l'adresse et la date.
5. Joindre un PDF.
6. Déposer.
7. Montrer le numéro, le statut et la timeline.

### 3.3 Agent

1. Se connecter avec `agent@gestactes.com`.
2. Ouvrir la file.
3. Prendre en charge la demande.
4. Modifier le brouillon.
5. Enregistrer : montrer le message de commit.
6. Soumettre à validation.

### 3.4 GitHub

1. Ouvrir l'Issue.
2. Montrer la branche `acte/2026-00042`.
3. Montrer les commits.
4. Ouvrir la Pull Request.
5. Montrer le label `statut:en-validation`.

### 3.5 Validateur

1. Se connecter avec `validateur@gestactes.com`.
2. Ouvrir la file de validation.
3. Examiner le contenu et la comparaison.
4. Demander une correction avec commentaire.
5. Revenir à l'agent, corriger, soumettre.
6. Approuver.

### 3.6 Signature

1. Ouvrir l'acte validé.
2. Cliquer sur « Signer l'acte ».
3. Confirmer.
4. Montrer le hash, le merge, le tag.
5. Télécharger le PDF.
6. Scanner le QR code.

### 3.7 Vérification publique

1. Ouvrir `/verification/2026-00042`.
2. Montrer « Valide », le type, la date, le signataire, le hash.
3. Rappeler qu'aucune donnée personnelle n'est exposée.

### 3.8 Conclusion

- Architecture : React, FastAPI, worker, PostgreSQL, GitHub, SMTP.
- Qualité : tests, CI, audit, outbox, webhooks.
- Limites : signature simulée, données fictives, pas de paiement.
- Évolutions : GitHub App, Alembic, stockage objet, RabbitMQ si besoin.

## 4. Plan de secours

| Problème | Solution |
|---|---|
| GitHub indisponible | Montrer la demande en base et le job outbox en attente. |
| Webhook non reçu | Utiliser `scripts/simulate_webhook.py`. |
| PDF non généré | Montrer le job `pdf.generate` et le statut `signee`. |
| Connexion impossible | Utiliser un autre compte ou restaurer le seed. |
| Base vide | `docker compose exec api python -m app.seed`. |
| Frontend cassé | Montrer Swagger UI et les tests. |

## 5. Checklist avant de commencer

- [ ] Les conteneurs sont démarrés.
- [ ] Le seed est chargé.
- [ ] Le token GitHub est valide.
- [ ] Le webhook est configuré ou smee est lancé.
- [ ] Mailpit est ouvert.
- [ ] Swagger est ouvert dans un onglet.
- [ ] GitHub est ouvert dans un onglet.
- [ ] Le PDF d'exemple est prêt.
- [ ] Le plan de secours est connu.
