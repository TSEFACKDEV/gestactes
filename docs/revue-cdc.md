# Revue critique du cahier des charges GestActes

**Document source :** `Cahier_des_charges_GestActes.pdf`, version 1.0, octobre 2026.
**Objet :** audit de cohérence, de faisabilité et de testabilité.
**Version corrigée :** `docs/cahier-des-charges-v2.md`.
**Auteur de la revue :** TSEFACK CALVIN KLEIN, responsable intégration.

---

## 1. Verdict global

Le document est bien structuré, le contexte est clair et le sujet est correctement
rattaché aux concepts d'architecture répartie. Les besoins fonctionnels sont
identifiés, priorisés et couvrent un cycle de vie complet.

En revanche, la version 1.0 mélange **deux niveaux de ambition** : une architecture
de production à six services avec RabbitMQ, et un projet étudiant de huit semaines
à dix personnes. Elle contient aussi plusieurs **contradictions techniques** qui
empêcheraient une implémentation directe :

- le workflow n'a pas de nomenclature d'états stable ;
- la signature SHA-256 est définie de façon circulaire ;
- GitHub Actions tente de pousser sur une branche `main` protégée ;
- les routes REST ne correspondent pas toujours aux besoins fonctionnels ;
- certains besoins n'ont ni endpoint, ni critère d'acceptation ;
- la répartition des rôles ne garantit pas l'isolation des fichiers.

La version 2.0 corrige ces points et retient une architecture **simple, répartie
et démontrable** : un client React, une API FastAPI modulaire, un worker
d'arrière-plan, PostgreSQL, Nginx, GitHub et SMTP. RabbitMQ et le service
passerelle séparé sont retirés du MVP ; leur rôle est remplacé par une table
d'outbox et par Nginx. Le découpage logique reste propre et pourra évoluer vers
des services indépendants sans réécriture du domaine.

---

## 2. Points forts conservés

1. **Le mapping métier / GitHub est pertinent** : Issue = demande, branche =
   brouillon, PR = soumission, revue = décision, merge = signature, tag =
   archivage.
2. **Le cycle de vie est complet** : demande, instruction, validation, signature,
   archivage, vérification.
3. **Les priorités MoSCoW sont explicites** et le MVP est identifiable.
4. **Les exigences non fonctionnelles sont mesurables** (latence, disponibilité,
   sécurité, portabilité).
5. **Le cadre légal est déjà présent** : données fictives, dépôts privés,
   minimisation.
6. **La démarche de tests est annoncée** à plusieurs niveaux.

---

## 3. Anomalies et corrections

### 3.1 Architecture

| ID | Constat | Risque | Correction v2.0 |
|---|---|---|---|
| A-01 | Six services + API Gateway + RabbitMQ pour un projet de 8 semaines. | Surcharge d'intégration, retards, multiplication des fichiers de configuration. | API FastAPI modulaire + worker + PostgreSQL + Nginx. Le découpage interne reste par domaine. |
| A-02 | La passerelle vérifie le JWT puis chaque service le revérifie. | Duplication de code et de secrets, risque de divergence. | Nginx fait proxy et limite le débit ; l'API vérifie le JWT une seule fois via une dépendance commune. |
| A-03 | RabbitMQ est présenté comme obligatoire alors que les volumes sont faibles. | Installation, exploitation et tests supplémentaires. | Table `outbox_jobs` + worker. Même garantie de reprise, beaucoup plus simple. |
| A-04 | « GitHub source de vérité du contenu » et « PostgreSQL index » sans mécanisme de réconciliation. | Désynchronisation silencieuse. | Le contenu fait foi dans GitHub ; l'état du workflow fait foi en base ; le worker réconcilie via webhooks et relances. |
| A-05 | Le diagramme de déploiement mentionne Nginx mais le compose n'est pas décrit. | Déploiement non reproductible. | `docker-compose.yml` avec `db`, `api`, `worker`, `web`, `mailpit`, healthchecks et variables d'environnement. |

### 3.2 Workflow et signature

