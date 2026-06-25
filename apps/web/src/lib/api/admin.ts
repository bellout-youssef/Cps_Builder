import { apiRequest } from '../api-client';

// ── User Management (Org Admin) ───────────────────────────────────────────────

export interface UserItem {
  id: string;
  email: string;
  roles: string[];
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface CreateUserDto {
  email: string;
  temporaryPassword: string;
  roles: string[];
}

export async function getUsers(): Promise<UserItem[]> {
  return apiRequest<UserItem[]>('/users');
}

export interface OrgMember {
  id: string;
  name: string;
  email: string;
}

/** Liste minimale des membres actifs de l'org pour le dropdown workflow. */
export async function getOrgMembers(): Promise<OrgMember[]> {
  return apiRequest<OrgMember[]>('/users/org-members');
}

export async function createUser(dto: CreateUserDto): Promise<UserItem> {
  return apiRequest<UserItem>('/users', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateUserRoles(id: string, roles: string[]): Promise<UserItem> {
  return apiRequest<UserItem>(`/users/${id}/roles`, {
    method: 'PATCH',
    body: JSON.stringify({ roles }),
  });
}

export async function deactivateUser(id: string): Promise<void> {
  await apiRequest<unknown>(`/users/${id}/deactivate`, { method: 'PATCH' });
}

export async function reactivateUser(id: string): Promise<void> {
  await apiRequest<unknown>(`/users/${id}/reactivate`, { method: 'PATCH' });
}

export async function resetUserPassword(id: string, temporaryPassword: string): Promise<void> {
  await apiRequest<unknown>(`/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ temporaryPassword }),
  });
}

// ── Org Settings (Org Admin) ──────────────────────────────────────────────────

export interface OrgSettings {
  id: string;
  name: string;
  slug: string;
}

export async function getOrgSettings(): Promise<OrgSettings> {
  return apiRequest<OrgSettings>('/organizations/me');
}

export async function updateOrgSettings(dto: { name: string }): Promise<OrgSettings> {
  return apiRequest<OrgSettings>('/organizations/me', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

// ── Super Admin ───────────────────────────────────────────────────────────────

export interface OrgItem {
  id: string;
  name: string;
  slug: string;
  userCount: number;
  projectCount: number;
  createdAt: string;
}

export async function getOrganizations(): Promise<OrgItem[]> {
  return apiRequest<OrgItem[]>('/organizations');
}

export async function createOrganization(dto: { name: string; slug: string }): Promise<OrgItem> {
  return apiRequest<OrgItem>('/organizations', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export interface MonitoringStats {
  totalOrgs: number;
  totalUsers: number;
  totalProjects: number;
  activeSubscriptions: number;
}

export async function getMonitoringStats(): Promise<MonitoringStats> {
  return apiRequest<MonitoringStats>('/admin/monitoring');
}
