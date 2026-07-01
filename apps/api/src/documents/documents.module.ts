import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HtmlGeneratorService } from './html-generator.service';
import { DocxGeneratorService } from './docx-generator.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { ExcelGeneratorService } from './excel-generator.service';
import { PublicationService } from './publication.service';
import { CpsContentBuilderService } from './cps-content-builder.service';
import { DocumentsController } from './documents.controller';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentsController],
  providers: [
    CpsContentBuilderService,
    HtmlGeneratorService,
    DocxGeneratorService,
    PdfGeneratorService,
    ExcelGeneratorService,
    PublicationService,
  ],
  exports: [PublicationService],
})
export class DocumentsModule {}
