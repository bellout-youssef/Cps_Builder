import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Unite } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateUniteDto } from './dto/create-unite.dto';

@Injectable()
export class UnitesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string): Promise<Unite[]> {
    return this.prisma.unite.findMany({
      where: { organizationId },
      orderBy: { label: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Unite> {
    const unite = await this.prisma.unite.findFirst({ where: { id, organizationId } });
    if (!unite) throw new NotFoundException(`Unite ${id} not found`);
    return unite;
  }

  async create(dto: CreateUniteDto, organizationId: string, userId: string): Promise<Unite> {
    const existing = await this.prisma.unite.findFirst({
      where: { organizationId, label: dto.label },
    });
    if (existing) throw new ConflictException(`Unite "${dto.label}" already exists in this organization`);

    return this.prisma.unite.create({
      data: {
        label: dto.label,
        symbol: dto.symbol,
        organization: { connect: { id: organizationId } },
        createdBy: { connect: { id: userId } },
      },
    });
  }

  async update(id: string, dto: Partial<CreateUniteDto>, organizationId: string): Promise<Unite> {
    const unite = await this.prisma.unite.findFirst({ where: { id, organizationId } });
    if (!unite) throw new NotFoundException(`Unite ${id} not found`);
    return this.prisma.unite.update({ where: { id }, data: dto });
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const unite = await this.prisma.unite.findFirst({ where: { id, organizationId } });
    if (!unite) throw new NotFoundException(`Unite ${id} not found`);
    await this.prisma.unite.delete({ where: { id } });
  }
}
