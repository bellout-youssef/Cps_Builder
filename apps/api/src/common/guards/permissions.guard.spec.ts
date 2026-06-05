import { Reflector } from '@nestjs/core';
import { RoleName } from '@prisma/client';
import { PermissionsGuard } from './permissions.guard';
import { RbacService } from '../../rbac/rbac.service';
import type { ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../types/jwt-payload.type';

function makeContext(user: Partial<JwtPayload> | null, handler = {}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => handler,
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  const rbacService = new RbacService();

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector, rbacService);
  });

  it('passes @Public() routes regardless of user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === 'isPublic') return true;
      return undefined;
    });
    const ctx = makeContext(null);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('passes when no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const user: JwtPayload = { sub: '1', email: 'a@b.com', organizationId: null, roles: [RoleName.CREATOR] };
    const ctx = makeContext(user);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows SUPER_ADMIN to access org:manage', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      return ['org:manage'];
    });
    const user: JwtPayload = { sub: '1', email: 'a@b.com', organizationId: null, roles: [RoleName.SUPER_ADMIN] };
    expect(guard.canActivate(makeContext(user))).toBe(true);
  });

  it('denies CREATOR access to org:manage', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      return ['org:manage'];
    });
    const user: JwtPayload = { sub: '1', email: 'a@b.com', organizationId: 'org1', roles: [RoleName.CREATOR] };
    expect(guard.canActivate(makeContext(user))).toBe(false);
  });

  it('denies SUPER_ADMIN access to business content (projects:read)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      return ['projects:read'];
    });
    const user: JwtPayload = { sub: '1', email: 'a@b.com', organizationId: null, roles: [RoleName.SUPER_ADMIN] };
    expect(guard.canActivate(makeContext(user))).toBe(false);
  });

  it('allows CREATOR + VERIFIER to satisfy projects:create AND projects:verify', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      return ['projects:create', 'projects:verify'];
    });
    const user: JwtPayload = {
      sub: '1', email: 'a@b.com', organizationId: 'org1',
      roles: [RoleName.CREATOR, RoleName.VERIFIER],
    };
    expect(guard.canActivate(makeContext(user))).toBe(true);
  });

  it('returns false when user is missing from request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      return ['projects:read'];
    });
    expect(guard.canActivate(makeContext(null))).toBe(false);
  });
});
