import { ConflictException, Injectable } from '@nestjs/common';
import type { Organization } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    const existing = await this.prisma.organization.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`Slug "${dto.slug}" already taken`);

    const org = await this.prisma.organization.create({
      data: { name: dto.name, slug: dto.slug },
    });

    if (dto.initFromTmpa) {
      // TODO Phase 2 : dupliquer le référentiel TMPA (articles, clauses, séries…)
      // La structure de données TMPA sera importée depuis /templates lors de la Phase 2.
    }

    return org;
  }

  findAll(): Promise<Organization[]> {
    return this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { id } });
  }
}
