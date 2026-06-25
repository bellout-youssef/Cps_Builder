-- Migration : simplification du modèle de rôles (6 → 3)
-- ORG_ADMIN + REF_MANAGER + VALIDATOR → ADMIN
-- CREATOR + VERIFIER → USER
-- SUPER_ADMIN inchangé
--
-- Stratégie : convertir roles.name en TEXT → manipuler les données librement
--             → supprimer l'ancien enum → recréer proprement sans ADD VALUE.
--
-- PostgreSQL interdit d'utiliser une valeur ajoutée par ADD VALUE dans la même
-- transaction (code 55P04). On évite entièrement ADD VALUE : CREATE TYPE ...
-- AS ENUM (...) rend les valeurs disponibles immédiatement dans la transaction.

-- ─── Étape 1 : Détacher roles.name de l'ancien enum ──────────────────────────
-- Une fois en TEXT, aucune colonne ne référence "RoleName" → on pourra le DROP.
ALTER TABLE "roles" ALTER COLUMN "name" TYPE TEXT;

-- ─── Étape 2 : Insérer les nouvelles entrées (colonne = TEXT, pas de contrainte enum) ─
INSERT INTO "roles" ("id", "name", "description", "createdAt")
SELECT gen_random_uuid()::text,
       'ADMIN',
       'Administrateur organisation : gère les utilisateurs, le référentiel, les projets, la validation et la publication.',
       NOW()
WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE "name" = 'ADMIN');

INSERT INTO "roles" ("id", "name", "description", "createdAt")
SELECT gen_random_uuid()::text,
       'USER',
       'Utilisateur polyvalent : crée des projets et vérifie les projets d''autres utilisateurs.',
       NOW()
WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE "name" = 'USER');

-- ─── Étape 3 : Réassigner les user_roles (référence par roleId, pas par enum) ─
-- ORG_ADMIN, REF_MANAGER, VALIDATOR → ADMIN
UPDATE "user_roles"
SET "roleId" = (SELECT "id" FROM "roles" WHERE "name" = 'ADMIN')
WHERE "roleId" IN (
  SELECT "id" FROM "roles" WHERE "name" IN ('ORG_ADMIN', 'REF_MANAGER', 'VALIDATOR')
);

-- CREATOR, VERIFIER → USER
UPDATE "user_roles"
SET "roleId" = (SELECT "id" FROM "roles" WHERE "name" = 'USER')
WHERE "roleId" IN (
  SELECT "id" FROM "roles" WHERE "name" IN ('CREATOR', 'VERIFIER')
);

-- ─── Étape 4 : Dédoublonner user_roles ───────────────────────────────────────
-- Un utilisateur ayant eu ORG_ADMIN + REF_MANAGER aurait maintenant 2 entrées ADMIN.
-- On conserve la plus ancienne pour chaque triplet (userId, organizationId, roleId).
DELETE FROM "user_roles"
WHERE "id" NOT IN (
  SELECT DISTINCT ON ("userId", "organizationId", "roleId") "id"
  FROM "user_roles"
  ORDER BY "userId", "organizationId", "roleId", "createdAt" ASC
);

-- ─── Étape 5 : Supprimer les anciennes entrées de la table roles ──────────────
DELETE FROM "roles"
WHERE "name" IN ('ORG_ADMIN', 'REF_MANAGER', 'CREATOR', 'VERIFIER', 'VALIDATOR');

-- ─── Étape 6 : Supprimer l'ancien enum ───────────────────────────────────────
-- Sûr : aucune colonne ne l'utilise plus (roles.name est devenu TEXT à l'étape 1).
DROP TYPE "RoleName";

-- ─── Étape 7 : Recréer l'enum avec les 3 valeurs finales ──────────────────────
-- CREATE TYPE ... AS ENUM (...) rend les valeurs IMMÉDIATEMENT disponibles dans
-- la transaction courante (contrairement à ADD VALUE qui exige un commit préalable).
CREATE TYPE "RoleName" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');

-- ─── Étape 8 : Reconvertir roles.name vers le nouvel enum ─────────────────────
-- Les valeurs TEXT en base ('SUPER_ADMIN', 'ADMIN', 'USER') castent proprement.
ALTER TABLE "roles"
  ALTER COLUMN "name" TYPE "RoleName"
  USING "name"::"RoleName";
