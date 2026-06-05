'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/auth-context';
import { ArticleTab } from '@/components/referentiel/article-tab';
import { ClauseTab } from '@/components/referentiel/clause-tab';
import { FicheTab } from '@/components/referentiel/fiche-tab';
import { SerieTab } from '@/components/referentiel/serie-tab';
import { UnitTab } from '@/components/referentiel/unit-tab';
import { FormulaTab } from '@/components/referentiel/formula-tab';
import { RefDocTab } from '@/components/referentiel/refdoc-tab';
import { CpsModelTab } from '@/components/referentiel/cpsmodel-tab';

const TABS = [
  { key: 'articles', label: 'Articles', Component: ArticleTab },
  { key: 'clauses', label: 'Clauses Techniques', Component: ClauseTab },
  { key: 'fiches', label: 'Fiches Techniques', Component: FicheTab },
  { key: 'series', label: 'Séries', Component: SerieTab },
  { key: 'unites', label: 'Unités', Component: UnitTab },
  { key: 'revision', label: 'Révision des prix', Component: FormulaTab },
  { key: 'documents', label: 'Documents de réf.', Component: RefDocTab },
  { key: 'modeles', label: 'Modèles CPS', Component: CpsModelTab },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function ReferentielPage() {
  const { can } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('articles');
  const [mounted, setMounted] = useState<Set<TabKey>>(new Set(['articles']));

  if (!can('referential:read')) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Accès non autorisé.</p>
      </div>
    );
  }

  function switchTab(key: TabKey) {
    setActiveTab(key);
    setMounted((prev) => new Set([...prev, key]));
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 pt-6 pb-0">
        <h1 className="text-lg font-semibold text-slate-900">Référentiel</h1>
        <p className="mt-0.5 mb-4 text-sm text-slate-500">
          Gestion des articles, clauses, fiches techniques et référentiels documentaires.
        </p>

        {/* Tab bar */}
        <div className="-mb-px flex gap-0 overflow-x-auto">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={clsx(
                'shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                activeTab === key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab panels — keep mounted tabs in DOM to avoid re-fetch on switch */}
      <div className="flex-1 overflow-y-auto p-6">
        {TABS.map(({ key, Component }) =>
          mounted.has(key) ? (
            <div key={key} className={activeTab === key ? 'block' : 'hidden'}>
              <Component />
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
