import type { Permission, JwtUser } from '@cps/shared';
import { ROLE_PERMISSIONS, RoleName } from '@cps/shared';

export function getUserPermissions(user: JwtUser): Set<Permission> {
  const perms = new Set<Permission>();
  for (const role of user.roles) {
    const rolePerms = ROLE_PERMISSIONS[role as RoleName];
    if (rolePerms) {
      for (const perm of rolePerms) {
        perms.add(perm);
      }
    }
  }
  return perms;
}

export function hasPermission(user: JwtUser, permission: Permission): boolean {
  return getUserPermissions(user).has(permission);
}