| ID | Constat | Risque | Correction v2.0 |
|---|---|---|---|
| W-01 | Les états sont écrits tantôt « Demandée », tantôt `en-validation`, tantôt `statut:demandée`. | Impossible de coder une machine à états fiable. | Énumération canonique : `demandee`, `en_instruction`, `en_validation`, `validee`, `signee`, `archivee`, `rejetee`, `annulee`. Les libellés français ne servent qu'à l'affichage. |
| W-02 | « Corrections demandées » renvoie en instruction, puis « Soumission » ouvre une nouvelle PR. | PR en double, branches orphelines, historique incohérent. | La PR reste ouverte ; l'agent pousse des commits sur la même branche et redemande une revue. La transition `en_instruction -> en_validation` est autorisée plusieurs fois. |
| W-03 | La signature est calculée puis le merge est effectué : le SHA du merge n'est pas connu au moment du calcul. | Signature non vérifiable, paradoxe de la hash. | `signature.json` signe le contenu canonique de `acte.json` et les octets de `acte.md`. Le SHA du merge est enregistré après coup en base et dans l'annotation du tag. |
| W-04 | Le hash est stocké dans `acte.json`, donc le hash modifierait le contenu qu'il hashe. | Auto-référence impossible. | Le hash vit dans un fichier séparé `signature.json`, jamais dans `acte.json`. |
| W-05 | Le rejet est présenté comme une revue GitHub. | GitHub ne propose que « Approve » et « Request changes ». | Le rejet = commentaire motivé + fermeture de la PR et de l'Issue. |
| W-06 | Aucun état terminal n'est explicitement interdit. | Transitions sauvages. | Table de transitions fermée ; `archivee`, `rejetee`, `annulee` sont terminales. |

### 3.3 GitHub et automatisation

| ID | Constat | Risque | Correction v2.0 |
|---|---|---|---|
| G-01 | Le workflow GitHub Actions pousse `acte.pdf` sur `main` après merge. | Échec si `main` est protégée, ce qui est justement recommandé. | Le PDF est généré par le worker après le merge, puis committé sur une branche dédiée ou via une GitHub App autorisée. Le workflow Actions se limite à la validation du JSON sur les PR. |
| G-02 | Le workflow de l'annexe B n'a ni `permissions`, ni `fetch-depth`, ni gestion du globstar. | Workflow non fonctionnel. | Workflow de validation fourni, avec `permissions: contents: read`, `fetch-depth: 0` et chemins explicites. |
| G-03 | Le webhook est décrit comme « PR fusionnée ». | Cet événement n'existe pas. | Écouter `pull_request` avec `action=closed` et `pull_request.merged=true`, ainsi que `pull_request_review`. |
| G-04 | Aucune gestion de l'idempotence des webhooks. | Double traitement, doubles notifications, doubles commits. | Table `webhook_events` avec `delivery_id` unique + vérification HMAC `X-Hub-Signature-256`. |
| G-05 | Un seul dépôt `actes-data` + un dépôt `actes-archives` + le dépôt de code. | Trois dépôts à synchroniser pour une équipe étudiante. | Un dépôt de données `gestactes-data` avec `actes/` et `archives/`, plus le dépôt de code. Le dossier `archives/` est protégé par convention et par CODEOWNERS. |
| G-06 | Les pièces jointes binaires sont committées sans limite réaliste. | Dépôt qui gonfle, quotas, clones lents. | 3 pièces maximum, 5 Mo par pièce, types PDF/JPEG/PNG, nom nettoyé, hash SHA-256, avertissement sur Git LFS. |
| G-07 | Les noms de branches utilisent `AR-2026-00042` en majuscules. | URL et outillage moins prévisibles. | `acte/AR-2026-00042`, en minuscules. |
| G-08 | Le compte technique GitHub n'est pas tranché (PAT ou GitHub App). | Blocage au moment de l'intégration. | PAT fine-grained pour le MVP, GitHub App documentée comme évolution. |

### 3.4 API REST

