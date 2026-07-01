import { apiRequest } from '../api-client';
import { tokenStorage } from '../token-storage';

export interface ProjectDocument {
  id: string;
  projectId: string;
  type: 'HTML' | 'DOCX' | 'PDF' | 'BDP_EXCEL' | 'ESTIM_EXCEL';
  filename: string;
  path: string;
  sizeBytes: number;
  createdAt: string;
}

export async function generatePreview(projectId: string): Promise<void> {
  await apiRequest<unknown>(`/projects/${projectId}/generate-preview`, { method: 'POST' });
}

export async function listDocuments(projectId: string): Promise<ProjectDocument[]> {
  return apiRequest<ProjectDocument[]>(`/projects/${projectId}/documents`);
}

/** Construit l'URL de téléchargement — type : html | docx | pdf | bdp | estim */
export function getDownloadUrl(projectId: string, type: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  return `${base}/projects/${projectId}/documents/${type}/download`;
}

/** Déclenche le téléchargement via fetch authentifié + blob URL. */
export async function downloadDocument(projectId: string, type: string): Promise<void> {
  const token = tokenStorage.getAccessToken();
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const url = `${base}/projects/${projectId}/documents/${type}/download`;

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message ?? `Téléchargement échoué (${res.status})`);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  const cd = res.headers.get('Content-Disposition') ?? '';
  const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';\s]+)["']?/i);
  a.download = match ? decodeURIComponent(match[1]) : `document.${type}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}
