'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Send, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OrgMember } from '@/lib/api/admin';

interface SendModalProps {
  projectCreatorId: string;
  currentUserId: string;
  orgMembers: OrgMember[];
  onConfirm: (opts: { targetUserId?: string; reason?: string }) => Promise<void>;
  onClose: () => void;
}

export function SendModal({
  projectCreatorId,
  currentUserId,
  orgMembers,
  onConfirm,
  onClose,
}: SendModalProps) {
  // Exclure le créateur et soi-même (séparation des responsabilités)
  const eligible = orgMembers.filter(
    (m) => m.id !== projectCreatorId && m.id !== currentUserId,
  );

  const [targetUserId, setTargetUserId] = useState<string>('admin');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    selectRef.current?.focus();
  }, []);

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    try {
      await onConfirm({
        targetUserId: targetUserId === 'admin' ? undefined : targetUserId,
        reason: reason.trim() || undefined,
      });
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
            <Send className="h-5 w-5 text-indigo-500" />
            <h2 className="text-base font-semibold text-slate-900">Envoyer pour vérification</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Destinataire *</label>
            <select
              ref={selectRef}
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <optgroup label="Administration">
                <option value="admin">
                  Envoyer à l&apos;Admin — pour validation &amp; publication
                </option>
              </optgroup>
              {eligible.length > 0 && (
                <optgroup label="Membres de l'organisation">
                  {eligible.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {targetUserId === 'admin' && (
              <p className="mt-1 text-xs text-indigo-600 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" />
                L&apos;admin recevra une notification et pourra valider ou demander des modifications.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Commentaire <span className="text-slate-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ajouter une note pour le destinataire…"
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button variant="primary" size="sm" loading={loading} onClick={handleConfirm}>
            <Send className="h-4 w-4" />
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
}
