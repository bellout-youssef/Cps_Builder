import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { WorkflowStep } from '@prisma/client';
import { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { JwtPayload } from '../common/types/jwt-payload.type';
import { PublicationService } from './publication.service';
import * as fs from 'fs';

const MIME: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  bdp: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  estim: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

@Controller('projects')
export class DocumentsController {
  constructor(private readonly publication: PublicationService) {}

  /**
   * Génération préliminaire (brouillon) — HTML + DOCX uniquement.
   * Accessible dès la création, sans verrou.
   */
  @Post(':id/generate-preview')
  @RequirePermissions('projects:read')
  async generatePreview(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const { workflowStep } = await this.publication.checkGenerateAccess(
      id,
      user.organizationId!,
      user.sub,
      user.roles,
    );
    if (workflowStep === WorkflowStep.PUBLISHED) {
      throw new ForbiddenException(
        'Un CPS publié est immutable — téléchargez les documents publiés via le endpoint documents.',
      );
    }
    await this.publication.generatePreview(id, user.organizationId!);
    return { message: 'Aperçu généré avec succès' };
  }

  /** Liste les documents générés pour un projet. */
  @Get(':id/documents')
  @RequirePermissions('projects:read')
  listDocuments(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.publication.listDocuments(id, user.organizationId!);
  }

  /** Téléchargement d'un document — type : html | docx | pdf | bdp | estim */
  @Get(':id/documents/:type/download')
  @RequirePermissions('projects:read')
  async download(
    @Param('id') id: string,
    @Param('type') type: string,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    await this.publication.checkGenerateAccess(id, user.organizationId!, user.sub, user.roles);
    const { fullPath, filename } = await this.publication.getDocumentPath(id, type, user.organizationId!);
    const mime = MIME[type.toLowerCase()] ?? 'application/octet-stream';
    res.set({
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    });
    return new StreamableFile(fs.createReadStream(fullPath));
  }
}