| ID | Constat | Risque | Correction v2.0 |
|---|---|---|---|
| P-01 | Les routes mélangent `/demandes` et `/actes/{id}` pour la même ressource. | Contrats ambigus, erreurs front-end. | `/demandes` est la ressource pivot ; les actions sont des sous-ressources explicites (`/demandes/{id}/prise-en-charge`, `/decision`, `/signature`). |
| P-02 | `DELETE /demandes/{id}` est utilisé pour annuler. | `DELETE` suggère une suppression définitive. | `POST /demandes/{id}/annulation`. |
| P-03 | `GET /admin/utilisateurs` est décrit comme « CRUD complet ». | Aucun POST/PATCH/DELETE documenté. | Contrat CRUD complet documenté. |
| P-04 | Aucune route pour les notifications, le reset de mot de passe, l'export CSV, les statistiques, le téléchargement des pièces. | Besoins EF-04, EF-25, EF-29, EF-31 non couverts. | Routes ajoutées et numérotées dans `docs/api-contract.md`. |
| P-05 | Pas de versionnage d'API. | Ruptures de contrat en cours de projet. | Préfixe `/api/v1`. |
| P-06 | Pas de format d'erreur ni de pagination standard. | Front-end obligé de deviner. | Enveloppe `Page<T>`, erreur `{error: {code, message, details, request_id}}`. |
| P-07 | Pas d'idempotence sur la création de demande. | Doublons en cas de double clic ou de retry. | En-tête `Idempotency-Key` accepté et stocké. |
| P-08 | Le webhook est listé comme rôle « GitHub (HMAC) » sans schéma de sécurité. | Confusion avec un endpoint public. | Endpoint public mais signature HMAC obligatoire, horodatage et rejet des doublons. |

### 3.5 Modèle de données et sécurité

| ID | Constat | Risque | Correction v2.0 |
|---|---|---|---|
| D-01 | Aucune table pour les refresh tokens, les tokens de reset ou les webhooks. | Impossible de révoquer une session ou de garantir l'idempotence. | Tables `refresh_tokens`, `password_reset_tokens`, `webhook_events`. |
| D-02 | Aucune table d'outbox. | Perte d'opérations GitHub en cas de panne. | Table `outbox_jobs` avec statut, tentatives et date de reprise. |
| D-03 | Le numéro d'acte est supposé unique sans mécanisme de génération concurrent. | Collision de numéros. | Séquence PostgreSQL par année + contrainte unique + transaction. |
| D-04 | Le statut est dupliqué dans `acte.json`, dans les labels GitHub et en base. | Trois sources de vérité. | Base = état du workflow ; GitHub = miroir par labels ; `acte.json` ne contient pas le statut. |
| D-05 | Les jetons JWT ne sont pas situés (cookie ou localStorage). | Vulnérabilité XSS ou CSRF selon le choix. | Access token en mémoire ; refresh token en cookie `HttpOnly`, `SameSite=Lax`, rotation. |
| D-06 | Pas de limitation de débit sur le login et la vérification publique. | Brute force et énumération. | Limitation Nginx + verrouillage progressif applicatif sur le login. |
| D-07 | La validation des fichiers est mentionnée mais pas spécifiée. | Upload malveillant. | Taille, nombre, type MIME réel, extension, nom, hash, stockage hors base. |
| D-08 | Les données personnelles dans GitHub ne sont pas minimisées. | Risque RGPD même avec des données fictives. | Données fictives, dépôt privé, pas d'e-mail dans `acte.json`, journalisation limitée. |

### 3.6 Tests, planning et organisation

| ID | Constat | Risque | Correction v2.0 |
|---|---|---|---|
| T-01 | Objectif de couverture > 70 % sur tous les services. | Inatteignable sur 8 semaines avec 10 personnes. | Cible MVP : 70 % sur les modules critiques (workflow, auth, GitHub), 50 % global. |
| T-02 | Aucun critère d'acceptation par besoin. | « Fini » devient subjectif. | Chaque EF priorité Haute a un critère Given/When/Then. |
| T-03 | Aucun test de contrat API. | Front et back divergent. | OpenAPI généré, tests de schéma, `docs/api-contract.md` figé avant codage. |
| T-04 | Le planning ne précise pas les dépendances entre tâches. | Blocages en cascade. | Ordre d'intégration et graphe de dépendances dans `docs/repartition-taches.md`. |
| T-05 | La répartition des rôles ne garantit pas « un fichier = une personne ». | Conflits Git permanents. | Matrice de propriété exclusive + fichiers partagés gelés + protocole de demande de modification. |
| T-06 | Aucune Definition of Done ni checklist de revue. | PR inégales. | DoD globale et checklist PR dans `CONTRIBUTING.md`. |

### 3.7 Expérience utilisateur et design

