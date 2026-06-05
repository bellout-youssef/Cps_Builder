# CLAUDE.md — Plateforme SaaS de Génération de CPS

> Ce fichier est la source de vérité du projet. Lis-le avant toute génération de code.
> Ne demande PAS de recoller le cahier des charges : tout est ici.

---

## 1. OBJECTIF

Plateforme SaaS **multi-organisations** pour créer, gérer, valider, publier et archiver
des **CPS** (Cahiers des Prescriptions Spéciales) à partir de référentiels structurés.

Génération automatique de : **CPS HTML (maître)**, **DOCX**, **PDF**, **BDP**, **Estimation**.
Modèles de référence = modèles **TMPA** (fichiers dans `/templates`).

### Règle documentaire FONDAMENTALE (ne jamais violer)
```
Données structurées → HTML natif → DOCX → PDF
```
Jamais l'inverse. **Le HTML est la source officielle.** DOCX et PDF en dérivent.
La mise en forme TMPA doit être respectée strictement.

---

## 2. STACK TECHNIQUE (imposée — ne pas dévier)

- **Backend** : NestJS (TypeScript), architecture modulaire
- **Frontend** : Next.js (App Router) + React + TypeScript
- **ORM** : Prisma
- **Base de données** : PostgreSQL (RLS pour isolation multi-tenant, tsvector pour recherche plein texte, JSONB pour structures flexibles)
- **Auth** : JWT (access + refresh)
- **Génération docs** : HTML maître → DOCX (lib `docx` ou LibreOffice headless) → PDF (Puppeteer). Excel via `exceljs`.
- **Conteneurisation** : Docker + docker-compose
- **Monorepo** : structure `apps/api`, `apps/web`, `packages/shared`

---

## 3. MULTI-ORGANISATIONS

- Chaque organisation possède : Utilisateurs, Projets CPS, Référentiels, Documents.
- **Isolation TOTALE** entre organisations (RLS PostgreSQL + guard `organization_id` sur chaque requête).
- Création d'une org : soit **vide**, soit **duplication du référentiel TMPA** (copie indépendante).

---

## 4. RÔLES (RBAC)

| Rôle | Périmètre |
|------|-----------|
| **Super Administrateur** | Organisations, Abonnements, Licences, Monitoring, Support. AUCUN accès au contenu métier. |
| **Administrateur Organisation** | Utilisateurs, Rôles, Paramètres organisation. |
| **Responsable Référentiel** | Articles, Clauses techniques, Fiches techniques, Séries, Documents, Formules, Publication référentiels, Publication CPS. |
| **Créateur** | Crée/modifie : Projets CPS, Articles non publiés, Clauses non publiées. |
| **Vérificateur** | Vérifie les projets. |
| **Validateur Métier** | Valide le contenu métier. |

- Les menus s'affichent selon les droits.
- **Le backend contrôle SYSTÉMATIQUEMENT les permissions** (jamais confiance au frontend).

### Multi-rôles & séparation des responsabilités
- Multi-rôles **autorisés** pour un même utilisateur.
- MAIS séparation des responsabilités obligatoire **sur un même CPS** :
  créateur ≠ vérificateur ≠ validateur (un même utilisateur ne peut pas cumuler
  ces étapes sur un CPS donné).

### Administration des utilisateurs (Admin Organisation)
- Création **manuelle** des utilisateurs, **pas d'email automatique**.
- **Mot de passe temporaire obligatoire** → changement forcé à la 1ère connexion.
- **Suppression INTERDITE** : seulement **désactivation** (historique conservé).
- Désactivation autorisée même si l'utilisateur est affecté à des projets : le système
  **affiche une alerte des impacts** et permet la réaffectation.
- Droits de l'Admin Organisation : créer/modifier utilisateurs, changer les rôles,
  réinitialiser le mot de passe, désactiver/réactiver, **prise de possession d'un projet**.

---

## 5. WORKFLOW CPS

```
Créateur → Vérificateur → Validateur Métier → Responsable Référentiel → Publication
```
Actions à chaque étape : **Valider**, **Rejeter**, **Demander modification**.

---

## 6. MODULES PRINCIPAUX

