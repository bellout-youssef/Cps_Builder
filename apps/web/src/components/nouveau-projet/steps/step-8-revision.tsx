'use client';

import { clsx } from 'clsx';
import { Input } from '@/components/ui/input';
import type { CpsQuestionnaire } from '../cps-questionnaire.types';

type RevisionFields = Pick<
  CpsQuestionnaire,
  'revision_prix' | 'rev_k' | 'rev_a' | 'rev_b' | 'rev_plafond'
>;

interface Props {
  data: RevisionFields;
  onChange: (data: RevisionFields) => void;
}

export function Step8Revision({ data, onChange }: Props) {
  const isRevisable = data.revision_prix === 'revisable';

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700">
          Révision des prix — Art 2.9
        </p>
        <div className="flex gap-3">
          {(
            [
              {
                value: 'ferme' as const,
                label: 'Prix fermes et non révisables',
                desc: 'Les prix ne varient pas pendant l\'exécution',
              },
              {
                value: 'revisable' as const,
                label: 'Prix révisables',
                desc: 'Conformément à l\'Arrêté n° 3-302-15 du 27/11/2015',
              },
            ] as const
          ).map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ ...data, revision_prix: value })}
              className={clsx(
                'flex flex-1 flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                data.revision_prix === value
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              )}
            >
              <span
                className={clsx(
                  'text-sm font-semibold',
                  data.revision_prix === value ? 'text-indigo-700' : 'text-slate-800',
                )}
              >
                {label}
              </span>
              <span className="text-xs text-slate-500">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {isRevisable && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 space-y-4">
          <div className="rounded-lg border border-indigo-200 bg-white p-3 font-mono text-sm text-center text-indigo-800">
            P = Po&nbsp;[&nbsp;<strong>{data.rev_k || 'k'}</strong>&nbsp;+&nbsp;
            <strong>{data.rev_a || 'a(I/Io)'}</strong>&nbsp;+&nbsp;
            <strong>{data.rev_b || 'b(…)'}</strong>&nbsp;]
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="rev-k"
              label="Partie fixe k"
              placeholder="Ex : 0,15"
              value={data.rev_k}
              onChange={(e) => onChange({ ...data, rev_k: e.target.value })}
            />
            <Input
              id="rev-a"
              label="Terme a (index principal)"
              placeholder="Ex : 0,70 (Ia/Iao)"
              value={data.rev_a}
              onChange={(e) => onChange({ ...data, rev_a: e.target.value })}
            />
            <Input
              id="rev-b"
              label="Terme b (index secondaire)"
              placeholder="Ex : 0,15 (Ib/Ibo)"
              value={data.rev_b}
              onChange={(e) => onChange({ ...data, rev_b: e.target.value })}
            />
            <Input
              id="rev-plafond"
              label="Plafond de variation (%)"
              placeholder="5"
              value={data.rev_plafond}
              onChange={(e) => onChange({ ...data, rev_plafond: e.target.value })}
            />
          </div>
          <p className="text-xs text-slate-500">
            k + a + b = 1. La variation est plafonnée à ({data.rev_plafond || '5'} %) du montant
            initial. Indices DEPF (Direction des Études et des Prévisions Financières).
          </p>
        </div>
      )}
    </div>
  );
}
