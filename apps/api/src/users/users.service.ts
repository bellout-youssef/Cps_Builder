import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateRolesDto } from './dto/update-roles.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';

export interface UserItem {
  id: string;
  email: string;
  name: string;
  roles: string[];
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
}

type UserWithRoles = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
  roles: { organizationId: string | null; role: { name: RoleName } }[];
};

function toUserItem(user: UserWithRoles, orgId: string): UserItem {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles
      .filter((ur) => ur.organizationId === orgId)
      .map((ur) => ur.role.name),
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
  };
}

const USER_INCLUDE = (orgId: string) => ({
  roles: {
    where: { organizationId: orgId },
    include: { role: true },
  },
}) as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string): Promise<UserItem[]> {
    const users = await this.prisma.user.findMany({
      where: { organizationId: orgId },
      include: USER_INCLUDE(orgId),
      orderBy: { createdAt: 'asc' },
    });
    return users.map((u) => toUserItem(u, orgId));
  }

  async create(dto: CreateUserDto, orgId: string): Promise<UserItem> {
    if (dto.roles.includes(RoleName.SUPER_ADMIN)) {
      throw new ForbiddenException('Le rôle SUPER_ADMIN ne peut pas être assigné via ce endpoint.');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Cet email est déjà utilisé.');

    const passwordHash = await argon2.hash(dto.temporaryPassword);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        organizationId: orgId,
        mustChangePassword: true,
      },
    });

    const roleRecords = await this.prisma.role.findMany({
      where: { name: { in: dto.roles } },
    });

    await this.prisma.userRole.createMany({
      data: roleRecords.map((r) => ({
        userId: user.id,
        roleId: r.id,
        organizationId: orgId,
      })),
    });

    const full = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: USER_INCLUDE(orgId),
    });
    return toUserItem(full, orgId);
  }

  async updateRoles(userId: string, dto: UpdateRolesDto, orgId: string): Promise<UserItem> {
    if (dto.roles.includes(RoleName.SUPER_ADMIN)) {
      throw new ForbiddenException('Le rôle SUPER_ADMIN ne peut pas être assigné via ce endpoint.');
    }

    await this.ensureUserInOrg(userId, orgId);

    await this.prisma.userRole.deleteMany({ where: { userId, organizationId: orgId } });

    if (dto.roles.length > 0) {
      const roleRecords = await this.prisma.role.findMany({
        where: { name: { in: dto.roles } },
      });
      await this.prisma.userRole.createMany({
        data: roleRecords.map((r) => ({ userId, roleId: r.id, organizationId: orgId })),
      });
    }

    const full = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: USER_INCLUDE(orgId),
    });
    return toUserItem(full, orgId);
  }

  async deactivate(userId: string, orgId: string): Promise<UserItem> {
    await this.ensureUserInOrg(userId, orgId);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      include: USER_INCLUDE(orgId),
    });
    return toUserItem(user, orgId);
  }

  async reactivate(userId: string, orgId: string): Promise<UserItem> {
    await this.ensureUserInOrg(userId, orgId);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      include: USER_INCLUDE(orgId),
    });
    return toUserItem(user, orgId);
  }

  async resetPassword(userId: string, dto: ResetPasswordDto, orgId: string): Promise<void> {
    await this.ensureUserInOrg(userId, orgId);
    const passwordHash = await argon2.hash(dto.temporaryPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: true },
    });
  }

  private async ensureUserInOrg(userId: string, orgId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({ where: { id: userId, organizationId: orgId } });
    if (!user) throw new NotFoundException(`Utilisateur ${userId} introuvable dans cette organisation.`);
  }
}
