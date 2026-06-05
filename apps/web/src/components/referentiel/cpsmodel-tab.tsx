'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { ProjectType } from '@cps/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import type { CpsModelItem } from '@/lib/api/referential';
import {
  getCpsModels,
  createCpsModel,
  updateCpsModel,
  deleteCpsModel,
} from '@/lib/api/referential';
import { ConfirmDialog } from './confirm-dialog';

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  [ProjectType.A]: 'Aménagement',
  [ProjectType.B]: 'Bâtiment',
  [ProjectType.O]: "Ouvrages d'art",
  [ProjectType.M]: 'Maritime et Portuaire',
  [ProjectType.E]: 'MT/BT',
};

interface FormState {
  code: string;
  name: string;
  description: string;
  projectTypes: string[];
}

const EMPTY: FormState = { code: '', name: '', description: '', projectTypes: [] };

function CpsModelForm({
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
  const set = (k: keyof FormState, v: FormState[keyof FormState]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function toggleType(t: string) {
    setForm((f) => ({
      ...f,
      projectTypes: f.projectTypes.includes(t)
        ? f.projectTypes.filter((x) => x !== t)
        : [...f.projectTypes, t],
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-slate-900">
          {isEditing ? 'Modifier le modèle' : 'Nouveau modèle CPS'}
        </h2>
        <div className="mt-4 space-y-4">
          <Input
            id="mcps-code"
            label="Code (ex: MCPS-T-001)"
            value={form.code}
            onChange={(e) => set('code', e.target.value)}
            placeholder="MCPS-T-001"
          />
          <Input
            id="mcps-name"
            label="Nom *"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Nom du modèle"
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="mcps-desc" className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="mcps-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Description (optionnel)"
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-700">Types de projet</p>
            <div className="flex flex-wrap gap-2">
              {(Object.values(ProjectType) as ProjectType[]).map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.projectTypes.includes(t)}
                    onChange={() => toggleType(t)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span className="text-sm text-slate-700">
                    <span className="font-medium">{t}</span> — {PROJECT_TYPE_LABELS[t]}
                  </span>
                </label>
              ))}
            </div>
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
            disabled={!form.name.trim()}
          >
            {isEditing ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CpsModelTab() {
  const { can } = useAuth();
  const [models, setModels] = useState<CpsModelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<CpsModelItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CpsModelItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = can('referential:manage');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setModels(await getCpsModels());
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
        name: form.name,
        description: form.description || null,
        projectTypes: form.projectTypes,
      };
      if (editItem) {
        await updateCpsModel(editItem.id, payload);
      } else {
        await createCpsModel(payload);
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
      await deleteCpsModel(deleteTarget.id);
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
        name: editItem.name,
        description: editItem.description ?? '',
        projectTypes: editItem.projectTypes,
      }
    : EMPTY;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {models.length} modèle{models.length !== 1 ? 's' : ''}
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
            Nouveau modèle
          </Button>
        )}
      </div>

      {loading && <p className="py-12 text-center text-sm text-slate-400">Chargement…</p>}
      {error && <p className="py-12 text-center text-sm text-red-500">{error}</p>}
      {!loading && !error && models.length === 0 && (
        <p className="py-12 text-center text-sm italic text-slate-400">Aucun modèle CPS</p>
      )}

      {!loading && models.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Nom
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Types
                </th>
                {canManage && (
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {models.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">{m.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {m.projectTypes.length === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        m.projectTypes.map((t) => (
                          <Badge key={t} variant="info">
                            {t}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditItem(m);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(m)}>
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
        <CpsModelForm
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
        title="Supprimer le modèle"
        message={`Confirmer la suppression de « ${deleteTarget?.name} » ?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
