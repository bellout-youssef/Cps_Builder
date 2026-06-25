import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName, SharePermission, WorkflowStep } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockProject = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'proj-1',
  organizationId: 'org-1',
  name: 'Test CPS',
  description: null,
  code: null,
  workflowStep: WorkflowStep.CREATION,
  isPrivate: true,
  createdById: 'user-creator',
  currentHolderId: null,
  verifiedById: null,
  validatedById: null,
  chapter2Answers: null,
  publishedAt: null,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  shares: [],
  types: [],
  ...overrides,
});

const mockUserRole = (roleName: RoleName) => ({ role: { name: roleName } });

// ─── Mocks ────────────────────────────────────────────────────────────────────

const prismaMock = {
  project: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  projectShare: {
    upsert: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
  },
  projectArticle: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
  },
  projectClause: {
    createMany: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  workflowTransition: { create: jest.fn() },
  auditLog: { create: jest.fn() },
  userRole: { findMany: jest.fn() },
  organization: { update: jest.fn() },
  article: { findMany: jest.fn() },
  clause: { findMany: jest.fn(), findFirst: jest.fn() },
  user: { findFirst: jest.fn() },
  $transaction: jest.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
};

const notifMock = { create: jest.fn() };

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation((ops: unknown[]) =>
      Promise.all(ops as Promise<unknown>[]),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationsService, useValue: notifMock },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  // ─── Génération du code CPS ───────────────────────────────────────────────

  describe('generateCpsCode', () => {
    it('doit respecter le format YYMMDD_CPS_ORGSLUG_XXXX', () => {
      const code = service.generateCpsCode('tmpa', 1, new Date('2026-06-05'));
      expect(code).toBe('260605_CPS_TMPA_0001');
    });

    it('doit mettre le slug en majuscule', () => {
      const code = service.generateCpsCode('abc-org', 12, new Date('2026-01-15'));
      expect(code).toBe('260115_CPS_ABC-ORG_0012');
    });

    it('doit padder le compteur sur 4 chiffres', () => {
      expect(service.generateCpsCode('tmpa', 1, new Date('2026-06-05'))).toMatch(/_0001$/);
      expect(service.generateCpsCode('tmpa', 99, new Date('2026-06-05'))).toMatch(/_0099$/);
      expect(service.generateCpsCode('tmpa', 1000, new Date('2026-06-05'))).toMatch(/_1000$/);
    });

    it('doit inclure la date au format YYMMDD', () => {
      const code = service.generateCpsCode('x', 1, new Date('2030-12-31'));
      expect(code.startsWith('301231_')).toBe(true);
    });
  });

  // ─── Création de projet ───────────────────────────────────────────────────

  describe('create', () => {
    it('doit creer un projet prive avec les types demandes', async () => {
      const created = mockProject();
      prismaMock.organization.update.mockResolvedValue({ slug: 'tmpa', dceCounter: 1 });
      prismaMock.project.create.mockResolvedValue(created);
      prismaMock.auditLog.create.mockResolvedValue({});

      const result = await service.create(
        { name: 'Test CPS', types: ['A', 'B'] as any },
        'user-creator',
        'org-1',
      );

      expect(prismaMock.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isPrivate: true, createdById: 'user-creator' }),
        }),
      );
      expect(result).toEqual(created);
    });
  });

  // ─── Immutabilité après publication ──────────────────────────────────────

  describe('immutabilite', () => {
    it("interdit la mise a jour d'un CPS publie", async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({ workflowStep: WorkflowStep.PUBLISHED }),
      );

      await expect(
        service.update('proj-1', { name: 'nouveau nom' }, 'user-creator', 'org-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it("interdit la mise a jour d'un CPS archive", async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({ workflowStep: WorkflowStep.ARCHIVED }),
      );

      await expect(
        service.update('proj-1', { name: 'nouveau nom' }, 'user-creator', 'org-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it("interdit de modifier une clause locale sur un CPS publie", async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({ workflowStep: WorkflowStep.PUBLISHED }),
      );

      await expect(
        service.updateLocalClause('proj-1', 'clause-1', { content: 'nouveau' }, 'user-creator', 'org-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── sendForReview — envoi vers USER ─────────────────────────────────────

  describe('sendForReview — vers un USER', () => {
    it('passe de CREATION a PENDING_REVIEW et notifie le destinataire', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({ workflowStep: WorkflowStep.CREATION, createdById: 'user-creator' }),
      );
      prismaMock.user.findFirst.mockResolvedValue({ id: 'user-verif', organizationId: 'org-1', isActive: true });
      prismaMock.$transaction.mockResolvedValue([{}, {}, {}]);
      prismaMock.project.findUnique.mockResolvedValue(
        mockProject({ workflowStep: WorkflowStep.PENDING_REVIEW, currentHolderId: 'user-verif' }),
      );
      notifMock.create.mockResolvedValue({});

      const result = await service.sendForReview(
        'proj-1',
        { targetUserId: 'user-verif' },
        'user-creator',
        'org-1',
      );

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(notifMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-verif', type: 'WORKFLOW_SUBMITTED' }),
      );
      expect(result?.workflowStep).toBe(WorkflowStep.PENDING_REVIEW);
    });

    it('refus si on essaie de s envoyer le projet a soi-meme', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({ workflowStep: WorkflowStep.CREATION, createdById: 'user-creator' }),
      );

      await expect(
        service.sendForReview('proj-1', { targetUserId: 'user-creator' }, 'user-creator', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('refus si le projet est en ADMIN_REVIEW', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({ workflowStep: WorkflowStep.ADMIN_REVIEW }),
      );

      await expect(
        service.sendForReview('proj-1', { targetUserId: 'user-verif' }, 'user-creator', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('refus si non-porteur essaie d envoyer', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({
          workflowStep: WorkflowStep.PENDING_REVIEW,
          createdById: 'user-creator',
          currentHolderId: 'user-verif',
        }),
      );
      prismaMock.userRole.findMany.mockResolvedValue([mockUserRole(RoleName.USER)]);

      await expect(
        service.sendForReview('proj-1', { targetUserId: 'user-other' }, 'user-tiers', 'org-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── sendForReview — envoi vers ADMIN ────────────────────────────────────

  describe('sendForReview — vers l admin', () => {
    it('passe de PENDING_REVIEW a ADMIN_REVIEW et notifie les admins', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({
          workflowStep: WorkflowStep.PENDING_REVIEW,
          createdById: 'user-creator',
          currentHolderId: 'user-verif',
        }),
      );
      prismaMock.userRole.findMany.mockResolvedValue([{ userId: 'user-admin' }]);
      prismaMock.$transaction.mockResolvedValue([{}, {}, {}]);
      prismaMock.project.findUnique.mockResolvedValue(
        mockProject({ workflowStep: WorkflowStep.ADMIN_REVIEW }),
      );
      notifMock.create.mockResolvedValue({});

      const result = await service.sendForReview('proj-1', {}, 'user-verif', 'org-1');

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(notifMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-admin', type: 'WORKFLOW_SUBMITTED' }),
      );
      expect(result?.workflowStep).toBe(WorkflowStep.ADMIN_REVIEW);
    });
  });

  // ─── Séparation des responsabilités ──────────────────────────────────────

  describe('separation des responsabilites', () => {
    it('refus : le createur ne peut pas envoyer son propre CPS au createur', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({ workflowStep: WorkflowStep.CREATION, createdById: 'user-creator' }),
      );
      prismaMock.user.findFirst.mockResolvedValue({ id: 'user-creator', organizationId: 'org-1', isActive: true });

      await expect(
        service.sendForReview('proj-1', { targetUserId: 'user-creator' }, 'user-creator', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('refus : publish interdit si admin est aussi createur', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({
          workflowStep: WorkflowStep.ADMIN_REVIEW,
          createdById: 'user-admin',
          organization: { id: 'org-1', slug: 'tmpa', cpsCounter: 0 },
        }),
      );
      prismaMock.userRole.findMany.mockResolvedValue([mockUserRole(RoleName.ADMIN)]);

      await expect(
        service.publish('proj-1', 'user-admin', 'org-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── Rejet / retour en CREATION ───────────────────────────────────────────

  describe('rejectCurrentStep', () => {
    it('renvoie le projet en CREATION depuis PENDING_REVIEW et notifie le createur', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({
          workflowStep: WorkflowStep.PENDING_REVIEW,
          createdById: 'user-creator',
          currentHolderId: 'user-verif',
        }),
      );
      prismaMock.userRole.findMany.mockResolvedValue([mockUserRole(RoleName.USER)]);
      prismaMock.$transaction.mockResolvedValue([{}, {}, {}]);
      prismaMock.project.findUnique.mockResolvedValue(
        mockProject({ workflowStep: WorkflowStep.CREATION }),
      );
      notifMock.create.mockResolvedValue({});

      await service.rejectCurrentStep(
        'proj-1',
        { reason: 'Documents manquants' },
        'user-verif',
        'org-1',
      );

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(notifMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'WORKFLOW_REJECTED', message: 'Documents manquants' }),
      );
    });

    it('renvoie le projet en CREATION depuis ADMIN_REVIEW (admin seulement)', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({
          workflowStep: WorkflowStep.ADMIN_REVIEW,
          createdById: 'user-creator',
          currentHolderId: null,
        }),
      );
      prismaMock.userRole.findMany.mockResolvedValue([mockUserRole(RoleName.ADMIN)]);
      prismaMock.$transaction.mockResolvedValue([{}, {}, {}]);
      prismaMock.project.findUnique.mockResolvedValue(mockProject());
      notifMock.create.mockResolvedValue({});

      await service.rejectCurrentStep('proj-1', {}, 'user-admin', 'org-1');

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('refus si non-porteur tente de rejeter depuis PENDING_REVIEW', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({
          workflowStep: WorkflowStep.PENDING_REVIEW,
          createdById: 'user-creator',
          currentHolderId: 'user-verif',
        }),
      );
      prismaMock.userRole.findMany.mockResolvedValue([mockUserRole(RoleName.USER)]);

      await expect(
        service.rejectCurrentStep('proj-1', {}, 'user-tiers', 'org-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── Publication ──────────────────────────────────────────────────────────

  describe('publish', () => {
    it('genere le code CPS et verrouille le document depuis ADMIN_REVIEW', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({
          workflowStep: WorkflowStep.ADMIN_REVIEW,
          createdById: 'user-creator',
          organization: { id: 'org-1', slug: 'tmpa', cpsCounter: 0 },
        }),
      );
      prismaMock.userRole.findMany.mockResolvedValue([mockUserRole(RoleName.ADMIN)]);
      prismaMock.organization.update.mockResolvedValue({ slug: 'tmpa', cpsCounter: 1 });
      prismaMock.$transaction.mockResolvedValue([{}, {}, {}]);
      prismaMock.project.findUnique.mockResolvedValue(
        mockProject({ workflowStep: WorkflowStep.PUBLISHED, code: '260605_CPS_TMPA_0001' }),
      );
      notifMock.create.mockResolvedValue({});

      const result = await service.publish('proj-1', 'user-admin', 'org-1');

      expect(prismaMock.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { cpsCounter: { increment: 1 } } }),
      );
      expect(result?.workflowStep).toBe(WorkflowStep.PUBLISHED);
    });

    it('refus si le projet n est pas en ADMIN_REVIEW', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({ workflowStep: WorkflowStep.PENDING_REVIEW }),
      );
      prismaMock.userRole.findMany.mockResolvedValue([mockUserRole(RoleName.ADMIN)]);

      await expect(
        service.publish('proj-1', 'user-admin', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it("refus si l'utilisateur n'est pas ADMIN", async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({
          workflowStep: WorkflowStep.ADMIN_REVIEW,
          organization: { slug: 'tmpa' },
        }),
      );
      prismaMock.userRole.findMany.mockResolvedValue([mockUserRole(RoleName.USER)]);

      await expect(
        service.publish('proj-1', 'user-basic', 'org-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── Copies locales de clauses ────────────────────────────────────────────

  describe('updateLocalClause', () => {
    it('cree une copie locale et marque isModifiedLocally=true', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({ workflowStep: WorkflowStep.CREATION, createdById: 'user-creator' }),
      );
      prismaMock.projectClause.findUnique.mockResolvedValue({
        id: 'pc-1',
        projectId: 'proj-1',
        clauseId: 'clause-1',
        title: 'Titre original',
        number: 'CT-A-001',
        localContent: null,
        isModifiedLocally: false,
        referentialVersion: 1,
        hasNewerVersion: false,
      });
      prismaMock.projectClause.update.mockResolvedValue({
        id: 'pc-1',
        localContent: 'Nouveau contenu modifie',
        isModifiedLocally: true,
      });

      const result = await service.updateLocalClause(
        'proj-1',
        'clause-1',
        { content: 'Nouveau contenu modifie' },
        'user-creator',
        'org-1',
      );

      expect(prismaMock.projectClause.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isModifiedLocally: true }),
        }),
      );
      expect(result.isModifiedLocally).toBe(true);
    });
  });

  describe('resetLocalClause', () => {
    it('restaure le titre original et efface localContent', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({ workflowStep: WorkflowStep.CREATION, createdById: 'user-creator' }),
      );
      prismaMock.projectClause.findUnique.mockResolvedValue({
        id: 'pc-1',
        clause: { title: 'Titre referentiel', version: 2 },
        localContent: 'Contenu local',
        isModifiedLocally: true,
      });
      prismaMock.projectClause.update.mockResolvedValue({
        localContent: null,
        isModifiedLocally: false,
      });

      await service.resetLocalClause('proj-1', 'clause-1', 'user-creator', 'org-1');

      expect(prismaMock.projectClause.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ localContent: null, isModifiedLocally: false }),
        }),
      );
    });
  });

  describe('acceptClauseVersionUpdate', () => {
    it('met a jour vers la version referentiel et vide les modifications locales', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({ workflowStep: WorkflowStep.CREATION, createdById: 'user-creator' }),
      );
      prismaMock.projectClause.findUnique.mockResolvedValue({
        id: 'pc-1',
        clauseId: 'clause-1',
        hasNewerVersion: true,
        localContent: 'Contenu local perime',
        isModifiedLocally: true,
        clause: { title: 'Nouveau titre referentiel', version: 3 },
      });
      prismaMock.projectClause.update.mockResolvedValue({
        localContent: null,
        isModifiedLocally: false,
        hasNewerVersion: false,
        referentialVersion: 3,
      });

      const result = await service.acceptClauseVersionUpdate(
        'proj-1',
        'clause-1',
        'user-creator',
        'org-1',
      );

      expect(prismaMock.projectClause.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hasNewerVersion: false,
            localContent: null,
            isModifiedLocally: false,
            referentialVersion: 3,
          }),
        }),
      );
    });

    it('leve BadRequestException si aucune mise a jour disponible', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({ workflowStep: WorkflowStep.CREATION, createdById: 'user-creator' }),
      );
      prismaMock.projectClause.findUnique.mockResolvedValue({
        id: 'pc-1',
        hasNewerVersion: false,
        clause: { version: 1 },
      });

      await expect(
        service.acceptClauseVersionUpdate('proj-1', 'clause-1', 'user-creator', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Partage ──────────────────────────────────────────────────────────────

  describe('shareProject', () => {
    it('permet au createur de partager le projet', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({ createdById: 'user-creator' }),
      );
      prismaMock.user.findFirst.mockResolvedValue({ id: 'user-2', organizationId: 'org-1' });
      prismaMock.projectShare.upsert.mockResolvedValue({
        projectId: 'proj-1',
        userId: 'user-2',
        permission: SharePermission.READ,
      });

      const result = await service.shareProject(
        'proj-1',
        { userId: 'user-2', permission: SharePermission.READ },
        'user-creator',
        'org-1',
      );

      expect(prismaMock.projectShare.upsert).toHaveBeenCalled();
      expect(result.permission).toBe(SharePermission.READ);
    });

    it('interdit de partager avec le createur lui-meme', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({ createdById: 'user-creator' }),
      );
      prismaMock.user.findFirst.mockResolvedValue({ id: 'user-creator', organizationId: 'org-1' });

      await expect(
        service.shareProject('proj-1', { userId: 'user-creator' }, 'user-creator', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Sélection d'articles ─────────────────────────────────────────────────

  describe('selectArticles', () => {
    it('refuse la selection sur un CPS publie', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({ workflowStep: WorkflowStep.PUBLISHED }),
      );

      await expect(
        service.selectArticles('proj-1', { articleIds: ['a-1'] }, 'user-creator', 'org-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('auto-suggere les clauses liees aux articles selectionnes', async () => {
      prismaMock.project.findFirst.mockResolvedValue(
        mockProject({ workflowStep: WorkflowStep.CREATION, createdById: 'user-creator' }),
      );
      prismaMock.article.findMany.mockResolvedValue([{ id: 'a-1' }]);
      prismaMock.projectArticle.createMany.mockResolvedValue({ count: 1 });
      prismaMock.clause.findMany.mockResolvedValue([
        { id: 'c-1', title: 'Clause A', number: 'CT-A-001', version: 1 },
      ]);
      prismaMock.projectClause.createMany.mockResolvedValue({ count: 1 });
      prismaMock.projectArticle.findMany.mockResolvedValue([{ articleId: 'a-1' }]);

      await service.selectArticles(
        'proj-1',
        { articleIds: ['a-1'], autoSuggest: true },
        'user-creator',
        'org-1',
      );

      expect(prismaMock.projectClause.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ clauseId: 'c-1', isAutomatic: true }),
          ]),
        }),
      );
    });
  });
});
