-- Migration : refonte du workflow CPS (WorkflowStep + WorkflowAction + currentHolderId)
--
-- Stratégie identique à 20260625000000_simplify_roles :
--   1. Convertir les colonnes utilisant l'enum en TEXT
--   2. Supprimer l'ancien enum
--   3. Créer le nouvel enum (valeurs disponibles immédiatement dans la transaction)
--   4. Reconvertir TEXT → nouvel enum avec USING
-- Cette approche évite l'erreur 55P04 "unsafe use of new value" liée à ADD VALUE.
--
-- Mapping WorkflowStep :
--   CREATION         → CREATION
--   VERIFICATION     → PENDING_REVIEW
--   BUSINESS_VALIDATION → ADMIN_REVIEW
--   REF_VALIDATION   → ADMIN_REVIEW
--   PUBLISHED        → PUBLISHED
--   ARCHIVED         → ARCHIVED
--
-- Mapping WorkflowAction :
--   APPROVE, REJECT, REQUEST_MODIFICATION → identiques
--   (ajout de SEND_TO_USER : nouveau type, aucune donnée existante à migrer)
--
-- NOTE : Prisma génère les colonnes en camelCase sans @map → noms réels en base :
--   projects."workflowStep"          (pas "workflow_step")
--   workflow_transitions."fromStep"  (pas "from_step")
--   workflow_transitions."toStep"    (pas "to_step")
--   La nouvelle colonne doit être "currentHolderId" (pas "current_holder_id")

-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTIE 1 : WorkflowStep
-- ═══════════════════════════════════════════════════════════════════════════════

-- Étape 1a : projects."workflowStep" → TEXT
-- Supprimer le DEFAULT lié à l'ancien enum (sinon PostgreSQL refuse le DROP TYPE avec code 2BP01)
ALTER TABLE "projects" ALTER COLUMN "workflowStep" DROP DEFAULT;
ALTER TABLE "projects" ALTER COLUMN "workflowStep" TYPE TEXT;

-- Étape 1b : workflow_transitions."fromStep" → TEXT
ALTER TABLE "workflow_transitions" ALTER COLUMN "fromStep" TYPE TEXT;

-- Étape 1c : workflow_transitions."toStep" → TEXT
ALTER TABLE "workflow_transitions" ALTER COLUMN "toStep" TYPE TEXT;

-- Étape 2 : Supprimer l'ancien enum WorkflowStep (aucune colonne ne l'utilise plus)
DROP TYPE "WorkflowStep";

-- Étape 3 : Créer le nouvel enum WorkflowStep
CREATE TYPE "WorkflowStep" AS ENUM (
  'CREATION',
  'PENDING_REVIEW',
  'ADMIN_REVIEW',
  'PUBLISHED',
  'ARCHIVED'
);

-- Étape 4a : Reconvertir projects."workflowStep" avec mapping des anciennes valeurs
ALTER TABLE "projects"
  ALTER COLUMN "workflowStep" TYPE "WorkflowStep"
  USING (
    CASE "workflowStep"
      WHEN 'CREATION'            THEN 'CREATION'
      WHEN 'VERIFICATION'        THEN 'PENDING_REVIEW'
      WHEN 'BUSINESS_VALIDATION' THEN 'ADMIN_REVIEW'
      WHEN 'REF_VALIDATION'      THEN 'ADMIN_REVIEW'
      WHEN 'PUBLISHED'           THEN 'PUBLISHED'
      WHEN 'ARCHIVED'            THEN 'ARCHIVED'
      ELSE 'CREATION'
    END
  )::"WorkflowStep";
-- Rétablir le DEFAULT avec le nouveau type enum
ALTER TABLE "projects" ALTER COLUMN "workflowStep" SET DEFAULT 'CREATION'::"WorkflowStep";

-- Étape 4b : Reconvertir workflow_transitions."fromStep"
ALTER TABLE "workflow_transitions"
  ALTER COLUMN "fromStep" TYPE "WorkflowStep"
  USING (
    CASE "fromStep"
      WHEN 'CREATION'            THEN 'CREATION'
      WHEN 'VERIFICATION'        THEN 'PENDING_REVIEW'
      WHEN 'BUSINESS_VALIDATION' THEN 'ADMIN_REVIEW'
      WHEN 'REF_VALIDATION'      THEN 'ADMIN_REVIEW'
      WHEN 'PUBLISHED'           THEN 'PUBLISHED'
      WHEN 'ARCHIVED'            THEN 'ARCHIVED'
      ELSE 'CREATION'
    END
  )::"WorkflowStep";

-- Étape 4c : Reconvertir workflow_transitions."toStep"
ALTER TABLE "workflow_transitions"
  ALTER COLUMN "toStep" TYPE "WorkflowStep"
  USING (
    CASE "toStep"
      WHEN 'CREATION'            THEN 'CREATION'
      WHEN 'VERIFICATION'        THEN 'PENDING_REVIEW'
      WHEN 'BUSINESS_VALIDATION' THEN 'ADMIN_REVIEW'
      WHEN 'REF_VALIDATION'      THEN 'ADMIN_REVIEW'
      WHEN 'PUBLISHED'           THEN 'PUBLISHED'
      WHEN 'ARCHIVED'            THEN 'ARCHIVED'
      ELSE 'CREATION'
    END
  )::"WorkflowStep";

-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTIE 2 : WorkflowAction (ajout de SEND_TO_USER)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Étape 5 : workflow_transitions."action" → TEXT
ALTER TABLE "workflow_transitions" ALTER COLUMN "action" TYPE TEXT;

-- Étape 6 : Supprimer l'ancien enum WorkflowAction
DROP TYPE "WorkflowAction";

-- Étape 7 : Créer le nouvel enum WorkflowAction avec SEND_TO_USER
CREATE TYPE "WorkflowAction" AS ENUM (
  'APPROVE',
  'REJECT',
  'REQUEST_MODIFICATION',
  'SEND_TO_USER'
);

-- Étape 8 : Reconvertir workflow_transitions."action" (valeurs inchangées)
ALTER TABLE "workflow_transitions"
  ALTER COLUMN "action" TYPE "WorkflowAction"
  USING "action"::"WorkflowAction";

-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTIE 3 : Ajout de currentHolderId sur projects
-- ═══════════════════════════════════════════════════════════════════════════════

-- Étape 9 : Ajouter la colonne nullable (null par défaut pour tous les projets existants)
ALTER TABLE "projects" ADD COLUMN "currentHolderId" TEXT;

-- Étape 10 : Contrainte FK vers users (nullable)
ALTER TABLE "projects"
  ADD CONSTRAINT "projects_currentHolderId_fkey"
  FOREIGN KEY ("currentHolderId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Index pour les recherches par porteur
CREATE INDEX "projects_currentHolderId_idx" ON "projects"("currentHolderId");
