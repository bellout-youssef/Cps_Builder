import { Badge, type BadgeVariant } from '@/components/ui/badge';
import type { SerieItem, ArticleItem } from '@/lib/api/referential';
import { ArticleCycle } from '@cps/shared';

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

interface ReferentialListProps {
  series: SerieItem[];
  articles: ArticleItem[];
  emptyMessage?: string;
}

export function ReferentialList({
  series,
  articles,
  emptyMessage = 'Aucune série',
}: ReferentialListProps) {
  if (series.length === 0) {
    return <p className="py-12 text-center text-sm italic text-slate-400">{emptyMessage}</p>;
  }

  const articlesBySerie = new Map<string, ArticleItem[]>();
  for (const a of articles) {
    if (!a.serieId) continue;
    const existing = articlesBySerie.get(a.serieId) ?? [];
    articlesBySerie.set(a.serieId, [...existing, a]);
  }

  return (
    <div className="space-y-3">
      {series.map((serie) => {
        const serieArticles = articlesBySerie.get(serie.id) ?? [];
        return (
          <div
            key={serie.id}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
              {serie.code && (
                <span className="font-mono text-sm font-semibold text-indigo-600">
                  {serie.code}
                </span>
              )}
              <span className="text-sm font-medium text-slate-700">{serie.name}</span>
              <span className="ml-auto text-xs text-slate-400">
                {serieArticles.length} article{serieArticles.length !== 1 ? 's' : ''}
              </span>
            </div>
            {serieArticles.length > 0 && (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-50">
                  {serieArticles.map((a) => (
                    <tr key={a.id} className="transition-colors hover:bg-slate-50">
                      <td className="w-24 px-4 py-2.5">
                        <span className="font-mono text-xs text-slate-400">{a.code ?? '—'}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-slate-700">{a.title}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Badge variant={CYCLE_BADGE[a.cycle]}>
                          {CYCLE_LABEL[a.cycle] ?? a.cycle}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