Accueil · Bibliothèque · Nouveau Projet · Référentiel · Administration · Notifications
(affichage selon les droits)

---

## 7. RÉFÉRENTIEL

Contient : Articles, Clauses Techniques, Fiches Techniques, Séries, Unités,
Révision des Prix, Documents de Référence, Modèles CPS.

### Articles
Cycle : `Brouillon → Publication → Publié → Archivage`
- Un article reçoit un **code UNIQUEMENT à la publication**.
- L'**unité** est choisie à la création puis **figée après publication** (rejeter toute modif d'unité ensuite).
- Rattachable à : clauses, prix unitaires, base articles.

### Clauses Techniques
- Base administrée par le Responsable Référentiel.
- Numérotation **indépendante** du type de travaux.
- À la création d'un CPS : Articles sélectionnés → Clauses proposées automatiquement → sélection manuelle possible.
- Les clauses sont **liées aux articles**.

### Fiches Techniques
Stockées comme : Titre, Lien URL, Description. Rattachables à des articles.

### Types de Projet (choix obligatoire à la création, multi-sélection autorisée)
- **A** = Aménagement
- **B** = Bâtiment
- **O** = Ouvrages d'art
- **M** = Maritime et Portuaire
- **E** = MT/BT

Les référentiels proposés dépendent des types choisis.

---

## 7bis. CODIFICATION (structure de codes validée)

Principe transverse : **séparer l'ID technique (machine, court) du code métier (humain, lisible)**.

| Entité | Format code métier | Notes |
|--------|-------------------|-------|
| **Séries** | `A-100`, `A-200`, `A-300`... | Ex : A-100 Terrassements, A-200 Assainissement, A-300 Voirie |
| **Articles** | `A-101` | + ID interne court (ex : `a001`) |
| **Clauses techniques** | `CT-B-001`, `CT-A-001`... | Structuré par domaine, lisible + scalable |
| **Sous-clauses** | *aucun code métier visible* | Titre uniquement + ID interne |
| **Fiches techniques** | `FT-B-001`, `FT-A-001` | Rattachables à plusieurs articles |
| **Documents de référence** | `DR-0001`, `DR-0002` | Format global unique. Liens ou fichiers externes |
| **Modèles CPS** | `MCPS-T-001` (Travaux) | V1 = Travaux uniquement, mais extensible |
| **Formules révision prix** | `FRP-T-001`, `FRP-A-001`... | Par domaine |
| **CPS publié** | `260605_CPS_TMPA_0001` | `date + CPS + organisation + numéro` ; **numérotation par organisation** |

Optimisation : les sous-clauses sans code métier réduisent la charge. Toujours exposer le code
métier à l'humain et garder l'ID technique pour les liaisons internes.

Double affichage : **Vue Liste** + **Vue Arborescence**.
Structure : Mes projets · Projets publiés · Référentiel · Archives · Recherche.

**Recherche globale unique, plein texte**, sur : Projets, Articles, Clauses, Fiches, Documents, Formules.

---

## 9. PROJETS CPS

### Visibilité paramétrable
- Par défaut : **créateur uniquement** (projet privé à la création).
- Partage manuel ensuite vers des **utilisateurs spécifiques**.
- Partage en **lecture** ou **modification** uniquement — pas d'administration de projet en V1.
- **Pas de groupes en V1** (simplification).

