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
import type { Article } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Controller('referential/articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @RequirePermissions('referential:read')
  findAll(@CurrentUser() user: JwtPayload): Promise<Article[]> {
    return this.articlesService.findAll(user.organizationId!);
  }

  @Get(':id')
  @RequirePermissions('referential:read')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<Article> {
    return this.articlesService.findOne(id, user.organizationId!);
  }

  @Post()
  @RequirePermissions('articles:edit_draft')
  create(
    @Body() dto: CreateArticleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Article> {
    return this.articlesService.create(dto, user.organizationId!, user.sub);
  }

  @Put(':id')
  @RequirePermissions('articles:edit_draft')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Article> {
    return this.articlesService.update(id, dto, user.organizationId!, user.roles);
  }

  @Post(':id/publish')
  @RequirePermissions('referential:publish')
  publish(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<Article> {
    return this.articlesService.publish(id, user.organizationId!);
  }

  @Post(':id/archive')
  @RequirePermissions('referential:manage')
  archive(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<Article> {
    return this.articlesService.archive(id, user.organizationId!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('referential:manage')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.articlesService.remove(id, user.organizationId!);
  }
}
