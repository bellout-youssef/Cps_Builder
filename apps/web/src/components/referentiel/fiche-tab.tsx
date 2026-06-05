'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { ArticleCycle } from '@cps/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import type { FicheItem, ArticleItem } from '@/lib/api/referential';
import {
  getFiches,
  createFiche,
  updateFiche,
  deleteFiche,
  getArticles,
} from '@/lib/api/referential';
import { ConfirmDialog } from './confirm-dialog';

interface FormState {
  title: string;
  url: string;
  description: string;
  articleIds: string[];
}

const EMPTY: FormState = { title: '', url: '', description: '', articleIds: [] };

function FicheForm({
  initial,
  articles,
  isEditing,
  saving,
  onSave,
  onClose,
}: {
  initial: FormState;
  articles: ArticleItem[];
  isEditing: boolean;
  saving: boolean;
  onSave: (f: FormState) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function toggleArticle(id: string) {
    setForm((f) => ({
      ...f,
      articleIds: f.articleIds.includes(id)
        ? f.articleIds.filter((x) => x !== id)
        : [...f.articleIds, id],
    }));
  }

  const published = articles.filter((a) => a.cycle === ArticleCycle.PUBLISHED);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-slate-900">
          {isEditing ? 'Modifier la fiche' : 'Nouvelle fiche technique'}
        </h2>
        <div className="mt-4 space-y-4">
          <Input
            id="ft-title"
            label="Titre *"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Titre de la fiche"
          />
          <Input
            id="ft-url"
            label="Lien URL *"
            type="url"
            value={form.url}
            onChange={(e) => set('url', e.target.value)}
            placeholder="https://…"
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="ft-desc" className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="ft-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Description (optionnel)"
            />
          </div>
          {published.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-slate-700">Articles liés</p>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 p-2 space-y-1">
                {published.map((a) => (
                  <label key={a.id} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.articleIds.includes(a.id)}
                      onChange={() => toggleArticle(a.id)}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <span className="text-sm text-slate-700">
                      {a.code && (
                        <span className="mr-1 font-mono text-xs text-indigo-600">{a.code}</span>
                      )}
                      {a.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
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

export function FicheTab() {
  const { can } = useAuth();
  const [fiches, setFiches] = useState<FicheItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<FicheItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FicheItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = can('referential:manage');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [fs, arts] = await Promise.all([getFiches(), getArticles()]);
      setFiches(fs);
      setArticles(arts);
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
        title: form.title,
        url: form.url,
        description: form.description || null,
        articleIds: form.articleIds,
      };
      if (editItem) {
        await updateFiche(editItem.id, payload);
      } else {
        await createFiche(payload);
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
      await deleteFiche(deleteTarget.id);
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
        title: editItem.title,
        url: editItem.url,
        description: editItem.description ?? '',
        articleIds: editItem.articleIds,
      }
    : EMPTY;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {fiches.length} fiche{fiches.length !== 1 ? 's' : ''}
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
            Nouvelle fiche
          </Button>
        )}
      </div>

      {loading && <p className="py-12 text-center text-sm text-slate-400">Chargement…</p>}
      {error && <p className="py-12 text-center text-sm text-red-500">{error}</p>}
      {!loading && !error && fiches.length === 0 && (
        <p className="py-12 text-center text-sm italic text-slate-400">Aucune fiche technique</p>
      )}

      {!loading && fiches.length > 0 && (
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
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Articles
                </th>
                {canManage && (
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {fiches.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">{f.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{f.title}</td>
                  <td className="px-4 py-3">
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ouvrir
                    </a>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{f.articleIds.length}</td>
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
        <FicheForm
          initial={initial}
          articles={articles}
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
        title="Supprimer la fiche"
        message={`Confirmer la suppression de « ${deleteTarget?.title} » ?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
