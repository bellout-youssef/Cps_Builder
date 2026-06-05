import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Clause } from '@prisma/client';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NotificationsService } from '../../notifications/notifications.service';
import type { CreateClauseDto } from './dto/create-clause.dto';
import type { UpdateClauseDto } from './dto/update-clause.dto';

@Injectable()
export class ClausesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll(organizationId: string): Promise<Clause[]> {
    return this.prisma.clause.findMany({
      where: { organizationId },
      orderBy: [{ number: 'asc' }],
    });
  }

  async findOne(id: string, organizationId: string): Promise<Clause> {
    const clause = await this.prisma.clause.findFirst({
      where: { id, organizationId },
      include: { article: true },
    });
    if (!clause) throw new NotFoundException(`Clause ${id} not found`);
    return clause;
  }

  async create(dto: CreateClauseDto, organizationId: string, userId: string): Promise<Clause> {
    const clause = await this.prisma.clause.create({
      data: {
        number: dto.number,
        title: dto.title,
        content: dto.content,
        organization: { connect: { id: organizationId } },
        createdBy: { connect: { id: userId } },
        ...(dto.articleId ? { article: { connect: { id: dto.articleId } } } : {}),
      },
    });
    await this.auditService.log({
      action: 'clause.created',
      entity: 'clause',
      entityId: clause.id,
      userId,
      organizationId,
      metadata: { number: clause.number, title: clause.title },
    });
    return clause;
  }

  async update(
    id: string,
    dto: UpdateClauseDto,
    organizationId: string,
    userId: string,
  ): Promise<Clause> {
    const clause = await this.prisma.clause.findFirst({ where: { id, organizationId } });
    if (!clause) throw new NotFoundException(`Clause ${id} not found`);

    const updated = await this.prisma.clause.update({
      where: { id },
      data: {
        ...(dto.number !== undefined && { number: dto.number }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.articleId !== undefined && {
          article: dto.articleId ? { connect: { id: dto.articleId } } : { disconnect: true },
        }),
        version: { increment: 1 },
      },
    });

    await this.auditService.log({
      action: 'clause.updated',
      entity: 'clause',
      entityId: id,
      userId,
      organizationId,
      metadata: { newVersion: updated.version, changes: dto },
    });

    // Propagate to active project copies
    const affected = await this.prisma.projectClause.findMany({
      where: { clauseId: id },
      include: {
        project: { select: { id: true, organizationId: true, createdById: true } },
      },
    });

    if (affected.length > 0) {
      await this.prisma.projectClause.updateMany({
        where: { clauseId: id },
        data: { hasNewerVersion: true },
      });

      // One notification per project creator (deduplicated)
      const notified = new Set<string>();
      for (const pc of affected) {
        if (!notified.has(pc.project.id)) {
          notified.add(pc.project.id);
          await this.notificationsService.create({
            organizationId: pc.project.organizationId,
            userId: pc.project.createdById,
            projectId: pc.project.id,
            type: NotificationType.CLAUSE_UPDATED,
            title: `Clause mise à jour : ${updated.title}`,
            message: `La clause ${updated.number} a une nouvelle version (v${updated.version}). Vous pouvez l'intégrer ou conserver la version actuelle.`,
            metadata: { clauseId: id, clauseNumber: updated.number, newVersion: updated.version },
          });
        }
      }
    }

    return updated;
  }

  async remove(id: string, organizationId: string, userId: string): Promise<void> {
    const clause = await this.prisma.clause.findFirst({ where: { id, organizationId } });
    if (!clause) throw new NotFoundException(`Clause ${id} not found`);

    const inUse = await this.prisma.projectClause.count({ where: { clauseId: id } });
    if (inUse > 0) {
      throw new ForbiddenException(
        `Clause utilisée dans ${inUse} projet(s) — suppression impossible. Archivez ou retirez-la des projets d'abord.`,
      );
    }

    await this.prisma.clause.delete({ where: { id } });
    await this.auditService.log({
      action: 'clause.deleted',
      entity: 'clause',
      entityId: id,
      userId,
      organizationId,
      metadata: { number: clause.number, title: clause.title },
    });
  }

  /**
   * Retourne toutes les clauses liées aux articles donnés, dans l'org courante.
   * Utilisé pour pré-remplir le Chapitre III lors de la création d'un CPS.
   */
  suggestByArticleIds(organizationId: string, articleIds: string[]): Promise<Clause[]> {
    return this.prisma.clause.findMany({
      where: {
        organizationId,
        articleId: { in: articleIds },
      },
      orderBy: [{ articleId: 'asc' }, { number: 'asc' }],
      include: { article: true },
    });
  }
}