| ID | Constat | Risque | Correction v2.0 |
|---|---|---|---|
| U-01 | Aucune direction artistique. | Interface hétérogène. | Design system soft et professionnel : Plus Jakarta Sans, vert forêt/or, icônes Lucide, animations discrètes. |
| U-02 | Aucune exigence d'accessibilité concrète. | Interface difficile à utiliser. | Contraste, focus visible, labels, navigation clavier, `prefers-reduced-motion`. |
| U-03 | Aucun état vide, chargement ou erreur défini. | Écrans incomplets. | Composants `EmptyState`, `Skeleton`, `Alert`, `Spinner` imposés. |
| U-04 | Le responsive est mentionné mais non testé. | Mauvaise expérience mobile. | Points de rupture Tailwind et test mobile dans la recette. |

---

## 4. Décisions structurantes de la version 2.0

### 4.1 Architecture retenue

```
Navigateur
   |
   v
Nginx (fichiers React + proxy /api)
   |
   v
API FastAPI  ---> PostgreSQL
   |                  ^
   |                  |
   +--> GitHub API    |
   +--> SMTP          |
                      |
Worker  ------------+
   |
   +--> GitHub API
   +--> SMTP
   +--> génération PDF
```

- **Un seul dépôt de code**, un dépôt de données GitHub séparé.
- **API modulaire** : `auth`, `demandes`, `workflow`, `admin`, `notifications`,
  `verification`, `webhooks`. Les frontières sont dans les dossiers, pas dans
  des conteneurs.
- **Worker séparé** : traite les jobs GitHub, e-mail, PDF et archivage.
- **PostgreSQL** : utilisateurs, demandes, état du workflow, audit, outbox,
  notifications.
- **GitHub** : contenu des actes, historique, Issues, PR, tags.
- **SMTP** : Mailpit en développement, vrai SMTP en production.

### 4.2 Ce qui est explicitement hors périmètre du MVP

- RabbitMQ, Kafka ou tout bus de messages externe.
- GitHub App (le PAT fine-grained suffit).
- Signature électronique qualifiée eIDAS.
- Paiement, application mobile native, mode hors ligne.
- Multi-tenant, internationalisation, thème sombre.
- Microservices déployés séparément.

### 4.3 Ce qui est ajouté

- `docs/api-contract.md` : contrat figé avant le développement.
- `docs/workflow.md` : machine à états et transitions autorisées.
- `docs/repartition-taches.md` : propriétaire unique par fichier, branches,
  commandes Git et ordre d'intégration.
- `docs/design-system.md` : direction artistique et composants.
- `docs/recette.md` : scénarios de recette et jeu de démonstration.
- `docs/github-setup.md` : labels, protection de branches, token, webhook.
- `backend/app/seed.py` : comptes et types d'actes de démonstration.
- `scripts/simulate_webhook.py` : test local sans exposer la machine.
- `docker-compose.yml` : lancement en une commande.

---

## 5. Checklist de validation du cahier des charges corrigé

- [x] Tous les besoins ont un identifiant, une priorité, un acteur et un critère
      d'acceptation.
- [x] Tous les états du workflow sont nommés de façon unique et codable.
- [x] La signature ne modifie pas le contenu qu'elle hashe.
- [x] Le workflow GitHub Actions ne pousse pas sur une branche protégée.
- [x] Chaque route REST correspond à un besoin fonctionnel.
- [x] Les erreurs, la pagination et l'authentification ont un format unique.
- [x] Le modèle de données couvre les jetons, l'audit, l'outbox et les webhooks.
- [x] Les secrets et les données personnelles sont hors du dépôt.
- [x] Les tests et la Definition of Done sont explicites.
- [x] Chaque fichier du projet a un propriétaire unique.
- [x] Le parcours de démonstration tient en moins de dix minutes.

---

## 6. Conclusion

La version 1.0 est un bon document de cadrage, mais elle n'est pas directement
implémentable. La version 2.0 conserve l'ambition pédagogique (GitHub comme
référentiel, workflow, traçabilité, architecture répartie) tout en supprimant
les sources de complexité inutiles. Elle est volontairement plus petite, plus
précise et plus testable.

Le projet final doit rester **simple, lisible et démontrable** : une API, un
worker, une base, un front, GitHub. La qualité vient de la rigueur du workflow,
de la traçabilité et des tests, pas du nombre de conteneurs.
