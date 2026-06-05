import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentType } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { HtmlGeneratorService } from './html-generator.service';
import { DocxGeneratorService } from './docx-generator.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { ExcelGeneratorService } from './excel-generator.service';
import {
  CpsDocumentData,
  CpsBdpLot,
  CpsEstimLot,
  CpsBdpSubSection,
  CpsEstimSubSection,
  CpsBdpLineItem,
  CpsEstimLineItem,
} from './types/cps-document.types';

@Injectable()
export class PublicationService {
  private readonly logger = new Logger(PublicationService.name);
  private readonly uploadsRoot: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly html: HtmlGeneratorService,
    private readonly docx: DocxGeneratorService,
    private readonly pdf: PdfGeneratorService,
    private readonly excel: ExcelGeneratorService,
  ) {
    this.uploadsRoot = config.get<string>('UPLOADS_DIR', 'uploads');
  }

  async generateAndStore(projectId: string, orgId: string): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId },
      include: {
        organization: true,
        createdBy: { select: { id: true, name: true } },
        types: true,
        clauses: {
          include: {
            clause: { select: { number: true, title: true, content: true, articleId: true } },
          },
          orderBy: { number: 'asc' },
        },
        articles: {
          include: {
            article: {
              select: { id: true, code: true, title: true, unit: true, description: true },
            },
          },
        },
      },
    });

    if (!project) throw new NotFoundException('Projet non trouvé');
    if (!project.code || !project.publishedAt) {
      throw new Error('Le projet doit être publié (code et publishedAt requis)');
    }

    const data = this.mapToDocumentData(project as Parameters<typeof this.mapToDocumentData>[0]);

    // ── Génération parallèle HTML + DOCX + PDF + BDP + ESTIM ──────
    this.logger.log(`Génération des documents pour ${project.code}...`);

    const [htmlContent, docxBuffer, bdpBuffer, estimBuffer] = await Promise.all([
      Promise.resolve(this.html.generate(data)),
      this.docx.generate(data),
      this.excel.generateBdp(data),
      this.excel.generateEstim(data),
    ]);

    const pdfBuffer = await this.pdf.generate(htmlContent, project.code);

    // ── Persistance sur disque ─────────────────────────────────────
    const dir = path.join(this.uploadsRoot, 'docs', orgId, projectId);
    await fs.mkdir(dir, { recursive: true });

    const slug = project.code;
    const files: Array<{ type: DocumentType; filename: string; buffer: Buffer }> = [
      { type: DocumentType.HTML, filename: `${slug}.html`, buffer: Buffer.from(htmlContent) },
      { type: DocumentType.DOCX, filename: `${slug}.docx`, buffer: docxBuffer },
      { type: DocumentType.PDF, filename: `${slug}.pdf`, buffer: pdfBuffer },
      { type: DocumentType.BDP_EXCEL, filename: `${slug}_BDP.xlsx`, buffer: bdpBuffer },
      { type: DocumentType.ESTIM_EXCEL, filename: `${slug}_ESTIM.xlsx`, buffer: estimBuffer },
    ];

    await Promise.all(
      files.map(({ filename, buffer }) => fs.writeFile(path.join(dir, filename), buffer)),
    );

    // ── Références en base ─────────────────────────────────────────
    await this.prisma.$transaction([
      this.prisma.projectDocument.deleteMany({ where: { projectId } }),
      this.prisma.projectDocument.createMany({
        data: files.map(({ type, filename, buffer }) => ({
          projectId,
          type,
          filename,
          path: path.join('docs', orgId, projectId, filename),
          sizeBytes: buffer.length,
        })),
      }),
      this.prisma.auditLog.create({
        data: {
          organizationId: orgId,
          userId: project.createdById,
          action: 'project.documents_generated',
          entity: 'project',
          entityId: projectId,
          metadata: { code: project.code, files: files.map((f) => f.filename) },
        },
      }),
    ]);

    this.logger.log(`Documents générés et stockés pour ${project.code}`);
  }

  // ─── Mapping Prisma → CpsDocumentData ────────────────────────────

  private mapToDocumentData(project: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    publishedAt: Date;
    chapter2Answers: unknown;
    createdById: string;
    organization: { id: string; name: string; slug: string };
    createdBy: { id: string; name: string };
    types: Array<{ type: string }>;
    clauses: Array<{
      number: string;
      title: string;
      localContent: string | null;
      isModifiedLocally: boolean;
      clause: { number: string; title: string; content: string | null; articleId: string | null };
    }>;
    articles: Array<{
      article: { id: string; code: string | null; title: string; unit: string | null; description: string | null };
    }>;
  }): CpsDocumentData {
    const { chapter1, chapter3 } = this.splitClauses(project.clauses);

    const ch2 = Array.isArray(project.chapter2Answers)
      ? (project.chapter2Answers as Array<{ question: string; answer: string }>)
      : [];

    const chapter4 = project.articles
      .filter((pa) => pa.article.code)
      .map((pa) => ({
        code: pa.article.code!,
        title: pa.article.title,
        unit: pa.article.unit ?? '—',
        description: pa.article.description ?? '',
      }));

    const { bdpLots, estimLots } = this.buildLots(project.articles);

    return {
      code: project.code,
      projectName: project.name,
      projectDescription: project.description ?? undefined,
      organization: project.organization,
      createdBy: project.createdBy,
      publishedAt: project.publishedAt,
      types: project.types.map((t) => t.type),
      preamble: undefined,
      chapter1,
      chapter2: ch2,
      chapter3,
      chapter4,
      bdpLots,
      estimLots,
      estimRecap: estimLots.map((lot) => ({
        lotCode: lot.lotCode,
        lotTitle: lot.lotTitle,
        totalAmount: lot.totalAmount,
      })),
      annexes: [],
    };
  }

  private splitClauses(
    clauses: Array<{
      number: string;
      title: string;
      localContent: string | null;
      isModifiedLocally: boolean;
      clause: { number: string; title: string; content: string | null; articleId: string | null };
    }>,
  ) {
    const chapter1 = clauses
      .filter((pc) => pc.clause.articleId === null)
      .map((pc) => ({
        id: pc.number,
        number: pc.number,
        title: pc.title,
        content: pc.localContent ?? pc.clause.content ?? '',
        isModifiedLocally: pc.isModifiedLocally,
      }));

    const chapter3 = clauses
      .filter((pc) => pc.clause.articleId !== null)
      .map((pc) => ({
        id: pc.number,
        number: pc.number,
        title: pc.title,
        content: pc.localContent ?? pc.clause.content ?? '',
        isModifiedLocally: pc.isModifiedLocally,
      }));

    return { chapter1, chapter3 };
  }

  private buildLots(
    articles: Array<{
      article: { id: string; code: string | null; title: string; unit: string | null; description: string | null };
    }>,
  ): { bdpLots: CpsBdpLot[]; estimLots: CpsEstimLot[] } {
    if (!articles.length) return { bdpLots: [], estimLots: [] };

    const items: CpsBdpLineItem[] = articles.map((pa) => ({
      priceCode: pa.article.code ?? '—',
      designation: pa.article.title,
      unit: pa.article.unit ?? '—',
    }));

    const estimItems: CpsEstimLineItem[] = items.map((it) => ({ ...it }));

    const section: CpsBdpSubSection = { title: 'Prestations', items };
    const estimSection: CpsEstimSubSection = { title: 'Prestations', items: estimItems };

    const bdpLot: CpsBdpLot = {
      lotCode: 'LOT 001',
      lotTitle: 'Travaux',
      subSections: [section],
      totalLabel: 'TOTAL LOT 001 : TRAVAUX',
    };

    const estimLot: CpsEstimLot = {
      lotCode: 'LOT 001',
      lotTitle: 'Travaux',
      subSections: [estimSection],
      totalLabel: 'TOTAL LOT 001 : TRAVAUX',
    };

    return { bdpLots: [bdpLot], estimLots: [estimLot] };
  }
}
