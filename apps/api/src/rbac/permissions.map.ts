import { RoleName } from '@prisma/client';

/**
 * Permissions atomiques de la plateforme.
 * Convention : <ressource>:<action>
 */
export type Permission =
  // SUPER_ADMIN uniquement — aucun accès au contenu métier
  | 'org:manage'
  | 'org:view'
  | 'subscriptions:manage'
  | 'support:access'
  // ADMIN — gestion organisation
  | 'users:manage'
  | 'roles:manage'
  | 'settings:manage'
  // ADMIN — référentiel
  | 'referential:manage'
  | 'referential:publish'
  | 'cps:publish'
  // ADMIN + USER — projets et contenu
  | 'projects:create'
  | 'articles:edit_draft'
  | 'clauses:edit_draft'
  | 'projects:verify'
  | 'projects:validate'
  | 'workflow:act'
  // Lecture partagée (ADMIN + USER, PAS SUPER_ADMIN)
  | 'projects:read'
  | 'referential:read'
  // Audit — ADMIN uniquement
  | 'audit:read';

/**
 * Matrice rôle → permissions.
 * SUPER_ADMIN n'a AUCUNE permission métier (section 4 CLAUDE.md).
 * ADMIN = union ORG_ADMIN + REF_MANAGER + CREATOR + VERIFIER + VALIDATOR.
 * USER = CREATOR + VERIFIER (la restriction own-project est appliquée dans la logique métier).
 */
export const ROLE_PERMISSIONS: Readonly<Record<RoleName, ReadonlyArray<Permission>>> = {
  [RoleName.SUPER_ADMIN]: [
    'org:manage',
    'org:view',
    'subscriptions:manage',
    'support:access',
  ],

  [RoleName.ADMIN]: [
    'users:manage',
    'roles:manage',
    'settings:manage',
    'referential:manage',
    'referential:publish',
    'cps:publish',
    'articles:edit_draft',
    'clauses:edit_draft',
    'workflow:act',
    'projects:create',
    'projects:read',
    'projects:verify',
    'projects:validate',
    'referential:read',
    'audit:read',
  ],

  [RoleName.USER]: [
    'projects:create',
    'articles:edit_draft',
    'clauses:edit_draft',
    'projects:verify',
    'workflow:act',
    'projects:read',
    'referential:read',
  ],
} as const;
