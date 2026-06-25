'use client';

import { clsx } from 'clsx';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { CpsQuestionnaire, DelaiTranche, DelaiPartiel } from '../cps-questionnaire.types';

type DelaiFields = Pick<
  CpsQuestionnaire,
  'delai_type' | 'delai_ferme_mois' | 'tranches' | 'delais_partiels'
>;

interface Props {
  data: DelaiFields;
  onChange: (data: DelaiFields) => void;
}

// ─── Tableau tranches ─────────────────────────────────────────────────────────

function TranchesTable({
  tranches,
  onChange,
}: {
  tranches: DelaiTranche[];
  onChange: (t: DelaiTranche[]) => void;
}) {
  function update(i: number, key: keyof DelaiTranche, value: string) {
    const next = tranches.map((t, idx) => (idx === i ? { ...t, [key]: value } : t));
    onChange(next);
  }

  function addOptionnelle() {
    const n = tranches.length; // 0=ferme, 1=opt1, etc.
    onChange([
      ...tranches,
      {
        label: `Tranche optionnelle N°${n}`,
        mois: '',
        dateCommencement: `À partir de l'OSC afférant à la TO${n}`,
        dateLimiteOsc: '',
      },
    ]);
  }

  function remove(i: number) {
    if (i === 0) return; // cannot remove tranche ferme
    onChange(tranches.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-3 py-2 font-medium text-slate-600 whitespace-nowrap">Tranche</th>
              <th className="px-3 py-2 font-medium text-slate-600 whitespace-nowrap">Délai (mois)</th>
              <th className="px-3 py-2 font-medium text-slate-600 whitespace-nowrap">Date commencement</th>
              <th className="px-3 py-2 font-medium text-slate-600 whitespace-nowrap">Date limite OSC</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {tranches.map((t, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={t.label}
                    onChange={(e) => update(i, 'label', e.target.value)}
                    className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    readOnly={i === 0}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={t.mois}
                    onChange={(e) => update(i, 'mois', e.target.value)}
                    placeholder="Ex : 6"
                    className="w-20 rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={t.dateCommencement}
                    onChange={(e) => update(i, 'dateCommencement', e.target.value)}
                    className="w-full min-w-[180px] rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={t.dateLimiteOsc}
                    onChange={(e) => update(i, 'dateLimiteOsc', e.target.value)}
                    placeholder="Ex : 3 mois après fin TF"
                    className="w-full min-w-[150px] rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-3 py-2">
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="text-red-400 hover:text-red-600"
                      title="Supprimer cette tranche"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addOptionnelle}
        className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        <Plus className="h-4 w-4" />
        Ajouter une tranche optionnelle
      </button>
    </div>
  );
}

// ─── Tableau délais partiels ──────────────────────────────────────────────────

function DelaisPartielsTable({
  delais,
  onChange,
}: {
  delais: DelaiPartiel[];
  onChange: (d: DelaiPartiel[]) => void;
}) {
  function update(i: number, key: keyof DelaiPartiel, value: string) {
    onChange(delais.map((d, idx) => (idx === i ? { ...d, [key]: value } : d)));
  }

  function addDelai() {
    const n = delais.length + 1;
    onChange([
      ...delais,
      {
        label: `Délai ${n}`,
        mois: '',
        dateCommencement: `À partir de l'OSC ${n}`,
        conditionReception: 'Achèvement sanctionné par PV de RP partielle',
      },
    ]);
  }

  function remove(i: number) {
    if (delais.length <= 1) return;
    onChange(delais.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-3 py-2 font-medium text-slate-600">Délai</th>
              <th className="px-3 py-2 font-medium text-slate-600 whitespace-nowrap">Durée (mois)</th>
              <th className="px-3 py-2 font-medium text-slate-600 whitespace-nowrap">Date de commencement</th>
              <th className="px-3 py-2 font-medium text-slate-600 whitespace-nowrap">Condition de réception</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {delais.map((d, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={d.label}
                    onChange={(e) => update(i, 'label', e.target.value)}
                    className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={d.mois}
                    onChange={(e) => update(i, 'mois', e.target.value)}
                    placeholder="Ex : 3"
                    className="w-20 rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={d.dateCommencement}
                    onChange={(e) => update(i, 'dateCommencement', e.target.value)}
                    className="w-full min-w-[180px] rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={d.conditionReception}
                    onChange={(e) => update(i, 'conditionReception', e.target.value)}
                    className="w-full min-w-[180px] rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-3 py-2">
                  {delais.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addDelai}
        className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        <Plus className="h-4 w-4" />
        Ajouter un délai partiel
      </button>
    </div>
  );
}

// ─── Step 6 ───────────────────────────────────────────────────────────────────

const DELAI_OPTIONS = [
  {
    value: 'ferme' as const,
    label: 'Délai ferme',
    desc: 'Un délai global unique à compter de l\'OSC',
  },
  {
    value: 'partiel' as const,
    label: 'Délais partiels',
    desc: 'Plusieurs sous-délais avec réceptions provisoires partielles',
  },
  {
    value: 'tranche' as const,
    label: 'Tranches',
    desc: 'Tranche ferme + tranches optionnelles activées par OSC',
  },
];

export function Step6Delai({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Type de délai */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">
          Type de délai d'exécution <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {DELAI_OPTIONS.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ ...data, delai_type: value })}
              className={clsx(
                'flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                data.delai_type === value
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              )}
            >
              <span
                className={clsx(
                  'text-sm font-semibold',
                  data.delai_type === value ? 'text-indigo-700' : 'text-slate-800',
                )}
              >
                {label}
              </span>
              <span className="text-xs text-slate-500">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ferme */}
      {data.delai_type === 'ferme' && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
          <Input
            id="delai-ferme-mois"
            label="Durée du marché (mois calendaires)"
            placeholder="Ex : 12"
            value={data.delai_ferme_mois}
            onChange={(e) => onChange({ ...data, delai_ferme_mois: e.target.value })}
          />
          <p className="mt-1 text-xs text-slate-500">
            À compter de la date de notification de l'OSC. 1 mois = 30 jours.
          </p>
        </div>
      )}

      {/* Tranches */}
      {data.delai_type === 'tranche' && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Tableau des tranches</p>
          <TranchesTable
            tranches={data.tranches}
            onChange={(tranches) => onChange({ ...data, tranches })}
          />
          <p className="text-xs text-slate-400">
            La tranche ferme ne peut pas être supprimée. Ajoutez autant de tranches optionnelles
            que nécessaire.
          </p>
        </div>
      )}

      {/* Partiels */}
      {data.delai_type === 'partiel' && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Tableau des délais partiels</p>
          <DelaisPartielsTable
            delais={data.delais_partiels}
            onChange={(delais_partiels) => onChange({ ...data, delais_partiels })}
          />
          <p className="text-xs text-slate-400">
            Si le délai global est respecté, les pénalités sur délais partiels seront restituées.
          </p>
        </div>
      )}
    </div>
  );
}
