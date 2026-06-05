import { Injectable, NotFoundException } from '@nestjs/common';
import type { ModeleCPS } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateModeleCpsDto } from './dto/create-modele-cps.dto';

@Injectable()
export class ModelesCpsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string): Promise<ModeleCPS[]> {
    return this.prisma.modeleCPS.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<ModeleCPS> {
    const item = await this.prisma.modeleCPS.findFirst({ where: { id, organizationId } });
    if (!item) throw new NotFoundException(`ModeleCPS ${id} not found`);
    return item;
  }

  create(dto: CreateModeleCpsDto, organizationId: string, userId: string): Promise<ModeleCPS> {
    return this.prisma.modeleCPS.create({
      data: {
        name: dto.name,
        description: dto.description,
        projectTypes: dto.projectTypes ?? [],
        templatePath: dto.templatePath,
        organization: { connect: { id: organizationId } },
        createdBy: { connect: { id: userId } },
      },
    });
  }

  async update(id: string, dto: Partial<CreateModeleCpsDto>, organizationId: string): Promise<ModeleCPS> {
    const item = await this.prisma.modeleCPS.findFirst({ where: { id, organizationId } });
    if (!item) throw new NotFoundException(`ModeleCPS ${id} not found`);
    return this.prisma.modeleCPS.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.projectTypes !== undefined && { projectTypes: dto.projectTypes }),
        ...(dto.templatePath !== undefined && { templatePath: dto.templatePath }),
      },
    });
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const item = await this.prisma.modeleCPS.findFirst({ where: { id, organizationId } });
    if (!item) throw new NotFoundException(`ModeleCPS ${id} not found`);
    await this.prisma.modeleCPS.delete({ where: { id } });
  }
}
