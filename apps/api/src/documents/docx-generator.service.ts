import { Injectable, Logger } from '@nestjs/common';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  LevelFormat,
  PageNumber,
  PageOrientation,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  convertMillimetersToTwip,
} from 'docx';
import {
  CpsDocumentData,
  CpsClause,
  CpsBdpLot,
  CpsEstimLot,
  BlockItem,
  CpsChapterContent,
} from './types/cps-document.types';

// ─── Couleurs TMPA ────────────────────────────────────────────────
const C = {
  marine: '0F4761',
  blue: '4472C4',
  lightBlue: '5B9BD5',
  mainBlue: '0070C0',
  white: 'FFFFFF',
  black: '000000',
  sectionBg: 'DEEAF1',
  subSectionBg: 'EBF3FB',
  totalBg: '4472C4',
} as const;

@Injectable()
export class DocxGeneratorService {
  private readonly logger = new Logger(DocxGeneratorService.name);

  async generate(data: CpsDocumentData): Promise<Buffer> {
    const footerParagraph = this.buildFooterParagraph(data.code);

    const doc = new Document({
      numbering: {
        config: [
          {
            reference: 'cps-bullets',
            levels: [
              {
                level: 0,
                format: LevelFormat.BULLET,
                text: '–',
                alignment: AlignmentType.LEFT,
                style: {
                  paragraph: {
                    indent: { left: convertMillimetersToTwip(7), hanging: convertMillimetersToTwip(4) },
                  },
                },
              },
            ],
          },
        ],
      },
      styles: {
        default: {
          document: {
            run: { font: 'Arial', size: 22 },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              size: {
                width: convertMillimetersToTwip(210),
                height: convertMillimetersToTwip(297),
                orientation: PageOrientation.PORTRAIT,
              },
              margin: {
                top: convertMillimetersToTwip(25.4),
                right: convertMillimetersToTwip(25.4),
                bottom: convertMillimetersToTwip(35),
                left: convertMillimetersToTwip(25.4),
              },
            },
          },
          footers: {
            default: new Footer({ children: [footerParagraph] }),
          },
          children: [
            ...this.buildCover(data),
            ...this.buildToc(),
            ...this.buildPreamble(data.preamble),
            ...this.buildChapter1(data.chapter1),
            ...this.buildChapter2(data.chapter2, data.chapter2Content),
            ...this.buildChapter3(data.chapter3),
            ...this.buildChapter4(data.chapter4),
            ...this.buildChapter5(data),
            ...data.annexes.flatMap((a, i) => this.buildAnnex(a, i + 1)),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    this.logger.log(`DOCX généré pour ${data.code} — ${buffer.length} octets`);
    return buffer;
  }

  // ─── Footer ───────────────────────────────────────────────────────
  private buildFooterParagraph(code: string): Paragraph {
    return new Paragraph({
      alignment: AlignmentType.RIGHT,
      border: {
        top: { style: BorderStyle.SINGLE, size: 4, space: 1, color: C.mainBlue },
      },
      children: [
        new TextRun({ text: 'CAHIER DES CHARGES', bold: true, font: 'Calibri Light', size: 16, color: C.mainBlue, smallCaps: true }),
        new TextRun({ break: 1, text: code, font: 'Calibri Light', size: 16, smallCaps: true }),
        new TextRun({ break: 1, text: 'Page ', font: 'Calibri Light', size: 14 }),
        new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri Light', size: 14 }),
        new TextRun({ text: ' | ', font: 'Calibri Light', size: 14 }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Calibri Light', size: 14 }),
      ],
    });
  }

  // ─── Cover ────────────────────────────────────────────────────────
  private buildCover(data: CpsDocumentData): (Paragraph | Table)[] {
    const typesStr = data.types.join(', ');
    const dateStr = data.publishedAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: convertMillimetersToTwip(60), after: convertMillimetersToTwip(4) },
        children: [
          new TextRun({ text: data.organization.name.toUpperCase(), font: 'Calibri Light', size: 24, bold: true, color: C.mainBlue, smallCaps: true }),
        ],
      }),
      new Paragraph({ children: [] }),
      new Paragraph({ children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'CAHIER DES PRESCRIPTIONS SPÉCIALES', font: 'Calibri Light', size: 20, color: C.blue, smallCaps: true }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: convertMillimetersToTwip(8), after: convertMillimetersToTwip(8) },
        children: [
          new TextRun({ text: data.projectName, font: 'Calibri', size: 40, bold: true, color: C.marine }),
        ],
      }),
      ...(data.projectDescription ? [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: data.projectDescription, size: 20, color: '555555' })],
      })] : []),
      new Paragraph({ children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `Types de projet : ${typesStr}`, size: 20 }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `Créé par : ${data.createdBy.name}`, size: 20 }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `Publié le : ${dateStr}`, size: 20 }),
        ],
      }),
      new Paragraph({ children: [] }),
      new Paragraph({ children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: {
          top: { style: BorderStyle.SINGLE, size: 6, color: C.mainBlue },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: C.mainBlue },
        },
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({ text: data.code, font: 'Calibri Light', size: 22, bold: true, color: C.mainBlue, smallCaps: true }),
        ],
      }),
      new Paragraph({ pageBreakBefore: true, children: [] }),
    ];
  }

  // ─── TOC ──────────────────────────────────────────────────────────
  private buildToc(): (Paragraph | Table)[] {
    const tocItems = [
      'Préambule',
      'Chapitre I — Clauses Communes',
      'Chapitre II — Questionnaire',
      'Chapitre III — Clauses Techniques',
      'Chapitre IV — Définition des Prix',
      'Chapitre V — Bordereau des Prix et Estimation',
      'Annexes',
    ];

    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Sommaire', font: 'Calibri', bold: true, size: 36, color: C.marine })],
      }),
      ...tocItems.map(
        (label) =>
          new Paragraph({
            children: [
              new TextRun({ text: label, font: 'Calibri Light', size: 18, color: C.mainBlue, smallCaps: true }),
            ],
          }),
      ),
      new Paragraph({ pageBreakBefore: true, children: [] }),
    ];
  }

  // ─── Préambule ────────────────────────────────────────────────────
  private buildPreamble(content?: string): (Paragraph | Table)[] {
    return [
      this.h1('Préambule'),
      new Paragraph({
        children: [
          new TextRun({
            text: content
              ? content.replace(/<[^>]+>/g, '')
              : 'Le présent CPS définit les conditions dans lesquelles seront exécutés les travaux.',
            size: 22,
          }),
        ],
      }),
      new Paragraph({ pageBreakBefore: true, children: [] }),
    ];
  }

  // ─── Chapitres clauses ────────────────────────────────────────────
  private buildChapter1(clauses: CpsClause[]): (Paragraph | Table)[] {
    return [this.h1('Chapitre I — Clauses Communes'), ...clauses.flatMap((c) => this.buildClause(c)), this.pageBreak()];
  }

  private buildChapter2(answers: Array<{ question: string; answer: string }>, content?: CpsChapterContent): (Paragraph | Table)[] {
    if (content) {
      return this.buildChapterContent(
        'Chapitre II — Clauses Administratives et Financières Spécifiques',
        content,
      );
    }
    if (!answers.length) return [];
    const rows = answers.flatMap((a) => [
      new Paragraph({ children: [new TextRun({ text: a.question, bold: true, size: 22 })] }),
      new Paragraph({
        shading: { type: ShadingType.SOLID, color: 'F8F8F8' },
        children: [new TextRun({ text: a.answer, size: 22 })],
      }),
      new Paragraph({ children: [] }),
    ]);

    return [this.h1('Chapitre II — Questionnaire'), ...rows, this.pageBreak()];
  }

  /** Render a CpsChapterContent to DOCX paragraphs/tables. */
  private buildChapterContent(chapterTitle: string, content: CpsChapterContent): (Paragraph | Table)[] {
    const result: (Paragraph | Table)[] = [this.h1(chapterTitle)];
    for (const art of content.articles) {
      const heading = art.num ? `Article ${art.num} — ${art.title}` : art.title;
      result.push(this.h2(heading));
      for (const block of art.blocks) {
        result.push(...this.renderBlock(block));
      }
    }
    result.push(this.pageBreak());
    return result;
  }

  private renderBlock(b: BlockItem): (Paragraph | Table)[] {
    switch (b.kind) {
      case 'para':
        return [
          new Paragraph({
            alignment: b.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
            children: [new TextRun({ text: b.text, size: 22, bold: b.bold, italics: b.italic })],
          }),
        ];
      case 'para_mixed':
        return [
          new Paragraph({
            alignment: b.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
            children: b.runs.map((r) => new TextRun({ text: r.text, size: 22, bold: r.bold, italics: r.italic })),
          }),
        ];
      case 'formula':
        return [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 160, after: 160 },
            children: [new TextRun({ text: b.text, font: 'Courier New', size: 22, bold: true })],
          }),
        ];
      case 'bullets':
        return b.items.map(
          (item) =>
            new Paragraph({
              numbering: { reference: 'cps-bullets', level: 0 },
              alignment: AlignmentType.JUSTIFIED,
              children: [new TextRun({ text: item, size: 22 })],
            }),
        );
      case 'table': {
        if (!b.rows.length) return [];
        const colCount = Math.max(b.headers.length, ...b.rows.map((r) => r.length));
        const colW = Math.floor(convertMillimetersToTwip(170) / colCount);
        const mkCell = (text: string, isHeader: boolean) =>
          new TableCell({
            shading: isHeader ? { type: ShadingType.SOLID, color: C.marine } : undefined,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text,
                    size: 18,
                    bold: isHeader,
                    color: isHeader ? C.white : C.black,
                  }),
                ],
              }),
            ],
          });
        const rows: TableRow[] = [];
        if (b.headers.length) {
          rows.push(new TableRow({ tableHeader: true, children: b.headers.map((h) => mkCell(h, true)) }));
        }
        b.rows.forEach((row) => {
          const cells = Array.from({ length: colCount }, (_, i) => mkCell(row[i] ?? '', false));
          rows.push(new TableRow({ children: cells }));
        });
        return [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows,
          }),
        ];
      }
    }
  }

  private buildChapter3(clauses: CpsClause[]): (Paragraph | Table)[] {
    return [this.h1('Chapitre III — Clauses Techniques'), ...clauses.flatMap((c) => this.buildClause(c)), this.pageBreak()];
  }

  private buildChapter4(prices: Array<{ code: string; title: string; unit: string; description: string }>): (Paragraph | Table)[] {
    if (!prices.length) return [this.h1('Chapitre IV — Définition des Prix'), this.pageBreak()];
    const rows = prices.flatMap((p) => {
      const descRuns = p.description.split('\n').flatMap((line, i) =>
        i === 0
          ? [new TextRun({ text: line, size: 21 })]
          : [new TextRun({ break: 1, text: line, size: 21 })],
      );
      return [
        new Paragraph({
          shading: { type: ShadingType.SOLID, color: C.marine },
          children: [
            new TextRun({ text: `${p.code} — ${p.title}`, bold: true, color: C.white, font: 'Calibri', size: 20, smallCaps: true }),
            new TextRun({ text: `  (${p.unit})`, color: C.white, size: 18, italics: true }),
          ],
        }),
        new Paragraph({ children: descRuns }),
        new Paragraph({ children: [] }),
      ];
    });

    return [this.h1('Chapitre IV — Définition des Prix'), ...rows, this.pageBreak()];
  }

  // ─── Chapitre V ───────────────────────────────────────────────────
  private buildChapter5(data: CpsDocumentData): (Paragraph | Table)[] {
    return [
      this.h1('Chapitre V — Bordereau des Prix et Estimation'),
      this.h2('A — Bordereau des Prix Détail'),
      ...this.buildBdpTable(data.bdpLots),
      this.h2('B — Estimation'),
      ...this.buildEstimTable(data.estimLots),
      this.pageBreak(),
    ];
  }

  private buildBdpTable(lots: CpsBdpLot[]): (Table | Paragraph)[] {
    if (!lots.length) return [new Paragraph({ children: [new TextRun({ text: 'Aucun prix défini.', italics: true })] })];

    const rows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          this.th('N° de Prix', 1500),
          this.th('Désignation des Prestations'),
          this.th('U', 900),
        ],
      }),
    ];

    for (const lot of lots) {
      rows.push(new TableRow({
        children: [this.tdLot(`${lot.lotCode} : ${lot.lotTitle}`, 3)],
      }));

      for (const sec of lot.subSections) {
        rows.push(new TableRow({
          children: [this.tdSection(sec.title, 3)],
        }));
        for (const item of sec.items) {
          rows.push(new TableRow({
            children: [
              this.td(item.priceCode),
              this.td(item.designation),
              this.tdCenter(item.unit),
            ],
          }));
        }
      }

      if (lot.totalAmount != null) {
        rows.push(new TableRow({
          children: [this.tdTotal(`${lot.totalLabel}`, 2), this.tdTotalNum(`${this.formatNum(lot.totalAmount)} DH HT`)],
        }));
      }
    }

    return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })];
  }

  private buildEstimTable(lots: CpsEstimLot[]): (Table | Paragraph)[] {
    if (!lots.length) return [new Paragraph({ children: [new TextRun({ text: 'Aucune estimation disponible.', italics: true })] })];

    const rows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          this.th('N° de Prix', 1500),
          this.th('Désignation des Prestations'),
          this.th('U', 700),
          this.th('Qté', 1200),
          this.th('PU HT', 1500),
          this.th('PT HT', 1700),
        ],
      }),
    ];

    for (const lot of lots) {
      rows.push(new TableRow({
        children: [this.tdLot(`${lot.lotCode} : ${lot.lotTitle}`, 6)],
      }));

      for (const sec of lot.subSections) {
        rows.push(new TableRow({
          children: [this.tdSection(sec.title, 6)],
        }));
        for (const item of sec.items) {
          rows.push(new TableRow({
            children: [
              this.td(item.priceCode),
              this.td(item.designation),
              this.tdCenter(item.unit),
              this.tdNum(item.quantity != null ? this.formatNum(item.quantity) : ''),
              this.tdNum(item.unitPrice != null ? this.formatNum(item.unitPrice) : ''),
              this.tdNum(item.totalPrice != null ? this.formatNum(item.totalPrice) : ''),
            ],
          }));
        }
      }

      if (lot.totalAmount != null) {
        rows.push(new TableRow({
          children: [this.tdTotal(lot.totalLabel, 5), this.tdTotalNum(`${this.formatNum(lot.totalAmount)} DH HT`)],
        }));
      }
    }

    return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })];
  }

  // ─── Annexes ──────────────────────────────────────────────────────
  private buildAnnex(annex: { title: string; content: string }, index: number): (Paragraph | Table)[] {
    return [
      this.h1(`Annexe ${index} — ${annex.title}`),
      new Paragraph({ children: [new TextRun({ text: annex.content.replace(/<[^>]+>/g, ''), size: 22 })] }),
    ];
  }

  // ─── Clause ───────────────────────────────────────────────────────
  private buildClause(c: CpsClause): (Paragraph | Table)[] {
    const headerChildren: TextRun[] = [
      new TextRun({ text: c.number, font: 'Calibri Light', size: 20, bold: true, color: C.mainBlue, smallCaps: true }),
      new TextRun({ text: '  ' }),
      new TextRun({ text: c.title, bold: true, size: 22 }),
    ];

    const paras: Paragraph[] = [
      new Paragraph({ children: headerChildren }),
    ];

    if (c.isModifiedLocally) {
      paras.push(new Paragraph({
        children: [new TextRun({ text: '⚠ Modifié localement', italics: true, size: 16, color: 'B07000' })],
      }));
    }

    paras.push(new Paragraph({
      children: [new TextRun({ text: c.content.replace(/<[^>]+>/g, ''), size: 22 })],
    }));

    for (const sc of c.subClauses ?? []) {
      paras.push(
        new Paragraph({ indent: { left: convertMillimetersToTwip(10) }, children: [new TextRun({ text: sc.title, bold: true, size: 21 })] }),
        new Paragraph({ indent: { left: convertMillimetersToTwip(10) }, children: [new TextRun({ text: sc.content.replace(/<[^>]+>/g, ''), size: 21 })] }),
      );
    }

    paras.push(new Paragraph({ children: [] }));
    return paras;
  }

  // ─── Helpers styles ───────────────────────────────────────────────
  private h1(text: string): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      children: [new TextRun({ text, font: 'Calibri', bold: true, size: 36, color: C.marine })],
    });
  }

  private h2(text: string): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.lightBlue } },
      children: [new TextRun({ text, font: 'Calibri Light', bold: true, size: 32, color: C.blue, smallCaps: true })],
    });
  }

  private pageBreak(): Paragraph {
    return new Paragraph({ pageBreakBefore: true, children: [] });
  }

  private th(text: string, width?: number): TableCell {
    return new TableCell({
      width: width ? { size: width, type: WidthType.DXA } : undefined,
      shading: { type: ShadingType.SOLID, color: C.mainBlue },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, color: C.white, size: 18, font: 'Calibri Light', smallCaps: true })],
      })],
    });
  }

  private td(text: string): TableCell {
    return new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, size: 18 })] })],
    });
  }

  private tdCenter(text: string): TableCell {
    return new TableCell({
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, size: 18 })] })],
    });
  }

  private tdNum(text: string): TableCell {
    return new TableCell({
      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text, size: 18 })] })],
    });
  }

  private tdLot(text: string, colspan: number): TableCell {
    return new TableCell({
      columnSpan: colspan,
      shading: { type: ShadingType.SOLID, color: C.marine },
      children: [new Paragraph({
        children: [new TextRun({ text, bold: true, color: C.white, size: 19, font: 'Calibri', smallCaps: true })],
      })],
    });
  }

  private tdSection(text: string, colspan: number): TableCell {
    return new TableCell({
      columnSpan: colspan,
      shading: { type: ShadingType.SOLID, color: C.sectionBg },
      children: [new Paragraph({
        children: [new TextRun({ text, bold: true, italics: true, size: 18, color: C.marine })],
      })],
    });
  }

  private tdTotal(text: string, colspan: number): TableCell {
    return new TableCell({
      columnSpan: colspan,
      shading: { type: ShadingType.SOLID, color: C.totalBg },
      children: [new Paragraph({
        children: [new TextRun({ text, bold: true, color: C.white, size: 18 })],
      })],
    });
  }

  private tdTotalNum(text: string): TableCell {
    return new TableCell({
      shading: { type: ShadingType.SOLID, color: C.totalBg },
      children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text, bold: true, color: C.white, size: 18 })],
      })],
    });
  }

  private formatNum(n: number): string {
    return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  }
}
