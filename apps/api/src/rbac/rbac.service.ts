import { Injectable } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { ROLE_PERMISSIONS, type Permission } from './permissions.map';

@Injectable()
export class RbacService {
  /** Renvoie true si les rôles couvrent TOUTES les permissions demandées. */
  hasPermissions(userRoles: RoleName[], requiredPermissions: Permission[]): boolean {
    if (requiredPermissions.length === 0) return true;

    const granted = new Set<Permission>();
    for (const role of userRoles) {
      const perms = ROLE_PERMISSIONS[role];
      for (const p of perms) {
        granted.add(p);
      }
    }

    return requiredPermissions.every((p) => granted.has(p));
  }

  /** Renvoie la liste des permissions effectives d'un ensemble de rôles. */
  getEffectivePermissions(userRoles: RoleName[]): Permission[] {
    const granted = new Set<Permission>();
    for (const role of userRoles) {
      for (const p of ROLE_PERMISSIONS[role]) {
        granted.add(p);
      }
    }
    return [...granted];
  }
}
