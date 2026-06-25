'use client';

import type { CpsQuestionnaire } from '../cps-questionnaire.types';

type ObjetFields = Pick<CpsQuestionnaire, 'objet_detail' | 'lieu_exec'>;

export interface Step3Errors {
  objet_detail?: string;
}

interface Props {
  data: ObjetFields;
  onChange: (data: ObjetFields) => void;
  errors: Step3Errors;
}

export function Step3Objet({ data, onChange, errors }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="objet-detail" className="text-sm font-medium text-slate-700">
          Objet détaillé du marché <span className="text-red-500">*</span>
        </label>
        <textarea
          id="objet-detail"
          rows={4}
          placeholder="Ex : Le présent marché a pour objet la réhabilitation de la voirie portuaire..."
          value={data.objet_detail}
          onChange={(e) => onChange({ ...data, objet_detail: e.target.value })}
          className={`block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.objet_detail ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'}`}
        />
        {errors.objet_detail && <p className="text-xs text-red-600">{errors.objet_detail}</p>}
        <p className="text-xs text-slate-400">Texte qui apparaît à l'Article 2.1 du Chapitre II.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="lieu-exec" className="text-sm font-medium text-slate-700">
          Lieu d'exécution
        </label>
        <input
          id="lieu-exec"
          type="text"
          placeholder="Ex : Port de Tanger Med, Zone Franche, Maroc"
          value={data.lieu_exec}
          onChange={(e) => onChange({ ...data, lieu_exec: e.target.value })}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}
