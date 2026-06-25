'use client';

import { useEffect, useRef, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { WorkflowAction } from '@cps/shared';
import { Button } from '@/components/ui/button';

const ACTION_CONFIG: Record<
  WorkflowAction,
  { label: string; description: string; variant: 'primary' | 'danger' | 'secondary'; requireComment: boolean }
> = {
  [WorkflowAction.SUBMIT]: {
    label: 'Soumettre pour vérification',
    description: 'Le CPS sera transmis au vérificateur. Cette action ne peut pas être annulée.',
    variant: 'primary',
    requireComment: false,
  },
  [WorkflowAction.APPROVE]: {
    label: 'Approuver',
    description: 'Valider cette étape et transmettre à l\'étape suivante du workflow.',
    variant: 'primary',
    requireComment: false,
  },
  [WorkflowAction.REJECT]: {
    label: 'Rejeter',
    description: 'Renvoyer le CPS en création. Un commentaire est obligatoire pour expliquer le motif du rejet.',
    variant: 'danger',
    requireComment: true,
  },
  [WorkflowAction.REQUEST_MODIFICATION]: {
    label: 'Demander une modification',
    description: 'Renvoyer le CPS en création avec une demande de modification. Un commentaire est obligatoire.',
    variant: 'secondary',
    requireComment: true,
  },
  [WorkflowAction.PUBLISH]: {
    label: 'Publier le CPS',
    description: 'Le CPS sera publié avec un code définitif et les documents (HTML, DOCX, PDF) seront générés. Cette action est irréversible.',
    variant: 'primary',
    requireComment: false,
  },
};

interface ActionModalProps {
  action: WorkflowAction;
  onConfirm: (comment?: string) => Promise<void>;
  onClose: () => void;
}

export function ActionModal({ action, onConfirm, onClose }: ActionModalProps) {
  const config = ACTION_CONFIG[action];
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (config.requireComment) textareaRef.current?.focus();
  }, [config.requireComment]);

  async function handleConfirm() {
    if (config.requireComment && !comment.trim()) {
      setError('Un commentaire est obligatoire pour cette action.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onConfirm(comment.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            {config.variant === 'danger' && (
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500" />
            )}
            <h2 className="text-base font-semibold text-slate-900">{config.label}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          <p className="text-sm text-slate-600">{config.description}</p>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Commentaire{config.requireComment ? ' *' : ' (optionnel)'}
            </label>
            <textarea
              ref={textareaRef}
              rows={4}
              value={comment}
              onChange={(e) => { setComment(e.target.value); setError(null); }}
              placeholder={config.requireComment ? 'Motif obligatoire…' : 'Ajouter une note (optionnel)…'}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button variant={config.variant} size="sm" loading={loading} onClick={handleConfirm}>
            Confirmer
          </Button>
        </div>
      </div>
    </div>
  );
}
