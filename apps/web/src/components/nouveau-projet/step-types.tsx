'use client';

import { clsx } from 'clsx';
import { ProjectType } from '@cps/shared';
import { Input } from '@/components/ui/input';

const PROJECT_TYPES: Array<{ type: ProjectType; label: string; description: string }> = [
  { type: ProjectType.A, label: 'A — Aménagement', description: 'Travaux d\'aménagement urbain et paysager' },
  { type: ProjectType.B, label: 'B — Bâtiment', description: 'Construction et réhabilitation de bâtiments' },
  { type: ProjectType.O, label: 'O — Ouvrages d\'art', description: 'Ponts, tunnels et ouvrages spéciaux' },
  { type: ProjectType.M, label: 'M — Maritime et Portuaire', description: 'Travaux maritimes et portuaires' },
  { type: ProjectType.E, label: 'E — MT/BT', description: 'Travaux d\'électricité moyenne et basse tension' },
];

export interface StepTypesData {
  name: string;
  description: string;
  types: ProjectType[];
  isPrivate: boolean;
}

interface StepTypesProps {
  data: StepTypesData;
  onChange: (data: StepTypesData) => void;
  errors: Partial<Record<keyof StepTypesData, string>>;
}

export function StepTypes({ data, onChange, errors }: StepTypesProps) {
  function toggleType(type: ProjectType) {
    const next = data.types.includes(type)
      ? data.types.filter((t) => t !== type)
      : [...data.types, type];
    onChange({ ...data, types: next });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Input
          id="project-name"
          label="Nom du projet *"
          placeholder="Ex: CPS Travaux voirie 2026"
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
            rows={3}
            placeholder="Brève description du projet (optionnel)"
            value={data.description}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">
          Types de projet <span className="text-red-500">*</span>
        </p>
        {errors.types && <p className="text-xs text-red-600">{errors.types}</p>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECT_TYPES.map(({ type, label, description }) => {
            const selected = data.types.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={clsx(
                  'flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                  selected
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                )}
              >
                <span
                  className={clsx(
                    'text-sm font-semibold',
                    selected ? 'text-indigo-700' : 'text-slate-800',
                  )}
                >
                  {label}
                </span>
                <span className="text-xs text-slate-500">{description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Visibilité</p>
        <div className="flex gap-4">
          {[
            { value: true, label: 'Privé', desc: 'Visible par vous uniquement' },
            { value: false, label: 'Partagé', desc: 'Partageable avec des collaborateurs' },
          ].map(({ value, label, desc }) => (
            <button
              key={String(value)}
              type="button"
              onClick={() => onChange({ ...data, isPrivate: value })}
              className={clsx(
                'flex flex-1 flex-col items-start gap-0.5 rounded-xl border-2 p-4 text-left transition-all',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                data.isPrivate === value
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              )}
            >
              <span
                className={clsx(
                  'text-sm font-semibold',
                  data.isPrivate === value ? 'text-indigo-700' : 'text-slate-800',
                )}
              >
                {label}
              </span>
              <span className="text-xs text-slate-500">{desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
