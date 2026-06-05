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
  // ORG_ADMIN
  | 'users:manage'
  | 'roles:manage'
  | 'settings:manage'
  // REF_MANAGER
  | 'referential:manage'
  | 'referential:publish'
  | 'cps:publish'
  // CREATOR
  | 'projects:create'
  | 'articles:edit_draft'
  | 'clauses:edit_draft'
  // VERIFIER
  | 'projects:verify'
  // VALIDATOR
  | 'projects:validate'
  // Lecture partagée (tous les rôles métier, PAS le SUPER_ADMIN)
  | 'projects:read'
  | 'referential:read';

/**
 * Matrice rôle → permissions.
 * SUPER_ADMIN n'a AUCUNE permission métier (section 4 CLAUDE.md).
 */
export const ROLE_PERMISSIONS: Readonly<Record<RoleName, ReadonlyArray<Permission>>> = {
  [RoleName.SUPER_ADMIN]: [
    'org:manage',
    'org:view',
    'subscriptions:manage',
    'support:access',
  ],

  [RoleName.ORG_ADMIN]: [
    'users:manage',
    'roles:manage',
    'settings:manage',
    'projects:read',
    'referential:read',
  ],

  [RoleName.REF_MANAGER]: [
    'referential:manage',
    'referential:publish',
    'cps:publish',
    'articles:edit_draft',
    'clauses:edit_draft',
    'projects:read',
    'referential:read',
  ],

  [RoleName.CREATOR]: [
    'projects:create',
    'articles:edit_draft',
    'clauses:edit_draft',
    'projects:read',
    'referential:read',
  ],

  [RoleName.VERIFIER]: [
    'projects:verify',
    'projects:read',
    'referential:read',
  ],

  [RoleName.VALIDATOR]: [
    'projects:validate',
    'projects:read',
    'referential:read',
  ],
} as const;
