import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import type { Unite } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { UnitesService } from './unites.service';
import { CreateUniteDto } from './dto/create-unite.dto';

@Controller('referential/unites')
export class UnitesController {
  constructor(private readonly unitesService: UnitesService) {}

  @Get()
  @RequirePermissions('referential:read')
  findAll(@CurrentUser() user: JwtPayload): Promise<Unite[]> {
    return this.unitesService.findAll(user.organizationId!);
  }

  @Get(':id')
  @RequirePermissions('referential:read')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<Unite> {
    return this.unitesService.findOne(id, user.organizationId!);
  }

  @Post()
  @RequirePermissions('referential:manage')
  create(@Body() dto: CreateUniteDto, @CurrentUser() user: JwtPayload): Promise<Unite> {
    return this.unitesService.create(dto, user.organizationId!, user.sub);
  }

  @Put(':id')
  @RequirePermissions('referential:manage')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateUniteDto>,
    @CurrentUser() user: JwtPayload,
  ): Promise<Unite> {
    return this.unitesService.update(id, dto, user.organizationId!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('referential:manage')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.unitesService.remove(id, user.organizationId!);
  }
}
