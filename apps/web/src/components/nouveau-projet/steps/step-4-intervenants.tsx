'use client';

import { Input } from '@/components/ui/input';
import type { CpsQuestionnaire } from '../cps-questionnaire.types';

type IntervenantsFields = Pick<CpsQuestionnaire, 'int_mo' | 'int_moe' | 'int_bc' | 'int_topo'>;

interface Props {
  data: IntervenantsFields;
  onChange: (data: IntervenantsFields) => void;
}

export function Step4Intervenants({ data, onChange }: Props) {
  function set<K extends keyof IntervenantsFields>(key: K, value: string) {
    onChange({ ...data, [key]: value });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Intervenants listés à l'Article 2.2 du Chapitre II. Les champs vides seront remplacés par
        «[À compléter]» dans le document final.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="int-mo"
          label="Maître d'Ouvrage (MO)"
          placeholder="Tanger Med Port Authority (TMPA)"
          value={data.int_mo}
          onChange={(e) => set('int_mo', e.target.value)}
        />
        <Input
          id="int-moe"
          label="Maître d'Œuvre / BET / Architecte"
          placeholder="[À compléter]"
          value={data.int_moe}
          onChange={(e) => set('int_moe', e.target.value)}
        />
        <Input
          id="int-bc"
          label="Bureau de Contrôle"
          placeholder="[À compléter]"
          value={data.int_bc}
          onChange={(e) => set('int_bc', e.target.value)}
        />
        <Input
          id="int-topo"
          label="Cabinet Topographique"
          placeholder="[À compléter]"
          value={data.int_topo}
          onChange={(e) => set('int_topo', e.target.value)}
        />
      </div>
    </div>
  );
}
