import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '@prisma/client';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { JwtPayload } from '../types/jwt-payload.type';

export interface TenantRequest extends Request {
  user: JwtPayload;
  organizationId: string | null;
  isSuperAdmin: boolean;
}

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = request.user;
    if (!user) return false;

    const isSuperAdmin = user.roles.includes(RoleName.SUPER_ADMIN);

    if (isSuperAdmin) {
      request.isSuperAdmin = true;
      request.organizationId = null;
      return true;
    }

    if (!user.organizationId) {
      throw new ForbiddenException('No organization context in token');
    }

    request.isSuperAdmin = false;
    request.organizationId = user.organizationId;
    return true;
  }
}
