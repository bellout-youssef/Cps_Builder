'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import type { RefDocItem } from '@/lib/api/referential';
import { getRefDocs, createRefDoc, updateRefDoc, deleteRefDoc } from '@/lib/api/referential';
import { ConfirmDialog } from './confirm-dialog';

interface FormState {
  code: string;
  title: string;
  url: string;
  description: string;
}

const EMPTY: FormState = { code: '', title: '', url: '', description: '' };

function RefDocForm({
  initial,
  isEditing,
  saving,
  onSave,
  onClose,
}: {
  initial: FormState;
  isEditing: boolean;
  saving: boolean;
  onSave: (f: FormState) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-slate-900">
          {isEditing ? 'Modifier le document' : 'Nouveau document de référence'}
        </h2>
        <div className="mt-4 space-y-4">
          <Input
            id="dr-code"
            label="Code (ex: DR-0001)"
            value={form.code}
            onChange={(e) => set('code', e.target.value)}
            placeholder="DR-0001"
          />
          <Input
            id="dr-title"
            label="Titre *"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Titre du document"
          />
          <Input
            id="dr-url"
            label="Lien URL *"
            type="url"
            value={form.url}
            onChange={(e) => set('url', e.target.value)}
            placeholder="https://…"
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="dr-desc" className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="dr-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Description (optionnel)"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button
            size="sm"
            onClick={() => onSave(form)}
            loading={saving}
            disabled={!form.title.trim() || !form.url.trim()}
          >
            {isEditing ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function RefDocTab() {
  const { can } = useAuth();
  const [docs, setDocs] = useState<RefDocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<RefDocItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RefDocItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = can('referential:manage');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setDocs(await getRefDocs());
    } catch {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSave(form: FormState) {
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        title: form.title,
        url: form.url,
        description: form.description || null,
      };
      if (editItem) {
        await updateRefDoc(editItem.id, payload);
      } else {
        await createRefDoc(payload);
      }
      setFormOpen(false);
      setEditItem(null);
      await load();
    } catch {
      // no-op
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRefDoc(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch {
      // no-op
    } finally {
      setDeleting(false);
    }
  }

  const initial: FormState = editItem
    ? {
        code: editItem.code,
        title: editItem.title,
        url: editItem.url,
        description: editItem.description ?? '',
      }
    : EMPTY;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {docs.length} document{docs.length !== 1 ? 's' : ''}
        </p>
        {canManage && (
          <Button
            size="sm"
            onClick={() => {
              setEditItem(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nouveau document
          </Button>
        )}
      </div>

      {loading && <p className="py-12 text-center text-sm text-slate-400">Chargement…</p>}
      {error && <p className="py-12 text-center text-sm text-red-500">{error}</p>}
      {!loading && !error && docs.length === 0 && (
        <p className="py-12 text-center text-sm italic text-slate-400">
          Aucun document de référence
        </p>
      )}

      {!loading && docs.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Titre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Lien
                </th>
                {canManage && (
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {docs.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">{d.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{d.title}</td>
                  <td className="px-4 py-3">
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ouvrir
                    </a>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditItem(d);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(d)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <RefDocForm
          initial={initial}
          isEditing={!!editItem}
          saving={saving}
          onSave={handleSave}
          onClose={() => {
            setFormOpen(false);
            setEditItem(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer le document"
        message={`Confirmer la suppression de « ${deleteTarget?.title} » ?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
