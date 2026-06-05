'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle,
  ClipboardList,
  Clock,
  FolderOpen,
  Star,
} from 'lucide-react';
import { WorkflowStep } from '@cps/shared';
import { useAuth } from '@/contexts/auth-context';
import { getProjects, type ProjectListItem } from '@/lib/api/projects';
import { getNotifications, type NotificationItem } from '@/lib/api/notifications';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STEP_LABEL: Record<WorkflowStep, string> = {
  [WorkflowStep.CREATION]: 'En création',
  [WorkflowStep.VERIFICATION]: 'En vérification',
  [WorkflowStep.BUSINESS_VALIDATION]: 'Validation métier',
  [WorkflowStep.REF_VALIDATION]: 'Validation référentiel',
  [WorkflowStep.PUBLISHED]: 'Publié',
  [WorkflowStep.ARCHIVED]: 'Archivé',
};

const STEP_BADGE: Record<WorkflowStep, BadgeVariant> = {
  [WorkflowStep.CREATION]: 'default',
  [WorkflowStep.VERIFICATION]: 'warning',
  [WorkflowStep.BUSINESS_VALIDATION]: 'warning',
  [WorkflowStep.REF_VALIDATION]: 'warning',
  [WorkflowStep.PUBLISHED]: 'success',
  [WorkflowStep.ARCHIVED]: 'default',
};

