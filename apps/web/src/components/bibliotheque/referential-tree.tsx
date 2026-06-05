'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, Folder, Hash, Layers } from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import type { SerieItem, ArticleItem } from '@/lib/api/referential';
import { ArticleCycle, ProjectType } from '@cps/shared';

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

const TYPE_LABEL: Record<ProjectType, string> = {
  [ProjectType.A]: 'Aménagement',
  [ProjectType.B]: 'Bâtiment',
  [ProjectType.O]: "Ouvrages d'art",
  [ProjectType.M]: 'Maritime et Portuaire',
  [ProjectType.E]: 'MT/BT',
};

const TYPE_ORDER: ProjectType[] = [
  ProjectType.A,
  ProjectType.B,
  ProjectType.O,
  ProjectType.M,
  ProjectType.E,
];

/** Extract project type from serie code prefix — e.g. "A-100" → "A" */
function typeFromCode(code: string | null): ProjectType | null {
  if (!code) return null;
  const prefix = code.split('-')[0] as ProjectType;
  return Object.values(ProjectType).includes(prefix) ? prefix : null;
}

function ArticleRow({ article }: { article: ArticleItem }) {
  return (
    <div className="flex items-center gap-2 rounded py-1.5 pl-4 pr-3 hover:bg-slate-50">
      <Hash className="h-3 w-3 flex-shrink-0 text-slate-300" />
      <span className="w-16 flex-shrink-0 font-mono text-xs text-slate-400">
        {article.code ?? '—'}
      </span>
      <span className="flex-1 truncate text-sm text-slate-600">{article.title}</span>
      <Badge variant={CYCLE_BADGE[article.cycle]}>
        {CYCLE_LABEL[article.cycle] ?? article.cycle}
      </Badge>
    </div>
  );
}

function SerieNode({ serie, articles }: { serie: SerieItem; articles: ArticleItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded px-3 py-2 transition-colors hover:bg-slate-50"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
        )}
        {open ? (
          <FolderOpen className="h-4 w-4 flex-shrink-0 text-amber-400" />
        ) : (
          <Folder className="h-4 w-4 flex-shrink-0 text-amber-400" />
        )}
        {serie.code && (
          <span className="w-16 flex-shrink-0 font-mono text-xs text-slate-400">{serie.code}</span>
        )}
        <span className="flex-1 text-left text-sm font-medium text-slate-700">{serie.name}</span>
        <span className="text-xs text-slate-400">
          {articles.length} article{articles.length !== 1 ? 's' : ''}
        </span>
      </button>
      {open && (
        <div className="ml-6 border-l border-slate-200">
          {articles.length === 0 ? (
            <p className="py-2 pl-4 text-xs italic text-slate-400">Aucun article</p>
          ) : (
            articles.map((a) => <ArticleRow key={a.id} article={a} />)
          )}
        </div>
      )}
    </div>
  );
}

function TypeGroup({
  type,
  series,
  articlesBySerie,
}: {
  type: ProjectType;
  series: SerieItem[];
  articlesBySerie: Map<string, ArticleItem[]>;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded px-2 py-2 transition-colors hover:bg-slate-50"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
        )}
        <Layers className="h-4 w-4 flex-shrink-0 text-indigo-500" />
        <span className="flex-1 text-left text-sm font-semibold text-slate-800">
          {TYPE_LABEL[type]}
        </span>
        <span className="text-xs text-slate-400">
          {series.length} série{series.length !== 1 ? 's' : ''}
        </span>
      </button>
      {open && (
        <div className="ml-5 border-l border-slate-200">
          {series.map((s) => (
            <SerieNode key={s.id} serie={s} articles={articlesBySerie.get(s.id) ?? []} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReferentialTreeProps {
  series: SerieItem[];
  articles: ArticleItem[];
  emptyMessage?: string;
}

export function ReferentialTree({
  series,
  articles,
  emptyMessage = 'Aucune série',
}: ReferentialTreeProps) {
  if (series.length === 0) {
    return <p className="py-12 text-center text-sm italic text-slate-400">{emptyMessage}</p>;
  }

  const articlesBySerie = new Map<string, ArticleItem[]>();
  for (const a of articles) {
    if (!a.serieId) continue;
    const existing = articlesBySerie.get(a.serieId) ?? [];
    articlesBySerie.set(a.serieId, [...existing, a]);
  }

  const seriesByType = new Map<ProjectType, SerieItem[]>();
  const unclassified: SerieItem[] = [];

  for (const s of series) {
    const type = typeFromCode(s.code);
    if (type) {
      const existing = seriesByType.get(type) ?? [];
      seriesByType.set(type, [...existing, s]);
    } else {
      unclassified.push(s);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-2">
      {TYPE_ORDER.filter((t) => seriesByType.has(t)).map((t) => (
        <TypeGroup
          key={t}
          type={t}
          series={seriesByType.get(t)!}
          articlesBySerie={articlesBySerie}
        />
      ))}
      {unclassified.map((s) => (
        <SerieNode key={s.id} serie={s} articles={articlesBySerie.get(s.id) ?? []} />
      ))}
    </div>
  );
}
