'use client';

import { clsx } from 'clsx';
import type { CpsQuestionnaire } from '../cps-questionnaire.types';

type VarianteFields = Pick<CpsQuestionnaire, 'variante' | 'variante_series'>;

interface Props {
  data: VarianteFields;
  onChange: (data: VarianteFields) => void;
}

export function Step10Variante({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700">
          Variante autorisée ? — Art 2.13
        </p>
        <div className="flex gap-3">
          {(
            [
              {
                value: 'oui' as const,
                label: 'Oui — variante autorisée',
                desc: 'La règle Q réalisée ≥ Q bordereau s\'applique',
              },
              {
                value: 'non' as const,
                label: 'Non applicable',
                desc: 'L\'article 2.13 sera marqué « Dispositions Non Applicables »',
              },
            ] as const
          ).map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ ...data, variante: value })}
              className={clsx(
                'flex flex-1 flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                data.variante === value
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              )}
            >
              <span
                className={clsx(
                  'text-sm font-semibold',
                  data.variante === value ? 'text-indigo-700' : 'text-slate-800',
                )}
              >
                {label}
              </span>
              <span className="text-xs text-slate-500">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {data.variante === 'oui' && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 space-y-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="variante-series" className="text-sm font-medium text-slate-700">
              Séries / lots concernés par la variante
            </label>
            <input
              id="variante-series"
              type="text"
              placeholder="Ex : Série A-100 — Terrassements"
              value={data.variante_series}
              onChange={(e) => onChange({ ...data, variante_series: e.target.value })}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="rounded-lg border border-indigo-200 bg-white p-3 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700">Règles de quantité applicables :</p>
            <p>• Q réalisée ≥ Q bordereau → Quantité à payer = Q bordereau</p>
            <p>• Q réalisée &lt; Q bordereau → Quantité à payer = Q réalisée + 0,5 × (Q bordereau − Q réalisée)</p>
          </div>
        </div>
      )}
    </div>
  );
}
