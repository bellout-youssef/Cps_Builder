import { apiRequest } from '../api-client';
import type { ProjectType } from '@cps/shared';

export interface ClauseItem {
  id: string;
  code: string;
  title: string;
  content: string;
  articleIds: string[];
  projectTypes: ProjectType[];
  isAutoSuggested?: boolean;
}

export async function getClausesForArticles(
  articleIds: string[],
  projectTypes: ProjectType[],
): Promise<ClauseItem[]> {
  const params = new URLSearchParams();
  articleIds.forEach((id) => params.append('articleIds', id));
  projectTypes.forEach((t) => params.append('types', t));
  try {
    return await apiRequest<ClauseItem[]>(`/referential/clauses?${params.toString()}`);
  } catch {
    return [];
  }
}
