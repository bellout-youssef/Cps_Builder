'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  CheckCircle,
  XCircle,
  MessageSquare,
  Lock,
  Edit3,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { WorkflowStep, WorkflowAction, RoleName } from '@cps/shared';
import type { JwtUser } from '@cps/shared';
import { Button } from '@/components/ui/button';
import { SendModal } from './send-modal';
import { ConfirmModal } from './confirm-modal';
import type { ProjectListItem } from '@/lib/api/projects';
import type { OrgMember } from '@/lib/api/admin';

interface WorkflowActionsProps {
  project: ProjectListItem;
  user: JwtUser;
  orgMembers: OrgMember[];
  onTransition: (action: WorkflowAction, opts?: { targetUserId?: string; reason?: string }) => Promise<void>;
}

export function WorkflowActions({ project, user, orgMembers, onTransition }: WorkflowActionsProps) {
  const router = useRouter();
  const { workflowStep } = project;
  const roles = new Set(user.roles);
  const isAdmin = roles.has(RoleName.ADMIN);
  const isCreator = project.createdById === user.sub;
  const isCurrentHolder = project.currentHolderId === user.sub;
  const isPorteur = isCreator || isCurrentHolder;

  const [activeSend, setActiveSend] = useState(false);
  const [activeAction, setActiveAction] = useState<WorkflowAction | null>(null);

  // ─── CPS publié ───────────────────────────────────────────────────────────

  if (workflowStep === WorkflowStep.PUBLISHED) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
        <Lock className="h-4 w-4 text-green-600" />
        <p className="text-sm font-medium text-green-700">
          CPS publié — document figé et immuable.
        </p>
      </div>
    );
  }

  // ─── Étape CREATION : porteur peut modifier et envoyer ────────────────────

  if (workflowStep === WorkflowStep.CREATION) {
    if (!isPorteur && !isAdmin) {
      return <NoActions />;
    }

    return (
      <>
        <div className="flex flex-wrap items-center gap-3">
          {/* Bouton "Modifier le projet" — ramène au questionnaire */}
          <Button
            variant="secondary"
            size="md"
            onClick={() => router.push(`/dashboard/nouveau-projet?edit=${project.id}`)}
          >
            <Edit3 className="h-4 w-4" />
            Modifier le projet
          </Button>

          {/* Bouton "Envoyer pour vérification" — ouvre le sélecteur de destinataire */}
          <Button
            variant="primary"
            size="md"
            onClick={() => setActiveSend(true)}
          >
            <Send className="h-4 w-4" />
            Envoyer pour vérification
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </Button>
        </div>

        {activeSend && (
          <SendModal
            projectCreatorId={project.createdById}
            currentUserId={user.sub}
            orgMembers={orgMembers}
            onConfirm={(opts) => onTransition(opts.targetUserId ? WorkflowAction.SEND_TO_USER : WorkflowAction.SEND_TO_ADMIN, opts)}
            onClose={() => setActiveSend(false)}
          />
        )}
      </>
    );
  }

  // ─── Étape PENDING_REVIEW : porteur actuel peut transmettre ou renvoyer ──

  if (workflowStep === WorkflowStep.PENDING_REVIEW) {
    if (!isCurrentHolder && !isAdmin) {
      return <NoActions message="Ce projet est actuellement en attente de vérification par un autre utilisateur." />;
    }

    return (
      <>
        <div className="flex flex-wrap items-center gap-3">
          {isCurrentHolder && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => router.push(`/dashboard/nouveau-projet?edit=${project.id}`)}
            >
              <Edit3 className="h-4 w-4" />
              Modifier le projet
            </Button>
          )}
          <Button variant="primary" size="md" onClick={() => setActiveSend(true)}>
            <UserCheck className="h-4 w-4" />
            Transmettre à…
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </Button>
          <Button variant="secondary" size="md" onClick={() => setActiveAction(WorkflowAction.REQUEST_MODIFICATION)}>
            <MessageSquare className="h-4 w-4" />
            Demander modification
          </Button>
          <Button variant="danger" size="md" onClick={() => setActiveAction(WorkflowAction.REJECT)}>
            <XCircle className="h-4 w-4" />
            Rejeter
          </Button>
        </div>

        {activeSend && (
          <SendModal
            projectCreatorId={project.createdById}
            currentUserId={user.sub}
            orgMembers={orgMembers}
            onConfirm={(opts) => onTransition(opts.targetUserId ? WorkflowAction.SEND_TO_USER : WorkflowAction.SEND_TO_ADMIN, opts)}
            onClose={() => setActiveSend(false)}
          />
        )}

        {activeAction !== null && (
          <ConfirmModal
            action={activeAction}
            onConfirm={(reason) => onTransition(activeAction, { reason })}
            onClose={() => setActiveAction(null)}
          />
        )}
      </>
    );
  }

  // ─── Étape ADMIN_REVIEW : admin valide ou renvoie ─────────────────────────

  if (workflowStep === WorkflowStep.ADMIN_REVIEW) {
    if (!isAdmin) {
      return <NoActions message="Ce projet est en attente de validation par l'administrateur." />;
    }

    return (
      <>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="md" onClick={() => setActiveAction(WorkflowAction.PUBLISH)}>
            <CheckCircle className="h-4 w-4" />
            Valider et publier
          </Button>
          <Button variant="secondary" size="md" onClick={() => setActiveAction(WorkflowAction.REQUEST_MODIFICATION)}>
            <MessageSquare className="h-4 w-4" />
            Demander modification
          </Button>
          <Button variant="danger" size="md" onClick={() => setActiveAction(WorkflowAction.REJECT)}>
            <XCircle className="h-4 w-4" />
            Rejeter
          </Button>
        </div>

        {activeAction !== null && (
          <ConfirmModal
            action={activeAction}
            onConfirm={(reason) => onTransition(activeAction, { reason })}
            onClose={() => setActiveAction(null)}
          />
        )}
      </>
    );
  }

  return <NoActions />;
}

function NoActions({ message }: { message?: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4">
      <p className="text-sm text-slate-400 italic">
        {message ?? 'Aucune action disponible pour votre rôle à cette étape.'}
      </p>
    </div>
  );
}
