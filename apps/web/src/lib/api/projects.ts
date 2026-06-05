import { apiRequest } from '../api-client';
import type { WorkflowStep, ProjectType, WorkflowAction } from '@cps/shared';

export interface ProjectListItem {
  id: string;
  name: string;
  workflowStep: WorkflowStep;
  isPrivate: boolean;
  code: string | null;
  types: Array<{ type: ProjectType }>;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  verifiedById: string | null;
  validatedById: string | null;
  publishedAt: string | null;
}

export interface ProjectClause {
  id: string;
  code: string;
  title: string;
  content: string;
  isLocallyModified: boolean;
  localContent?: string;
  articleIds: string[];
  order: number;
}

export interface WorkflowHistoryItem {
  id: string;
  action: WorkflowAction;
  fromStep: WorkflowStep;
  toStep: WorkflowStep;
  comment?: string;
  performedById: string;
  performedByEmail: string;
  createdAt: string;
}

export interface ProjectDetail extends ProjectListItem {
  description?: string;
  clauses: ProjectClause[];
  questionnaireAnswers: Record<string, string>;
  workflowHistory: WorkflowHistoryItem[];
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  types: ProjectType[];
  isPrivate: boolean;
  articleIds: string[];
  clauseIds: string[];
  questionnaireAnswers: Record<string, string>;
}

export async function getProjects(): Promise<ProjectListItem[]> {
  const res = await apiRequest<ProjectListItem[] | { data: ProjectListItem[]; total: number }>(
    '/projects',
  );
  return Array.isArray(res) ? res : res.data;
}

export async function getProject(id: string): Promise<ProjectDetail> {
  return apiRequest<ProjectDetail>(`/projects/${id}`);
}

export async function createProject(payload: CreateProjectPayload): Promise<ProjectListItem> {
  return apiRequest<ProjectListItem>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function transitionWorkflow(
  projectId: string,
  action: WorkflowAction,
  comment?: string,
): Promise<ProjectDetail> {
  return apiRequest<ProjectDetail>(`/projects/${projectId}/workflow`, {
    method: 'POST',
    body: JSON.stringify({ action, comment }),
  });
}
