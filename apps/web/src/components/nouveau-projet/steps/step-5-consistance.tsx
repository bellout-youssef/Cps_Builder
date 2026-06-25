'use client';

import { clsx } from 'clsx';
import type { CpsQuestionnaire } from '../cps-questionnaire.types';

type ConsistanceFields = Pick<CpsQuestionnaire, 'consistance' | 'textes_speciaux' | 'caut_prov'>;

interface Props {
  data: ConsistanceFields;
  onChange: (data: ConsistanceFields) => void;
}

export function Step5Consistance({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="consistance" className="text-sm font-medium text-slate-700">
          Consistance des travaux — Art 2.3
        </label>
        <textarea
          id="consistance"
          rows={4}
          placeholder={'Saisissez chaque poste de travaux sur une ligne :\n- Terrassements généraux\n- Réseaux d\'assainissement\n- Voirie et revêtement'}
          value={data.consistance}
          onChange={(e) => onChange({ ...data, consistance: e.target.value })}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-slate-400">Une ligne par poste. Chaque ligne devient une puce dans le document.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="textes-speciaux" className="text-sm font-medium text-slate-700">
          Textes spéciaux applicables — Art 2.4
        </label>
        <textarea
          id="textes-speciaux"
          rows={4}
          placeholder={'Ex :\n- Devis général d\'architecture (1956)\n- Règles BAEL 91 / CCBA 68\n- Norme NM 01.4.007'}
          value={data.textes_speciaux}
          onChange={(e) => onChange({ ...data, textes_speciaux: e.target.value })}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-slate-400">
          Textes réglementaires spécifiques au marché (en plus des textes généraux de l'Art 1.2).
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">
          Cautionnement provisoire exigé ? — Art 2.5
        </p>
        <div className="flex gap-3">
          {(['oui', 'non'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ ...data, caut_prov: v })}
              className={clsx(
                'flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                data.caut_prov === v
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
              )}
            >
              {v === 'oui' ? 'Oui — cautionnement provisoire exigé' : 'Non — pas de cautionnement provisoire'}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">
          Si <strong>Oui</strong> : en cas de non-réalisation du cautionnement définitif dans 30 j,
          le provisoire reste acquis au MO. Si <strong>Non</strong> : pénalité de 1 % appliquée.
        </p>
      </div>
    </div>
  );
}
