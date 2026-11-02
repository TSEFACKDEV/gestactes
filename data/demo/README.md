# Données de démonstration

**Propriétaire :** VOUMIA OUALA DILANE

Ce dossier contient des charges utiles fictives pour tester l'application sans
dépendre d'un vrai dépôt GitHub.

| Fichier | Usage |
|---|---|
| `acte_example.json` | Exemple de contenu d'acte. |
| `webhook_pr_merged.json` | Simulation d'une PR fusionnée. |
| `webhook_review.json` | Simulation d'une revue approuvée. |

## Simuler un webhook

```bash
export GITHUB_WEBHOOK_SECRET=change-me
python scripts/simulate_webhook.py \
  --event pull_request \
  --delivery local-001 \
  --payload data/demo/webhook_pr_merged.json
```

Le script calcule la signature HMAC et poste sur
`http://localhost:8000/api/v1/webhooks/github`.

## Comptes de démonstration

Créés par `python -m app.seed` :

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Citoyen | citoyen@gestactes.com | Demo1234! |
| Agent | agent@gestactes.com | Demo1234! |
| Validateur | validateur@gestactes.com | Demo1234! |
| Admin | admin@gestactes.com | Demo1234! |
