import { ConflictException, Injectable } from '@nestjs/common';
import type { Organization } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateOrganizationDto } from './dto/create-organization.dto';

export type OrgWithCounts = Organization & {
  userCount: number;
  projectCount: number;
};

type RawWithCount = Organization & { _count: { users: number; projects: number } };

function toOrgWithCounts(raw: RawWithCount): OrgWithCounts {
  const { _count, ...org } = raw;
  return { ...org, userCount: _count.users, projectCount: _count.projects };
}

const COUNT_INCLUDE = { _count: { select: { users: true, projects: true } } } as const;

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto): Promise<OrgWithCounts> {
    const existing = await this.prisma.organization.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`Slug "${dto.slug}" already taken`);

    const raw = await this.prisma.organization.create({
      data: { name: dto.name, slug: dto.slug },
      include: COUNT_INCLUDE,
    });

    if (dto.initFromTmpa) {
      // TODO Phase 2 : dupliquer le référentiel TMPA (articles, clauses, séries…)
      // La structure de données TMPA sera importée depuis /templates lors de la Phase 2.
    }

    return toOrgWithCounts(raw);
  }

  async findAll(): Promise<OrgWithCounts[]> {
    const raws = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: COUNT_INCLUDE,
    });
    return raws.map(toOrgWithCounts);
  }

  findOne(id: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  async update(id: string, data: { name: string }): Promise<Organization> {
    return this.prisma.organization.update({ where: { id }, data: { name: data.name } });
  }
}
