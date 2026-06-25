// Types for the 12-step CPS creation questionnaire
// Mirrors the field structure of templates/generate_cps_module.js

export interface DelaiTranche {
  label: string;
  mois: string;
  dateCommencement: string;
  dateLimiteOsc: string;
}

export interface DelaiPartiel {
  label: string;
  mois: string;
  dateCommencement: string;
  conditionReception: string;
}

export interface PrixLigne {
  numero: string;
  designation: string;
  unite: string;
}

export interface CpsQuestionnaire {
  // Step 1 — AO & Mode de passation
  ao_num: string;
  ao_title: string;
  mode_passation: string;

  // Step 2 — Maître d'Ouvrage (6 champs, saisis à chaque CPS)
  mo_capital: string;
  mo_rc: string;
  mo_ice: string;
  mo_if: string;
  mo_siege: string;
  mo_dg: string;

  // Step 3 — Objet du marché
  objet_detail: string;
  lieu_exec: string;

  // Step 4 — Intervenants (Art 2.2)
  int_mo: string;
  int_moe: string;
  int_bc: string;
  int_topo: string;

  // Step 5 — Consistance + Textes + Cautionnement provisoire
  consistance: string;
  textes_speciaux: string;
  caut_prov: 'oui' | 'non' | '';

  // Step 6 — Délai d'exécution (pivot: delai_type)
  delai_type: 'ferme' | 'partiel' | 'tranche' | '';
  delai_ferme_mois: string;          // when delai_type === 'ferme'
  tranches: DelaiTranche[];          // when delai_type === 'tranche'
  delais_partiels: DelaiPartiel[];   // when delai_type === 'partiel'

  // Step 7 — Délai de garantie + Pénalités (pivot: penalite_autres)
  delai_garantie: string;
  penalite_taux: string;
  penalite_plafond: string;
  penalite_autres: 'oui' | 'non' | '';
  penalite_autres_detail: string;    // when penalite_autres === 'oui'

  // Step 8 — Révision des prix (pivot: revision_prix)
  revision_prix: 'ferme' | 'revisable' | '';
  rev_k: string;                     // when revision_prix === 'revisable'
  rev_a: string;
  rev_b: string;
  rev_plafond: string;

  // Step 9 — Sous-traitance + Approvisionnements (pivot: approvi)
  st_exclus: string;
  approvi: 'oui' | 'non' | '';

  // Step 10 — Variante (pivot: variante)
  variante: 'oui' | 'non' | '';
  variante_series: string;           // when variante === 'oui'

  // Step 11 — Clauses techniques (Chapitre III)
  tech_prescriptions: string;
  tech_docs: string;

  // Step 12 — Définition des prix (Chapitre IV) — tableau dynamique
  cdp_lignes: PrixLigne[];
}

export const EMPTY_QUESTIONNAIRE: CpsQuestionnaire = {
  ao_num: '',
  ao_title: '',
  mode_passation: '',
  mo_capital: '',
  mo_rc: '',
  mo_ice: '',
  mo_if: '',
  mo_siege: '',
  mo_dg: '',
  objet_detail: '',
  lieu_exec: '',
  int_mo: 'Tanger Med Port Authority (TMPA)',
  int_moe: '',
  int_bc: '',
  int_topo: '',
  consistance: '',
  textes_speciaux: '',
  caut_prov: '',
  delai_type: '',
  delai_ferme_mois: '',
  tranches: [
    {
      label: 'Tranche ferme',
      mois: '',
      dateCommencement: 'OSC 1 (au plus tard 60 j après signature)',
      dateLimiteOsc: '',
    },
  ],
  delais_partiels: [
    {
      label: 'Délai 1',
      mois: '',
      dateCommencement: 'À partir de l\'OSC 1, au plus tard 60 j après signature',
      conditionReception: 'Achèvement sanctionné par PV de RP partielle',
    },
  ],
  delai_garantie: '',
  penalite_taux: '',
  penalite_plafond: '10',
  penalite_autres: '',
  penalite_autres_detail: '',
  revision_prix: '',
  rev_k: '0,15',
  rev_a: '',
  rev_b: '',
  rev_plafond: '5',
  st_exclus: '',
  approvi: '',
  variante: '',
  variante_series: '',
  tech_prescriptions: '',
  tech_docs: '',
  cdp_lignes: [{ numero: '101', designation: '', unite: '' }],
};
