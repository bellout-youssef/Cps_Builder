import { apiRequest, ApiError } from '../api-client';

export interface SearchHit {
  type: 'project' | 'article' | 'clause' | 'fiche' | 'document' | 'formula';
  id: string;
  title: string;
  code?: string;
  description?: string;
  workflowStep?: string;
  updatedAt?: string;
}

export interface SearchResponse {
  results: SearchHit[];
  total: number;
  query: string;
}

export async function globalSearch(q: string): Promise<SearchResponse> {
  try {
    return await apiRequest<SearchResponse>(`/search?q=${encodeURIComponent(q)}`);
  } catch (err) {
    // Phase 5 endpoint not yet built — return empty gracefully
    if (
      err instanceof ApiError &&
      (err.status === 404 || err.status === 501 || err.status === 500)
    ) {
      return { results: [], total: 0, query: q };
    }
    throw err;
  }
}
