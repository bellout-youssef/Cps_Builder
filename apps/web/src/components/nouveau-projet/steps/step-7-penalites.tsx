'use client';

import { clsx } from 'clsx';
import { Input } from '@/components/ui/input';
import type { CpsQuestionnaire } from '../cps-questionnaire.types';

type PenalitesFields = Pick<
  CpsQuestionnaire,
  'delai_garantie' | 'penalite_taux' | 'penalite_plafond' | 'penalite_autres' | 'penalite_autres_detail'
>;

interface Props {
  data: PenalitesFields;
  onChange: (data: PenalitesFields) => void;
}

const GARANTIE_OPTIONS = [
  { value: '12 mois', label: '12 mois' },
  { value: '24 mois', label: '24 mois' },
  { value: '36 mois', label: '36 mois' },
  { value: '48 mois', label: '48 mois' },
];

export function Step7Penalites({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Délai de garantie */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100 pb-1">
          Délai de garantie — Art 2.7
        </h3>
        <div className="flex flex-col gap-1">
          <label htmlFor="delai-garantie" className="text-sm font-medium text-slate-700">
            Durée de la garantie
          </label>
          <div className="flex gap-2 flex-wrap">
            {GARANTIE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...data, delai_garantie: opt.value })}
                className={clsx(
                  'rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                  data.delai_garantie === opt.value
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                )}
              >
                {opt.label}
              </button>
            ))}
            <input
              type="text"
              value={
                GARANTIE_OPTIONS.some((o) => o.value === data.delai_garantie)
                  ? ''
                  : data.delai_garantie
              }
              onChange={(e) => onChange({ ...data, delai_garantie: e.target.value })}
              placeholder="Autre durée..."
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <p className="text-xs text-slate-400">
            À compter de la date de la réception provisoire.
          </p>
        </div>
      </div>

      {/* Pénalités pour retard */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100 pb-1">
          Pénalités pour retard — Art 2.8
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="penalite-taux" className="text-sm font-medium text-slate-700">
              Taux journalier (ex : 1/1000)
            </label>
            <input
              id="penalite-taux"
              type="text"
              placeholder="Ex : 1/1000"
              value={data.penalite_taux}
              onChange={(e) => onChange({ ...data, penalite_taux: e.target.value })}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-400">Fraction du montant du marché par jour de retard.</p>
          </div>
          <Input
            id="penalite-plafond"
            label="Plafond total des pénalités (%)"
            placeholder="10"
            value={data.penalite_plafond}
            onChange={(e) => onChange({ ...data, penalite_plafond: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Pénalités particulières additionnelles ?
          </p>
          <div className="flex gap-3">
            {(['oui', 'non'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange({ ...data, penalite_autres: v })}
                className={clsx(
                  'flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                  data.penalite_autres === v
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                )}
              >
                {v === 'oui' ? 'Oui' : 'Non'}
              </button>
            ))}
          </div>
        </div>

        {data.penalite_autres === 'oui' && (
          <div className="flex flex-col gap-1 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
            <label htmlFor="penalite-autres-detail" className="text-sm font-medium text-slate-700">
              Détail des pénalités particulières
            </label>
            <textarea
              id="penalite-autres-detail"
              rows={3}
              placeholder={'Ex :\n- Pénalité de 5 000 DH par document non remis dans les délais\n- Pénalité de 10 000 DH par PV de réunion non transmis'}
              value={data.penalite_autres_detail}
              onChange={(e) => onChange({ ...data, penalite_autres_detail: e.target.value })}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-400">Une pénalité par ligne.</p>
          </div>
        )}
      </div>
    </div>
  );
}
