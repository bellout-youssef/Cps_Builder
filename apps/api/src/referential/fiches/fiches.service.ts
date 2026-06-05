import { Injectable, NotFoundException } from '@nestjs/common';
import type { FicheTechnique } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateFicheDto } from './dto/create-fiche.dto';
import type { UpdateFicheDto } from './dto/update-fiche.dto';

@Injectable()
export class FichesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string): Promise<FicheTechnique[]> {
    return this.prisma.ficheTechnique.findMany({
      where: { organizationId },
      orderBy: { title: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<FicheTechnique> {
    const fiche = await this.prisma.ficheTechnique.findFirst({
      where: { id, organizationId },
      include: { articles: { include: { article: true } } },
    });
    if (!fiche) throw new NotFoundException(`FicheTechnique ${id} not found`);
    return fiche;
  }

  async create(dto: CreateFicheDto, organizationId: string, userId: string): Promise<FicheTechnique> {
    return this.prisma.ficheTechnique.create({
      data: {
        title: dto.title,
        url: dto.url,
        description: dto.description,
        organization: { connect: { id: organizationId } },
        createdBy: { connect: { id: userId } },
        ...(dto.articleIds?.length
          ? {
              articles: {
                create: dto.articleIds.map((articleId) => ({ articleId })),
              },
            }
          : {}),
      },
    });
  }

  async update(id: string, dto: UpdateFicheDto, organizationId: string): Promise<FicheTechnique> {
    const fiche = await this.prisma.ficheTechnique.findFirst({ where: { id, organizationId } });
    if (!fiche) throw new NotFoundException(`FicheTechnique ${id} not found`);

    return this.prisma.ficheTechnique.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.articleIds !== undefined && {
          articles: {
            deleteMany: {},
            create: dto.articleIds.map((articleId) => ({ articleId })),
          },
        }),
      },
    });
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const fiche = await this.prisma.ficheTechnique.findFirst({ where: { id, organizationId } });
    if (!fiche) throw new NotFoundException(`FicheTechnique ${id} not found`);
    await this.prisma.ficheTechnique.delete({ where: { id } });
  }
}
