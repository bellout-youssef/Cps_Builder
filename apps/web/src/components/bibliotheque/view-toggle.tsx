'use client';

import { List, GitBranch } from 'lucide-react';
import { clsx } from 'clsx';

export type ViewMode = 'liste' | 'arborescence';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
      <button
        onClick={() => onChange('liste')}
        className={clsx(
          'flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors',
          value === 'liste'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-500 hover:text-slate-700',
        )}
      >
        <List className="h-3.5 w-3.5" />
        Liste
      </button>
      <button
        onClick={() => onChange('arborescence')}
        className={clsx(
          'flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors',
          value === 'arborescence'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-500 hover:text-slate-700',
        )}
      >
        <GitBranch className="h-3.5 w-3.5" />
        Arborescence
      </button>
    </div>
  );
}
