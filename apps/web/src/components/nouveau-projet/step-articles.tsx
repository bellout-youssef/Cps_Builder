'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { ArticleCycle } from '@cps/shared';
import { getSeries, getArticles, type SerieItem, type ArticleItem } from '@/lib/api/referential';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { clsx } from 'clsx';

interface StepArticlesProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function StepArticles({ selectedIds, onChange }: StepArticlesProps) {
  const [series, setSeries] = useState<SerieItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([getSeries(), getArticles()])
      .then(([s, a]) => {
        setSeries(s);
        setArticles(a.filter((ar) => ar.cycle === ArticleCycle.PUBLISHED));
        setExpanded(new Set(s.map((se) => se.id)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? articles.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            (a.code ?? '').toLowerCase().includes(q) ||
            (a.description ?? '').toLowerCase().includes(q),
        )
      : articles;
  }, [articles, search]);

  const bySerieId = useMemo(() => {
    const map = new Map<string | null, ArticleItem[]>();
    filtered.forEach((a) => {
      const key = a.serieId ?? null;
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    });
    return map;
  }, [filtered]);

  function toggle(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    onChange(next);
  }

  function toggleSerie(serieId: string | null) {
    const serieArticles = bySerieId.get(serieId) ?? [];
    const allSelected = serieArticles.every((a) => selectedIds.includes(a.id));
    const ids = serieArticles.map((a) => a.id);
    if (allSelected) {
      onChange(selectedIds.filter((id) => !ids.includes(id)));
    } else {
      const toAdd = ids.filter((id) => !selectedIds.includes(id));
      onChange([...selectedIds, ...toAdd]);
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const orderedSeries = series.filter((s) => bySerieId.has(s.id));
  const unsorted = bySerieId.get(null) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Sélectionnez les articles à inclure dans ce CPS.
        </p>
        {selectedIds.length > 0 && (
          <Badge variant="info">{selectedIds.length} article{selectedIds.length > 1 ? 's' : ''} sélectionné{selectedIds.length > 1 ? 's' : ''}</Badge>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher un article..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm italic text-slate-400">Aucun article trouvé</p>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[420px] pr-1">
          {orderedSeries.map((serie) => {
            const arts = bySerieId.get(serie.id) ?? [];
            const allSelected = arts.every((a) => selectedIds.includes(a.id));
            const someSelected = arts.some((a) => selectedIds.includes(a.id));
            const isOpen = expanded.has(serie.id);

            return (
              <div key={serie.id} className="rounded-xl border border-slate-200 overflow-hidden">
                {/* Serie header */}
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange={() => toggleSerie(serie.id)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => toggleExpand(serie.id)}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="text-sm font-semibold text-slate-700">
                      {serie.code ? `${serie.code} — ` : ''}{serie.name}
                    </span>
                    <span className="ml-auto text-xs text-slate-400">{arts.length} articles</span>
                  </button>
                </div>

                {/* Articles */}
                {isOpen && (
                  <ul className="divide-y divide-slate-100">
                    {arts.map((article) => (
                      <li key={article.id}>
                        <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(article.id)}
                            onChange={() => toggle(article.id)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800">
                              {article.code && (
                                <span className="mr-2 font-mono text-xs text-slate-500">
                                  {article.code}
                                </span>
                              )}
                              {article.title}
                            </p>
                            {article.description && (
                              <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                                {article.description}
                              </p>
                            )}
                          </div>
                          {article.unit && (
                            <span className="ml-2 flex-shrink-0 text-xs text-slate-400">
                              {article.unit}
                            </span>
                          )}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}

          {unsorted.length > 0 && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5">
                <span className="text-sm font-semibold text-slate-500 italic">Sans série</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {unsorted.map((article) => (
                  <li key={article.id}>
                    <label className={clsx('flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-slate-50')}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(article.id)}
                        onChange={() => toggle(article.id)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800">{article.title}</p>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
