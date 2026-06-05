import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  Prisma,
  RoleName,
  SharePermission,
  WorkflowAction,
  WorkflowStep,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PublicationService } from '../documents/publication.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ShareProjectDto, UpdateShareDto } from './dto/share-project.dto';
import { SelectArticlesDto } from './dto/select-articles.dto';
import { AddClauseToProjectDto, UpdateProjectClauseDto } from './dto/update-project-clause.dto';
import { WorkflowActionDto } from './dto/workflow-action.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly publicationService: PublicationService,
  ) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async create(dto: CreateProjectDto, userId: string, orgId: string) {
    const project = await this.prisma.project.create({
      data: {
        organizationId: orgId,
        createdById: userId,
        name: dto.name,
        description: dto.description,
        isPrivate: true,
        types: {
          create: dto.types.map((type) => ({ type })),
        },
      },
      include: { types: true, shares: true },
    });

    await this.auditService.log({ action: 'project.created', entity: 'project', entityId: project.id, userId, organizationId: orgId, metadata: { name: dto.name, types: dto.types } });
    return project;
  }

  async findAll(userId: string, orgId: string) {
    const roles = await this.getUserRoles(userId, orgId);
    const isAdmin = roles.includes(RoleName.ORG_ADMIN) || roles.includes(RoleName.REF_MANAGER);

    if (isAdmin) {
      return this.prisma.project.findMany({
        where: { organizationId: orgId, archivedAt: null },
        include: { types: true, createdBy: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    const visibilityCriteria: object[] = [
      { createdById: userId },
      { shares: { some: { userId } } },
    ];

    if (roles.includes(RoleName.VERIFIER)) {
      visibilityCriteria.push({ workflowStep: WorkflowStep.VERIFICATION });
    }
    if (roles.includes(RoleName.VALIDATOR)) {
      visibilityCriteria.push({ workflowStep: WorkflowStep.BUSINESS_VALIDATION });
    }

    return this.prisma.project.findMany({
      where: { organizationId: orgId, archivedAt: null, OR: visibilityCriteria },
      include: { types: true, createdBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, orgId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, organizationId: orgId },
      include: {
        types: true,
        shares: { include: { user: { select: { id: true, name: true, email: true } } } },
        createdBy: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true } },
        validatedBy: { select: { id: true, name: true } },
        workflowHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!project) throw new NotFoundException('Projet non trouvé');
    await this.assertCanRead(project as any, userId, orgId);
    return project;
  }

  async update(id: string, dto: UpdateProjectDto, userId: string, orgId: string) {
    const project = await this.getProjectOrFail(id, orgId);
    this.assertNotPublished(project.workflowStep);
    await this.assertCanWrite(project as any, userId, orgId);

    return this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.chapter2Answers !== undefined && { chapter2Answers: dto.chapter2Answers as Prisma.InputJsonValue }),
      },
      include: { types: true },
    });
  }

  // ─── Articles & Auto-suggestion de clauses ────────────────────────────────

  async selectArticles(id: string, dto: SelectArticlesDto, userId: string, orgId: string) {
    const project = await this.getProjectOrFail(id, orgId);
    this.assertNotPublished(project.workflowStep);
    await this.assertCanWrite(project as any, userId, orgId);

    // Vérifier que les articles existent dans l'org
    const articles = await this.prisma.article.findMany({
      where: { id: { in: dto.articleIds }, organizationId: orgId },
    });
    if (articles.length !== dto.articleIds.length) {
      throw new BadRequestException('Un ou plusieurs articles introuvables dans cette organisation');
    }

    await this.prisma.projectArticle.createMany({
      data: dto.articleIds.map((articleId) => ({ projectId: id, articleId })),
      skipDuplicates: true,
    });

    if (dto.autoSuggest !== false) {
      const clauses = await this.prisma.clause.findMany({
        where: { organizationId: orgId, articleId: { in: dto.articleIds } },
      });

      await this.prisma.projectClause.createMany({
        data: clauses.map((c) => ({
          projectId: id,
          clauseId: c.id,
          title: c.title,
          number: c.number,
          referentialVersion: c.version,
          isAutomatic: true,
        })),
        skipDuplicates: true,
      });
    }

    return this.prisma.projectArticle.findMany({
      where: { projectId: id },
      include: { article: { select: { id: true, title: true, code: true } } },
    });
  }

  async removeArticle(id: string, articleId: string, userId: string, orgId: string) {
    const project = await this.getProjectOrFail(id, orgId);
    this.assertNotPublished(project.workflowStep);
    await this.assertCanWrite(project as any, userId, orgId);

    await this.prisma.projectArticle.deleteMany({ where: { projectId: id, articleId } });
  }

  // ─── Gestion des clauses locales ──────────────────────────────────────────

  async getProjectClauses(id: string, userId: string, orgId: string) {
    const project = await this.getProjectOrFail(id, orgId);
    await this.assertCanRead(project as any, userId, orgId);

    return this.prisma.projectClause.findMany({
      where: { projectId: id },
      include: {
        clause: {
          select: { id: true, number: true, title: true, content: true, version: true, articleId: true },
        },
      },
      orderBy: { clause: { number: 'asc' } },
    });
  }

  async addClause(id: string, dto: AddClauseToProjectDto, userId: string, orgId: string) {
    const project = await this.getProjectOrFail(id, orgId);
    this.assertNotPublished(project.workflowStep);
    await this.assertCanWrite(project as any, userId, orgId);

    const clause = await this.prisma.clause.findFirst({
      where: { id: dto.clauseId, organizationId: orgId },
    });
    if (!clause) throw new NotFoundException('Clause non trouvée dans cette organisation');

    return this.prisma.projectClause.create({
      data: {
        projectId: id,
        clauseId: dto.clauseId,
        title: clause.title,
        number: clause.number,
        referentialVersion: clause.version,
        isAutomatic: false,
      },
    });
  }

  async removeClause(id: string, clauseId: string, userId: string, orgId: string) {
    const project = await this.getProjectOrFail(id, orgId);
    this.assertNotPublished(project.workflowStep);
    await this.assertCanWrite(project as any, userId, orgId);

    await this.prisma.projectClause.deleteMany({ where: { projectId: id, clauseId } });
  }

  async updateLocalClause(
    id: string,
    clauseId: string,
    dto: UpdateProjectClauseDto,
    userId: string,
    orgId: string,
  ) {
    const project = await this.getProjectOrFail(id, orgId);
    this.assertNotPublished(project.workflowStep);
    await this.assertCanWrite(project as any, userId, orgId);

    const pc = await this.prisma.projectClause.findUnique({
      where: { projectId_clauseId: { projectId: id, clauseId } },
    });
    if (!pc) throw new NotFoundException('Clause non trouvée dans ce projet');

    return this.prisma.projectClause.update({
      where: { id: pc.id },
      data: {
        ...(dto.content !== undefined && { localContent: dto.content }),
        ...(dto.title !== undefined && { title: dto.title }),
        isModifiedLocally: true,
      },
    });
  }

  async resetLocalClause(id: string, clauseId: string, userId: string, orgId: string) {
    const project = await this.getProjectOrFail(id, orgId);
    this.assertNotPublished(project.workflowStep);
    await this.assertCanWrite(project as any, userId, orgId);

    const pc = await this.prisma.projectClause.findUnique({
      where: { projectId_clauseId: { projectId: id, clauseId } },
      include: { clause: true },
    });
    if (!pc) throw new NotFoundException('Clause non trouvée dans ce projet');

    return this.prisma.projectClause.update({
      where: { id: pc.id },
      data: {
        localContent: null,
        title: pc.clause.title,
        isModifiedLocally: false,
      },
    });
  }

  async acceptClauseVersionUpdate(id: string, clauseId: string, userId: string, orgId: string) {
    const project = await this.getProjectOrFail(id, orgId);
    this.assertNotPublished(project.workflowStep);
    await this.assertCanWrite(project as any, userId, orgId);

    const pc = await this.prisma.projectClause.findUnique({
      where: { projectId_clauseId: { projectId: id, clauseId } },
      include: { clause: true },
    });
    if (!pc) throw new NotFoundException('Clause non trouvée dans ce projet');
    if (!pc.hasNewerVersion) throw new BadRequestException('Aucune mise à jour disponible pour cette clause');

    // Remplace le contenu par la version actuelle du référentiel
    return this.prisma.projectClause.update({
      where: { id: pc.id },
      data: {
        title: pc.clause.title,
        localContent: null,
        isModifiedLocally: false,
        referentialVersion: pc.clause.version,
        hasNewerVersion: false,
      },
    });
  }

  async dismissClauseVersionUpdate(id: string, clauseId: string, userId: string, orgId: string) {
    const pc = await this.prisma.projectClause.findUnique({
      where: { projectId_clauseId: { projectId: id, clauseId } },
    });
    if (!pc) throw new NotFoundException('Clause non trouvée dans ce projet');

    // Marque la notification comme vue sans mettre à jour le contenu
    return this.prisma.projectClause.update({
      where: { id: pc.id },
      data: { hasNewerVersion: false },
    });
  }

  // ─── Partage ──────────────────────────────────────────────────────────────

  async shareProject(id: string, dto: ShareProjectDto, userId: string, orgId: string) {
    const project = await this.getProjectOrFail(id, orgId);
    if (project.createdById !== userId) {
      const roles = await this.getUserRoles(userId, orgId);
      if (!roles.includes(RoleName.ORG_ADMIN)) {
        throw new ForbiddenException('Seul le créateur ou un administrateur peut partager ce projet');
      }
    }

    // L'utilisateur partagé doit appartenir à la même organisation
    const targetUser = await this.prisma.user.findFirst({
      where: { id: dto.userId, organizationId: orgId },
    });
    if (!targetUser) throw new NotFoundException('Utilisateur non trouvé dans cette organisation');

    if (dto.userId === project.createdById) {
      throw new BadRequestException('Impossible de partager un projet avec son créateur');
    }

    return this.prisma.projectShare.upsert({
      where: { projectId_userId: { projectId: id, userId: dto.userId } },
      create: { projectId: id, userId: dto.userId, permission: dto.permission ?? SharePermission.READ },
      update: { permission: dto.permission ?? SharePermission.READ },
    });
  }

  async updateShare(id: string, targetUserId: string, dto: UpdateShareDto, userId: string, orgId: string) {
    const project = await this.getProjectOrFail(id, orgId);
    if (project.createdById !== userId) {
      const roles = await this.getUserRoles(userId, orgId);
      if (!roles.includes(RoleName.ORG_ADMIN)) {
        throw new ForbiddenException('Seul le créateur ou un administrateur peut modifier le partage');
      }
    }

    return this.prisma.projectShare.update({
      where: { projectId_userId: { projectId: id, userId: targetUserId } },
      data: { permission: dto.permission },
    });
  }

  async removeShare(id: string, targetUserId: string, userId: string, orgId: string) {
    const project = await this.getProjectOrFail(id, orgId);
    if (project.createdById !== userId) {
      const roles = await this.getUserRoles(userId, orgId);
      if (!roles.includes(RoleName.ORG_ADMIN)) {
        throw new ForbiddenException('Seul le créateur ou un administrateur peut retirer un partage');
      }
    }

    await this.prisma.projectShare.deleteMany({
      where: { projectId: id, userId: targetUserId },
    });
  }

  async getShares(id: string, userId: string, orgId: string) {
    const project = await this.getProjectOrFail(id, orgId);
    await this.assertCanRead(project as any, userId, orgId);

    return this.prisma.projectShare.findMany({
      where: { projectId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  // ─── Workflow ─────────────────────────────────────────────────────────────

  async submitForWorkflow(id: string, userId: string, orgId: string) {
    const project = await this.getProjectOrFail(id, orgId);

    if (project.workflowStep !== WorkflowStep.CREATION) {
      throw new BadRequestException(`Le projet est déjà en étape ${project.workflowStep}`);
    }
    if (project.createdById !== userId) {
      throw new ForbiddenException('Seul le créateur peut soumettre le projet au workflow');
    }

    await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id },
        data: { workflowStep: WorkflowStep.VERIFICATION },
      }),
      this.prisma.workflowTransition.create({
        data: {
          projectId: id,
          fromStep: WorkflowStep.CREATION,
          toStep: WorkflowStep.VERIFICATION,
          action: WorkflowAction.APPROVE,
          performedById: userId,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'workflow.submitted',
          entity: 'project',
          entityId: id,
        },
      }),
    ]);

    return this.prisma.project.findUnique({ where: { id }, include: { types: true } });
  }

  async approveCurrentStep(id: string, dto: WorkflowActionDto, userId: string, orgId: string) {
    const project = await this.getProjectOrFail(id, orgId);
    this.assertNotPublishedOrArchived(project.workflowStep);

    await this.checkApprovePermission(project as any, userId, orgId);

    const fromStep = project.workflowStep;
    const toStep = this.getNextWorkflowStep(fromStep);

    const projectUpdate: Record<string, unknown> = { workflowStep: toStep };
    if (fromStep === WorkflowStep.VERIFICATION) {
      projectUpdate.verifiedById = userId;
    } else if (fromStep === WorkflowStep.BUSINESS_VALIDATION) {
      projectUpdate.validatedById = userId;
    }

    await this.prisma.$transaction([
      this.prisma.project.update({ where: { id }, data: projectUpdate as any }),
      this.prisma.workflowTransition.create({
        data: {
          projectId: id,
          fromStep,
          toStep,
          action: WorkflowAction.APPROVE,
          performedById: userId,
          reason: dto.reason,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: `workflow.${fromStep.toLowerCase()}.approved`,
          entity: 'project',
          entityId: id,
          metadata: dto.reason ? ({ reason: dto.reason } as Prisma.InputJsonValue) : undefined,
        },
      }),
    ]);

    // Notifier le créateur
    await this.notificationsService.create({
      organizationId: orgId,
      userId: project.createdById,
      projectId: id,
      type: NotificationType.WORKFLOW_APPROVED,
      title: `CPS approuvé — étape ${fromStep}`,
      message: dto.reason,
    });

    return this.prisma.project.findUnique({ where: { id }, include: { types: true } });
  }

  async rejectCurrentStep(id: string, dto: WorkflowActionDto, userId: string, orgId: string) {
    return this.sendBackToCreation(id, dto, WorkflowAction.REJECT, userId, orgId);
  }

  async requestModification(id: string, dto: WorkflowActionDto, userId: string, orgId: string) {
    return this.sendBackToCreation(id, dto, WorkflowAction.REQUEST_MODIFICATION, userId, orgId);
  }

  async publish(id: string, userId: string, orgId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, organizationId: orgId },
      include: { organization: true },
    });
    if (!project) throw new NotFoundException('Projet non trouvé');

    if (project.workflowStep !== WorkflowStep.REF_VALIDATION) {
      throw new BadRequestException(
        `Le projet doit être en étape REF_VALIDATION pour être publié (étape actuelle : ${project.workflowStep})`,
      );
    }

    const roles = await this.getUserRoles(userId, orgId);
    if (!roles.includes(RoleName.REF_MANAGER)) {
      throw new ForbiddenException('Rôle REF_MANAGER requis pour publier un CPS');
    }

    // Incrément atomique du compteur de l'organisation
    const org = await this.prisma.organization.update({
      where: { id: orgId },
      data: { cpsCounter: { increment: 1 } },
    });

    const code = this.generateCpsCode(org.slug, org.cpsCounter, new Date());

    await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id },
        data: {
          workflowStep: WorkflowStep.PUBLISHED,
          code,
          publishedAt: new Date(),
        },
      }),
      this.prisma.workflowTransition.create({
        data: {
          projectId: id,
          fromStep: WorkflowStep.REF_VALIDATION,
          toStep: WorkflowStep.PUBLISHED,
          action: WorkflowAction.APPROVE,
          performedById: userId,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'project.published',
          entity: 'project',
          entityId: id,
          metadata: { code } as Prisma.InputJsonValue,
        },
      }),
    ]);

    const published = await this.prisma.project.findUnique({ where: { id }, include: { types: true } });

    // Génération asynchrone des documents (HTML, DOCX, PDF, BDP, ESTIM)
    this.publicationService.generateAndStore(id, orgId).catch((err: unknown) => {
      this.logger.error(`Échec génération documents pour ${code}: ${err instanceof Error ? err.message : String(err)}`);
    });

    return published;
  }

  // ─── Versionnement ────────────────────────────────────────────────────────

  async duplicateAsNewVersion(id: string, userId: string, orgId: string) {
    const original = await this.prisma.project.findFirst({
      where: { id, organizationId: orgId, workflowStep: WorkflowStep.PUBLISHED },
      include: { types: true, articles: true, clauses: true },
    });
    if (!original) throw new NotFoundException('Projet publié non trouvé');

    const roles = await this.getUserRoles(userId, orgId);
    if (!roles.includes(RoleName.REF_MANAGER) && !roles.includes(RoleName.ORG_ADMIN)) {
      throw new ForbiddenException('Rôle REF_MANAGER ou ORG_ADMIN requis pour créer une nouvelle version');
    }

    const newProject = await this.prisma.$transaction(async (tx) => {
      // Archiver l'ancienne version
      await tx.project.update({
        where: { id },
        data: { workflowStep: WorkflowStep.ARCHIVED, archivedAt: new Date() },
      });

      // Créer le nouveau projet
      const created = await tx.project.create({
        data: {
          organizationId: orgId,
          createdById: userId,
          name: original.name,
          description: original.description,
          isPrivate: true,
          chapter2Answers: original.chapter2Answers as any,
          types: { create: original.types.map((t) => ({ type: t.type })) },
        },
      });

      // Dupliquer les sélections d'articles
      if (original.articles.length > 0) {
        await tx.projectArticle.createMany({
          data: original.articles.map((a) => ({ projectId: created.id, articleId: a.articleId })),
        });
      }

      // Dupliquer les clauses (copies locales conservées)
      if (original.clauses.length > 0) {
        await tx.projectClause.createMany({
          data: original.clauses.map((c) => ({
            projectId: created.id,
            clauseId: c.clauseId,
            title: c.title,
            number: c.number,
            localContent: c.localContent,
            isModifiedLocally: c.isModifiedLocally,
            referentialVersion: c.referentialVersion,
            isAutomatic: c.isAutomatic,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'project.new_version',
          entity: 'project',
          entityId: created.id,
          metadata: { originalId: id, originalCode: original.code } as Prisma.InputJsonValue,
        },
      });

      return created;
    });

    return this.prisma.project.findUnique({ where: { id: newProject.id }, include: { types: true } });
  }

  // ─── Génération du code CPS ───────────────────────────────────────────────

  generateCpsCode(orgSlug: string, counter: number, date: Date): string {
    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const seq = String(counter).padStart(4, '0');
    return `${yy}${mm}${dd}_CPS_${orgSlug.toUpperCase()}_${seq}`;
  }

  // ─── Helpers privés ───────────────────────────────────────────────────────

  private async sendBackToCreation(
    id: string,
    dto: WorkflowActionDto,
    action: Exclude<WorkflowAction, 'APPROVE'>,
    userId: string,
    orgId: string,
  ) {
    const project = await this.getProjectOrFail(id, orgId);
    this.assertNotPublishedOrArchived(project.workflowStep);

    await this.checkActionPermission(project as any, userId, orgId);

    const fromStep = project.workflowStep;

    await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id },
        data: {
          workflowStep: WorkflowStep.CREATION,
          verifiedById: null,
          validatedById: null,
        },
      }),
      this.prisma.workflowTransition.create({
        data: {
          projectId: id,
          fromStep,
          toStep: WorkflowStep.CREATION,
          action,
          performedById: userId,
          reason: dto.reason,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: action === WorkflowAction.REJECT ? 'workflow.rejected' : 'workflow.modification_requested',
          entity: 'project',
          entityId: id,
          metadata: { reason: dto.reason, fromStep } as Prisma.InputJsonValue,
        },
      }),
    ]);

    const notifType =
      action === WorkflowAction.REJECT
        ? NotificationType.WORKFLOW_REJECTED
        : NotificationType.WORKFLOW_MODIFICATION_REQUESTED;

    await this.notificationsService.create({
      organizationId: orgId,
      userId: project.createdById,
      projectId: id,
      type: notifType,
      title: action === WorkflowAction.REJECT ? 'CPS rejeté' : 'Modification demandée',
      message: dto.reason,
      metadata: { fromStep },
    });

    return this.prisma.project.findUnique({ where: { id }, include: { types: true } });
  }

  private async checkApprovePermission(
    project: {
      workflowStep: WorkflowStep;
      createdById: string;
      verifiedById: string | null;
      validatedById: string | null;
    },
    userId: string,
    orgId: string,
  ) {
    const roles = await this.getUserRoles(userId, orgId);

    switch (project.workflowStep) {
      case WorkflowStep.VERIFICATION:
        if (!roles.includes(RoleName.VERIFIER)) {
          throw new ForbiddenException('Rôle VERIFIER requis pour cette étape');
        }
        if (project.createdById === userId) {
          throw new ForbiddenException(
            'Séparation des responsabilités : le créateur ne peut pas vérifier son propre CPS',
          );
        }
        break;

      case WorkflowStep.BUSINESS_VALIDATION:
        if (!roles.includes(RoleName.VALIDATOR)) {
          throw new ForbiddenException('Rôle VALIDATOR requis pour cette étape');
        }
        if (project.createdById === userId) {
          throw new ForbiddenException(
            'Séparation des responsabilités : le créateur ne peut pas valider son propre CPS',
          );
        }
        if (project.verifiedById === userId) {
          throw new ForbiddenException(
            'Séparation des responsabilités : le vérificateur ne peut pas valider le même CPS',
          );
        }
        break;

      case WorkflowStep.REF_VALIDATION:
        if (!roles.includes(RoleName.REF_MANAGER)) {
          throw new ForbiddenException('Rôle REF_MANAGER requis pour valider cette étape');
        }
        break;

      default:
        throw new BadRequestException(`Aucune approbation possible à l'étape ${project.workflowStep}`);
    }
  }

  private async checkActionPermission(
    project: { workflowStep: WorkflowStep },
    userId: string,
    orgId: string,
  ) {
    const roles = await this.getUserRoles(userId, orgId);

    const stepRoleMap: Record<string, RoleName> = {
      [WorkflowStep.VERIFICATION]: RoleName.VERIFIER,
      [WorkflowStep.BUSINESS_VALIDATION]: RoleName.VALIDATOR,
      [WorkflowStep.REF_VALIDATION]: RoleName.REF_MANAGER,
    };

    const requiredRole = stepRoleMap[project.workflowStep];
    if (!requiredRole) {
      throw new BadRequestException(`Aucune action possible à l'étape ${project.workflowStep}`);
    }
    if (!roles.includes(requiredRole)) {
      throw new ForbiddenException(`Rôle ${requiredRole} requis pour agir à cette étape`);
    }
  }

  private getNextWorkflowStep(current: WorkflowStep): WorkflowStep {
    const transitions: Partial<Record<WorkflowStep, WorkflowStep>> = {
      [WorkflowStep.CREATION]: WorkflowStep.VERIFICATION,
      [WorkflowStep.VERIFICATION]: WorkflowStep.BUSINESS_VALIDATION,
      [WorkflowStep.BUSINESS_VALIDATION]: WorkflowStep.REF_VALIDATION,
      [WorkflowStep.REF_VALIDATION]: WorkflowStep.PUBLISHED,
    };
    const next = transitions[current];
    if (!next) throw new BadRequestException(`Pas d'étape suivante pour ${current}`);
    return next;
  }

  private async getUserRoles(userId: string, orgId: string): Promise<RoleName[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId, organizationId: orgId },
      include: { role: true },
    });
    return userRoles.map((ur) => ur.role.name);
  }

  private async assertCanRead(
    project: { createdById: string; shares: Array<{ userId: string }> },
    userId: string,
    orgId: string,
  ) {
    if (project.createdById === userId) return;
    if (project.shares.some((s) => s.userId === userId)) return;
    const roles = await this.getUserRoles(userId, orgId);
    if (
      roles.includes(RoleName.ORG_ADMIN) ||
      roles.includes(RoleName.REF_MANAGER) ||
      roles.includes(RoleName.VERIFIER) ||
      roles.includes(RoleName.VALIDATOR)
    ) {
      return;
    }
    throw new ForbiddenException("Vous n'avez pas accès à ce projet");
  }

  private async assertCanWrite(
    project: { createdById: string; shares: Array<{ userId: string; permission: SharePermission }> },
    userId: string,
    orgId: string,
  ) {
    if (project.createdById === userId) return;
    const share = project.shares.find((s) => s.userId === userId);
    if (share?.permission === SharePermission.WRITE) return;
    const roles = await this.getUserRoles(userId, orgId);
    if (roles.includes(RoleName.ORG_ADMIN)) return;
    throw new ForbiddenException("Vous n'avez pas les droits de modification sur ce projet");
  }

  private assertNotPublished(step: WorkflowStep) {
    if (step === WorkflowStep.PUBLISHED || step === WorkflowStep.ARCHIVED) {
      throw new ForbiddenException('Un CPS publié est immuable — aucune modification possible');
    }
  }

  private assertNotPublishedOrArchived(step: WorkflowStep) {
    if (step === WorkflowStep.PUBLISHED) {
      throw new ForbiddenException('Un CPS publié est immuable');
    }
    if (step === WorkflowStep.ARCHIVED) {
      throw new ForbiddenException('Un CPS archivé ne peut plus être modifié');
    }
  }

  private async getProjectOrFail(id: string, orgId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, organizationId: orgId },
      include: {
        shares: { select: { userId: true, permission: true } },
      },
    });
    if (!project) throw new NotFoundException('Projet non trouvé');
    return project;
  }

}

