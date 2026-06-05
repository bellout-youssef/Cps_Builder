import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Clause } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateClauseDto } from './dto/create-clause.dto';
import type { UpdateClauseDto } from './dto/update-clause.dto';

@Injectable()
export class ClausesService {
  constructor(private readonly prisma: PrismaService) {}

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

  create(dto: CreateClauseDto, organizationId: string, userId: string): Promise<Clause> {
    return this.prisma.clause.create({
      data: {
        number: dto.number,
        title: dto.title,
        content: dto.content,
        organization: { connect: { id: organizationId } },
        createdBy: { connect: { id: userId } },
        ...(dto.articleId ? { article: { connect: { id: dto.articleId } } } : {}),
      },
    });
  }

  async update(id: string, dto: UpdateClauseDto, organizationId: string): Promise<Clause> {
    const clause = await this.prisma.clause.findFirst({ where: { id, organizationId } });
    if (!clause) throw new NotFoundException(`Clause ${id} not found`);

    return this.prisma.clause.update({
      where: { id },
      data: {
        ...(dto.number !== undefined && { number: dto.number }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.articleId !== undefined && {
          article: dto.articleId ? { connect: { id: dto.articleId } } : { disconnect: true },
        }),
      },
    });
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const clause = await this.prisma.clause.findFirst({ where: { id, organizationId } });
    if (!clause) throw new NotFoundException(`Clause ${id} not found`);
    await this.prisma.clause.delete({ where: { id } });
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
