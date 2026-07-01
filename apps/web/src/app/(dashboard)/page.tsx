'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  FolderOpen,
  Library,
  Activity,
  Star,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { getProjects, type ProjectListItem } from '@/lib/api/projects';
import { getNotifications, type NotificationItem } from '@/lib/api/notifications';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { WorkflowStep, RoleName } from '@cps/shared';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STEP_LABEL: Record<WorkflowStep, string> = {
  [WorkflowStep.CREATION]: 'En création',
  [WorkflowStep.PENDING_REVIEW]: 'En vérification',
  [WorkflowStep.ADMIN_REVIEW]: 'Validation admin',
  [WorkflowStep.PUBLISHED]: 'Publié',
  [WorkflowStep.ARCHIVED]: 'Archivé',
};

const STEP_BADGE: Record<WorkflowStep, BadgeVariant> = {
  [WorkflowStep.CREATION]: 'default',
  [WorkflowStep.PENDING_REVIEW]: 'warning',
  [WorkflowStep.ADMIN_REVIEW]: 'warning',
  [WorkflowStep.PUBLISHED]: 'success',
  [WorkflowStep.ARCHIVED]: 'default',
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return <p className="py-6 text-center text-sm text-slate-400 italic">{message}</p>;
}

function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
    >
      {label}
      <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

// ─── Task widget ─────────────────────────────────────────────────────────────

interface TaskWidgetProps {
  tasks: ProjectListItem[];
}

function TasksWidget({ tasks }: TaskWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-indigo-500" />
          <CardTitle>Mes tâches</CardTitle>
          {tasks.length > 0 && <Badge variant="info">{tasks.length}</Badge>}
        </div>
        {tasks.length > 0 && <SectionLink href="/dashboard/bibliotheque" label="Voir tout" />}
      </CardHeader>
      <CardBody>
        {tasks.length === 0 ? (
          <EmptyState message="Aucune tâche en attente" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{fmtDate(p.updatedAt)}</p>
                </div>
                <Badge variant={STEP_BADGE[p.workflowStep]}>{STEP_LABEL[p.workflowStep]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

// ─── Projects widget ──────────────────────────────────────────────────────────

interface ProjectsWidgetProps {
  projects: ProjectListItem[];
}

function ProjectsWidget({ projects }: ProjectsWidgetProps) {
  const recent = projects
    .filter((p) => p.workflowStep !== WorkflowStep.ARCHIVED)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-indigo-500" />
          <CardTitle>Mes projets</CardTitle>
        </div>
        <SectionLink href="/dashboard/bibliotheque" label="Voir tout" />
      </CardHeader>
      <CardBody>
        {recent.length === 0 ? (
          <EmptyState message="Aucun projet" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {p.types.map((t) => t.type).join(', ')} · {fmtDate(p.updatedAt)}
                  </p>
                </div>
                <Badge variant={STEP_BADGE[p.workflowStep]}>{STEP_LABEL[p.workflowStep]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

// ─── Stats widget ─────────────────────────────────────────────────────────────

interface StatsWidgetProps {
  projects: ProjectListItem[];
}

function ReferentialStatsWidget({ projects }: StatsWidgetProps) {
  const published = projects.filter((p) => p.workflowStep === WorkflowStep.PUBLISHED).length;
  const inProgress = projects.filter(
    (p) => p.workflowStep !== WorkflowStep.PUBLISHED && p.workflowStep !== WorkflowStep.ARCHIVED,
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Library className="h-4 w-4 text-indigo-500" />
          <CardTitle>Référentiels</CardTitle>
        </div>
        <SectionLink href="/dashboard/referentiel" label="Accéder" />
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{published}</p>
            <p className="mt-1 text-xs text-slate-500">CPS publiés</p>
          </div>
          <div className="rounded-lg bg-indigo-50 p-4 text-center">
            <p className="text-2xl font-bold text-indigo-700">{inProgress}</p>
            <p className="mt-1 text-xs text-indigo-500">En cours</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Activity widget ──────────────────────────────────────────────────────────

const NOTIFICATION_LABEL: Record<string, string> = {
  WORKFLOW_SUBMITTED: 'CPS soumis pour révision',
  WORKFLOW_APPROVED: 'Étape approuvée',
  WORKFLOW_REJECTED: 'CPS rejeté',
  WORKFLOW_MODIFICATION_REQUESTED: 'Modification demandée',
  CLAUSE_VERSION_UPDATED: 'Nouvelle version de clause disponible',
  PROJECT_SHARED: 'Projet partagé avec vous',
};

interface ActivityWidgetProps {
  notifications: NotificationItem[];
  loading: boolean;
}

function ActivityWidget({ notifications, loading }: ActivityWidgetProps) {
  const recent = notifications.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-indigo-500" />
          <CardTitle>Activité récente</CardTitle>
          {notifications.filter((n) => !n.isRead).length > 0 && (
            <Badge variant="danger">
              {notifications.filter((n) => !n.isRead).length} non lu
              {notifications.filter((n) => !n.isRead).length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <SectionLink href="/dashboard/notifications" label="Tout voir" />
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner size="sm" />
          </div>
        ) : recent.length === 0 ? (
          <EmptyState message="Aucune activité récente" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-3 py-3 ${!n.isRead ? 'opacity-100' : 'opacity-70'}`}
              >
                <span
                  className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${!n.isRead ? 'bg-indigo-500' : 'bg-slate-300'}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700">{NOTIFICATION_LABEL[n.type] ?? n.type}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{fmtDate(n.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

// ─── Favourites (placeholder for V1) ─────────────────────────────────────────

function FavouritesWidget() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-indigo-500" />
          <CardTitle>Favoris</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <EmptyState message="Épinglez un projet pour le retrouver ici" />
      </CardBody>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, can } = useAuth();

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [notifLoading, setNotifLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  useEffect(() => {
    if (!can('projects:read')) {
      setProjectsLoading(false);
      return;
    }
    getProjects()
      .then(setProjects)
      .catch((err: unknown) =>
        setProjectsError(err instanceof Error ? err.message : 'Erreur de chargement'),
      )
      .finally(() => setProjectsLoading(false));
  }, [can]);

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  }, []);

  // "Mes tâches" = projects requiring action from this user
  const myTasks = projects.filter((p) => {
    if (!user) return false;
    if (user.roles.includes(RoleName.USER) && p.workflowStep === WorkflowStep.PENDING_REVIEW)
      return true;
    if (user.roles.includes(RoleName.ADMIN) && p.workflowStep === WorkflowStep.ADMIN_REVIEW)
      return true;
    return false;
  });

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="Accueil" />

      <main className="flex-1 overflow-y-auto p-6">
        {/* Welcome banner */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Bonjour
            {user?.email ? ` — ${user.email}` : ''}{' '}
            <span className="inline-block" role="img" aria-label="wave">
              👋
            </span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Voici un résumé de votre activité sur la plateforme.
          </p>
        </div>

        {/* Error state */}
        {projectsError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {projectsError}
          </div>
        )}

        {/* Loading state */}
        {projectsLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Row 1 */}
            <TasksWidget tasks={myTasks} />
            {can('projects:read') && <ProjectsWidget projects={projects} />}

            {/* Row 2 */}
            {can('referential:read') && <ReferentialStatsWidget projects={projects} />}
            <ActivityWidget notifications={notifications} loading={notifLoading} />

            {/* Row 3 */}
            <FavouritesWidget />
          </div>
        )}
      </main>
    </div>
  );
}
