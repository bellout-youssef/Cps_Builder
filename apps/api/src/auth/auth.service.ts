import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RoleName } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { RefreshDto } from './dto/refresh.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        organizationId: dto.organizationId ?? null,
      },
    });

    const roles: RoleName[] = [];

    if (dto.organizationId) {
      const creatorRole = await this.prisma.role.findUniqueOrThrow({
        where: { name: RoleName.CREATOR },
      });
      await this.prisma.userRole.create({
        data: { userId: user.id, roleId: creatorRole.id, organizationId: dto.organizationId },
      });
      roles.push(RoleName.CREATOR);
    }

    return this.issueTokenPair(user.id, user.email, user.organizationId, roles);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        roles: { include: { role: true } },
      },
    });

    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Resolve org context: explicit DTO > user record > first UserRole's org (handles stale user.organizationId=null)
    const orgId =
      dto.organizationId ??
      user.organizationId ??
      user.roles.find((ur) => ur.organizationId !== null)?.organizationId ??
      null;

    const roles = user.roles
      .filter((ur) => ur.organizationId === orgId)
      .map((ur) => ur.role.name);

    return this.issueTokenPair(user.id, user.email, orgId, roles);
  }

  async refresh(dto: RefreshDto): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = this.hashToken(dto.refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt !== null || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    // Rotation : on révoque l'ancien
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const roles = await this.getUserRoles(payload.sub, payload.organizationId);
    return this.issueTokenPair(payload.sub, payload.email, payload.organizationId, roles);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async issueTokenPair(
    userId: string,
    email: string,
    organizationId: string | null,
    roles: RoleName[],
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email, organizationId, roles };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_EXPIRY', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRY', '7d'),
    });

    const refreshExpiry = this.config.get<string>('JWT_REFRESH_EXPIRY', '7d');
    const expiresAt = new Date(Date.now() + this.parseDuration(refreshExpiry));

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private async getUserRoles(
    userId: string,
    organizationId: string | null,
  ): Promise<RoleName[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        organizationId: organizationId ?? null,
      },
      include: { role: true },
    });
    return userRoles.map((ur) => ur.role.name);
  }

  /** SHA-256 déterministe — permet le lookup sans stocker le token en clair. */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseDuration(duration: string): number {
    const units: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    const match = /^(\d+)([smhd])$/.exec(duration);
    if (!match) return 7 * 86_400_000;
    return parseInt(match[1], 10) * (units[match[2]] ?? 86_400_000);
  }
}
