import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import type { ModeleCPS } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { ModelesCpsService } from './modeles-cps.service';
import { CreateModeleCpsDto } from './dto/create-modele-cps.dto';

@Controller('referential/modeles-cps')
export class ModelesCpsController {
  constructor(private readonly modelesCpsService: ModelesCpsService) {}

  @Get()
  @RequirePermissions('referential:read')
  findAll(@CurrentUser() user: JwtPayload): Promise<ModeleCPS[]> {
    return this.modelesCpsService.findAll(user.organizationId!);
  }

  @Get(':id')
  @RequirePermissions('referential:read')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<ModeleCPS> {
    return this.modelesCpsService.findOne(id, user.organizationId!);
  }

  @Post()
  @RequirePermissions('referential:manage')
  create(@Body() dto: CreateModeleCpsDto, @CurrentUser() user: JwtPayload): Promise<ModeleCPS> {
    return this.modelesCpsService.create(dto, user.organizationId!, user.sub);
  }

  @Put(':id')
  @RequirePermissions('referential:manage')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateModeleCpsDto>,
    @CurrentUser() user: JwtPayload,
  ): Promise<ModeleCPS> {
    return this.modelesCpsService.update(id, dto, user.organizationId!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('referential:manage')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.modelesCpsService.remove(id, user.organizationId!);
  }
}
