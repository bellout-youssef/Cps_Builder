'use client';

import { useState } from 'react';
import { Send, CheckCircle, XCircle, MessageSquare, Lock } from 'lucide-react';
import { WorkflowStep, WorkflowAction, RoleName } from '@cps/shared';
import type { JwtUser } from '@cps/shared';
import { Button } from '@/components/ui/button';
import { ActionModal } from './action-modal';
import type { ProjectListItem } from '@/lib/api/projects';

interface AvailableAction {
  action: WorkflowAction;
  label: string;
  icon: React.ReactNode;
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
}

function getAvailableActions(
  project: ProjectListItem,
  user: JwtUser,
): AvailableAction[] {
  const { workflowStep } = project;
  const roles = new Set(user.roles);

  switch (workflowStep) {
    case WorkflowStep.CREATION:
      // Only the creator can submit — and only their own project
      if (roles.has(RoleName.CREATOR) && project.createdById === user.sub) {
        return [
          { action: WorkflowAction.SUBMIT, label: 'Soumettre pour vérification', icon: <Send className="h-4 w-4" />, variant: 'primary' },
        ];
      }
      return [];

    case WorkflowStep.VERIFICATION:
      if (roles.has(RoleName.VERIFIER)) {
        return [
          { action: WorkflowAction.APPROVE, label: 'Approuver', icon: <CheckCircle className="h-4 w-4" />, variant: 'primary' },
          { action: WorkflowAction.REQUEST_MODIFICATION, label: 'Demander modification', icon: <MessageSquare className="h-4 w-4" />, variant: 'secondary' },
          { action: WorkflowAction.REJECT, label: 'Rejeter', icon: <XCircle className="h-4 w-4" />, variant: 'danger' },
        ];
      }
      return [];

    case WorkflowStep.BUSINESS_VALIDATION:
      if (roles.has(RoleName.VALIDATOR)) {
        return [
          { action: WorkflowAction.APPROVE, label: 'Valider', icon: <CheckCircle className="h-4 w-4" />, variant: 'primary' },
          { action: WorkflowAction.REQUEST_MODIFICATION, label: 'Demander modification', icon: <MessageSquare className="h-4 w-4" />, variant: 'secondary' },
          { action: WorkflowAction.REJECT, label: 'Rejeter', icon: <XCircle className="h-4 w-4" />, variant: 'danger' },
        ];
      }
      return [];

    case WorkflowStep.REF_VALIDATION:
      if (roles.has(RoleName.REF_MANAGER)) {
        return [
          { action: WorkflowAction.APPROVE, label: 'Publier le CPS', icon: <CheckCircle className="h-4 w-4" />, variant: 'primary' },
          { action: WorkflowAction.REQUEST_MODIFICATION, label: 'Demander modification', icon: <MessageSquare className="h-4 w-4" />, variant: 'secondary' },
          { action: WorkflowAction.REJECT, label: 'Rejeter', icon: <XCircle className="h-4 w-4" />, variant: 'danger' },
        ];
      }
      return [];

    case WorkflowStep.PUBLISHED:
    case WorkflowStep.ARCHIVED:
      return [];
  }
}

interface WorkflowActionsProps {
  project: ProjectListItem;
  user: JwtUser;
  onTransition: (action: WorkflowAction, comment?: string) => Promise<void>;
}

export function WorkflowActions({ project, user, onTransition }: WorkflowActionsProps) {
  const [activeAction, setActiveAction] = useState<WorkflowAction | null>(null);

  const actions = getAvailableActions(project, user);

  if (project.workflowStep === WorkflowStep.PUBLISHED) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
        <Lock className="h-4 w-4 text-green-600" />
        <p className="text-sm font-medium text-green-700">
          CPS publié — document figé et immuable.
        </p>
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4">
        <p className="text-sm text-slate-400 italic">
          Aucune action disponible pour votre rôle à cette étape.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {actions.map(({ action, label, icon, variant }) => (
          <Button
            key={action}
            variant={variant}
            size="md"
            onClick={() => setActiveAction(action)}
          >
            {icon}
            {label}
          </Button>
        ))}
      </div>

      {activeAction !== null && (
        <ActionModal
          action={activeAction}
          onConfirm={(comment) => onTransition(activeAction, comment)}
          onClose={() => setActiveAction(null)}
        />
      )}
    </>
  );
}
