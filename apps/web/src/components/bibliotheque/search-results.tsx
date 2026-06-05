import { FileText, BookOpen, Clipboard, File, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import type { SearchHit } from '@/lib/api/search';
import type { ElementType } from 'react';

const TYPE_ICON: Record<SearchHit['type'], ElementType> = {
  project: FileText,
  article: BookOpen,
  clause: Clipboard,
  fiche: File,
  document: File,
  formula: File,
};

const TYPE_LABEL: Record<SearchHit['type'], string> = {
  project: 'Projet',
  article: 'Article',
  clause: 'Clause',
  fiche: 'Fiche technique',
  document: 'Document',
  formula: 'Formule',
};

interface SearchResultsProps {
  hits: SearchHit[];
  query: string;
  loading: boolean;
  error?: string | null;
}

export function SearchResults({ hits, query, loading, error }: SearchResultsProps) {
  if (!query || query.length < 2) {
    return (
      <div className="flex flex-col items-center py-20">
        <Search className="h-10 w-10 text-slate-200" />
        <p className="mt-4 text-sm text-slate-400">
          Saisissez au moins 2 caractères pour lancer la recherche.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return <p className="py-10 text-center text-sm text-red-500">{error}</p>;
  }

  if (hits.length === 0) {
    return (
      <p className="py-12 text-center text-sm italic text-slate-400">
        Aucun résultat pour « {query} »
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <span className="text-xs text-slate-500">
          {hits.length} résultat{hits.length > 1 ? 's' : ''} pour « {query} »
        </span>
      </div>
      <ul className="divide-y divide-slate-100">
        {hits.map((hit) => {
          const Icon = TYPE_ICON[hit.type];
          return (
            <li
              key={`${hit.type}-${hit.id}`}
              className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
            >
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-400" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-800">{hit.title}</span>
                  {hit.code && <span className="font-mono text-xs text-slate-400">{hit.code}</span>}
                </div>
                {hit.description && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{hit.description}</p>
                )}
              </div>
              <Badge variant="default">{TYPE_LABEL[hit.type]}</Badge>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
