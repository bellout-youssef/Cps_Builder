import { RoleName } from './enums';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtUser {
  sub: string;
  email: string;
  organizationId: string | null;
  roles: RoleName[];
  iat?: number;
  exp?: number;
}

export type Permission =
  | 'org:manage'
  | 'org:view'
  | 'subscriptions:manage'
  | 'support:access'
  | 'users:manage'
  | 'roles:manage'
  | 'settings:manage'
  | 'referential:manage'
  | 'referential:publish'
  | 'cps:publish'
  | 'projects:create'
  | 'articles:edit_draft'
  | 'clauses:edit_draft'
  | 'projects:verify'
  | 'projects:validate'
  | 'projects:read'
  | 'referential:read'
  | 'audit:read';

export const ROLE_PERMISSIONS: Readonly<Record<RoleName, ReadonlyArray<Permission>>> = {
  [RoleName.SUPER_ADMIN]: ['org:manage', 'org:view', 'subscriptions:manage', 'support:access'],
  [RoleName.ORG_ADMIN]: [
    'users:manage',
    'roles:manage',
    'settings:manage',
    'projects:read',
    'referential:read',
    'audit:read',
  ],
  [RoleName.REF_MANAGER]: [
    'referential:manage',
    'referential:publish',
    'cps:publish',
    'articles:edit_draft',
    'clauses:edit_draft',
    'projects:read',
    'referential:read',
    'audit:read',
  ],
  [RoleName.CREATOR]: [
    'projects:create',
    'articles:edit_draft',
    'clauses:edit_draft',
    'projects:read',
    'referential:read',
  ],
  [RoleName.VERIFIER]: ['projects:verify', 'projects:read', 'referential:read'],
  [RoleName.VALIDATOR]: ['projects:validate', 'projects:read', 'referential:read'],
} as const;
