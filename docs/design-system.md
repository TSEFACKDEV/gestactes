# Design system GestActes

**Propriétaire :** GUEMOGNE GERALDINE ESTHER
**Version :** 1.0
**Objectif :** interface soft, moderne, professionnelle, calme et lisible.

---

## 1. Principes

1. **Le contenu d'abord.** Pas de décoration qui compete avec l'information.
2. **De la lumière et de l'air.** Fond chaud, cartes blanches, bordures fines,
   espacements généreux.
3. **Une seule action primaire par écran.** Les actions secondaires sont
   discrètes.
4. **Pas d'emoji, pas de gradient criard, pas d'effet “IA”.** Les icônes sont
   des icônes, pas des emoticônes.
5. **Le mouvement sert la compréhension.** Il est court, doux et désactivable.
6. **Accessible par défaut.** Contraste, focus, clavier, labels.

---

## 2. Typographie

| Usage | Police | Graisse | Taille |
|---|---|---|---|
| Titres de page | Plus Jakarta Sans | 600 | 30–36 px |
| Titres de section | Plus Jakarta Sans | 600 | 22–24 px |
| Titres de carte | Plus Jakarta Sans | 600 | 18 px |
| Corps | Inter | 400 | 14–16 px |
| Labels | Inter | 500 | 13 px |
| Méta / aides | Inter | 400 | 12–13 px |
| Chiffres, hash, numéros | IBM Plex Mono | 500 | 13–14 px |

Chargement dans `frontend/index.html` :

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700&family=IBM+Plex+Mono:wght@500&display=swap"
  rel="stylesheet"
/>
```

Tailwind :

```ts
fontFamily: {
  sans: ["Inter", "system-ui", "sans-serif"],
  display: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
  mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
}
```

---

## 3. Couleurs

| Token | Hex | Usage |
|---|---|---|
| `canvas` | `#F7F4EC` | Fond général chaud. |
| `surface` | `#FFFFFF` | Cartes, formulaires, modales. |
| `surface-muted` | `#F1EFEA` | Zones secondaires, hover. |
| `ink` | `#24332A` | Texte principal. |
| `ink-soft` | `#64756A` | Texte secondaire. |
| `line` | `#DDD8CC` | Bordures. |
| `primary` | `#1E4D3A` | Vert forêt, actions principales. |
| `primary-hover` | `#143528` | Hover. |
| `primary-soft` | `#E4F0E7` | Fonds d'état actif, badges. |
| `accent` | `#C08A2E` | Or camerounais, accent rare. |
| `accent-soft` | `#F6EEE0` | Fond accent. |
| `success` | `#2F7D5B` | Succès. |
| `success-soft` | `#EAF3ED` | Fond succès. |
| `warning` | `#A97822` | Avertissement. |
| `warning-soft` | `#FBF1DF` | Fond avertissement. |
| `danger` | `#B4453B` | Erreur, rejet. |
| `danger-soft` | `#F9EAEA` | Fond erreur. |
| `info` | `#4A6FA5` | Information. |
| `info-soft` | `#EAF0F8` | Fond information. |

**Règles**

- Le fond général n'est jamais blanc pur : `canvas` sépare les cartes.
- Les couleurs de statut sont toujours accompagnées d'un libellé, jamais de la
  couleur seule.
- Pas de dégradé. Pas de néon. Pas de noir pur.
- Le vert forêt est la couleur d'action ; l'or est un accent, pas une
  couleur d'action.

---

## 4. Espacement, rayons, ombres

| Token | Valeur |
|---|---|
| Espacement de base | 4 px |
| Padding de page | 24 px mobile, 32 px desktop |
| Gap de grille | 16 px mobile, 24 px desktop |
| Largeur de contenu | `max-w-7xl` (1280 px) |
| Sidebar | 264 px |
| Topbar | 64 px |
| Rayon `sm` | 6 px |
| Rayon `md` | 10 px |
| Rayon `lg` | 14 px |
| Rayon `xl` | 18 px |
| Ombre `soft` | `0 1px 2px rgba(31,42,40,.04), 0 8px 24px rgba(31,42,40,.06)` |
| Ombre `lifted` | `0 2px 4px rgba(31,42,40,.05), 0 16px 40px rgba(31,42,40,.08)` |

