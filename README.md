# Plateforme SaaS CPS — Cahiers des Prescriptions Spéciales

Plateforme multi-organisations pour créer, gérer, valider, publier et archiver des **CPS** à partir de référentiels structurés.

Stack : **NestJS** (API) · **Next.js 14** (Web) · **PostgreSQL** · **Prisma** · **pnpm workspaces** · **Docker**

---

## Prérequis

| Outil | Version minimale |
|-------|-----------------|
| Node.js | 20 LTS |
| pnpm | 9+ |
| PostgreSQL | 15+ (local) ou géré (Railway/Render) |
| Docker | 24+ (optionnel, pour prod) |

---

## Installation locale (développement)

```bash
# 1. Cloner le dépôt
git clone <url-du-repo> cps-builder
cd cps-builder

# 2. Installer toutes les dépendances (monorepo pnpm)
pnpm install

# 3. Copier les variables d'environnement
cp .env.example .env
# puis éditer .env avec vos valeurs (DATABASE_URL, secrets JWT…)

# 4. Appliquer les migrations et peupler la base
pnpm prisma:migrate
pnpm prisma:seed

# 5. Lancer en développement (hot-reload)
pnpm dev:api   # NestJS sur http://localhost:3001
pnpm dev:web   # Next.js sur http://localhost:3000
```

### Variables d'environnement (`.env`)

```dotenv
# PostgreSQL
DATABASE_URL=postgresql://cps_user:cps_password@localhost:5432/cps_db

# JWT — à remplacer par des valeurs aléatoires longues en production
JWT_SECRET=change_this_secret_in_production
JWT_REFRESH_SECRET=change_this_refresh_secret_in_production
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# API
PORT=3001
NODE_ENV=development

# Web (Next.js)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Comptes de démo (créés par le seed)

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `superadmin@cps.dev` | `Admin@1234!` | Super Administrateur |
| `orgadmin@cps.dev` | `Admin@1234!` | Admin Organisation |
| `refmanager@cps.dev` | `Admin@1234!` | Responsable Référentiel |
| `createur@cps.dev` | `Admin@1234!` | Créateur |
| `verificateur@cps.dev` | `Admin@1234!` | Vérificateur |
| `validateur@cps.dev` | `Admin@1234!` | Validateur Métier |

---

## Commandes utiles

```bash
# Build de tous les packages
pnpm build

# Migrations Prisma
pnpm prisma:migrate        # dev : crée et applique une migration
pnpm prisma:migrate:deploy # prod : applique les migrations existantes
pnpm prisma:seed           # peuple la base avec les données de démo

# Lint / formatage
pnpm lint
pnpm format

# Tests
pnpm test
```

---

## Déploiement avec Docker Compose (auto-hébergé)

```bash
# 1. Créer le fichier .env à la racine (variables de production)
cp .env.example .env
# → Éditer JWT_SECRET, JWT_REFRESH_SECRET avec des valeurs longues et aléatoires

# 2. Builder et démarrer
docker compose up --build -d

# 3. Vérifier les logs
docker compose logs -f api
docker compose logs -f web
```

L'API applique automatiquement `prisma migrate deploy` au démarrage.

| Service | URL |
|---------|-----|
| Web (Next.js) | http://localhost:3000 |
| API (NestJS) | http://localhost:3001 |
| PostgreSQL | localhost:5432 |

---

## Déploiement sur Railway

### Architecture recommandée
Trois services Railway dans le même projet :
1. **PostgreSQL** — plugin natif Railway
2. **API** — service depuis ce dépôt Git
3. **Web** — service depuis ce dépôt Git

### Étape par étape

#### 1. Créer le projet Railway

Depuis [railway.app](https://railway.app) → **New Project** → **Empty Project**.

#### 2. Ajouter PostgreSQL

Dans le projet → **+ Add Service** → **Database** → **PostgreSQL**.
Récupérer la variable `DATABASE_URL` générée (format `postgresql://…`).

#### 3. Déployer l'API

**+ Add Service** → **GitHub Repo** → sélectionner ce dépôt.

Dans les paramètres du service API :

- **Root Directory** : laisser vide (la racine du monorepo)
- **Dockerfile Path** : `apps/api/Dockerfile`
- **Start Command** : laisser vide (défini dans le Dockerfile)

