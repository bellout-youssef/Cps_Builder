'use client';

import { WorkflowAction, WorkflowStep } from '@cps/shared';
import type { WorkflowHistoryItem } from '@/lib/api/projects';
import { clsx } from 'clsx';
import { CheckCircle, XCircle, MessageSquare, Send, Clock } from 'lucide-react';

const ACTION_ICON: Record<WorkflowAction, React.ReactNode> = {
  [WorkflowAction.SEND_TO_USER]: <Send className="h-4 w-4" />,
  [WorkflowAction.SEND_TO_ADMIN]: <Send className="h-4 w-4" />,
  [WorkflowAction.REJECT]: <XCircle className="h-4 w-4" />,
  [WorkflowAction.REQUEST_MODIFICATION]: <MessageSquare className="h-4 w-4" />,
  [WorkflowAction.PUBLISH]: <CheckCircle className="h-4 w-4" />,
};

const ACTION_LABEL: Record<WorkflowAction, string> = {
  [WorkflowAction.SEND_TO_USER]: 'Soumis pour vérification',
  [WorkflowAction.SEND_TO_ADMIN]: "Transmis à l'administrateur",
  [WorkflowAction.REJECT]: 'Rejeté',
  [WorkflowAction.REQUEST_MODIFICATION]: 'Modification demandée',
  [WorkflowAction.PUBLISH]: 'Publié',
};

const ACTION_COLOR: Record<WorkflowAction, string> = {
  [WorkflowAction.SEND_TO_USER]: 'text-indigo-600 bg-indigo-50',
  [WorkflowAction.SEND_TO_ADMIN]: 'text-indigo-600 bg-indigo-50',
  [WorkflowAction.REJECT]: 'text-red-600 bg-red-50',
  [WorkflowAction.REQUEST_MODIFICATION]: 'text-amber-600 bg-amber-50',
  [WorkflowAction.PUBLISH]: 'text-emerald-600 bg-emerald-50',
};

const STEP_LABEL: Partial<Record<WorkflowStep, string>> = {
  [WorkflowStep.CREATION]: 'Création',
  [WorkflowStep.PENDING_REVIEW]: 'En révision',
  [WorkflowStep.ADMIN_REVIEW]: 'Validation admin',
  [WorkflowStep.PUBLISHED]: 'Publication',
  [WorkflowStep.ARCHIVED]: 'Archive',
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface WorkflowHistoryProps {
  history: WorkflowHistoryItem[];
}

export function WorkflowHistory({ history }: WorkflowHistoryProps) {
  if (history.length === 0) {
    return (
      <p className="py-4 text-center text-sm italic text-slate-400">
        Aucune transition enregistrée.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {history.map((item, index) => (
        <li key={item.id} className="flex gap-4">
          {/* Timeline dot + line */}
          <div className="flex flex-col items-center">
            <div
              className={clsx(
                'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                ACTION_COLOR[item.action],
              )}
            >
              {ACTION_ICON[item.action]}
            </div>
            {index < history.length - 1 && (
              <div className="mt-1 w-0.5 flex-1 bg-slate-200" />
            )}
          </div>

          {/* Content */}
          <div className="mb-4 flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-semibold text-slate-800">
                {ACTION_LABEL[item.action]}
              </span>
              <span className="text-xs text-slate-400">par</span>
              <span className="text-xs font-medium text-slate-600">{item.performedByEmail}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              {fmtDate(item.createdAt)}
              <span className="mx-1">·</span>
              <span>{STEP_LABEL[item.fromStep] ?? item.fromStep}</span>
              <span>→</span>
              <span>{STEP_LABEL[item.toStep] ?? item.toStep}</span>
            </div>
            {item.comment && (
              <blockquote className="mt-2 rounded-lg border-l-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600 italic">
                {item.comment}
              </blockquote>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
