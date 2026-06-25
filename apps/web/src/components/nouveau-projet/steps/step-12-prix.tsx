'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { CpsQuestionnaire, PrixLigne } from '../cps-questionnaire.types';

type PrixFields = Pick<CpsQuestionnaire, 'cdp_lignes'>;

interface Props {
  data: PrixFields;
  onChange: (data: PrixFields) => void;
}

const UNITES_COURANTES = ['m', 'm²', 'm³', 'ml', 'kg', 'T', 'U', 'forfait', 'h', 'jour'];

export function Step12Prix({ data, onChange }: Props) {
  const lignes = data.cdp_lignes;

  function update(i: number, key: keyof PrixLigne, value: string) {
    const next = lignes.map((l, idx) => (idx === i ? { ...l, [key]: value } : l));
    onChange({ cdp_lignes: next });
  }

  function addLigne() {
    const lastNum = lignes.length > 0 ? lignes[lignes.length - 1].numero : '100';
    const nextNum = String(Number(lastNum) + 1);
    onChange({ cdp_lignes: [...lignes, { numero: nextNum, designation: '', unite: '' }] });
  }

  function remove(i: number) {
    if (lignes.length <= 1) return;
    onChange({ cdp_lignes: lignes.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Définition des prix — Chapitre IV. Chaque ligne correspond à un article du BDP.
        Les quantités seront saisies séparément dans le BDP.
      </p>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="w-24 px-3 py-2.5 font-medium text-slate-600">N° Prix</th>
              <th className="px-3 py-2.5 font-medium text-slate-600">Désignation</th>
              <th className="w-32 px-3 py-2.5 font-medium text-slate-600">Unité</th>
              <th className="w-10 px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={ligne.numero}
                    onChange={(e) => update(i, 'numero', e.target.value)}
                    className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={ligne.designation}
                    onChange={(e) => update(i, 'designation', e.target.value)}
                    placeholder="Ex : Terrassements en déblai en terrain quelconque"
                    className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={UNITES_COURANTES.includes(ligne.unite) ? ligne.unite : '__custom__'}
                    onChange={(e) => {
                      if (e.target.value !== '__custom__') update(i, 'unite', e.target.value);
                    }}
                    className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">— Unité —</option>
                    {UNITES_COURANTES.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    <option value="__custom__">Autre…</option>
                  </select>
                  {(!UNITES_COURANTES.includes(ligne.unite) && ligne.unite !== '') && (
                    <input
                      type="text"
                      value={ligne.unite}
                      onChange={(e) => update(i, 'unite', e.target.value)}
                      placeholder="Unité libre"
                      className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  )}
                </td>
                <td className="px-3 py-2">
                  {lignes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="text-red-400 hover:text-red-600"
                      title="Supprimer cette ligne"
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
        onClick={addLigne}
        className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        <Plus className="h-4 w-4" />
        Ajouter un article prix
      </button>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <strong>Format de génération :</strong> Chaque ligne produit une section «&nbsp;Prix N° {'{'}numero{'}'}»
        avec désignation et unité dans le Chapitre IV du document DOCX/PDF.
      </div>
    </div>
  );
}
