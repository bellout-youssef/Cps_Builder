import { Test, TestingModule } from '@nestjs/testing';
import { SearchService, type SearchResult } from './search.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('empty / short query guard', () => {
    it('returns [] and never queries the DB for a blank string', async () => {
      const result = await service.search('   ', 'org-1');
      expect(result).toEqual([]);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('type filtering', () => {
    it('calls $queryRaw exactly once when a single type is requested', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      await service.search('terrassement', 'org-1', ['article']);
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('calls $queryRaw for each requested type', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      await service.search('chaussée', 'org-1', ['article', 'clause', 'fiche']);
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(3);
    });

    it('calls $queryRaw 6 times when no types filter is supplied', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      await service.search('fondation', 'org-1');
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(6);
    });
  });

  describe('organisation isolation', () => {
    it('passes the orgId as a parameterised value (never string-interpolated)', async () => {
      const orgId = 'sentinel-org-42';
      prisma.$queryRaw.mockResolvedValue([]);

      await service.search('béton', orgId, ['project']);

      // Tagged-template call: fn`... ${val1} ... ${val2}` → fn([parts], val1, val2)
      // The orgId must appear in the interpolated values, not baked into the SQL string.
      const callArgs: unknown[] = prisma.$queryRaw.mock.calls[0] as unknown[];
      const interpolated = callArgs.slice(1); // everything after the TemplateStringsArray
      expect(interpolated).toContain(orgId);
    });

    it('a different orgId produces a different parameterised call', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await service.search('béton', 'org-A', ['project']);
      await service.search('béton', 'org-B', ['project']);

      const orgAValues = (prisma.$queryRaw.mock.calls[0] as unknown[]).slice(1);
      const orgBValues = (prisma.$queryRaw.mock.calls[1] as unknown[]).slice(1);

      expect(orgAValues).toContain('org-A');
      expect(orgBValues).toContain('org-B');
      expect(orgAValues).not.toContain('org-B');
    });
  });

  describe('relevance sorting', () => {
    it('returns results sorted by score descending', async () => {
      const lowScore: SearchResult  = { type: 'article', id: 'a1', title: 'Article', code: 'ART-0001', description: null, score: 0.1 };
      const highScore: SearchResult = { type: 'clause',  id: 'c1', title: 'Clause',  code: 'CT-001',   description: null, score: 0.9 };

      prisma.$queryRaw
        .mockResolvedValueOnce([lowScore])
        .mockResolvedValueOnce([highScore]);

      const results = await service.search('test', 'org-1', ['article', 'clause']);

      expect(results[0].score).toBeGreaterThan(results[1].score);
      expect(results[0].type).toBe('clause');
    });

    it('respects the limit parameter', async () => {
      const rows: SearchResult[] = Array.from({ length: 8 }, (_, i) => ({
        type: 'article' as const,
        id: `a${i}`,
        title: `Article ${i}`,
        code: null,
        description: null,
        score: i * 0.1,
      }));
      prisma.$queryRaw.mockResolvedValue(rows);

      const results = await service.search('test', 'org-1', ['article'], 5);
      expect(results).toHaveLength(5);
    });
  });
});
