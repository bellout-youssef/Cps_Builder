import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../../rbac/permissions.map';

export const PERMISSIONS_KEY = 'requiredPermissions';
export const RequirePermissions = (...permissions: Permission[]): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);
