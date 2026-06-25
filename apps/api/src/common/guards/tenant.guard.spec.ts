import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '@prisma/client';
import { TenantGuard } from './tenant.guard';
import type { ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../types/jwt-payload.type';

function makeContext(user: Partial<JwtPayload> | null): { ctx: ExecutionContext; request: Record<string, unknown> } {
  const request: Record<string, unknown> = { user };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
  return { ctx, request };
}

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new TenantGuard(reflector);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false); // not public
  });

  it('passes @Public() routes without checking user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const { ctx } = makeContext(null);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns false when user is absent', () => {
    const { ctx } = makeContext(null);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('sets isSuperAdmin=true and organizationId=null for SUPER_ADMIN', () => {
    const user: JwtPayload = { sub: '1', email: 'sa@cps.dev', organizationId: null, roles: [RoleName.SUPER_ADMIN] };
    const { ctx, request } = makeContext(user);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(request['isSuperAdmin']).toBe(true);
    expect(request['organizationId']).toBeNull();
  });

  it('sets organizationId on request for org-scoped user', () => {
    const user: JwtPayload = { sub: '2', email: 'u@org.com', organizationId: 'org-abc', roles: [RoleName.USER] };
    const { ctx, request } = makeContext(user);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(request['isSuperAdmin']).toBe(false);
    expect(request['organizationId']).toBe('org-abc');
  });

  it('throws ForbiddenException for org-scoped user with null organizationId in token', () => {
    const user: JwtPayload = { sub: '3', email: 'u@org.com', organizationId: null, roles: [RoleName.USER] };
    const { ctx } = makeContext(user);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