### Versionnement
- Un CPS publié = **1 seule version active**.
- Nouvelle version : Duplication → Nouveau CPS → Nouveau code.
- Les anciennes versions ne sont **plus accessibles** aux utilisateurs (mais l'audit conserve les traces).
- Référentiel/CPS v1 : archivé après évolution ; seule la dernière version est active ;
  une version archivée n'est accessible qu'à l'admin.
- Nouvelles versions de clauses : **n'écrasent JAMAIS** les anciennes. Chaque CPS reste lié
  à sa version initiale de clause.

### Immutabilité du CPS publié (RÈGLE FONDAMENTALE)
- Un CPS publié est **IMMUTABLE** : aucune modification possible après publication (gel total).
- Les évolutions du référentiel **ne modifient PAS** les CPS déjà publiés.

### Modification d'une clause dans un projet (copie de travail)
- Toute modification d'une clause dans un projet crée une **copie locale** ; le référentiel
  reste inchangé.
- L'interface affiche le texte final + un indicateur **« modifié localement »**.

### Référentiel évolutif (propagation contrôlée)
- Nouvelle version d'une clause → **notification** au projet concerné.
- Le projet **conserve sa version actuelle** par défaut ; l'utilisateur peut choisir de
  mettre à jour OU de conserver l'ancienne version. Jamais de mise à jour forcée.

### Traçabilité / dépendances / suppression
- Toute clause peut être liée à des articles.
- Suppression possible **uniquement si aucune dépendance** existante.
- L'origine d'une clause (automatique ou manuelle) est tracée — déterminant pour la suppression.

### Publication
- Attribue le **code définitif**.
- **Verrouille** le document.
- Génère **HTML**, **DOCX**, **PDF**.

---

## 10. STRUCTURE D'UN CPS

| Section | Contenu |
|---------|---------|
| Couverture | — |
| Préambule | — |
| **Chapitre I** | Clauses communes |
| **Chapitre II** | Questionnaire paramétrable |
| **Chapitre III** | Clauses techniques |
| **Chapitre IV** | Définition des prix |
| **Chapitre V** | BDP + Estimation |
| Annexes | — |

### Chapitre II
- Construit à partir d'un **questionnaire**.
- Certaines clauses génériques et obligatoires (ex : **Article 2.13** toujours intégré tel quel).

### Chapitre III
- Base de données **indépendante**.
- Paramètres : Type de projet, Séries, Articles sélectionnés.
- Certaines clauses communes à plusieurs types de travaux.

### Chapitre IV
- Généré à partir : Base Articles + Définition des prix.

---

## 11. MODÈLES DOCUMENTAIRES DE RÉFÉRENCE (dans /templates)

- `250305_model_CPS_type travaux.docx`
- `23042025-CPS SIMULATEUR+VTS.docx`
- `251201_ESTIM_TMPA_BAT_EQ.xlsx`
- `251201_BDP_TMPA_BAT_EQ.xlsx`

Le moteur documentaire doit reproduire fidèlement la mise en forme TMPA.

---

## 12. TABLEAU DE BORD

Affichage synthétique : Mes tâches · Mes projets · Référentiels · Activité récente · Favoris.

---

## 13. NOTIFICATIONS

- Suppression automatique après traitement.
- Traçabilité assurée par l'**audit** (jamais supprimé).

---

## 14. AUDIT

Trace toutes les actions sensibles : créations, modifications, validations, rejets,
publications, versionnements, suppressions de notifications. Immuable.

---

## 15. PÉRIMÈTRE V1

INCLUS : Création CPS · Référentiels · Workflow · Validation · Publication ·
PDF · DOCX · BDP · Estimation · Recherche plein texte · Audit · RBAC complet ·
Import/Export Excel.

EXCLU de la V1 : BI avancée, statistiques complexes.

---

## 16. CONVENTIONS DE CODE

- TypeScript strict partout. Pas de `any`.
- Backend : un module NestJS par domaine (`auth`, `organizations`, `users`, `rbac`,
  `referential`, `projects`, `workflow`, `documents`, `search`, `audit`, `notifications`).
- DTO + validation (`class-validator`) sur chaque endpoint.
- Toute requête métier filtrée par `organization_id` (sauf Super Admin).
- Tests : au minimum un test unitaire par service critique.
- Migrations Prisma versionnées et nommées explicitement.
- Commits conventionnels (`feat:`, `fix:`, `chore:`...).
- Ne génère JAMAIS toute l'application d'un coup : respecte le découpage par phases.

---

## 17. RÈGLES POUR L'ASSISTANT

1. Avant de coder, vérifie ce fichier.
2. Travaille phase par phase (voir PROMPTS.md).
3. Produis des diffs ciblés, pas des réécritures complètes de fichiers existants.
4. Référence les fichiers par leur chemin ; ne réaffiche pas le code inchangé.
5. Si une décision métier manque, pose UNE question précise avant de coder.
