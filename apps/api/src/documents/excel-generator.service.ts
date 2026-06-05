import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { CpsDocumentData, CpsBdpLot, CpsEstimLot, CpsRecapRow } from './types/cps-document.types';

// ─── Couleurs TMPA ────────────────────────────────────────────────
const C = {
  marine: 'FF0F4761',
  blue: 'FF4472C4',
  mainBlue: 'FF0070C0',
  sectionBg: 'FFDEEAF1',
  subSectionBg: 'FFEBF3FB',
  totalBg: 'FF4472C4',
  grandTotalBg: 'FF0F4761',
  headerText: 'FFFFFFFF',
  lightGray: 'FFF2F2F2',
  red: 'FFFF0000',
} as const;

@Injectable()
export class ExcelGeneratorService {
  private readonly logger = new Logger(ExcelGeneratorService.name);

  async generateBdp(data: CpsDocumentData): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = data.organization.name;
    wb.created = data.publishedAt;

    const ws = wb.addWorksheet('RECAP', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
      views: [{ showGridLines: true }],
    });

    this.setBdpColumns(ws);
    this.addBdpTitle(ws, data);
    this.addBdpColumnHeaders(ws);
    this.addBdpLots(ws, data.bdpLots);

    const buf = await wb.xlsx.writeBuffer();
    this.logger.log(`BDP Excel généré pour ${data.code} — ${buf.byteLength} octets`);
    return Buffer.from(buf);
  }

  async generateEstim(data: CpsDocumentData): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = data.organization.name;
    wb.created = data.publishedAt;

    const ws = wb.addWorksheet('RECAP', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
    });

    this.setEstimColumns(ws);
    this.addEstimTitle(ws, data);
    this.addEstimRecap(ws, data.estimRecap);
    this.addEstimColumnHeaders(ws);
    this.addEstimLots(ws, data.estimLots);

    const buf = await wb.xlsx.writeBuffer();
    this.logger.log(`ESTIM Excel généré pour ${data.code} — ${buf.byteLength} octets`);
    return Buffer.from(buf);
  }

  // ─── BDP ─────────────────────────────────────────────────────────

  private setBdpColumns(ws: ExcelJS.Worksheet): void {
    ws.columns = [
      { key: 'prix', width: 14 },
      { key: 'designation', width: 60 },
      { key: 'unite', width: 8 },
    ];
  }

  private addBdpTitle(ws: ExcelJS.Worksheet, data: CpsDocumentData): void {
    const titleRow = ws.addRow([data.projectName]);
    titleRow.getCell(1).font = { bold: true, size: 12, name: 'Calibri' };
    ws.mergeCells(titleRow.number, 1, titleRow.number, 3);

    const aoRow = ws.addRow([`AO N°: ${data.organization.slug.toUpperCase()}_AO_${data.code.split('_')[0]}`]);
    aoRow.getCell(1).font = { bold: true, size: 11, name: 'Calibri' };
    ws.mergeCells(aoRow.number, 1, aoRow.number, 3);

    ws.addRow([]);
  }

  private addBdpColumnHeaders(ws: ExcelJS.Worksheet): void {
    const hRow = ws.addRow(['N° DE PRIX', 'DÉSIGNATION DES PRESTATIONS', 'U']);
    hRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.mainBlue } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = this.thinBorder();
    });
    hRow.height = 22;
  }

  private addBdpLots(ws: ExcelJS.Worksheet, lots: CpsBdpLot[]): void {
    for (const lot of lots) {
      const lotRow = ws.addRow([`${lot.lotCode} : ${lot.lotTitle}`]);
      ws.mergeCells(lotRow.number, 1, lotRow.number, 3);
      this.styleRow(lotRow, C.marine, true, 11);
      lotRow.height = 18;

      for (const sec of lot.subSections) {
        const secRow = ws.addRow([sec.title]);
        ws.mergeCells(secRow.number, 1, secRow.number, 3);
        this.styleRow(secRow, C.sectionBg, true, 10, C.marine);

        for (const item of sec.items) {
          const row = ws.addRow([item.priceCode, item.designation, item.unit]);
          row.getCell(1).font = { name: 'Calibri', size: 10 };
          row.getCell(2).font = { name: 'Calibri', size: 10 };
          row.getCell(3).font = { name: 'Calibri', size: 10 };
          row.getCell(3).alignment = { horizontal: 'center' };
          row.eachCell((c) => { c.border = this.thinBorder(); });
        }
      }

      if (lot.totalAmount != null) {
        const totalRow = ws.addRow([lot.totalLabel, '', `${this.formatNum(lot.totalAmount)} DH HT`]);
        ws.mergeCells(totalRow.number, 1, totalRow.number, 2);
        this.styleRow(totalRow, C.totalBg, true, 10);
        totalRow.getCell(3).alignment = { horizontal: 'right' };
      }
    }
  }

  // ─── ESTIM ───────────────────────────────────────────────────────

  private setEstimColumns(ws: ExcelJS.Worksheet): void {
    ws.columns = [
      { key: 'prix', width: 14 },
      { key: 'designation', width: 52 },
      { key: 'unite', width: 7 },
      { key: 'qte', width: 12 },
      { key: 'pu', width: 14 },
      { key: 'pt', width: 16 },
    ];
  }

  private addEstimTitle(ws: ExcelJS.Worksheet, data: CpsDocumentData): void {
    const titleRow = ws.addRow([data.projectName]);
    ws.mergeCells(titleRow.number, 1, titleRow.number, 6);
    titleRow.getCell(1).font = { bold: true, size: 12, name: 'Calibri' };

    const aoRow = ws.addRow([`AO N°: ${data.organization.slug.toUpperCase()}_AO_${data.code.split('_')[0]}`]);
    ws.mergeCells(aoRow.number, 1, aoRow.number, 6);
    aoRow.getCell(1).font = { bold: true, size: 11, name: 'Calibri' };

    ws.addRow([]);
  }

  private addEstimRecap(ws: ExcelJS.Worksheet, recap: CpsRecapRow[]): void {
    if (!recap.length) return;

    const recapTitleRow = ws.addRow(['RÉCAPITULATION']);
    ws.mergeCells(recapTitleRow.number, 1, recapTitleRow.number, 6);
    recapTitleRow.getCell(1).font = { bold: true, size: 12, color: { argb: C.marine }, name: 'Calibri' };

    const hRow = ws.addRow(['SOUS LOTS', 'DÉSIGNATION', 'Surface (m²)', 'Ratio', 'TOTAL GÉNÉRAL DH HT', '']);
    ws.mergeCells(hRow.number, 5, hRow.number, 6);
    hRow.eachCell((cell, col) => {
      if (col > 6) return;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.mainBlue } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = this.thinBorder();
    });
    hRow.height = 22;

    for (const r of recap) {
      const row = ws.addRow([
        r.lotCode,
        r.lotTitle,
        r.surface ?? '',
        r.ratio ?? '',
        r.totalPrice ?? '',
        '',
      ]);
      ws.mergeCells(row.number, 5, row.number, 6);
      row.getCell(3).numFmt = '#,##0.00';
      row.getCell(4).numFmt = '#,##0.00';
      row.getCell(5).numFmt = '#,##0.00';
      row.getCell(5).alignment = { horizontal: 'right' };
      row.eachCell((c, col) => {
        if (col > 6) return;
        c.border = this.thinBorder();
        c.font = { name: 'Calibri', size: 10 };
      });
    }

    ws.addRow([]);
  }

  private addEstimColumnHeaders(ws: ExcelJS.Worksheet): void {
    const hRow = ws.addRow(['N° DE PRIX', 'DÉSIGNATION DES PRESTATIONS', 'U', 'Qté\nTOTALE', ' PU HT ', ' PT HT ']);
    hRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.mainBlue } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = this.thinBorder();
    });
    hRow.height = 28;
  }

  private addEstimLots(ws: ExcelJS.Worksheet, lots: CpsEstimLot[]): void {
    for (const lot of lots) {
      const lotRow = ws.addRow([`${lot.lotCode} : ${lot.lotTitle}`]);
      ws.mergeCells(lotRow.number, 1, lotRow.number, 6);
      this.styleRow(lotRow, C.marine, true, 11);
      lotRow.height = 18;

      for (const sec of lot.subSections) {
        const secRow = ws.addRow([sec.title]);
        ws.mergeCells(secRow.number, 1, secRow.number, 6);
        this.styleRow(secRow, C.sectionBg, true, 10, C.marine);

        for (const item of sec.items) {
          const row = ws.addRow([
            item.priceCode,
            item.designation,
            item.unit,
            item.quantity ?? '',
            item.unitPrice ?? '',
            item.totalPrice ?? '',
          ]);
          row.getCell(1).font = { name: 'Calibri', size: 10 };
          row.getCell(2).font = { name: 'Calibri', size: 10 };
          row.getCell(2).alignment = { wrapText: true };
          row.getCell(3).alignment = { horizontal: 'center' };
          row.getCell(4).numFmt = '#,##0.00';
          row.getCell(5).numFmt = '#,##0.00';
          row.getCell(6).numFmt = '#,##0.00';
          row.getCell(4).alignment = { horizontal: 'right' };
          row.getCell(5).alignment = { horizontal: 'right' };
          row.getCell(6).alignment = { horizontal: 'right' };
          row.eachCell((c, col) => {
            if (col <= 6) c.border = this.thinBorder();
          });
        }
      }

      if (lot.totalAmount != null) {
        const totalRow = ws.addRow([lot.totalLabel, '', '', '', '', this.formatNum(lot.totalAmount)]);
        ws.mergeCells(totalRow.number, 1, totalRow.number, 5);
        this.styleRow(totalRow, C.totalBg, true, 10);
        totalRow.getCell(6).font = { bold: true, color: { argb: C.headerText }, name: 'Calibri', size: 10 };
        totalRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.totalBg } };
        totalRow.getCell(6).alignment = { horizontal: 'right' };
        totalRow.getCell(6).numFmt = '#,##0.00';
        totalRow.getCell(6).border = this.thinBorder();
      }
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────

  private styleRow(
    row: ExcelJS.Row,
    bgArgb: string,
    bold = false,
    size = 10,
    textArgb = 'FFFFFFFF',
  ): void {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      cell.font = { bold, size, name: 'Calibri', color: { argb: textArgb } };
      cell.border = this.thinBorder();
    });
  }

  private thinBorder(): Partial<ExcelJS.Borders> {
    const side = { style: 'thin' as const };
    return { top: side, left: side, bottom: side, right: side };
  }

  private formatNum(n: number): string {
    return n.toFixed(2);
  }
}
