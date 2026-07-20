import Link from 'next/link';
import { Edit3 } from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import type { ProjectListItem } from '@/lib/api/projects';
import { WorkflowStep, ProjectType } from '@cps/shared';
import { GenerateCpsButton } from './generate-cps-button';

const TYPE_LABEL: Record<ProjectType, string> = {
  [ProjectType.A]: 'Aménagement',
  [ProjectType.B]: 'Bâtiment',
  [ProjectType.O]: "Ouvrages d'art",
  [ProjectType.M]: 'Maritime',
  [ProjectType.E]: 'MT/BT',
};

const STEP_LABEL: Record<WorkflowStep, string> = {
  [WorkflowStep.CREATION]: 'En création',
  [WorkflowStep.PENDING_REVIEW]: 'En révision',
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

interface ProjectListProps {
  projects: ProjectListItem[];
  emptyMessage?: string;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function ProjectList({ projects, emptyMessage = 'Aucun projet', currentUserId, isAdmin = false }: ProjectListProps) {
  if (projects.length === 0) {
    return <p className="py-12 text-center text-sm italic text-slate-400">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nom
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell">
              Types
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
              Code
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Étape
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">
              Mis à jour
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {projects.map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/projects/${p.id}`}
                  className="block max-w-xs truncate font-medium text-slate-800 hover:text-indigo-600 transition-colors"
                >
                  {p.name}
                </Link>
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                <span className="text-xs text-slate-500">
                  {p.types.map((t) => TYPE_LABEL[t.type]).join(', ') || '—'}
                </span>
              </td>
              <td className="hidden px-4 py-3 md:table-cell">
                <span className="font-mono text-xs text-slate-400">{p.code ?? '—'}</span>
              </td>
              <td className="px-4 py-3">
                <Badge variant={STEP_BADGE[p.workflowStep]}>{STEP_LABEL[p.workflowStep]}</Badge>
              </td>
              <td className="hidden px-4 py-3 lg:table-cell">
                <span className="text-xs text-slate-400">{fmtDate(p.updatedAt)}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  {p.workflowStep === WorkflowStep.CREATION && currentUserId && p.createdById === currentUserId && (
                    <Link
                      href={`/dashboard/nouveau-projet?edit=${p.id}`}
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Modifier
                    </Link>
                  )}
                  <GenerateCpsButton project={p} currentUserId={currentUserId} isAdmin={isAdmin} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
