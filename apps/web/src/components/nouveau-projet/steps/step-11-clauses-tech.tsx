'use client';

import type { CpsQuestionnaire } from '../cps-questionnaire.types';

type ClausesTechFields = Pick<CpsQuestionnaire, 'tech_prescriptions' | 'tech_docs'>;

interface Props {
  data: ClausesTechFields;
  onChange: (data: ClausesTechFields) => void;
}

export function Step11ClausesTech({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Contenu du Chapitre III. Les champs vides génèrent un placeholder «[Clauses techniques à
        compléter]» dans le document.
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="tech-prescriptions" className="text-sm font-medium text-slate-700">
          Prescriptions techniques particulières
        </label>
        <textarea
          id="tech-prescriptions"
          rows={5}
          placeholder={'Ex :\n- Les matériaux de remblai seront de classe GTR B5\n- Le béton utilisé sera de type C25/30\n- Les essais Proctor seront réalisés tous les 200 m²'}
          value={data.tech_prescriptions}
          onChange={(e) => onChange({ ...data, tech_prescriptions: e.target.value })}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-slate-400">Une prescription par ligne. Chaque ligne devient une puce.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tech-docs" className="text-sm font-medium text-slate-700">
          Documents techniques à fournir par l'entrepreneur
        </label>
        <textarea
          id="tech-docs"
          rows={4}
          placeholder={'Ex :\n- Note de calcul des structures (dans les 30 j après OSC)\n- Plan d\'installation de chantier\n- Programme détaillé d\'exécution'}
          value={data.tech_docs}
          onChange={(e) => onChange({ ...data, tech_docs: e.target.value })}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-slate-400">Documents à soumettre au MO pendant l'exécution.</p>
      </div>
    </div>
  );
}
