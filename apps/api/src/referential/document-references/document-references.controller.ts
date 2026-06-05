import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import type { DocumentReference } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { DocumentReferencesService } from './document-references.service';
import { CreateDocumentReferenceDto } from './dto/create-document-reference.dto';

@Controller('referential/document-references')
export class DocumentReferencesController {
  constructor(private readonly documentReferencesService: DocumentReferencesService) {}

  @Get()
  @RequirePermissions('referential:read')
  findAll(@CurrentUser() user: JwtPayload): Promise<DocumentReference[]> {
    return this.documentReferencesService.findAll(user.organizationId!);
  }

  @Get(':id')
  @RequirePermissions('referential:read')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<DocumentReference> {
    return this.documentReferencesService.findOne(id, user.organizationId!);
  }

  @Post()
  @RequirePermissions('referential:manage')
  create(@Body() dto: CreateDocumentReferenceDto, @CurrentUser() user: JwtPayload): Promise<DocumentReference> {
    return this.documentReferencesService.create(dto, user.organizationId!, user.sub);
  }

  @Put(':id')
  @RequirePermissions('referential:manage')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateDocumentReferenceDto>,
    @CurrentUser() user: JwtPayload,
  ): Promise<DocumentReference> {
    return this.documentReferencesService.update(id, dto, user.organizationId!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('referential:manage')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.documentReferencesService.remove(id, user.organizationId!);
  }
}
