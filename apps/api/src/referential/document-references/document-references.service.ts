import { Injectable, NotFoundException } from '@nestjs/common';
import type { DocumentReference } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateDocumentReferenceDto } from './dto/create-document-reference.dto';

@Injectable()
export class DocumentReferencesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string): Promise<DocumentReference[]> {
    return this.prisma.documentReference.findMany({
      where: { organizationId },
      orderBy: { title: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<DocumentReference> {
    const item = await this.prisma.documentReference.findFirst({ where: { id, organizationId } });
    if (!item) throw new NotFoundException(`DocumentReference ${id} not found`);
    return item;
  }

  create(dto: CreateDocumentReferenceDto, organizationId: string, userId: string): Promise<DocumentReference> {
    return this.prisma.documentReference.create({
      data: {
        title: dto.title,
        reference: dto.reference,
        url: dto.url,
        description: dto.description,
        organization: { connect: { id: organizationId } },
        createdBy: { connect: { id: userId } },
      },
    });
  }

  async update(id: string, dto: Partial<CreateDocumentReferenceDto>, organizationId: string): Promise<DocumentReference> {
    const item = await this.prisma.documentReference.findFirst({ where: { id, organizationId } });
    if (!item) throw new NotFoundException(`DocumentReference ${id} not found`);
    return this.prisma.documentReference.update({ where: { id }, data: dto });
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const item = await this.prisma.documentReference.findFirst({ where: { id, organizationId } });
    if (!item) throw new NotFoundException(`DocumentReference ${id} not found`);
    await this.prisma.documentReference.delete({ where: { id } });
  }
}
