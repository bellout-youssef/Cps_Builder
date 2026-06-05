import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import type { Clause } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { ClausesService } from './clauses.service';
import { CreateClauseDto } from './dto/create-clause.dto';
import { SuggestClausesDto } from './dto/suggest-clauses.dto';
import { UpdateClauseDto } from './dto/update-clause.dto';

@Controller('referential/clauses')
export class ClausesController {
  constructor(private readonly clausesService: ClausesService) {}

  @Get()
  @RequirePermissions('referential:read')
  findAll(@CurrentUser() user: JwtPayload): Promise<Clause[]> {
    return this.clausesService.findAll(user.organizationId!);
  }

  @Get(':id')
  @RequirePermissions('referential:read')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<Clause> {
    return this.clausesService.findOne(id, user.organizationId!);
  }

  @Post()
  @RequirePermissions('clauses:edit_draft')
  create(
    @Body() dto: CreateClauseDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Clause> {
    return this.clausesService.create(dto, user.organizationId!, user.sub);
  }

  @Put(':id')
  @RequirePermissions('clauses:edit_draft')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClauseDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Clause> {
    return this.clausesService.update(id, dto, user.organizationId!, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('referential:manage')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.clausesService.remove(id, user.organizationId!, user.sub);
  }

  /**
   * POST /referential/clauses/suggest
   * Corps : { articleIds: string[] }
   * Retourne les clauses liées aux articles fournis (pour pré-remplissage Chapitre III).
   */
  @Post('suggest')
  @RequirePermissions('referential:read')
  suggest(
    @Body() dto: SuggestClausesDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Clause[]> {
    return this.clausesService.suggestByArticleIds(user.organizationId!, dto.articleIds);
  }
}
