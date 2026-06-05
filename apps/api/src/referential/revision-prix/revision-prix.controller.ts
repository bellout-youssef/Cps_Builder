import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import type { RevisionPrix } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { RevisionPrixService } from './revision-prix.service';
import { CreateRevisionPrixDto } from './dto/create-revision-prix.dto';

@Controller('referential/revision-prix')
export class RevisionPrixController {
  constructor(private readonly revisionPrixService: RevisionPrixService) {}

  @Get()
  @RequirePermissions('referential:read')
  findAll(@CurrentUser() user: JwtPayload): Promise<RevisionPrix[]> {
    return this.revisionPrixService.findAll(user.organizationId!);
  }

  @Get(':id')
  @RequirePermissions('referential:read')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<RevisionPrix> {
    return this.revisionPrixService.findOne(id, user.organizationId!);
  }

  @Post()
  @RequirePermissions('referential:manage')
  create(@Body() dto: CreateRevisionPrixDto, @CurrentUser() user: JwtPayload): Promise<RevisionPrix> {
    return this.revisionPrixService.create(dto, user.organizationId!, user.sub);
  }

  @Put(':id')
  @RequirePermissions('referential:manage')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateRevisionPrixDto>,
    @CurrentUser() user: JwtPayload,
  ): Promise<RevisionPrix> {
    return this.revisionPrixService.update(id, dto, user.organizationId!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('referential:manage')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.revisionPrixService.remove(id, user.organizationId!);
  }
}
