import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Article, ArticleCycle, Prisma, RoleName } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import type { CreateArticleDto } from './dto/create-article.dto';
import type { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findAll(organizationId: string): Promise<Article[]> {
    return this.prisma.article.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Article> {
    const article = await this.prisma.article.findFirst({
      where: { id, organizationId },
      include: {
        serie: true,
        clauses: { orderBy: { number: 'asc' } },
        fiches: { include: { fiche: true } },
      },
    });
    if (!article) throw new NotFoundException(`Article ${id} not found`);
    return article;
  }

  create(dto: CreateArticleDto, organizationId: string, userId: string): Promise<Article> {
    return this.prisma.article.create({
      data: {
        title: dto.title,
        description: dto.description,
        unit: dto.unit,
        cycle: ArticleCycle.DRAFT,
        organization: { connect: { id: organizationId } },
        createdBy: { connect: { id: userId } },
        ...(dto.serieId ? { serie: { connect: { id: dto.serieId } } } : {}),
      },
    });
  }

  async update(
    id: string,
    dto: UpdateArticleDto,
    organizationId: string,
    userRoles: RoleName[],
  ): Promise<Article> {
    const article = await this.prisma.article.findFirst({ where: { id, organizationId } });
    if (!article) throw new NotFoundException(`Article ${id} not found`);

    if (article.cycle === ArticleCycle.ARCHIVING) {
      throw new ForbiddenException('Archived articles cannot be modified');
    }

    const isAdmin = userRoles.includes(RoleName.ADMIN);
    if (!isAdmin && article.cycle !== ArticleCycle.DRAFT) {
      throw new ForbiddenException('Seul un ADMIN peut modifier un article non-brouillon');
    }

    if (
      article.cycle === ArticleCycle.PUBLISHED &&
      dto.unit !== undefined &&
      dto.unit !== article.unit
    ) {
      throw new ConflictException('Article unit is frozen after publication');
    }

    const data: Prisma.ArticleUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.serieId !== undefined) {
      data.serie = dto.serieId ? { connect: { id: dto.serieId } } : { disconnect: true };
    }
    // unit change allowed only if not yet published
    if (dto.unit !== undefined && article.cycle !== ArticleCycle.PUBLISHED) {
      data.unit = dto.unit;
    }

    return this.prisma.article.update({ where: { id }, data });
  }

  async publish(id: string, organizationId: string, userId: string): Promise<Article> {
    const article = await this.prisma.article.findFirst({ where: { id, organizationId } });
    if (!article) throw new NotFoundException(`Article ${id} not found`);

    if (
      article.cycle !== ArticleCycle.DRAFT &&
      article.cycle !== ArticleCycle.PUBLISHING
    ) {
      throw new BadRequestException(
        `Cannot publish article with cycle ${article.cycle}. Expected DRAFT or PUBLISHING.`,
      );
    }

    const codedCount = await this.prisma.article.count({
      where: { organizationId, code: { not: null } },
    });
    const code = `ART-${String(codedCount + 1).padStart(4, '0')}`;

    const published = await this.prisma.article.update({
      where: { id },
      data: { cycle: ArticleCycle.PUBLISHED, code },
    });
    await this.auditService.log({
      action: 'article.published',
      entity: 'article',
      entityId: id,
      userId,
      organizationId,
      metadata: { code },
    });
    return published;
  }

  async archive(id: string, organizationId: string, userId: string): Promise<Article> {
    const article = await this.prisma.article.findFirst({ where: { id, organizationId } });
    if (!article) throw new NotFoundException(`Article ${id} not found`);

    if (article.cycle !== ArticleCycle.PUBLISHED) {
      throw new BadRequestException(
        `Cannot archive article with cycle ${article.cycle}. Expected PUBLISHED.`,
      );
    }

    const archived = await this.prisma.article.update({
      where: { id },
      data: { cycle: ArticleCycle.ARCHIVING },
    });
    await this.auditService.log({
      action: 'article.archived',
      entity: 'article',
      entityId: id,
      userId,
      organizationId,
      metadata: { code: article.code },
    });
    return archived;
  }

  async remove(id: string, organizationId: string, userId: string): Promise<void> {
    const article = await this.prisma.article.findFirst({ where: { id, organizationId } });
    if (!article) throw new NotFoundException(`Article ${id} not found`);

    if (article.cycle !== ArticleCycle.DRAFT) {
      throw new ForbiddenException('Only DRAFT articles can be deleted');
    }

    await this.prisma.article.delete({ where: { id } });
    await this.auditService.log({
      action: 'article.deleted',
      entity: 'article',
      entityId: id,
      userId,
      organizationId,
      metadata: { title: article.title },
    });
  }
}
