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

  // ADMIN = union ORG_ADMIN + REF_MANAGER + CREATOR + VERIFIER + VALIDATOR
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

  // USER = CREATOR + VERIFIER (restriction own-project appliquée côté backend)
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
