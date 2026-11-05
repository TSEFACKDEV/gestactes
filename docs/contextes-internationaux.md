# Contexte international

**Propriétaire :** TSEFACK CALVIN KLEIN
**Objectif :** garder un socle commun tout en adaptant GestActes à d'autres pays
ou collectivités.

---

## 1. Principe

GestActes ne dépend pas du Cameroun dans son architecture. Le pays, la commune,
les types d'actes et les mentions légales sont des **données de configuration**,
pas des règles codées en dur.

Le jeu de démonstration est camerounais :

- attestation de résidence ;
- extrait d'acte de naissance ;
- autorisation de bâtir ;
- numéros `AR-`, `EN-`, `AB-` ;
- commune de Douala 5e.

## 2. Couches à adapter

| Couche | Fichier / zone | À changer |
|---|---|---|
| Types d'actes | `backend/app/seed.py`, administration | Codes, libellés, descriptions, champs. |
| Schémas de formulaires | `form_schema` des types | Champs, options, champs obligatoires. |
| Gabarits | `template_md` | Mentions légales, titres, formule de clôture. |
| Numérotation | `backend/app/services/numbering.py` | Préfixes et format. |
| Validation du numéro | `frontend/src/lib/validation.ts` | Regex et exemples. |
| Autorité | Textes et pages | Commune, arrondissement, centre d'état civil. |
| Coordonnées | Pied de page, PDF | Adresse, téléphone, site. |
| Langue | Textes | Français, anglais, autre langue. |
| Dates | `Intl.DateTimeFormat` | Format local. |
| Adresses | Formulaires | Ordre des champs, code postal, quartier. |
| Vérification | URL du QR code | Domaine public réel. |

## 3. Exemples d'adaptation

### France

- Attestation de domicile : `AD-2026-00042`.
- Acte de naissance : `AN-2026-00042`.
- Permis de construire : `PC-2026-00042`.
- Champs : commune, code postal, numéro de voie, date de naissance, filiation.

### Sénégal

- Attestation de résidence : `AR-`.
- Extrait d'acte de naissance : `EN-`.
- Autorisation de construire : `AC-`.
- Champs : région, département, commune, quartier.

### Côte d'Ivoire

- Attestation de résidence : `AR-`.
- Extrait d'acte de naissance : `EN-`.
- Permis de construire : `PC-`.
- Champs : commune, quartier, lot, îlot.

### Belgique / Canada

- Utiliser les termes locaux : « attestation de domicile », « certificat de
  résidence », « permis de bâtir ».
- Adapter les identifiants nationaux et les formats d'adresse.
- Prévoir l'anglais ou la langue locale.

## 4. Checklist

- [ ] Remplacer les trois types dans `seed.py`.
- [ ] Mettre à jour les préfixes dans `numbering.py`.
- [ ] Mettre à jour la regex de validation du numéro.
- [ ] Adapter les champs et les pièces demandées.
- [ ] Adapter les gabarits Markdown.
- [ ] Remplacer les mentions « commune de Douala 5e ».
- [ ] Mettre à jour les textes du README et des pages publiques.
- [ ] Vérifier les exemples de la FAQ.
- [ ] Vérifier le QR code et l'URL de vérification.
- [ ] Tester avec des données fictives locales.
- [ ] Faire relire les mentions légales par une personne compétente.

## 5. Limites

- La signature reste simulée : elle n'a pas de valeur légale.
- Les registres officiels ne sont pas connectés.
- Une exploitation réelle exige une base légale, un hébergement conforme et une
  politique de conservation des données.
