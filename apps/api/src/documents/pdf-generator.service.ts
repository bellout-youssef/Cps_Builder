import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  async generate(html: string, code: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load', timeout: 30000 });

      const footerTemplate = this.buildFooterTemplate(code);

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate,
        margin: {
          top: '2.54cm',
          right: '2.54cm',
          bottom: '3.5cm',
          left: '2.54cm',
        },
      });

      this.logger.log(`PDF généré pour ${code} — ${pdfBuffer.length} octets`);
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private buildFooterTemplate(code: string): string {
    const safeCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return `
<div style="
  width:100%;
  padding-right:2.54cm;
  padding-left:2.54cm;
  font-family:Arial,Helvetica,sans-serif;
  font-size:7pt;
  color:#0070C0;
  text-align:right;
  border-top:0.5pt solid #0070C0;
  padding-top:3pt;
  line-height:1.4;
">
  <span style="font-weight:700;font-variant:small-caps;letter-spacing:1pt;">CAHIER DES CHARGES</span><br>
  <span style="color:#333333;font-variant:small-caps;">${safeCode}</span><br>
  <span>Page <span class="pageNumber"></span> | <span class="totalPages"></span></span>
</div>`;
  }
}
