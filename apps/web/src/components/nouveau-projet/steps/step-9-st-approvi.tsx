'use client';

import { clsx } from 'clsx';
import type { CpsQuestionnaire } from '../cps-questionnaire.types';

type StAproviFields = Pick<CpsQuestionnaire, 'st_exclus' | 'approvi'>;

interface Props {
  data: StAproviFields;
  onChange: (data: StAproviFields) => void;
}

export function Step9StApprovi({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Sous-traitance */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100 pb-1">
          Sous-traitance — Art 2.10
        </h3>
        <p className="text-sm text-slate-500">
          La sous-traitance nécessite l'accord préalable écrit du MO et ne peut dépasser 50 % du
          montant ni porter sur le lot principal.
        </p>
        <div className="flex flex-col gap-1">
          <label htmlFor="st-exclus" className="text-sm font-medium text-slate-700">
            Travaux exclus de la sous-traitance
          </label>
          <textarea
            id="st-exclus"
            rows={3}
            placeholder={'Ex :\n- Travaux de terrassement principal\n- Mise en œuvre de la chaussée définitive'}
            value={data.st_exclus}
            onChange={(e) => onChange({ ...data, st_exclus: e.target.value })}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-slate-400">
            Laisser vide si aucune exclusion spécifique. Une ligne par exclusion.
          </p>
        </div>
      </div>

      {/* Approvisionnements */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100 pb-1">
          Approvisionnements — Art 2.11
        </h3>
        <p className="text-sm font-medium text-slate-700">
          Acomptes sur approvisionnements prévus ?
        </p>
        <div className="flex gap-3">
          {(['oui', 'non'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ ...data, approvi: v })}
              className={clsx(
                'flex flex-1 flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                data.approvi === v
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              )}
            >
              <span
                className={clsx(
                  'text-sm font-semibold',
                  data.approvi === v ? 'text-indigo-700' : 'text-slate-800',
                )}
              >
                {v === 'oui' ? 'Oui — acomptes autorisés' : 'Non — pas d\'acomptes'}
              </span>
              <span className="text-xs text-slate-500">
                {v === 'oui'
                  ? 'Matériaux acquis, lotis sur chantier et nécessaires à l\'exécution'
                  : 'Le marché ne prévoit pas d\'acomptes sur approvisionnements'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
