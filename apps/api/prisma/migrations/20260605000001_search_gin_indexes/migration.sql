-- Full-text search: GIN indexes on tsvector expressions (French text config)
-- These speed up the @@ plainto_tsquery() queries in SearchService.$queryRaw calls.

CREATE INDEX IF NOT EXISTS idx_projects_fts
  ON projects USING gin(
    to_tsvector('french', name || ' ' || COALESCE(description, ''))
  );

CREATE INDEX IF NOT EXISTS idx_articles_fts
  ON articles USING gin(
    to_tsvector('french', title || ' ' || COALESCE(description, ''))
  );

CREATE INDEX IF NOT EXISTS idx_clauses_fts
  ON clauses USING gin(
    to_tsvector('french', title || ' ' || COALESCE(content, ''))
  );

CREATE INDEX IF NOT EXISTS idx_fiches_fts
  ON fiches_techniques USING gin(
    to_tsvector('french', title || ' ' || COALESCE(description, ''))
  );

CREATE INDEX IF NOT EXISTS idx_document_references_fts
  ON document_references USING gin(
    to_tsvector('french',
      title || ' ' || COALESCE(description, '') || ' ' || COALESCE(reference, '')
    )
  );

CREATE INDEX IF NOT EXISTS idx_revision_prix_fts
  ON revision_prix USING gin(
    to_tsvector('french',
      title || ' ' || COALESCE(description, '') || ' ' || COALESCE(formula, '')
    )
  );
