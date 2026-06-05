import { Injectable } from '@nestjs/common';
import { Prisma, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateNotificationDto {
  organizationId: string;
  userId: string;
  projectId?: string;
  type: NotificationType;
  title: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        ...dto,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async findAllForUser(userId: string, orgId: string) {
    return this.prisma.notification.findMany({
      where: { userId, organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async remove(id: string, userId: string) {
    return this.prisma.notification.delete({ where: { id, userId } });
  }

  async markAllAsRead(userId: string, orgId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, organizationId: orgId, isRead: false },
      data: { isRead: true },
    });
  }

  async countUnread(userId: string, orgId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, organizationId: orgId, isRead: false },
    });
  }
}
