'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import type { FormulaItem } from '@/lib/api/referential';
import { getFormulas, createFormula, updateFormula, deleteFormula } from '@/lib/api/referential';
import { ConfirmDialog } from './confirm-dialog';

interface FormState {
  code: string;
  name: string;
  formula: string;
  description: string;
}

const EMPTY: FormState = { code: '', name: '', formula: '', description: '' };

function FormulaForm({
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
          {isEditing ? 'Modifier la formule' : 'Nouvelle formule de révision'}
        </h2>
        <div className="mt-4 space-y-4">
          <Input
            id="frp-code"
            label="Code (ex: FRP-T-001)"
            value={form.code}
            onChange={(e) => set('code', e.target.value)}
            placeholder="FRP-T-001"
          />
          <Input
            id="frp-name"
            label="Nom *"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Nom de la formule"
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="frp-formula" className="text-sm font-medium text-slate-700">
              Formule *
            </label>
            <textarea
              id="frp-formula"
              value={form.formula}
              onChange={(e) => set('formula', e.target.value)}
              rows={3}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="ex: 0.15×(Mn/Mo) + 0.35×(En/Eo) + 0.50"
            />
          </div>
          <Input
            id="frp-desc"
            label="Description"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Description (optionnel)"
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button
            size="sm"
            onClick={() => onSave(form)}
            loading={saving}
            disabled={!form.name.trim() || !form.formula.trim()}
          >
            {isEditing ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FormulaTab() {
  const { can } = useAuth();
  const [formulas, setFormulas] = useState<FormulaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<FormulaItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FormulaItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = can('referential:manage');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setFormulas(await getFormulas());
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
        formula: form.formula,
        description: form.description || null,
      };
      if (editItem) {
        await updateFormula(editItem.id, payload);
      } else {
        await createFormula(payload);
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
      await deleteFormula(deleteTarget.id);
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
        formula: editItem.formula,
        description: editItem.description ?? '',
      }
    : EMPTY;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {formulas.length} formule{formulas.length !== 1 ? 's' : ''}
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
            Nouvelle formule
          </Button>
        )}
      </div>

      {loading && <p className="py-12 text-center text-sm text-slate-400">Chargement…</p>}
      {error && <p className="py-12 text-center text-sm text-red-500">{error}</p>}
      {!loading && !error && formulas.length === 0 && (
        <p className="py-12 text-center text-sm italic text-slate-400">
          Aucune formule de révision
        </p>
      )}

      {!loading && formulas.length > 0 && (
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
                  Formule
                </th>
                {canManage && (
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {formulas.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">{f.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{f.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 max-w-xs truncate">
                    {f.formula}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditItem(f);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(f)}>
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
        <FormulaForm
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
        title="Supprimer la formule"
        message={`Confirmer la suppression de « ${deleteTarget?.name} » ?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
