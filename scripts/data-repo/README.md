# Dépôt de données `gestactes-data`

Ce dossier contient le modèle à copier dans le dépôt **privé** `gestactes-data`.

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
    workflows/validate-acte.yml
    CODEOWNERS
  README.md
```

## Mise en place

1. Créer le dépôt privé `gestactes-data`.
2. Copier `.github/workflows/validate-acte.yml`.
3. Créer les dossiers `actes/`, `archives/`, `modeles/`.
4. Protéger `main` : PR obligatoire, checks `validate-acte`, pas de push direct.
5. Donner au PAT de l'application les droits Contents, Issues et Pull requests.

Le worker crée les Issues, branches, commits, PR et tags. Les développeurs ne
poussent pas directement dans ce dépôt.