Les cartes utilisent `border border-line` + `shadow-soft`, pas les deux
exagérément. Les modales utilisent `shadow-lifted`.

---

## 5. Icônes

- Bibliothèque : `react-icons/lu` (Lucide).
- Tailles : 16 px (inline), 18 px (boutons), 20 px (navigation), 24 px (états
  vides), 28–32 px (hero).
- Couleur : `currentColor`, jamais une couleur codée en dur.
- Pas d'emoji dans les libellés, les boutons, les notifications ou les titres.
- Une icône seule doit avoir un `aria-label` et un `title`.

Exemples :

```tsx
import { LuFileText, LuClock, LuCircleCheck, LuUsers } from "react-icons/lu";

<LuFileText aria-hidden="true" className="h-[18px] w-[18px]" />
```

---

## 6. Composants

### 6.1 Boutons

| Variante | Fond | Texte | Bordure | Usage |
|---|---|---|---|---|
| `primary` | `primary` | blanc | aucune | Action principale. |
| `secondary` | blanc | `ink` | `line` | Action secondaire. |
| `ghost` | transparent | `ink-soft` | aucune | Action tertiaire. |
| `danger` | `danger` | blanc | aucune | Rejet, suppression. |
| `link` | transparent | `primary` | aucune | Lien inline. |

- Hauteurs : `sm` 32 px, `md` 40 px, `lg` 48 px.
- Rayon `md`.
- Transition 150 ms.
- `active:scale-[0.98]`.
- `focus-visible:ring-2 ring-primary/30 ring-offset-2`.
- État `loading` : spinner + texte, bouton désactivé.
- Icône à gauche ou à droite, jamais au milieu du texte.

### 6.2 Champs

- Label au-dessus, 13 px, `font-medium`.
- Champ 40 px, fond blanc, bordure `line`, rayon `md`.
- Placeholder `ink-soft/60`.
- Focus : bordure `primary`, ring 2 px `primary/20`.
- Erreur : bordure `danger`, message 12 px `danger`.
- Aide : 12 px `ink-soft`.
- `required` : astérisque discrète ou mention « obligatoire ».
- Jamais de placeholder comme seul label.

### 6.3 Cartes

- Fond `surface`, bordure `line`, rayon `xl`, ombre `soft`.
- Padding 20–24 px.
- Titre 18 px `font-display`.
- Une carte = une idée. Pas de carte dans une carte.

### 6.4 Badges de statut

| Statut | Fond | Texte |
|---|---|---|
| `demandee` | `warning-soft` | `warning` |
| `en_instruction` | `info-soft` | `info` |
| `en_validation` | `#F1ECFA` | `#6B4FA8` |
| `validee` | `success-soft` | `success` |
| `signee` | `primary-soft` | `primary` |
| `archivee` | `surface-muted` | `ink-soft` |
| `rejetee` | `danger-soft` | `danger` |
| `annulee` | `surface-muted` | `ink-soft` |

- Forme : `rounded-full`, padding 4/10, texte 12 px `font-medium`.
- Point de couleur 6 px + libellé.
- Jamais de badge uniquement coloré.

### 6.5 Tableaux

- Conteneur carte, `overflow-x-auto`.
- En-tête `surface-muted`, texte 12 px uppercase `tracking-wide`.
- Lignes 56 px, hover `surface-muted/60`.
- Pas de zébrure.
- Actions à droite, icônes avec tooltip.
- Pagination sous le tableau.
- Mobile : scroll horizontal, pas de transformation en cartes pour le MVP.

### 6.6 Modales

- Overlay `ink/30` + blur léger.
- Panneau blanc, rayon `xl`, ombre `lifted`, max-w-lg.
- Titre 20 px, description 14 px.
- Actions alignées à droite : secondaire puis primaire.
- Fermeture : bouton X, Échap, clic sur l'overlay.
- `role="dialog"`, `aria-modal="true"`, focus sur le premier champ.
- Animation `fade-in` + `scale-in` 180 ms.

### 6.7 États vides

- Icône 32 px dans un cercle `primary-soft`.
- Titre 16 px, description 14 px `ink-soft`.
- Une action principale si pertinent.
- Pas d'illustration complexe.

### 6.8 Timeline

- Ligne verticale `line`, points 10 px.
- Point actif `primary`, point passé `success`, point futur `line`.
- Date à gauche sur desktop, au-dessus sur mobile.
- Texte 14 px, méta 12 px.

