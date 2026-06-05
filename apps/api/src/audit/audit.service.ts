import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { QueryAuditDto } from './dto/query-audit.dto';

export interface AuditLogParams {
  action: string;
  entity: string;
  entityId?: string;
  userId: string;
  organizationId: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditLogParams): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  findAll(organizationId: string, filters: QueryAuditDto = {}) {
    const { entity, entityId, action, userId, from, to, limit = 50, offset = 0 } = filters;

    return this.prisma.auditLog.findMany({
      where: {
        organizationId,
        ...(entity && { entity }),
        ...(entityId && { entityId }),
        ...(action && { action: { contains: action, mode: Prisma.QueryMode.insensitive } }),
        ...(userId && { userId }),
        ...((from || to) && {
          createdAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit ?? 50, 200),
      skip: offset ?? 0,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