**Variables d'environnement** (onglet Variables) :

```
DATABASE_URL          = <coller la valeur depuis le service PostgreSQL>
JWT_SECRET            = <valeur aléatoire longue, ex: openssl rand -hex 64>
JWT_REFRESH_SECRET    = <autre valeur aléatoire longue>
JWT_EXPIRY            = 15m
JWT_REFRESH_EXPIRY    = 7d
PORT                  = 3001
NODE_ENV              = production
```

> **Migrations** : le CMD du Dockerfile exécute `prisma migrate deploy` au démarrage.
> Pour peupler la base la première fois, utiliser le **Railway CLI** :
> ```bash
> railway run pnpm prisma:seed
> ```

#### 4. Déployer le Web

**+ Add Service** → **GitHub Repo** → même dépôt.

- **Dockerfile Path** : `apps/web/Dockerfile`

**Variables d'environnement** :

```
NEXT_PUBLIC_API_URL = https://<domaine-public-du-service-api>.railway.app
PORT                = 3000
NODE_ENV            = production
```

#### 5. Domaines publics

Dans les paramètres de chaque service → **Settings** → **Networking** → **Generate Domain**.

---

## Déploiement sur Render

### Architecture recommandée

| Service | Type Render | Dockerfile |
|---------|------------|------------|
| PostgreSQL | **PostgreSQL** (managed) | — |
| API | **Web Service** | `apps/api/Dockerfile` |
| Web | **Web Service** | `apps/web/Dockerfile` |

### Étape par étape

#### 1. PostgreSQL managé

Dashboard Render → **New** → **PostgreSQL**.
Récupérer la **Internal Database URL** (format `postgresql://…`).

#### 2. Service API

**New** → **Web Service** → connecter le dépôt GitHub.

| Champ | Valeur |
|-------|--------|
| **Environment** | Docker |
| **Dockerfile Path** | `apps/api/Dockerfile` |
| **Docker Context** | `.` (racine) |
| **Port** | `3001` |

**Environment Variables** :

```
DATABASE_URL          = <Internal Database URL de PostgreSQL>
JWT_SECRET            = <valeur aléatoire>
JWT_REFRESH_SECRET    = <valeur aléatoire>
JWT_EXPIRY            = 15m
JWT_REFRESH_EXPIRY    = 7d
PORT                  = 3001
NODE_ENV              = production
```

> Render exécute automatiquement la commande de démarrage du Dockerfile (`prisma migrate deploy && node dist/main`).

Pour le seed initial, utiliser le **Render Shell** (onglet Shell du service) :
```bash
node_modules/.bin/prisma db seed
```

#### 3. Service Web

**New** → **Web Service** → même dépôt.

| Champ | Valeur |
|-------|--------|
| **Dockerfile Path** | `apps/web/Dockerfile` |
| **Docker Context** | `.` |
| **Port** | `3000` |

**Environment Variables** :

```
NEXT_PUBLIC_API_URL = https://<url-publique-du-service-api>.onrender.com
PORT                = 3000
NODE_ENV            = production
```

---

## Architecture du monorepo

```
.
├── apps/
│   ├── api/               NestJS — modules : auth, rbac, organizations, referential,
│   │   ├── src/           projects, documents, audit, search, notifications
│   │   └── prisma/        schéma Prisma, migrations, seed
│   └── web/               Next.js 14 App Router
│       └── src/
│           ├── app/       pages (auth, dashboard, référentiel, admin…)
│           ├── components/
│           └── lib/       api client, permissions, jwt
└── packages/
    └── shared/            types et enums partagés (@cps/shared)
```

### Règle documentaire fondamentale

```
Données structurées → HTML natif → DOCX → PDF
```

Le HTML est la source officielle. DOCX et PDF en dérivent. Jamais l'inverse.

---

## Sécurité

- **JWT** : access token 15 min + refresh token 7 jours
- **RBAC** : 6 rôles avec permissions atomiques, enforced côté backend
- **Multi-tenant** : isolation par `organization_id` sur toutes les requêtes + RLS PostgreSQL
- **Workflow** : séparation des responsabilités enforced (créateur ≠ vérificateur ≠ validateur sur un même CPS)
- **Audit** : journal immuable de toutes les actions sensibles

---

## Licence

Usage interne TMPA. Tous droits réservés.
