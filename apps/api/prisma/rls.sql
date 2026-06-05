-- =============================================================================
-- Row-Level Security (RLS) — Isolation multi-tenant PostgreSQL
-- =============================================================================
-- COMMENT APPLIQUER :
--   1. Après `pnpm prisma:migrate` (migration initiale créée)
--   2. psql $DATABASE_URL -f prisma/rls.sql
--
-- La RLS est la défense en profondeur. Le TenantGuard NestJS reste
-- la première ligne de défense (application-level).
-- =============================================================================

-- Activer RLS sur toutes les tables multi-tenant
ALTER TABLE organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_type_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE clauses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;

-- Rôle applicatif limité (connexion normale de l'API)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'cps_app') THEN
    CREATE ROLE cps_app LOGIN PASSWORD 'change_in_production';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE cps_db TO cps_app;
GRANT USAGE ON SCHEMA public TO cps_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cps_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO cps_app;

-- Forcer RLS même pour le propriétaire de la table (défense en profondeur)
ALTER TABLE organizations       FORCE ROW LEVEL SECURITY;
ALTER TABLE users               FORCE ROW LEVEL SECURITY;
ALTER TABLE projects            FORCE ROW LEVEL SECURITY;
ALTER TABLE articles            FORCE ROW LEVEL SECURITY;
ALTER TABLE clauses             FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- Politiques RLS
-- La variable de session `app.current_org_id` est settée via :
--   SELECT set_config('app.current_org_id', '<orgId>', true);
-- L'option `app.bypass_rls` = 'on' est réservée au SUPER_ADMIN.
-- =============================================================================

CREATE POLICY org_isolation ON organizations
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR id = current_setting('app.current_org_id', true)
  );

CREATE POLICY user_isolation ON users
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR organization_id = current_setting('app.current_org_id', true)
    OR organization_id IS NULL   -- SUPER_ADMIN (scope global)
  );

CREATE POLICY user_role_isolation ON user_roles
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR organization_id = current_setting('app.current_org_id', true)
    OR organization_id IS NULL
  );

CREATE POLICY project_isolation ON projects
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR organization_id = current_setting('app.current_org_id', true)
  );

CREATE POLICY project_type_entry_isolation ON project_type_entries
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR project_id IN (
      SELECT id FROM projects
      WHERE organization_id = current_setting('app.current_org_id', true)
    )
  );

CREATE POLICY article_isolation ON articles
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR organization_id = current_setting('app.current_org_id', true)
  );

CREATE POLICY clause_isolation ON clauses
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR organization_id = current_setting('app.current_org_id', true)
  );

CREATE POLICY audit_log_isolation ON audit_logs
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR organization_id = current_setting('app.current_org_id', true)
    OR organization_id IS NULL
  );
