import type { RoleName } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  /** null uniquement pour le SUPER_ADMIN */
  organizationId: string | null;
  roles: RoleName[];
}
