import { Injectable, NotFoundException } from '@nestjs/common';
import type { Serie } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateSerieDto } from './dto/create-serie.dto';

@Injectable()
export class SeriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string): Promise<Serie[]> {
    return this.prisma.serie.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Serie> {
    const serie = await this.prisma.serie.findFirst({ where: { id, organizationId } });
    if (!serie) throw new NotFoundException(`Serie ${id} not found`);
    return serie;
  }

  create(dto: CreateSerieDto, organizationId: string, userId: string): Promise<Serie> {
    return this.prisma.serie.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        organization: { connect: { id: organizationId } },
        createdBy: { connect: { id: userId } },
      },
    });
  }

  async update(id: string, dto: Partial<CreateSerieDto>, organizationId: string): Promise<Serie> {
    const serie = await this.prisma.serie.findFirst({ where: { id, organizationId } });
    if (!serie) throw new NotFoundException(`Serie ${id} not found`);
    return this.prisma.serie.update({ where: { id }, data: dto });
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const serie = await this.prisma.serie.findFirst({ where: { id, organizationId } });
    if (!serie) throw new NotFoundException(`Serie ${id} not found`);
    await this.prisma.serie.delete({ where: { id } });
  }
}
