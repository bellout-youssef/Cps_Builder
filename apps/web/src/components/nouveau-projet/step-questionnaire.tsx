'use client';

import { Lock } from 'lucide-react';
import { clsx } from 'clsx';

// Static questionnaire definition for V1
interface QField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'readonly';
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  articleRef?: string;
}

interface QSection {
  id: string;
  title: string;
  fields: QField[];
}

const QUESTIONNAIRE_SECTIONS: QSection[] = [
  {
    id: 'identification',
    title: 'Identification du marché',
    fields: [
      { id: 'maitre_ouvrage', label: "Maître d'ouvrage", type: 'text', required: true, placeholder: "Nom du maître d'ouvrage" },
      { id: 'consistance', label: 'Consistance des travaux', type: 'textarea', placeholder: 'Description détaillée des travaux' },
      {
        id: 'mode_passation',
        label: 'Mode de passation',
        type: 'select',
        required: true,
        options: [
          { value: 'appel_offres_ouvert', label: "Appel d'offres ouvert" },
          { value: 'appel_offres_restreint', label: "Appel d'offres restreint" },
          { value: 'bon_de_commande', label: 'Bon de commande' },
          { value: 'marche_negociation', label: 'Marché de négociation' },
        ],
      },
      {
        id: 'mode_reglement',
        label: 'Mode de règlement',
        type: 'select',
        options: [
          { value: 'avancement', label: "À l'avancement (situation mensuelle)" },
          { value: 'achevement', label: "Après achèvement" },
        ],
      },
    ],
  },
  {
    id: 'delais',
    title: 'Délais et pénalités',
    fields: [
      { id: 'delai_execution', label: "Délai d'exécution (en jours)", type: 'number', required: true, placeholder: '180', hint: "Durée totale des travaux en jours calendaires" },
      {
        id: 'delai_garantie',
        label: 'Délai de garantie',
        type: 'select',
        options: [
          { value: '12', label: '12 mois' },
          { value: '24', label: '24 mois' },
          { value: '36', label: '36 mois' },
        ],
      },
      { id: 'penalite_retard', label: 'Taux de pénalité de retard (%/jour)', type: 'number', placeholder: '0.05', hint: 'Ex : 0,05 % du montant du marché par jour de retard' },
      { id: 'plafond_penalites', label: 'Plafond des pénalités (%)', type: 'number', placeholder: '10', hint: 'Plafond total des pénalités en % du montant du marché' },
    ],
  },
  {
    id: 'cautionnement',
    title: 'Cautionnement et garanties',
    fields: [
      { id: 'cautionnement_provisoire', label: 'Cautionnement provisoire (DH)', type: 'number', placeholder: '0', hint: "Montant en DH, ou 0 si non exigé" },
      { id: 'cautionnement_definitif', label: 'Cautionnement définitif (%)', type: 'number', placeholder: '3', hint: '% du montant initial du marché (HT)' },
      { id: 'retenue_garantie', label: 'Retenue de garantie (%)', type: 'number', placeholder: '10', hint: '% prélevé sur chaque décompte' },
      { id: 'assurances', label: 'Assurances exigées', type: 'textarea', placeholder: 'Ex : Assurance TRC, RC chantier, etc.' },
    ],
  },
  {
    id: 'avances',
    title: 'Avances',
    fields: [
      { id: 'avance_demarrage', label: 'Avance de démarrage (%)', type: 'number', placeholder: '10', hint: '% du montant du marché accordé à la notification' },
      { id: 'conditions_avance', label: "Conditions d'octroi de l'avance", type: 'textarea', placeholder: "Ex : Sur présentation d'une caution bancaire" },
    ],
  },
  {
    id: 'obligations',
    title: 'Clauses obligatoires',
    fields: [
      {
        id: 'article_2_13',
        label: 'Article 2.13 — Règlement des litiges',
        type: 'readonly',
        articleRef: '2.13',
        hint: 'Clause obligatoire intégrée telle quelle (non modifiable).',
      },
    ],
  },
];

const ARTICLE_213_TEXT =
  'Tout litige né à l\'occasion de l\'exécution du présent marché est soumis aux tribunaux compétents du Royaume du Maroc conformément à la législation en vigueur. À défaut de règlement amiable, le contentieux est porté devant le tribunal administratif territorialement compétent.';

interface StepQuestionnaireProps {
  answers: Record<string, string>;
  onChange: (answers: Record<string, string>) => void;
}

export function StepQuestionnaire({ answers, onChange }: StepQuestionnaireProps) {
  function set(id: string, value: string) {
    onChange({ ...answers, [id]: value });
  }

  return (
    <div className="space-y-8">
      {QUESTIONNAIRE_SECTIONS.map((section) => (
        <section key={section.id} className="space-y-4">
          <h4 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {section.title}
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={
                  field.type === 'readonly' && field.id === 'article_2_13'
                    ? ARTICLE_213_TEXT
                    : (answers[field.id] ?? '')
                }
                onChange={(v) => set(field.id, v)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

interface FieldRendererProps {
  field: QField;
  value: string;
  onChange: (value: string) => void;
}

function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const isWide = field.type === 'textarea' || field.type === 'readonly';

  return (
    <div className={clsx('flex flex-col gap-1', isWide && 'sm:col-span-2')}>
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-slate-700">
          {field.label}
          {field.required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        {field.type === 'readonly' && (
          <span title="Clause obligatoire non modifiable">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
          </span>
        )}
        {field.articleRef && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-mono text-amber-700">
            Art. {field.articleRef}
          </span>
        )}
      </div>

      {field.type === 'text' && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}

      {field.type === 'number' && (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          min={0}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}

      {field.type === 'select' && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">— Choisir —</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {field.type === 'readonly' && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
          <p className="text-sm text-amber-900">{value}</p>
        </div>
      )}

      {field.hint && (
        <p className="text-xs text-slate-400">{field.hint}</p>
      )}
    </div>
  );
}
