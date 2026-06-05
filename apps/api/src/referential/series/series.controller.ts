import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import type { Serie } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { SeriesService } from './series.service';
import { CreateSerieDto } from './dto/create-serie.dto';

@Controller('referential/series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Get()
  @RequirePermissions('referential:read')
  findAll(@CurrentUser() user: JwtPayload): Promise<Serie[]> {
    return this.seriesService.findAll(user.organizationId!);
  }

  @Get(':id')
  @RequirePermissions('referential:read')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<Serie> {
    return this.seriesService.findOne(id, user.organizationId!);
  }

  @Post()
  @RequirePermissions('referential:manage')
  create(@Body() dto: CreateSerieDto, @CurrentUser() user: JwtPayload): Promise<Serie> {
    return this.seriesService.create(dto, user.organizationId!, user.sub);
  }

  @Put(':id')
  @RequirePermissions('referential:manage')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateSerieDto>,
    @CurrentUser() user: JwtPayload,
  ): Promise<Serie> {
    return this.seriesService.update(id, dto, user.organizationId!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('referential:manage')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.seriesService.remove(id, user.organizationId!);
  }
}
