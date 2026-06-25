import { apiRequest } from '../api-client';
import type { WorkflowStep, ProjectType } from '@cps/shared';
import { WorkflowAction } from '@cps/shared';
import type { CpsQuestionnaire } from '@/components/nouveau-projet/cps-questionnaire.types';

export interface ProjectListItem {
  id: string;
  name: string;
  workflowStep: WorkflowStep;
  isPrivate: boolean;
  code: string | null;
  dceRef: string | null;
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
  chapter2Answers: CpsQuestionnaire | null;
  workflowHistory: WorkflowHistoryItem[];
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  types: ProjectType[];
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

export async function saveQuestionnaireDraft(
  projectId: string,
  questionnaire: CpsQuestionnaire,
): Promise<void> {
  await apiRequest<unknown>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify({ chapter2Answers: questionnaire }),
  });
}

export async function transitionWorkflow(
  projectId: string,
  action: WorkflowAction,
  comment?: string,
): Promise<ProjectDetail> {
  const routes: Record<WorkflowAction, string> = {
    [WorkflowAction.SUBMIT]: 'submit',
    [WorkflowAction.APPROVE]: 'approve',
    [WorkflowAction.REJECT]: 'reject',
    [WorkflowAction.REQUEST_MODIFICATION]: 'request-modification',
    [WorkflowAction.PUBLISH]: 'publish',
  };
  return apiRequest<ProjectDetail>(`/projects/${projectId}/workflow/${routes[action]}`, {
    method: 'POST',
    body: comment ? JSON.stringify({ reason: comment }) : undefined,
  });
}
