'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, CheckCircle, XCircle, Archive, Send } from 'lucide-react';
import { ArticleCycle } from '@cps/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import type { ArticleItem, SerieItem } from '@/lib/api/referential';
import {
  getArticles,
  getSeries,
  createArticle,
  updateArticle,
  deleteArticle,
  submitArticleForPublication,
  publishArticle,
  rejectArticlePublication,
  archiveArticle,
} from '@/lib/api/referential';
import { ConfirmDialog } from './confirm-dialog';

const CYCLE_BADGE: Record<ArticleCycle, BadgeVariant> = {
  [ArticleCycle.DRAFT]: 'default',
  [ArticleCycle.PUBLISHING]: 'warning',
  [ArticleCycle.PUBLISHED]: 'success',
  [ArticleCycle.ARCHIVING]: 'warning',
};

const CYCLE_LABEL: Record<ArticleCycle, string> = {
  [ArticleCycle.DRAFT]: 'Brouillon',
  [ArticleCycle.PUBLISHING]: 'En publication',
  [ArticleCycle.PUBLISHED]: 'Publié',
  [ArticleCycle.ARCHIVING]: 'En archivage',
};

interface FormState {
  title: string;
  description: string;
  unit: string;
  serieId: string;
}

const EMPTY: FormState = { title: '', description: '', unit: '', serieId: '' };

function ArticleForm({
  initial,
  series,
  isEditing,
  saving,
  onSave,
  onClose,
}: {
  initial: FormState;
  series: SerieItem[];
  isEditing: boolean;
  saving: boolean;
  onSave: (f: FormState) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const canSubmit = form.title.trim() !== '' && (isEditing || form.unit.trim() !== '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-slate-900">
          {isEditing ? "Modifier l'article" : 'Nouvel article'}
        </h2>
        <div className="mt-4 space-y-4">
          <Input
            id="art-title"
            label="Titre *"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Titre de l'article"
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="art-desc" className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="art-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Description (optionnel)"
            />
          </div>
          <Input
            id="art-unit"
            label="Unité *"
            value={form.unit}
            onChange={(e) => set('unit', e.target.value)}
            placeholder="ex: m², ml, u"
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="art-serie" className="text-sm font-medium text-slate-700">
              Série
            </label>
            <select
              id="art-serie"
              value={form.serieId}
              onChange={(e) => set('serieId', e.target.value)}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— Aucune série —</option>
              {series.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code ? `${s.code} — ` : ''}
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button size="sm" onClick={() => onSave(form)} loading={saving} disabled={!canSubmit}>
            {isEditing ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ArticleTab() {
  const { can } = useAuth();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [series, setSeries] = useState<SerieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ArticleItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ArticleItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const canManage = can('referential:manage');
  const canPublish = can('referential:publish');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [arts, sers] = await Promise.all([getArticles(), getSeries()]);
      setArticles(arts);
      setSeries(sers);
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
      if (editItem) {
        await updateArticle(editItem.id, {
          title: form.title,
          description: form.description || null,
          unit: form.unit || null,
          serieId: form.serieId || null,
        });
      } else {
        await createArticle({
          title: form.title,
          description: form.description || null,
          unit: form.unit || null,
          serieId: form.serieId || null,
        });
      }
      setFormOpen(false);
      setEditItem(null);
      await load();
    } catch {
      // no-op — backend error surfaced via network
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteArticle(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch {
      // no-op
    } finally {
      setDeleting(false);
    }
  }

  async function runAction(id: string, fn: () => Promise<ArticleItem>) {
    setActionId(id);
    try {
      await fn();
      await load();
    } catch {
      // no-op
    } finally {
      setActionId(null);
    }
  }

  const serieMap = new Map(series.map((s) => [s.id, s]));

  const initial: FormState = editItem
    ? {
        title: editItem.title,
        description: editItem.description ?? '',
        unit: editItem.unit ?? '',
        serieId: editItem.serieId ?? '',
      }
    : EMPTY;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {articles.length} article{articles.length !== 1 ? 's' : ''}
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
            Nouvel article
          </Button>
        )}
      </div>

      {loading && <p className="py-12 text-center text-sm text-slate-400">Chargement…</p>}
      {error && <p className="py-12 text-center text-sm text-red-500">{error}</p>}
      {!loading && !error && articles.length === 0 && (
        <p className="py-12 text-center text-sm italic text-slate-400">Aucun article</p>
      )}

      {!loading && articles.length > 0 && (
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
                  Unité
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Série
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  État
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {articles.map((a) => {
                const serie = a.serieId ? serieMap.get(a.serieId) : undefined;
                const busy = actionId === a.id;
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{a.code ?? '—'}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{a.title}</td>
                    <td className="px-4 py-3 text-slate-600">{a.unit ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {serie ? `${serie.code ? `${serie.code} ` : ''}${serie.name}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={CYCLE_BADGE[a.cycle]}>{CYCLE_LABEL[a.cycle]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {a.cycle === ArticleCycle.DRAFT && canManage && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              onClick={() => {
                                setEditItem(a);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              onClick={() => setDeleteTarget(a)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              loading={busy}
                              onClick={() =>
                                runAction(a.id, () => submitArticleForPublication(a.id))
                              }
                            >
                              <Send className="h-3.5 w-3.5" />
                              Soumettre
                            </Button>
                          </>
                        )}
                        {a.cycle === ArticleCycle.PUBLISHING && (
                          <>
                            {canPublish && (
                              <Button
                                size="sm"
                                loading={busy}
                                onClick={() => runAction(a.id, () => publishArticle(a.id))}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Publier
                              </Button>
                            )}
                            {canManage && (
                              <Button
                                variant="secondary"
                                size="sm"
                                loading={busy}
                                onClick={() =>
                                  runAction(a.id, () => rejectArticlePublication(a.id))
                                }
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Rejeter
                              </Button>
                            )}
                          </>
                        )}
                        {a.cycle === ArticleCycle.PUBLISHED && canManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={busy}
                            onClick={() => runAction(a.id, () => archiveArticle(a.id))}
                          >
                            <Archive className="h-3.5 w-3.5" />
                            Archiver
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <ArticleForm
          initial={initial}
          series={series}
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
        title="Supprimer l'article"
        message={`Confirmer la suppression de « ${deleteTarget?.title} » ?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
