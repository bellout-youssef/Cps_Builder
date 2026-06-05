import { Badge, type BadgeVariant } from '@/components/ui/badge';
import type { ProjectListItem } from '@/lib/api/projects';
import { WorkflowStep, ProjectType } from '@cps/shared';

const TYPE_LABEL: Record<ProjectType, string> = {
  [ProjectType.A]: 'Aménagement',
  [ProjectType.B]: 'Bâtiment',
  [ProjectType.O]: "Ouvrages d'art",
  [ProjectType.M]: 'Maritime',
  [ProjectType.E]: 'MT/BT',
};

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
}

export function ProjectList({ projects, emptyMessage = 'Aucun projet' }: ProjectListProps) {
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
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {projects.map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-slate-50">
              <td className="px-4 py-3">
                <span className="block max-w-xs truncate font-medium text-slate-800">{p.name}</span>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
