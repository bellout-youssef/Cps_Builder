import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { JwtPayload } from '../common/types/jwt-payload.type';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ShareProjectDto, UpdateShareDto } from './dto/share-project.dto';
import { SelectArticlesDto } from './dto/select-articles.dto';
import { AddClauseToProjectDto, UpdateProjectClauseDto } from './dto/update-project-clause.dto';
import { WorkflowActionDto } from './dto/workflow-action.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  @Post()
  @RequirePermissions('projects:create')
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: JwtPayload) {
    return this.projectsService.create(dto, user.sub, user.organizationId!);
  }

  @Get()
  @RequirePermissions('projects:read')
  findAll(@CurrentUser() user: JwtPayload) {
    return this.projectsService.findAll(user.sub, user.organizationId!);
  }

  @Get(':id')
  @RequirePermissions('projects:read')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.projectsService.findOne(id, user.sub, user.organizationId!);
  }

  @Patch(':id')
  @RequirePermissions('projects:create')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.update(id, dto, user.sub, user.organizationId!);
  }

  // ─── Articles ─────────────────────────────────────────────────────────────

  @Post(':id/articles')
  @RequirePermissions('projects:create')
  selectArticles(
    @Param('id') id: string,
    @Body() dto: SelectArticlesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.selectArticles(id, dto, user.sub, user.organizationId!);
  }

  @Delete(':id/articles/:articleId')
  @RequirePermissions('projects:create')
  removeArticle(
    @Param('id') id: string,
    @Param('articleId') articleId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.removeArticle(id, articleId, user.sub, user.organizationId!);
  }

  // ─── Clauses locales ──────────────────────────────────────────────────────

  @Get(':id/clauses')
  @RequirePermissions('projects:read')
  getProjectClauses(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.projectsService.getProjectClauses(id, user.sub, user.organizationId!);
  }

  @Post(':id/clauses')
  @RequirePermissions('projects:create')
  addClause(
    @Param('id') id: string,
    @Body() dto: AddClauseToProjectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.addClause(id, dto, user.sub, user.organizationId!);
  }

  @Delete(':id/clauses/:clauseId')
  @RequirePermissions('projects:create')
  removeClause(
    @Param('id') id: string,
    @Param('clauseId') clauseId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.removeClause(id, clauseId, user.sub, user.organizationId!);
  }

  @Patch(':id/clauses/:clauseId')
  @RequirePermissions('projects:create')
  updateLocalClause(
    @Param('id') id: string,
    @Param('clauseId') clauseId: string,
    @Body() dto: UpdateProjectClauseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.updateLocalClause(id, clauseId, dto, user.sub, user.organizationId!);
  }

  @Post(':id/clauses/:clauseId/reset')
  @RequirePermissions('projects:create')
  resetLocalClause(
    @Param('id') id: string,
    @Param('clauseId') clauseId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.resetLocalClause(id, clauseId, user.sub, user.organizationId!);
  }

  @Post(':id/clauses/:clauseId/accept-update')
  @RequirePermissions('projects:create')
  acceptClauseVersionUpdate(
    @Param('id') id: string,
    @Param('clauseId') clauseId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.acceptClauseVersionUpdate(id, clauseId, user.sub, user.organizationId!);
  }

  @Post(':id/clauses/:clauseId/dismiss-update')
  @RequirePermissions('projects:create')
  dismissClauseVersionUpdate(
    @Param('id') id: string,
    @Param('clauseId') clauseId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.dismissClauseVersionUpdate(id, clauseId, user.sub, user.organizationId!);
  }

  // ─── Partage ──────────────────────────────────────────────────────────────

  @Get(':id/shares')
  @RequirePermissions('projects:read')
  getShares(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.projectsService.getShares(id, user.sub, user.organizationId!);
  }

  @Post(':id/shares')
  @RequirePermissions('projects:create')
  shareProject(
    @Param('id') id: string,
    @Body() dto: ShareProjectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.shareProject(id, dto, user.sub, user.organizationId!);
  }

  @Patch(':id/shares/:userId')
  @RequirePermissions('projects:create')
  updateShare(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateShareDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.updateShare(id, targetUserId, dto, user.sub, user.organizationId!);
  }

  @Delete(':id/shares/:userId')
  @RequirePermissions('projects:create')
  removeShare(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.removeShare(id, targetUserId, user.sub, user.organizationId!);
  }

  // ─── Workflow ─────────────────────────────────────────────────────────────

  @Post(':id/workflow/submit')
  @RequirePermissions('projects:create')
  submitForWorkflow(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.projectsService.submitForWorkflow(id, user.sub, user.organizationId!);
  }

  @Post(':id/workflow/approve')
  @RequirePermissions('workflow:act')
  approveCurrentStep(
    @Param('id') id: string,
    @Body() dto: WorkflowActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.approveCurrentStep(id, dto, user.sub, user.organizationId!);
  }

  @Post(':id/workflow/reject')
  @RequirePermissions('workflow:act')
  rejectCurrentStep(
    @Param('id') id: string,
    @Body() dto: WorkflowActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.rejectCurrentStep(id, dto, user.sub, user.organizationId!);
  }

  @Post(':id/workflow/request-modification')
  @RequirePermissions('workflow:act')
  requestModification(
    @Param('id') id: string,
    @Body() dto: WorkflowActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.requestModification(id, dto, user.sub, user.organizationId!);
  }

  @Post(':id/workflow/publish')
  @RequirePermissions('cps:publish')
  publish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.projectsService.publish(id, user.sub, user.organizationId!);
  }

  // ─── Versionnement ────────────────────────────────────────────────────────

  @Post(':id/new-version')
  @RequirePermissions('cps:publish')
  duplicateAsNewVersion(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.projectsService.duplicateAsNewVersion(id, user.sub, user.organizationId!);
  }
}
