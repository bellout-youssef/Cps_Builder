import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SearchResultType } from './dto/search-query.dto';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  code: string | null;
  description: string | null;
  score: number;
}

interface RawRow {
  type: string;
  id: string;
  title: string;
  code: string | null;
  description: string | null;
  score: number;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    query: string,
    orgId: string,
    types?: SearchResultType[],
    limit = 20,
  ): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    const enabled: SearchResultType[] = types?.length
      ? types
      : ['project', 'article', 'clause', 'fiche', 'document', 'formula'];

    const searches: Promise<RawRow[]>[] = [];
    if (enabled.includes('project'))  searches.push(this.searchProjects(query, orgId));
    if (enabled.includes('article'))  searches.push(this.searchArticles(query, orgId));
    if (enabled.includes('clause'))   searches.push(this.searchClauses(query, orgId));
    if (enabled.includes('fiche'))    searches.push(this.searchFiches(query, orgId));
    if (enabled.includes('document')) searches.push(this.searchDocuments(query, orgId));
    if (enabled.includes('formula'))  searches.push(this.searchFormulas(query, orgId));

    const rows = (await Promise.all(searches)).flat();
    return rows
      .sort((a, b) => b.score - a.score)
      .slice(0, limit) as SearchResult[];
  }

  private searchProjects(query: string, orgId: string): Promise<RawRow[]> {
    return this.prisma.$queryRaw<RawRow[]>`
      SELECT
        'project'::text AS type,
        id,
        name        AS title,
        code,
        description,
        CAST(ts_rank(
          to_tsvector('french', name || ' ' || COALESCE(description, '')),
          plainto_tsquery('french', ${query})
        ) AS FLOAT8) AS score
      FROM projects
      WHERE organization_id = ${orgId}
        AND archived_at IS NULL
        AND to_tsvector('french', name || ' ' || COALESCE(description, ''))
            @@ plainto_tsquery('french', ${query})
      ORDER BY score DESC
      LIMIT 10
    `;
  }

  private searchArticles(query: string, orgId: string): Promise<RawRow[]> {
    return this.prisma.$queryRaw<RawRow[]>`
      SELECT
        'article'::text AS type,
        id,
        title,
        code,
        description,
        CAST(ts_rank(
          to_tsvector('french', title || ' ' || COALESCE(description, '')),
          plainto_tsquery('french', ${query})
        ) AS FLOAT8) AS score
      FROM articles
      WHERE organization_id = ${orgId}
        AND to_tsvector('french', title || ' ' || COALESCE(description, ''))
            @@ plainto_tsquery('french', ${query})
      ORDER BY score DESC
      LIMIT 10
    `;
  }

  private searchClauses(query: string, orgId: string): Promise<RawRow[]> {
    return this.prisma.$queryRaw<RawRow[]>`
      SELECT
        'clause'::text AS type,
        id,
        title,
        number      AS code,
        COALESCE(content, '') AS description,
        CAST(ts_rank(
          to_tsvector('french', title || ' ' || COALESCE(content, '')),
          plainto_tsquery('french', ${query})
        ) AS FLOAT8) AS score
      FROM clauses
      WHERE organization_id = ${orgId}
        AND to_tsvector('french', title || ' ' || COALESCE(content, ''))
            @@ plainto_tsquery('french', ${query})
      ORDER BY score DESC
      LIMIT 10
    `;
  }

  private searchFiches(query: string, orgId: string): Promise<RawRow[]> {
    return this.prisma.$queryRaw<RawRow[]>`
      SELECT
        'fiche'::text AS type,
        id,
        title,
        NULL::text  AS code,
        description,
        CAST(ts_rank(
          to_tsvector('french', title || ' ' || COALESCE(description, '')),
          plainto_tsquery('french', ${query})
        ) AS FLOAT8) AS score
      FROM fiches_techniques
      WHERE organization_id = ${orgId}
        AND to_tsvector('french', title || ' ' || COALESCE(description, ''))
            @@ plainto_tsquery('french', ${query})
      ORDER BY score DESC
      LIMIT 10
    `;
  }

  private searchDocuments(query: string, orgId: string): Promise<RawRow[]> {
    return this.prisma.$queryRaw<RawRow[]>`
      SELECT
        'document'::text AS type,
        id,
        title,
        reference   AS code,
        description,
        CAST(ts_rank(
          to_tsvector('french',
            title || ' ' || COALESCE(description, '') || ' ' || COALESCE(reference, '')
          ),
          plainto_tsquery('french', ${query})
        ) AS FLOAT8) AS score
      FROM document_references
      WHERE organization_id = ${orgId}
        AND to_tsvector('french',
              title || ' ' || COALESCE(description, '') || ' ' || COALESCE(reference, ''))
            @@ plainto_tsquery('french', ${query})
      ORDER BY score DESC
      LIMIT 10
    `;
  }

  private searchFormulas(query: string, orgId: string): Promise<RawRow[]> {
    return this.prisma.$queryRaw<RawRow[]>`
      SELECT
        'formula'::text AS type,
        id,
        title,
        NULL::text  AS code,
        COALESCE(description, formula) AS description,
        CAST(ts_rank(
          to_tsvector('french',
            title || ' ' || COALESCE(description, '') || ' ' || COALESCE(formula, '')
          ),
          plainto_tsquery('french', ${query})
        ) AS FLOAT8) AS score
      FROM revision_prix
      WHERE organization_id = ${orgId}
        AND to_tsvector('french',
              title || ' ' || COALESCE(description, '') || ' ' || COALESCE(formula, ''))
            @@ plainto_tsquery('french', ${query})
      ORDER BY score DESC
      LIMIT 10
    `;
  }
}