const NOTIF_LABELS: Record<string, string> = {
  WORKFLOW_SUBMITTED: 'Soumis au flux',
  WORKFLOW_APPROVED: 'Approuvé',
  WORKFLOW_REJECTED: 'Rejeté',
  WORKFLOW_MODIFICATION_REQUESTED: 'Modification demandée',
  CPS_PUBLISHED: 'CPS publié',
  CLAUSE_UPDATED: 'Clause mise à jour',
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  return `Il y a ${Math.floor(hours / 24)} j`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, can } = useAuth();

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetches: Promise<void>[] = [];

    if (can('projects:read')) {
      fetches.push(
        getProjects()
          .then(setProjects)
          .catch(() => undefined),
      );
    }

    fetches.push(
      getNotifications()
        .then(setNotifications)
        .catch(() => undefined),
    );

    Promise.all(fetches).finally(() => setLoading(false));
  }, [can]);

  // ─── Derived ────────────────────────────────────────────────────────────────

  const tasks: ProjectListItem[] = [];
  if (can('projects:verify')) {
    tasks.push(...projects.filter((p) => p.workflowStep === WorkflowStep.VERIFICATION));
  }
  if (can('projects:validate')) {
    tasks.push(...projects.filter((p) => p.workflowStep === WorkflowStep.BUSINESS_VALIDATION));
  }
  if (can('cps:publish')) {
    tasks.push(...projects.filter((p) => p.workflowStep === WorkflowStep.REF_VALIDATION));
  }

  const recentProjects = [...projects]
    .filter((p) => p.workflowStep !== WorkflowStep.ARCHIVED)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const activeProjects = projects.filter(
    (p) => p.workflowStep !== WorkflowStep.PUBLISHED && p.workflowStep !== WorkflowStep.ARCHIVED,
  );
  const publishedProjects = projects.filter((p) => p.workflowStep === WorkflowStep.PUBLISHED);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const recentNotifs = notifications.slice(0, 5);

  const isSuperAdmin = can('org:manage') && !can('projects:read');

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="Tableau de bord" />

      <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Greeting */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Bonjour{user?.email ? `, ${user.email.split('@')[0]}` : ''}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Voici un résumé de votre activité sur la plateforme.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : isSuperAdmin ? (
            /* Super Admin: no project access — redirect to their panel */
            <Card>
              <CardBody>
                <div className="py-6 text-center">
                  <p className="text-sm text-slate-600">
                    Bienvenue, Super Administrateur. Accédez au panneau d&apos;administration
                    globale pour gérer les organisations et les abonnements.
                  </p>
                  <Link
                    href="/dashboard/superadmin"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Panneau Super Admin
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardBody>
            </Card>
          ) : (
            <>
              {/* ── Stats ─────────────────────────────────────────────── */}
              {can('projects:read') && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard
                    label="Projets en cours"
                    value={activeProjects.length}
                    icon={<FolderOpen className="h-5 w-5" />}
                    accent="indigo"
                  />
                  <StatCard
                    label="Publiés"
                    value={publishedProjects.length}
                    icon={<CheckCircle className="h-5 w-5" />}
                    accent="green"
                  />
                  <StatCard
                    label="Tâches en attente"
                    value={tasks.length}
                    icon={<ClipboardList className="h-5 w-5" />}
                    accent={tasks.length > 0 ? 'amber' : 'slate'}
                  />
                  <StatCard
                    label="Notifications non lues"
                    value={unreadCount}
                    icon={<Bell className="h-5 w-5" />}
                    accent={unreadCount > 0 ? 'amber' : 'slate'}
                    href="/dashboard/notifications"
                  />
                </div>
              )}

              {/* ── Main grid ─────────────────────────────────────────── */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left: tasks + projects + referential */}
                <div className="space-y-6 lg:col-span-2">
                  {/* Mes tâches */}
                  {(can('projects:verify') || can('projects:validate') || can('cps:publish')) && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-indigo-500" />
                            <CardTitle>Mes tâches</CardTitle>
                            {tasks.length > 0 && (
                              <Badge variant="warning">{tasks.length}</Badge>
                            )}
                          </div>
                          <Link
                            href="/dashboard/bibliotheque"
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                          >
                            Voir tout
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </CardHeader>
                      <CardBody>
                        {tasks.length === 0 ? (
                          <p className="py-4 text-center text-sm italic text-slate-400">
                            Aucune tâche en attente.
                          </p>
                        ) : (
                          <ul className="divide-y divide-slate-100">
                            {tasks.slice(0, 5).map((p) => (
                              <ProjectRow key={p.id} project={p} />
                            ))}
                          </ul>
                        )}
                      </CardBody>
                    </Card>
                  )}

                  {/* Mes projets récents */}
                  {can('projects:read') && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-indigo-500" />
                            <CardTitle>Mes projets récents</CardTitle>
                          </div>
                          <Link
                            href="/dashboard/bibliotheque"
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                          >
                            Voir tout
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </CardHeader>
                      <CardBody>
                        {recentProjects.length === 0 ? (
                          <div className="py-8 text-center">
                            <p className="text-sm italic text-slate-400">
                              Aucun projet pour le moment.
                            </p>
                            {can('projects:create') && (
                              <Link
                                href="/dashboard/nouveau-projet"
                                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                              >
                                Créer un projet
                              </Link>
                            )}
                          </div>
                        ) : (
                          <ul className="divide-y divide-slate-100">
                            {recentProjects.map((p) => (
                              <ProjectRow key={p.id} project={p} />
                            ))}
                          </ul>
                        )}
                      </CardBody>
                    </Card>
                  )}

                  {/* Référentiel — quick access */}
                  {can('referential:read') && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-indigo-500" />
                          <CardTitle>Référentiel</CardTitle>
                        </div>
                      </CardHeader>
                      <CardBody>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {REFERENTIAL_LINKS.map(({ label, href }) => (
                            <Link
                              key={href}
                              href={href}
                              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                              <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                              {label}
                            </Link>
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>

                {/* Right: activity + favorites */}
                <div className="space-y-6">
                  {/* Activité récente */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-indigo-500" />
                          <CardTitle>Activité récente</CardTitle>
                        </div>
                        {notifications.length > 0 && (
                          <Link
                            href="/dashboard/notifications"
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                          >
                            Voir tout
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </CardHeader>
                    <CardBody>
                      {recentNotifs.length === 0 ? (
                        <div className="flex flex-col items-center py-6 text-center">
                          <Bell className="mb-2 h-8 w-8 text-slate-200" />
                          <p className="text-sm italic text-slate-400">Aucune activité récente.</p>
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {recentNotifs.map((notif) => (
                            <li
                              key={notif.id}
                              className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${
                                notif.isRead ? 'bg-slate-50' : 'bg-indigo-50'
                              }`}
                            >
                              <div
                                className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                                  notif.isRead ? 'bg-slate-300' : 'bg-indigo-500'
                                }`}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-slate-700">
                                  {NOTIF_LABELS[notif.type] ?? notif.type}
                                </p>
                                {notif.message && (
                                  <p className="mt-0.5 truncate text-xs text-slate-500">
                                    {notif.message}
                                  </p>
                                )}
                                <p className="mt-0.5 text-xs text-slate-400">
                                  {fmtRelative(notif.createdAt)}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardBody>
                  </Card>

                  {/* Favoris */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-indigo-500" />
                        <CardTitle>Favoris</CardTitle>
                      </div>
                    </CardHeader>
                    <CardBody>
                      <div className="flex flex-col items-center py-6 text-center">
                        <Star className="mb-2 h-8 w-8 text-slate-200" />
                        <p className="text-sm italic text-slate-400">Aucun favori pour le moment.</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Fonctionnalité disponible prochainement.
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REFERENTIAL_LINKS = [
  { label: 'Articles', href: '/dashboard/referentiel?tab=articles' },
  { label: 'Clauses techniques', href: '/dashboard/referentiel?tab=clauses' },
  { label: 'Fiches techniques', href: '/dashboard/referentiel?tab=fiches' },
  { label: 'Séries', href: '/dashboard/referentiel?tab=series' },
  { label: 'Unités', href: '/dashboard/referentiel?tab=unites' },
  { label: 'Documents', href: '/dashboard/referentiel?tab=documents' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

type Accent = 'indigo' | 'green' | 'amber' | 'slate';

const ACCENT: Record<Accent, { icon: string; value: string }> = {
  indigo: { icon: 'bg-indigo-100 text-indigo-600', value: 'text-indigo-700' },
  green: { icon: 'bg-green-100 text-green-600', value: 'text-green-700' },
  amber: { icon: 'bg-amber-100 text-amber-600', value: 'text-amber-700' },
  slate: { icon: 'bg-slate-100 text-slate-400', value: 'text-slate-600' },
};

function StatCard({
  label,
  value,
  icon,
  accent,
  href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: Accent;
  href?: string;
}) {
  const cls = ACCENT[accent];
  const inner = (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${cls.icon}`}
      >
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-bold ${cls.value}`}>{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block transition-opacity hover:opacity-80">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function ProjectRow({ project }: { project: ProjectListItem }) {
  return (
    <li>
      <Link
        href={`/dashboard/projects/${project.id}`}
        className="-mx-1 flex items-center gap-3 rounded-lg px-1 py-3 transition-colors hover:bg-slate-50"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-slate-800">{project.name}</p>
            {project.code && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">
                {project.code}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <Badge variant={STEP_BADGE[project.workflowStep]}>
              {STEP_LABEL[project.workflowStep]}
            </Badge>
            <span className="text-xs text-slate-400">{fmtDate(project.updatedAt)}</span>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-300" />
      </Link>
    </li>
  );
}
