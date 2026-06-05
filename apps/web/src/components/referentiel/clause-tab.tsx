'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { ArticleCycle } from '@cps/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import type { ClauseItem, ArticleItem } from '@/lib/api/referential';
import {
  getClauses,
  createClause,
  updateClause,
  deleteClause,
  getArticles,
} from '@/lib/api/referential';
import { ConfirmDialog } from './confirm-dialog';

const DOMAINS = ['A', 'B', 'O', 'M', 'E'] as const;
const DOMAIN_LABELS: Record<string, string> = {
  A: 'Aménagement',
  B: 'Bâtiment',
  O: "Ouvrages d'art",
  M: 'Maritime et Portuaire',
  E: 'MT/BT',
};

interface FormState {
  title: string;
  content: string;
  domain: string;
  articleIds: string[];
}

const EMPTY: FormState = { title: '', content: '', domain: '', articleIds: [] };

function ClauseForm({
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
          {isEditing ? 'Modifier la clause' : 'Nouvelle clause technique'}
        </h2>
        <div className="mt-4 space-y-4">
          <Input
            id="cl-title"
            label="Titre *"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Titre de la clause"
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="cl-domain" className="text-sm font-medium text-slate-700">
              Domaine
            </label>
            <select
              id="cl-domain"
              value={form.domain}
              onChange={(e) => set('domain', e.target.value)}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— Tous domaines —</option>
              {DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d} — {DOMAIN_LABELS[d]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="cl-content" className="text-sm font-medium text-slate-700">
              Contenu *
            </label>
            <textarea
              id="cl-content"
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              rows={6}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Contenu de la clause technique…"
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
            disabled={!form.title.trim() || !form.content.trim()}
          >
            {isEditing ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ClauseTab() {
  const { can } = useAuth();
  const [clauses, setClauses] = useState<ClauseItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ClauseItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClauseItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = can('referential:manage');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [cls, arts] = await Promise.all([getClauses(), getArticles()]);
      setClauses(cls);
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
        content: form.content,
        domain: form.domain || null,
        articleIds: form.articleIds,
      };
      if (editItem) {
        await updateClause(editItem.id, payload);
      } else {
        await createClause(payload);
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
      await deleteClause(deleteTarget.id);
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
        content: editItem.content,
        domain: editItem.domain ?? '',
        articleIds: editItem.articleIds,
      }
    : EMPTY;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {clauses.length} clause{clauses.length !== 1 ? 's' : ''}
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
            Nouvelle clause
          </Button>
        )}
      </div>

      {loading && <p className="py-12 text-center text-sm text-slate-400">Chargement…</p>}
      {error && <p className="py-12 text-center text-sm text-red-500">{error}</p>}
      {!loading && !error && clauses.length === 0 && (
        <p className="py-12 text-center text-sm italic text-slate-400">Aucune clause technique</p>
      )}

      {!loading && clauses.length > 0 && (
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
                  Domaine
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
              {clauses.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">{c.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{c.title}</td>
                  <td className="px-4 py-3">
                    {c.domain ? (
                      <Badge variant="info">
                        {c.domain} — {DOMAIN_LABELS[c.domain]}
                      </Badge>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.articleIds.length}</td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditItem(c);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(c)}>
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
        <ClauseForm
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
        title="Supprimer la clause"
        message={`Confirmer la suppression de « ${deleteTarget?.title} » ?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
