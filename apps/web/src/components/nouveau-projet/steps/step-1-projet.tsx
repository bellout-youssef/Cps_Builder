'use client';

import { clsx } from 'clsx';
import { ProjectType } from '@cps/shared';
import { Input } from '@/components/ui/input';
import type { CpsQuestionnaire } from '../cps-questionnaire.types';

const PROJECT_TYPES: Array<{ type: ProjectType; label: string; desc: string }> = [
  { type: ProjectType.A, label: 'A — Aménagement', desc: 'Aménagement urbain et paysager' },
  { type: ProjectType.B, label: 'B — Bâtiment', desc: 'Construction et réhabilitation' },
  { type: ProjectType.O, label: 'O — Ouvrages d\'art', desc: 'Ponts, tunnels, ouvrages spéciaux' },
  { type: ProjectType.M, label: 'M — Maritime et Portuaire', desc: 'Travaux maritimes et portuaires' },
  { type: ProjectType.E, label: 'E — MT/BT', desc: 'Électricité moyenne et basse tension' },
];

const MODES_PASSATION = [
  { value: 'Appel d\'offres ouvert', label: 'Appel d\'offres ouvert' },
  { value: 'Appel d\'offres restreint', label: 'Appel d\'offres restreint' },
  { value: 'Bon de commande', label: 'Bon de commande' },
  { value: 'Marché de négociation', label: 'Marché de négociation' },
  { value: 'Marché cadre', label: 'Marché cadre' },
];

export interface Step1ProjectData {
  name: string;
  description: string;
  types: ProjectType[];
  questionnaire: Pick<CpsQuestionnaire, 'ao_num' | 'ao_title' | 'mode_passation'>;
}

export interface Step1Errors {
  name?: string;
  types?: string;
  ao_num?: string;
  ao_title?: string;
}

interface Props {
  data: Step1ProjectData;
  dceRef: string | null;
  onChange: (data: Step1ProjectData) => void;
  errors: Step1Errors;
}

export function Step1Projet({ data, dceRef, onChange, errors }: Props) {
  function setQ<K extends keyof Step1ProjectData['questionnaire']>(
    key: K,
    value: Step1ProjectData['questionnaire'][K],
  ) {
    onChange({ ...data, questionnaire: { ...data.questionnaire, [key]: value } });
  }

  function toggleType(type: ProjectType) {
    const next = data.types.includes(type)
      ? data.types.filter((t) => t !== type)
      : [...data.types, type];
    onChange({ ...data, types: next });
  }

  return (
    <div className="space-y-6">
      {/* Project meta */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100 pb-1">
          Informations du projet
        </h3>
        <Input
          id="project-name"
          label="Nom du projet *"
          placeholder="Ex : CPS Travaux voirie 2026"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          error={errors.name}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="project-desc" className="text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="project-desc"
            rows={2}
            placeholder="Brève description (optionnel)"
            value={data.description}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Types de travaux <span className="text-red-500">*</span>
          </p>
          {errors.types && <p className="text-xs text-red-600">{errors.types}</p>}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PROJECT_TYPES.map(({ type, label, desc }) => {
              const selected = data.types.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={clsx(
                    'flex flex-col items-start gap-0.5 rounded-xl border-2 p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                    selected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300',
                  )}
                >
                  <span className={clsx('text-sm font-semibold', selected ? 'text-indigo-700' : 'text-slate-800')}>
                    {label}
                  </span>
                  <span className="text-xs text-slate-500">{desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* AO fields */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100 pb-1">
          Appel d'offres
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="ao-num"
            label="N° AO *"
            placeholder="Ex : TMPA_AO_2026_001"
            value={data.questionnaire.ao_num}
            onChange={(e) => setQ('ao_num', e.target.value)}
            error={errors.ao_num}
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="mode-passation" className="text-sm font-medium text-slate-700">
              Mode de passation
            </label>
            <select
              id="mode-passation"
              value={data.questionnaire.mode_passation}
              onChange={(e) => setQ('mode_passation', e.target.value)}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— Choisir —</option>
              {MODES_PASSATION.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
        <Input
          id="ao-title"
          label="Intitulé du marché *"
          placeholder="Ex : Travaux de réhabilitation de la voirie portuaire"
          value={data.questionnaire.ao_title}
          onChange={(e) => setQ('ao_title', e.target.value)}
          error={errors.ao_title}
        />
      </div>

      {/* DCE Ref (read-only, shown after project creation) */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100 pb-1">
          Référence DCE
        </h3>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">
            Référence DCE
            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-500">
              auto-générée
            </span>
          </label>
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="font-mono text-sm text-slate-600">
              {dceRef ?? 'AAMMJJ_DCE_CPS_ORGSLUG_XXXXX — générée à la création'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Format : date du jour + numéro séquentiel par organisation. Visible en lecture seule.
          </p>
        </div>
      </div>
    </div>
  );
}
