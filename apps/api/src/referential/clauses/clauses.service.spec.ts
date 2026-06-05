import { NotFoundException } from '@nestjs/common';
import { ClausesService } from './clauses.service';

const ORG = 'org-1';
const USER = 'user-1';

function makeClause(id: string, articleId: string | null = null) {
  return {
    id,
    organizationId: ORG,
    articleId,
    number: '1.1',
    title: `Clause ${id}`,
    content: null,
    createdById: USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('ClausesService', () => {
  describe('suggestByArticleIds()', () => {
    it('returns clauses linked to the given article IDs', async () => {
      const linked = [makeClause('c1', 'a1'), makeClause('c2', 'a2')];
      const unlinked = makeClause('c3', 'a3');

      const prisma = {
        clause: {
          findMany: jest.fn().mockResolvedValue(linked),
        },
      };
      const svc = new ClausesService(prisma as never);

      const result = await svc.suggestByArticleIds(ORG, ['a1', 'a2']);

      expect(prisma.clause.findMany).toHaveBeenCalledWith({
        where: { organizationId: ORG, articleId: { in: ['a1', 'a2'] } },
        orderBy: [{ articleId: 'asc' }, { number: 'asc' }],
        include: { article: true },
      });
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.id)).not.toContain(unlinked.id);
    });

    it('filters by organizationId — never leaks cross-org clauses', async () => {
      const prisma = {
        clause: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };
      const svc = new ClausesService(prisma as never);

      await svc.suggestByArticleIds('org-other', ['a1']);

      const callArgs = (prisma.clause.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.organizationId).toBe('org-other');
    });

    it('returns empty array when no clauses are linked', async () => {
      const prisma = {
        clause: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };
      const svc = new ClausesService(prisma as never);

      const result = await svc.suggestByArticleIds(ORG, ['a99']);
      expect(result).toEqual([]);
    });
  });

  describe('findOne()', () => {
    it('throws NotFoundException when clause is not in the org', async () => {
      const prisma = {
        clause: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };
      const svc = new ClausesService(prisma as never);

      await expect(svc.findOne('c1', 'wrong-org')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove()', () => {
    it('deletes an existing clause', async () => {
      const clause = makeClause('c1', 'a1');
      const prisma = {
        clause: {
          findFirst: jest.fn().mockResolvedValue(clause),
          delete: jest.fn().mockResolvedValue(clause),
        },
      };
      const svc = new ClausesService(prisma as never);

      await expect(svc.remove('c1', ORG)).resolves.toBeUndefined();
      expect(prisma.clause.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });
  });
});
