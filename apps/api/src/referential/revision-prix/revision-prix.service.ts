import { Injectable, NotFoundException } from '@nestjs/common';
import type { RevisionPrix } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateRevisionPrixDto } from './dto/create-revision-prix.dto';

@Injectable()
export class RevisionPrixService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string): Promise<RevisionPrix[]> {
    return this.prisma.revisionPrix.findMany({
      where: { organizationId },
      orderBy: { title: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<RevisionPrix> {
    const item = await this.prisma.revisionPrix.findFirst({ where: { id, organizationId } });
    if (!item) throw new NotFoundException(`RevisionPrix ${id} not found`);
    return item;
  }

  create(dto: CreateRevisionPrixDto, organizationId: string, userId: string): Promise<RevisionPrix> {
    return this.prisma.revisionPrix.create({
      data: {
        title: dto.title,
        formula: dto.formula,
        description: dto.description,
        organization: { connect: { id: organizationId } },
        createdBy: { connect: { id: userId } },
      },
    });
  }

  async update(id: string, dto: Partial<CreateRevisionPrixDto>, organizationId: string): Promise<RevisionPrix> {
    const item = await this.prisma.revisionPrix.findFirst({ where: { id, organizationId } });
    if (!item) throw new NotFoundException(`RevisionPrix ${id} not found`);
    return this.prisma.revisionPrix.update({ where: { id }, data: dto });
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const item = await this.prisma.revisionPrix.findFirst({ where: { id, organizationId } });
    if (!item) throw new NotFoundException(`RevisionPrix ${id} not found`);
    await this.prisma.revisionPrix.delete({ where: { id } });
  }
}
