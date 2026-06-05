import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ArticleCycle, RoleName } from '@prisma/client';
import { ArticlesService } from './articles.service';

const ORG = 'org-1';
const USER = 'user-1';

function makePrisma(articleOverrides: Record<string, unknown> = {}) {
  const base = {
    id: 'art-1',
    organizationId: ORG,
    code: null,
    title: 'Test Article',
    description: null,
    unit: 'm²',
    cycle: ArticleCycle.DRAFT,
    serieId: null,
    createdById: USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...articleOverrides,
  };

  return {
    article: {
      findFirst: jest.fn().mockResolvedValue(base),
      findMany: jest.fn().mockResolvedValue([base]),
      create: jest.fn().mockResolvedValue(base),
      update: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...base, ...data }),
      ),
      delete: jest.fn().mockResolvedValue(base),
      count: jest.fn().mockResolvedValue(3),
    },
  };
}

describe('ArticlesService', () => {
  describe('publish()', () => {
    it('assigns a code and sets cycle to PUBLISHED when article is DRAFT', async () => {
      const prisma = makePrisma({ cycle: ArticleCycle.DRAFT, code: null });
      const svc = new ArticlesService(prisma as never);

      const result = await svc.publish('art-1', ORG);

      expect(result.cycle).toBe(ArticleCycle.PUBLISHED);
      expect(result.code).toMatch(/^ART-\d{4}$/);
    });

    it('assigns a code when article is PUBLISHING', async () => {
      const prisma = makePrisma({ cycle: ArticleCycle.PUBLISHING, code: null });
      const svc = new ArticlesService(prisma as never);

      const result = await svc.publish('art-1', ORG);
      expect(result.code).toMatch(/^ART-\d{4}$/);
    });

    it('throws BadRequestException when article is already PUBLISHED', async () => {
      const prisma = makePrisma({ cycle: ArticleCycle.PUBLISHED, code: 'ART-0001' });
      const svc = new ArticlesService(prisma as never);

      await expect(svc.publish('art-1', ORG)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when article is ARCHIVING', async () => {
      const prisma = makePrisma({ cycle: ArticleCycle.ARCHIVING });
      const svc = new ArticlesService(prisma as never);

      await expect(svc.publish('art-1', ORG)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException when article does not belong to org', async () => {
      const prisma = makePrisma();
      prisma.article.findFirst = jest.fn().mockResolvedValue(null);
      const svc = new ArticlesService(prisma as never);

      await expect(svc.publish('art-1', 'other-org')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('generates sequential codes using current count + 1', async () => {
      const prisma = makePrisma({ cycle: ArticleCycle.DRAFT });
      prisma.article.count = jest.fn().mockResolvedValue(9);
      const svc = new ArticlesService(prisma as never);

      const result = await svc.publish('art-1', ORG);
      expect(result.code).toBe('ART-0010');
    });
  });

  describe('archive()', () => {
    it('sets cycle to ARCHIVING when article is PUBLISHED', async () => {
      const prisma = makePrisma({ cycle: ArticleCycle.PUBLISHED, code: 'ART-0001' });
      const svc = new ArticlesService(prisma as never);

      const result = await svc.archive('art-1', ORG);
      expect(result.cycle).toBe(ArticleCycle.ARCHIVING);
    });

    it('throws BadRequestException when article is DRAFT', async () => {
      const prisma = makePrisma({ cycle: ArticleCycle.DRAFT });
      const svc = new ArticlesService(prisma as never);

      await expect(svc.archive('art-1', ORG)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update() — unit freezing', () => {
    it('allows title change on PUBLISHED article for REF_MANAGER', async () => {
      const prisma = makePrisma({ cycle: ArticleCycle.PUBLISHED, code: 'ART-0001' });
      const svc = new ArticlesService(prisma as never);

      await expect(
        svc.update('art-1', { title: 'New Title' }, ORG, [RoleName.REF_MANAGER]),
      ).resolves.toBeTruthy();
    });

    it('rejects unit change on PUBLISHED article', async () => {
      const prisma = makePrisma({ cycle: ArticleCycle.PUBLISHED, code: 'ART-0001', unit: 'm²' });
      const svc = new ArticlesService(prisma as never);

      await expect(
        svc.update('art-1', { unit: 'kg' }, ORG, [RoleName.REF_MANAGER]),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('allows unit change on DRAFT article', async () => {
      const prisma = makePrisma({ cycle: ArticleCycle.DRAFT, unit: 'm²' });
      const svc = new ArticlesService(prisma as never);

      await expect(
        svc.update('art-1', { unit: 'kg' }, ORG, [RoleName.CREATOR]),
      ).resolves.toBeTruthy();
    });

    it('rejects CREATOR editing a PUBLISHED article', async () => {
      const prisma = makePrisma({ cycle: ArticleCycle.PUBLISHED, code: 'ART-0001' });
      const svc = new ArticlesService(prisma as never);

      await expect(
        svc.update('art-1', { title: 'New Title' }, ORG, [RoleName.CREATOR]),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects any modification on ARCHIVING article', async () => {
      const prisma = makePrisma({ cycle: ArticleCycle.ARCHIVING });
      const svc = new ArticlesService(prisma as never);

      await expect(
        svc.update('art-1', { title: 'x' }, ORG, [RoleName.REF_MANAGER]),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('remove()', () => {
    it('deletes a DRAFT article', async () => {
      const prisma = makePrisma({ cycle: ArticleCycle.DRAFT });
      const svc = new ArticlesService(prisma as never);

      await expect(svc.remove('art-1', ORG)).resolves.toBeUndefined();
      expect(prisma.article.delete).toHaveBeenCalledWith({ where: { id: 'art-1' } });
    });

    it('throws ForbiddenException when trying to delete a PUBLISHED article', async () => {
      const prisma = makePrisma({ cycle: ArticleCycle.PUBLISHED });
      const svc = new ArticlesService(prisma as never);

      await expect(svc.remove('art-1', ORG)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
