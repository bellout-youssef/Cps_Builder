import { apiRequest } from '../api-client';
import type { ArticleCycle } from '@cps/shared';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SerieItem {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleItem {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  cycle: ArticleCycle;
  serieId: string | null;
  unit: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClauseItem {
  id: string;
  code: string;
  title: string;
  content: string;
  domain: string | null;
  articleIds: string[];
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FicheItem {
  id: string;
  code: string;
  title: string;
  url: string;
  description: string | null;
  articleIds: string[];
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnitItem {
  id: string;
  label: string;
  description: string | null;
  organizationId: string;
}

export interface FormulaItem {
  id: string;
  code: string;
  name: string;
  formula: string;
  description: string | null;
  organizationId: string;
}

export interface RefDocItem {
  id: string;
  code: string;
  title: string;
  url: string;
  description: string | null;
  organizationId: string;
}

export interface CpsModelItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  projectTypes: string[];
  organizationId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function unwrap<T>(res: T[] | { data: T[] }): T[] {
  return Array.isArray(res) ? res : res.data;
}

// ── Séries ────────────────────────────────────────────────────────────────────

export async function getSeries(): Promise<SerieItem[]> {
  return unwrap(await apiRequest<SerieItem[] | { data: SerieItem[] }>('/referential/series'));
}

export async function createSerie(
  data: Pick<SerieItem, 'code' | 'name' | 'description'>,
): Promise<SerieItem> {
  return apiRequest<SerieItem>('/referential/series', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSerie(
  id: string,
  data: Pick<SerieItem, 'code' | 'name' | 'description'>,
): Promise<SerieItem> {
  return apiRequest<SerieItem>(`/referential/series/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteSerie(id: string): Promise<void> {
  await apiRequest<void>(`/referential/series/${id}`, { method: 'DELETE' });
}

// ── Articles ──────────────────────────────────────────────────────────────────

export async function getArticles(): Promise<ArticleItem[]> {
  return unwrap(await apiRequest<ArticleItem[] | { data: ArticleItem[] }>('/referential/articles'));
}

export async function createArticle(
  data: Pick<ArticleItem, 'title' | 'description' | 'unit' | 'serieId'>,
): Promise<ArticleItem> {
  return apiRequest<ArticleItem>('/referential/articles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateArticle(
  id: string,
  data: Pick<ArticleItem, 'title' | 'description' | 'unit' | 'serieId'>,
): Promise<ArticleItem> {
  return apiRequest<ArticleItem>(`/referential/articles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteArticle(id: string): Promise<void> {
  await apiRequest<void>(`/referential/articles/${id}`, { method: 'DELETE' });
}

export async function submitArticleForPublication(id: string): Promise<ArticleItem> {
  return apiRequest<ArticleItem>(`/referential/articles/${id}/submit`, { method: 'POST' });
}

export async function publishArticle(id: string): Promise<ArticleItem> {
  return apiRequest<ArticleItem>(`/referential/articles/${id}/publish`, { method: 'POST' });
}

export async function rejectArticlePublication(id: string): Promise<ArticleItem> {
  return apiRequest<ArticleItem>(`/referential/articles/${id}/reject`, { method: 'POST' });
}

export async function archiveArticle(id: string): Promise<ArticleItem> {
  return apiRequest<ArticleItem>(`/referential/articles/${id}/archive`, { method: 'POST' });
}

// ── Clauses Techniques ────────────────────────────────────────────────────────

export async function getClauses(): Promise<ClauseItem[]> {
  return unwrap(await apiRequest<ClauseItem[] | { data: ClauseItem[] }>('/referential/clauses'));
}

export async function createClause(
  data: Pick<ClauseItem, 'title' | 'content' | 'domain' | 'articleIds'>,
): Promise<ClauseItem> {
  return apiRequest<ClauseItem>('/referential/clauses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateClause(
  id: string,
  data: Pick<ClauseItem, 'title' | 'content' | 'domain' | 'articleIds'>,
): Promise<ClauseItem> {
  return apiRequest<ClauseItem>(`/referential/clauses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteClause(id: string): Promise<void> {
  await apiRequest<void>(`/referential/clauses/${id}`, { method: 'DELETE' });
}

// ── Fiches Techniques ─────────────────────────────────────────────────────────

export async function getFiches(): Promise<FicheItem[]> {
  return unwrap(await apiRequest<FicheItem[] | { data: FicheItem[] }>('/referential/fiches'));
}

export async function createFiche(
  data: Pick<FicheItem, 'title' | 'url' | 'description' | 'articleIds'>,
): Promise<FicheItem> {
  return apiRequest<FicheItem>('/referential/fiches', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateFiche(
  id: string,
  data: Pick<FicheItem, 'title' | 'url' | 'description' | 'articleIds'>,
): Promise<FicheItem> {
  return apiRequest<FicheItem>(`/referential/fiches/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteFiche(id: string): Promise<void> {
  await apiRequest<void>(`/referential/fiches/${id}`, { method: 'DELETE' });
}

// ── Unités ────────────────────────────────────────────────────────────────────

export async function getUnits(): Promise<UnitItem[]> {
  return unwrap(await apiRequest<UnitItem[] | { data: UnitItem[] }>('/referential/units'));
}

export async function createUnit(data: Pick<UnitItem, 'label' | 'description'>): Promise<UnitItem> {
  return apiRequest<UnitItem>('/referential/units', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUnit(
  id: string,
  data: Pick<UnitItem, 'label' | 'description'>,
): Promise<UnitItem> {
  return apiRequest<UnitItem>(`/referential/units/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteUnit(id: string): Promise<void> {
  await apiRequest<void>(`/referential/units/${id}`, { method: 'DELETE' });
}

// ── Formules de révision des prix ─────────────────────────────────────────────

export async function getFormulas(): Promise<FormulaItem[]> {
  return unwrap(await apiRequest<FormulaItem[] | { data: FormulaItem[] }>('/referential/formulas'));
}

export async function createFormula(
  data: Pick<FormulaItem, 'code' | 'name' | 'formula' | 'description'>,
): Promise<FormulaItem> {
  return apiRequest<FormulaItem>('/referential/formulas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateFormula(
  id: string,
  data: Pick<FormulaItem, 'code' | 'name' | 'formula' | 'description'>,
): Promise<FormulaItem> {
  return apiRequest<FormulaItem>(`/referential/formulas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteFormula(id: string): Promise<void> {
  await apiRequest<void>(`/referential/formulas/${id}`, { method: 'DELETE' });
}

// ── Documents de référence ────────────────────────────────────────────────────

export async function getRefDocs(): Promise<RefDocItem[]> {
  return unwrap(await apiRequest<RefDocItem[] | { data: RefDocItem[] }>('/referential/ref-docs'));
}

export async function createRefDoc(
  data: Pick<RefDocItem, 'code' | 'title' | 'url' | 'description'>,
): Promise<RefDocItem> {
  return apiRequest<RefDocItem>('/referential/ref-docs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRefDoc(
  id: string,
  data: Pick<RefDocItem, 'code' | 'title' | 'url' | 'description'>,
): Promise<RefDocItem> {
  return apiRequest<RefDocItem>(`/referential/ref-docs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteRefDoc(id: string): Promise<void> {
  await apiRequest<void>(`/referential/ref-docs/${id}`, { method: 'DELETE' });
}

// ── Modèles CPS ───────────────────────────────────────────────────────────────

export async function getCpsModels(): Promise<CpsModelItem[]> {
  return unwrap(
    await apiRequest<CpsModelItem[] | { data: CpsModelItem[] }>('/referential/cps-models'),
  );
}

export async function createCpsModel(
  data: Pick<CpsModelItem, 'code' | 'name' | 'description' | 'projectTypes'>,
): Promise<CpsModelItem> {
  return apiRequest<CpsModelItem>('/referential/cps-models', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCpsModel(
  id: string,
  data: Pick<CpsModelItem, 'code' | 'name' | 'description' | 'projectTypes'>,
): Promise<CpsModelItem> {
  return apiRequest<CpsModelItem>(`/referential/cps-models/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCpsModel(id: string): Promise<void> {
  await apiRequest<void>(`/referential/cps-models/${id}`, { method: 'DELETE' });
}
