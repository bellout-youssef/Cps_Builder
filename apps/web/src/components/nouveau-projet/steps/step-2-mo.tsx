'use client';

import { Input } from '@/components/ui/input';
import type { CpsQuestionnaire } from '../cps-questionnaire.types';

type MoFields = Pick<CpsQuestionnaire, 'mo_capital' | 'mo_rc' | 'mo_ice' | 'mo_if' | 'mo_siege' | 'mo_dg'>;

interface Props {
  data: MoFields;
  onChange: (data: MoFields) => void;
}

export function Step2Mo({ data, onChange }: Props) {
  function set<K extends keyof MoFields>(key: K, value: string) {
    onChange({ ...data, [key]: value });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Ces informations apparaissent dans le préambule du CPS (identité du Maître d'Ouvrage).
        Elles sont saisies pour chaque CPS.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="mo-capital"
          label="Capital social (DH)"
          placeholder="Ex : 1 000 000 000"
          value={data.mo_capital}
          onChange={(e) => set('mo_capital', e.target.value)}
        />
        <Input
          id="mo-rc"
          label="RC (Registre de commerce)"
          placeholder="Ex : 12345"
          value={data.mo_rc}
          onChange={(e) => set('mo_rc', e.target.value)}
        />
        <Input
          id="mo-ice"
          label="ICE"
          placeholder="Ex : 000123456789000"
          value={data.mo_ice}
          onChange={(e) => set('mo_ice', e.target.value)}
        />
        <Input
          id="mo-if"
          label="Identifiant Fiscal (IF)"
          placeholder="Ex : 12345678"
          value={data.mo_if}
          onChange={(e) => set('mo_if', e.target.value)}
        />
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="mo-siege" className="text-sm font-medium text-slate-700">
            Siège social
          </label>
          <input
            id="mo-siege"
            type="text"
            placeholder="Ex : Zone Franche du Port de Tanger, Maroc"
            value={data.mo_siege}
            onChange={(e) => set('mo_siege', e.target.value)}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="mo-dg" className="text-sm font-medium text-slate-700">
            Représentant légal (Directeur Général)
          </label>
          <input
            id="mo-dg"
            type="text"
            placeholder="Ex : Monsieur Prénom NOM"
            value={data.mo_dg}
            onChange={(e) => set('mo_dg', e.target.value)}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}
