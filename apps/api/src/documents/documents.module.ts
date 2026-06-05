import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HtmlGeneratorService } from './html-generator.service';
import { DocxGeneratorService } from './docx-generator.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { ExcelGeneratorService } from './excel-generator.service';
import { PublicationService } from './publication.service';

@Module({
  imports: [PrismaModule],
  providers: [
    HtmlGeneratorService,
    DocxGeneratorService,
    PdfGeneratorService,
    ExcelGeneratorService,
    PublicationService,
  ],
  exports: [PublicationService],
})
export class DocumentsModule {}
