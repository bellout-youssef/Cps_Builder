'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Info } from 'lucide-react';
import type { ProjectType } from '@cps/shared';
import { getClausesForArticles, type ClauseItem } from '@/lib/api/clauses';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { clsx } from 'clsx';

interface StepClausesProps {
  selectedArticleIds: string[];
  projectTypes: ProjectType[];
  selectedClauseIds: string[];
  onChange: (ids: string[]) => void;
}

export function StepClauses({
  selectedArticleIds,
  projectTypes,
  selectedClauseIds,
  onChange,
}: StepClausesProps) {
  const [clauses, setClauses] = useState<ClauseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getClausesForArticles(selectedArticleIds, projectTypes)
      .then((results) => {
        setClauses(results);
        // Pre-select all auto-suggested clauses
        const autoIds = results
          .filter((c) => c.isAutoSuggested)
          .map((c) => c.id);
        onChange([...new Set([...selectedClauseIds, ...autoIds])]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArticleIds, projectTypes]);

  function toggle(id: string) {
    const next = selectedClauseIds.includes(id)
      ? selectedClauseIds.filter((i) => i !== id)
      : [...selectedClauseIds, id];
    onChange(next);
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const suggested = clauses.filter((c) => c.isAutoSuggested);
  const others = clauses.filter((c) => !c.isAutoSuggested);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500" />
        <p className="text-sm text-indigo-700">
          Les clauses marquées{' '}
          <span className="inline-flex items-center gap-1 font-medium">
            <Sparkles className="h-3 w-3" /> suggérées
          </span>{' '}
          ont été proposées automatiquement d'après les articles sélectionnés. Vous pouvez les
          désélectionner ou en ajouter d'autres.
        </p>
      </div>

      {clauses.length === 0 ? (
        <p className="py-8 text-center text-sm italic text-slate-400">
          Aucune clause disponible pour les articles sélectionnés.
          {selectedArticleIds.length === 0 && ' Sélectionnez d\'abord des articles à l\'étape précédente.'}
        </p>
      ) : (
        <div className="space-y-4">
          {suggested.length > 0 && (
            <ClauseGroup
              title="Clauses suggérées automatiquement"
              clauses={suggested}
              selectedIds={selectedClauseIds}
              expanded={expanded}
              onToggle={toggle}
              onExpand={setExpanded}
              auto
            />
          )}
          {others.length > 0 && (
            <ClauseGroup
              title="Autres clauses disponibles"
              clauses={others}
              selectedIds={selectedClauseIds}
              expanded={expanded}
              onToggle={toggle}
              onExpand={setExpanded}
            />
          )}
        </div>
      )}

      {selectedClauseIds.length > 0 && (
        <p className="text-right text-xs text-slate-500">
          {selectedClauseIds.length} clause{selectedClauseIds.length > 1 ? 's' : ''} sélectionnée{selectedClauseIds.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

interface ClauseGroupProps {
  title: string;
  clauses: ClauseItem[];
  selectedIds: string[];
  expanded: string | null;
  onToggle: (id: string) => void;
  onExpand: (id: string | null) => void;
  auto?: boolean;
}

function ClauseGroup({ title, clauses, selectedIds, expanded, onToggle, onExpand, auto }: ClauseGroupProps) {
  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {auto && <Sparkles className="h-3.5 w-3.5 text-indigo-400" />}
        {title}
        <Badge variant={auto ? 'info' : 'default'}>{clauses.length}</Badge>
      </h4>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
        {clauses.map((clause) => {
          const selected = selectedIds.includes(clause.id);
          const isOpen = expanded === clause.id;
          return (
            <li key={clause.id} className={clsx('transition-colors', selected ? 'bg-white' : 'bg-slate-50/50')}>
              <div className="flex items-start gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  id={`clause-${clause.id}`}
                  checked={selected}
                  onChange={() => onToggle(clause.id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`clause-${clause.id}`}
                      className="cursor-pointer text-sm font-medium text-slate-800"
                    >
                      <span className="mr-2 font-mono text-xs text-slate-400">{clause.code}</span>
                      {clause.title}
                    </label>
                    {auto && <Badge variant="info" className="text-[10px]">Suggérée</Badge>}
                  </div>
                  {clause.content && (
                    <>
                      <button
                        type="button"
                        onClick={() => onExpand(isOpen ? null : clause.id)}
                        className="mt-1 text-xs text-indigo-600 hover:text-indigo-700"
                      >
                        {isOpen ? 'Masquer' : 'Aperçu du contenu'}
                      </button>
                      {isOpen && (
                        <p className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 line-clamp-6 whitespace-pre-wrap">
                          {clause.content}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