### 6.9 Toasts

- Bas droite, max-w-sm, fond blanc, bordure `line`, ombre `lifted`.
- Icône de statut, titre 14 px, message 13 px.
- Durée 4 s, fermeture manuelle.
- `aria-live="polite"`.

---

## 7. Mouvement

| Animation | Durée | Easing | Usage |
|---|---|---|---|
| `fade-in` | 200 ms | ease-out | Apparition de page, modale. |
| `slide-up` | 240 ms | `cubic-bezier(.22,1,.36,1)` | Cartes, listes. |
| `scale-in` | 180 ms | ease-out | Modale, menu. |
| `shimmer` | 1.4 s | linéaire | Skeleton. |
| `pulse-soft` | 2 s | ease-in-out | Indicateur de chargement. |

Règles :

- Pas d'animation en boucle sauf skeleton et indicateur de chargement.
- Pas de rebond, pas de rotation, pas de parallaxe.
- `hover` : `translateY(-2px)` maximum sur les cartes cliquables.
- `active` : `scale(0.98)` sur les boutons.
- Respecter `prefers-reduced-motion: reduce` : désactiver les translations et
  les animations non essentielles.

---

## 8. Layout

### 8.1 Public

- Header simple : logo, lien « Vérifier un acte », bouton « Se connecter ».
- Contenu centré, max-w-6xl.
- Hero : titre 40–48 px, texte 18 px, deux actions maximum.
- Sections avec beaucoup d'air, séparateurs `line`.

### 8.2 Application

```text
┌──────────────┬─────────────────────────────────────┐
│ Sidebar 264  │ Topbar 64                            │
│              ├─────────────────────────────────────┤
│ Navigation   │ Page header                          │
│ par rôle     │ Contenu max-w-7xl                    │
│              │                                     │
└──────────────┴─────────────────────────────────────┘
```

- Sidebar fixe desktop, drawer mobile.
- Item actif : fond `primary-soft`, texte `primary`, indicateur 3 px à gauche.
- Topbar : fil d'Ariane, cloche, avatar.
- Page header : titre, description, action principale à droite.
- Contenu : `px-6 py-8` mobile, `px-8 py-10` desktop.

### 8.3 Connexion / inscription

- Deux colonnes desktop : panneau de présentation à gauche (fond `primary`),
  formulaire à droite sur `surface`.
- Mobile : formulaire seul, logo en haut.
- Pas de photo, pas d'illustration lourde.

---

## 9. Règles de contenu

- Français, phrases courtes, ton neutre et professionnel.
- Pas d'emoji.
- Pas de majuscules criardes.
- Les numéros d'acte sont en monospace : `AR-2026-00042`.
- Les dates sont affichées en `jj MMM yyyy` (ex. `12 oct. 2026`) et les heures
  en `HH:mm`.
- Les erreurs expliquent **quoi faire**, pas seulement ce qui a échoué.
- Les boutons sont des verbes : « Enregistrer », « Soumettre », « Signer ».
- Les titres de page sont des noms : « Mes demandes », « File de validation ».

---

## 10. Accessibilité

- Contraste AA minimum (4.5:1 pour le texte normal).
- `focus-visible` toujours visible, jamais `outline: none` sans remplacement.
- Tous les champs ont un label associé.
- Les erreurs sont liées au champ via `aria-describedby`.
- Les modales piègent le focus et rendent le focus à l'élément déclencheur.
- Les tableaux ont un `<caption>` ou un titre accessible.
- Les icônes décoratives ont `aria-hidden="true"`.
- Les icônes seules ont un `aria-label`.
- Navigation clavier complète.
- `prefers-reduced-motion` respecté.
- Tester au clavier et avec un lecteur d'écran sur les parcours principaux.

---

## 11. À ne pas faire

- Pas d'emoji dans l'interface.
- Pas de dégradé violet/bleu « IA ».
- Pas de glassmorphism.
- Pas d'ombres noires dures.
- Pas de boutons `rounded-full` partout.
- Pas de texte blanc sur fond clair.
- Pas de tableau sans en-tête.
- Pas de formulaire sans label.
- Pas de modale sans bouton de fermeture.
- Pas de page sans état vide, chargement ou erreur.
- Pas de dépendance à une seule couleur pour un statut.
