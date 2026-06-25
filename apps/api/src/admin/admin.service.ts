import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface MonitoringStats {
  totalOrgs: number;
  totalUsers: number;
  totalProjects: number;
  activeSubscriptions: number;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonitoringStats(): Promise<MonitoringStats> {
    const [totalOrgs, totalUsers, totalProjects] = await this.prisma.$transaction([
      this.prisma.organization.count(),
      // Utilisateurs actifs rattachés à une organisation (exclut le superadmin global)
      this.prisma.user.count({ where: { isActive: true, organizationId: { not: null } } }),
      this.prisma.project.count(),
    ]);

    return {
      totalOrgs,
      totalUsers,
      totalProjects,
      activeSubscriptions: 0, // Hors périmètre V1 — aucun modèle Subscription
    };
  }
}
