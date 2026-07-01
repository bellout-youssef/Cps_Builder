'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, Folder, FileText } from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import type { ProjectListItem } from '@/lib/api/projects';
import { WorkflowStep, ProjectType } from '@cps/shared';

const TYPE_LABEL: Record<ProjectType, string> = {
  [ProjectType.A]: 'Aménagement',
  [ProjectType.B]: 'Bâtiment',
  [ProjectType.O]: "Ouvrages d'art",
  [ProjectType.M]: 'Maritime et Portuaire',
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

const TYPE_ORDER: ProjectType[] = [
  ProjectType.A,
  ProjectType.B,
  ProjectType.O,
  ProjectType.M,
  ProjectType.E,
];

function ProjectRow({ project }: { project: ProjectListItem }) {
  return (
    <div className="flex items-center gap-2 rounded py-1.5 pl-10 pr-3 hover:bg-slate-50">
      <FileText className="h-3.5 w-3.5 flex-shrink-0 text-slate-300" />
      <span className="flex-1 truncate text-sm text-slate-700">{project.name}</span>
      {project.code && <span className="font-mono text-xs text-slate-400">{project.code}</span>}
      <Badge variant={STEP_BADGE[project.workflowStep]}>{STEP_LABEL[project.workflowStep]}</Badge>
    </div>
  );
}

function TypeGroup({ type, projects }: { type: ProjectType; projects: ProjectListItem[] }) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded px-3 py-2 transition-colors hover:bg-slate-50"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
        )}
        {open ? (
          <FolderOpen className="h-4 w-4 flex-shrink-0 text-indigo-400" />
        ) : (
          <Folder className="h-4 w-4 flex-shrink-0 text-indigo-400" />
        )}
        <span className="flex-1 text-left text-sm font-medium text-slate-700">
          {TYPE_LABEL[type]}
        </span>
        <span className="text-xs text-slate-400">
          {projects.length} projet{projects.length > 1 ? 's' : ''}
        </span>
      </button>
      {open && (
        <div>
          {projects.map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProjectTreeProps {
  projects: ProjectListItem[];
  emptyMessage?: string;
}

export function ProjectTree({ projects, emptyMessage = 'Aucun projet' }: ProjectTreeProps) {
  if (projects.length === 0) {
    return <p className="py-12 text-center text-sm italic text-slate-400">{emptyMessage}</p>;
  }

  // Group by primary type (first type in the array)
  const grouped = new Map<ProjectType, ProjectListItem[]>();
  for (const p of projects) {
    const primary = p.types[0]?.type ?? ProjectType.A;
    const existing = grouped.get(primary) ?? [];
    grouped.set(primary, [...existing, p]);
  }

  // Projects with no type
  const untyped = projects.filter((p) => p.types.length === 0);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-2">
      {TYPE_ORDER.filter((t) => grouped.has(t)).map((t) => (
        <TypeGroup key={t} type={t} projects={grouped.get(t)!} />
      ))}
      {untyped.length > 0 && untyped.map((p) => <ProjectRow key={p.id} project={p} />)}
    </div>
  );
}
