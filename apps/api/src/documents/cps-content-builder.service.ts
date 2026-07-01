import { Injectable } from '@nestjs/common';
import { BlockItem, CpsArticleSection, CpsChapterContent } from './types/cps-document.types';

/**
 * Transposition fidèle de la logique conditionnelle de /templates/generate_cps_module.js
 * vers un format neutre (BlockItem[]) consommable par html-generator et docx-generator.
 *
 * 6 pivots : delai_type · revision_prix · variante · penalite_autres · approvi · caut_prov
 */

export interface CpsQuestionnaireInput {
  ao_num?: string;
  ao_title?: string;
  mode_passation?: string;
  mo_capital?: string;
  mo_rc?: string;
  mo_ice?: string;
  mo_if?: string;
  mo_siege?: string;
  mo_dg?: string;
  objet_detail?: string;
  lieu_exec?: string;
  int_mo?: string;
  int_moe?: string;
  int_bc?: string;
  int_topo?: string;
  consistance?: string;
  textes_speciaux?: string;
  caut_prov?: 'oui' | 'non' | '';
  delai_type?: 'ferme' | 'partiel' | 'tranche' | '';
  delai_ferme_mois?: string;
  tranches?: Array<{ label: string; mois: string; dateCommencement: string; dateLimiteOsc: string }>;
  delais_partiels?: Array<{ label: string; mois: string; dateCommencement: string; conditionReception: string }>;
  delai_garantie?: string;
  penalite_taux?: string;
  penalite_plafond?: string;
  penalite_autres?: 'oui' | 'non' | '';
  penalite_autres_detail?: string;
  revision_prix?: 'ferme' | 'revisable' | '';
  rev_k?: string;
  rev_a?: string;
  rev_b?: string;
  rev_plafond?: string;
  st_exclus?: string;
  approvi?: 'oui' | 'non' | '';
  variante?: 'oui' | 'non' | '';
  variante_series?: string;
  tech_prescriptions?: string;
  tech_docs?: string;
  cdp_lignes?: Array<{ numero: string; designation: string; unite: string }>;
}

@Injectable()
export class CpsContentBuilderService {
  /** Produit le contenu structuré des 14 articles du Chapitre II. */
  buildChapterII(q: CpsQuestionnaireInput): CpsChapterContent {
    return {
      articles: [
        this.art21(q),
        this.art22(q),
        this.art23(q),
        this.art24(q),
        this.art25(q),
        this.art26(q),
        this.art27(q),
        this.art28(q),
        this.art29(q),
        this.art210(q),
        this.art211(q),
        this.art212(),
        this.art213(q),
        this.art214(q),
      ],
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private str(v: string | null | undefined): string {
    return (v ?? '').trim();
  }

  private splitLines(v: string | null | undefined): string[] {
    const s = this.str(v);
    if (!s || s === '—') return [];
    return s.split('\n').map((l) => l.trim()).filter(Boolean);
  }

  // ─── Articles 2.1 → 2.14 ─────────────────────────────────────────────────

  private art21(q: CpsQuestionnaireInput): CpsArticleSection {
    const blocks: BlockItem[] = [
      {
        kind: 'para_mixed',
        runs: [
          { text: 'Le présent marché a pour objet : ' },
          { text: this.str(q.objet_detail) || '[À compléter]', bold: true },
        ],
      },
    ];
    if (this.str(q.lieu_exec)) {
      blocks.push({
        kind: 'para_mixed',
        runs: [
          { text: "Lieu d'exécution : " },
          { text: this.str(q.lieu_exec), bold: true },
        ],
      });
    }
    return { num: '2.1', title: 'OBJET DU MARCHÉ', blocks };
  }

  private art22(q: CpsQuestionnaireInput): CpsArticleSection {
    return {
      num: '2.2',
      title: 'INTERVENANTS',
      blocks: [
        { kind: 'para', text: 'Les intervenants du présent marché sont :' },
        {
          kind: 'para_mixed',
          runs: [{ text: "Le Maître d'ouvrage : ", bold: true }, { text: this.str(q.int_mo) || 'Tanger Med Port Authority (TMPA)' }],
        },
        {
          kind: 'para_mixed',
          runs: [{ text: "Le Maître d'œuvre (Architecte, BET) : ", bold: true }, { text: this.str(q.int_moe) || '[À compléter]' }],
        },
        {
          kind: 'para_mixed',
          runs: [{ text: 'Bureau de Contrôle : ', bold: true }, { text: this.str(q.int_bc) || '[À compléter]' }],
        },
        {
          kind: 'para_mixed',
          runs: [{ text: 'Cabinet topographique : ', bold: true }, { text: this.str(q.int_topo) || '[À compléter]' }],
        },
      ],
    };
  }

  private art23(q: CpsQuestionnaireInput): CpsArticleSection {
    const lines = this.splitLines(q.consistance);
    const blocks: BlockItem[] = [{ kind: 'para', text: 'Les travaux à exécuter consistent en ce qui suit :' }];
    blocks.push({ kind: 'bullets', items: lines.length ? lines.map((l) => l.replace(/^[-–•]\s*/, '')) : ['[À compléter]'] });
    return { num: '2.3', title: 'CONSISTANCE DES TRAVAUX', blocks };
  }

  private art24(q: CpsQuestionnaireInput): CpsArticleSection {
    const lines = this.splitLines(q.textes_speciaux);
    const items = lines.length
      ? lines.map((l) => l.replace(/^[-–•]\s*/, ''))
      : ["Devis général d'architecture (1956)", 'Règles BAEL / CCBA 68'];
    return {
      num: '2.4',
      title: 'RÉFÉRENCE AUX TEXTES SPÉCIAUX APPLICABLES AU MARCHÉ',
      blocks: [
        { kind: 'para', text: 'Le titulaire est également soumis aux textes suivants :' },
        { kind: 'bullets', items },
        { kind: 'para', text: 'En cas de contradiction, les prescriptions des documents les plus récents primeront.' },
      ],
    };
  }

  private art25(q: CpsQuestionnaireInput): CpsArticleSection {
    // pivot: caut_prov
    const conditionalText =
      q.caut_prov === 'oui'
        ? 'Si non réalisé dans 30 jours → le cautionnement provisoire reste acquis au MO.'
        : 'Si non réalisé dans 30 jours → pénalité de 1% du montant initial.';
    return {
      num: '2.5',
      title: 'CAUTIONNEMENT DÉFINITIF',
      blocks: [
        { kind: 'para', text: 'Le montant du cautionnement définitif est fixé à (3%) du montant initial du marché.' },
        { kind: 'para', text: conditionalText },
        {
          kind: 'para',
          text: "En cas de non-production, le montant total du cautionnement définitif sera retenu sur les sommes dues à partir du premier décompte.",
        },
      ],
    };
  }

  private art26(q: CpsQuestionnaireInput): CpsArticleSection {
    return { num: '2.6', title: "DURÉE, DÉLAI D'EXÉCUTION OU DATE D'ACHÈVEMENT", blocks: this.delaiBlock(q) };
  }

  private art27(q: CpsQuestionnaireInput): CpsArticleSection {
    const garantie = this.str(q.delai_garantie) || 'XXX';
    return {
      num: '2.7',
      title: 'DÉLAI DE GARANTIE',
      blocks: [
        {
          kind: 'para_mixed',
          runs: [
            { text: 'Le délai de garantie est fixé à ' },
            { text: garantie, bold: true },
            { text: ' à compter de la date de la réception provisoire.' },
          ],
        },
        {
          kind: 'para',
          text: "Pendant ce délai, l'entrepreneur remettra les plans conformes à l'exécution et remédiera à toutes les défectuosités constatées.",
        },
      ],
    };
  }

  private art28(q: CpsQuestionnaireInput): CpsArticleSection {
    return { num: '2.8', title: 'PÉNALITÉS POUR RETARD', blocks: this.penaliteBlock(q) };
  }

  private art29(q: CpsQuestionnaireInput): CpsArticleSection {
    return { num: '2.9', title: 'RÉVISION DES PRIX', blocks: this.revisionBlock(q) };
  }

  private art210(q: CpsQuestionnaireInput): CpsArticleSection {
    const blocks: BlockItem[] = [
      {
        kind: 'para',
        text: "Accord préalable écrit du MO requis. La sous-traitance ne peut dépasser (50%) du montant du marché ni porter sur le lot principal.",
      },
    ];
    const stLines = this.splitLines(q.st_exclus);
    if (stLines.length) {
      blocks.push({ kind: 'para', text: 'Travaux exclus de la sous-traitance :' });
      blocks.push({ kind: 'bullets', items: stLines.map((l) => l.replace(/^[-–•]\s*/, '')) });
    }
    blocks.push({ kind: 'para', text: 'Le titulaire demeure personnellement responsable de toutes les obligations résultant du marché.' });
    return { num: '2.10', title: 'SOUS-TRAITANCE', blocks };
  }

  private art211(q: CpsQuestionnaireInput): CpsArticleSection {
    // pivot: approvi
    const blocks: BlockItem[] =
      q.approvi === 'oui'
        ? [
            { kind: 'para', text: 'Les approvisionnements peuvent donner lieu à des acomptes sous réserve :' },
            {
              kind: 'bullets',
              items: [
                'Acquis en toute propriété et effectivement payés',
                'Lotis sur le chantier',
                "Nécessaires à l'exécution",
              ],
            },
          ]
        : [{ kind: 'para', text: "Le présent marché ne prévoit pas d'acomptes sur approvisionnements." }];
    return { num: '2.11', title: 'APPROVISIONNEMENTS', blocks };
  }

  private art212(): CpsArticleSection {
    return {
      num: '2.12',
      title: 'CAS DE FORCE MAJEURE',
      blocks: [
        {
          kind: 'para',
          text: "Événement imprévisible, irrésistible, hors du contrôle des parties rendant l'exécution pratiquement impossible. Seuils intempéries :",
        },
        {
          kind: 'table',
          headers: ['Événement', 'Travaux Maritimes', 'Aménagement', 'Bâtiment'],
          rows: [
            ['Pluie', '15 mm/j', '5 mm/j', '10 mm/j'],
            ['Vent', '>60 km/h', '>60 km/h', '>60 km/h'],
            ['Houle', '6 m', 'NA', 'NA'],
            ['Séisme', '4° Richter', '4° Richter', '4° Richter'],
          ],
        },
        { kind: 'para', text: 'Après 60 jours de force majeure, le marché peut être résilié.' },
      ],
    };
  }

  private art213(q: CpsQuestionnaireInput): CpsArticleSection {
    // pivot: variante
    let blocks: BlockItem[];
    if (q.variante === 'oui') {
      blocks = [];
      if (this.str(q.variante_series)) {
        blocks.push({
          kind: 'para_mixed',
          runs: [{ text: 'Séries / lots concernés : ' }, { text: this.str(q.variante_series), bold: true }],
        });
      }
      blocks.push({
        kind: 'bullets',
        items: [
          "Le titulaire s'engage sur le coût global de son offre variante.",
          'Q réalisée ≥ Q bordereau → Quantité à payer = Q bordereau.',
          'Q réalisée < Q bordereau → Quantité à payer = Q réalisée + 0,5 × (Q bordereau − Q réalisée).',
        ],
      });
    } else {
      // Article 2.13 toujours présent — "Dispositions Non Applicables" si variante ≠ oui
      blocks = [{ kind: 'para', text: 'Dispositions Non Applicables.' }];
    }
    return { num: '2.13', title: 'CONDITIONS ET EXÉCUTION DE LA VARIANTE', blocks };
  }

  private art214(q: CpsQuestionnaireInput): CpsArticleSection {
    return { num: '2.14', title: 'RÉCEPTIONS', blocks: this.receptionBlock(this.str(q.delai_type)) };
  }

  // ─── Fonctions pivots (fidèles à generate_cps_module.js) ─────────────────

  /** pivot: delai_type → Art. 2.14 */
  private receptionBlock(delaiType: string): BlockItem[] {
    if (delaiType === 'ferme') {
      return [
        {
          kind: 'para_mixed',
          runs: [
            { text: 'Une ' },
            { text: 'réception provisoire', bold: true },
            { text: " sera prononcée à l'achèvement de l'ensemble des travaux, conformément à l'article 72 du RGA TMSA." },
          ],
        },
        {
          kind: 'para_mixed',
          runs: [
            { text: 'La ' },
            { text: 'réception définitive', bold: true },
            { text: " sera prononcée à l'expiration du délai de garantie, conformément à l'article 75 du RGA TMSA." },
          ],
        },
      ];
    }
    if (delaiType === 'partiel') {
      return [
        {
          kind: 'table',
          headers: ['Réceptions provisoires', 'Réception définitive'],
          rows: [
            [
              'Une RP partielle sera déclarée après achèvement des prestations relatives à chaque délai.',
              'Une RD partielle sera déclarée après la période de garantie relative à chaque délai partiel.',
            ],
            [
              'Une RP globale sera déclarée en même temps que la dernière RP partielle.',
              'La RD globale sera déclarée après la période de garantie relative au dernier délai partiel.',
            ],
          ],
        },
        { kind: 'para', text: 'Si le délai global a été respecté, les pénalités sur délais partiels seront restituées.', italic: true },
      ];
    }
    if (delaiType === 'tranche') {
      return [
        {
          kind: 'table',
          headers: ['Réceptions provisoires', 'Réception définitive'],
          rows: [
            [
              'Une RP partielle sera déclarée après achèvement des prestations relatives à chaque tranche.',
              'Une RD partielle sera déclarée après la période de garantie relative à chaque tranche.',
            ],
            [
              'Une RP globale sera déclarée en même temps que la dernière RP partielle.',
              'La RD globale sera déclarée après la période de garantie relative à la dernière tranche optionnelle.',
            ],
          ],
        },
        { kind: 'para', text: 'Tranche optionnelle non activée dans le délai prévu = automatiquement résiliée.', italic: true },
      ];
    }
    return [{ kind: 'para', text: '[Type de délai à définir]', italic: true }];
  }

  /** pivot: delai_type → Art. 2.6 */
  private delaiBlock(q: CpsQuestionnaireInput): BlockItem[] {
    const delaiType = this.str(q.delai_type);

    if (delaiType === 'ferme') {
      const mois = this.str(q.delai_ferme_mois) || 'XXX';
      return [
        {
          kind: 'para_mixed',
          runs: [
            { text: 'Le présent marché est conclu pour une durée de (' },
            { text: mois, bold: true },
            { text: ") mois calendaires à compter de la date de notification de l'OSC." },
          ],
        },
        { kind: 'para', text: 'Un mois calendaire est égal à 30 jours.' },
      ];
    }

    if (delaiType === 'partiel') {
      const partiels = q.delais_partiels ?? [];
      const rows: string[][] = partiels.length
        ? partiels.map((p) => [p.label, `(${p.mois || 'XXX'}) mois`, p.dateCommencement, p.conditionReception])
        : [["Délai 1", "(XXX) mois", "À partir de l'OSC 1, au plus tard 60 jours après signature", "Achèvement sanctionné par PV de RP partielle"]];
      return [
        { kind: 'para', text: 'Le prestataire est tenu de respecter les délais partiels suivants :' },
        { kind: 'table', headers: ['', "Délai d'exécution", 'Date de commencement', 'Condition de réception'], rows },
      ];
    }

    if (delaiType === 'tranche') {
      const tranches = q.tranches ?? [];
      const rows: string[][] = tranches.length
        ? tranches.map((t) => [t.label, `(${t.mois || 'XXX'}) mois`, t.dateCommencement, t.dateLimiteOsc, "Achèvement sanctionné par PV de RP partielle"])
        : [
            ["Tranche ferme", "(XXX) mois", "OSC 1 au plus tard 60 jours après signature", "XXX", "Achèvement sanctionné par PV de RP partielle"],
            ["Tranche optionnelle N°1", "(XXX) mois", "À partir de l'OSC afférant", "Confirmation MO dans un délai de XXX à partir de la fin de la TF", "Achèvement sanctionné par PV de RP partielle"],
          ];
      return [
        { kind: 'para', text: 'Les prestations seront réalisées suivant les délais prescrits dans le tableau suivant :' },
        { kind: 'table', headers: ['', "Délai d'exécution", 'Date de commencement', 'Date limite OSC', 'Condition de réception'], rows },
      ];
    }

    return [{ kind: 'para', text: "[Type de délai à définir : ferme, partiel ou à tranches]", italic: true }];
  }

  /** pivots: delai_type + penalite_autres → Art. 2.8 */
  private penaliteBlock(q: CpsQuestionnaireInput): BlockItem[] {
    const items: BlockItem[] = [];
    const taux = this.str(q.penalite_taux) || 'X/1000';
    const plafond = this.str(q.penalite_plafond) || '10';
    const delaiType = this.str(q.delai_type);

    if (delaiType === 'ferme') {
      items.push({
        kind: 'para_mixed',
        runs: [
          { text: 'En cas de retard, pénalité journalière de (' },
          { text: taux, bold: true },
          { text: ') du montant du marché.' },
        ],
      });
    } else if (delaiType === 'partiel') {
      items.push({
        kind: 'table',
        headers: ['', 'Pénalités'],
        rows: [['Délai 1', `${taux} du montant du marché`]],
      });
      items.push({ kind: 'para_mixed', runs: [{ text: 'Délai global respecté → pénalités partielles restituées.', bold: true }] });
    } else if (delaiType === 'tranche') {
      items.push({
        kind: 'table',
        headers: ['Tranche', 'Pénalités'],
        rows: [
          ['Tranche ferme', `${taux} du montant`],
          ['Tranche optionnelle N°1', `${taux} du montant`],
        ],
      });
    }

    // pivot: penalite_autres
    if (q.penalite_autres === 'oui' && this.str(q.penalite_autres_detail)) {
      items.push({ kind: 'para', text: 'Pénalités particulières additionnelles :' });
      const lines = this.splitLines(q.penalite_autres_detail);
      if (lines.length) {
        items.push({ kind: 'bullets', items: lines.map((l) => l.replace(/^[-–•]\s*/, '')) });
      }
    }

    items.push({
      kind: 'bullets',
      items: [
        'Ces pénalités seront appliquées de plein droit sans mise en demeure.',
        'Les journées de repos hebdomadaire et jours fériés ne sont pas déduites.',
        "Lorsque le plafond est atteint, le MO est en droit de résilier le marché.",
        `L'ensemble des pénalités est plafonné à (${plafond}%) du montant initial du marché.`,
      ],
    });

    return items;
  }

  /** pivot: revision_prix → Art. 2.9 */
  private revisionBlock(q: CpsQuestionnaireInput): BlockItem[] {
    if (q.revision_prix === 'revisable') {
      const k = this.str(q.rev_k) || 'k';
      const a = this.str(q.rev_a) || 'a(I/Io)';
      const b = this.str(q.rev_b) || 'b(..)';
      const plafond = this.str(q.rev_plafond) || '5';
      return [
        { kind: 'para', text: "La révision des prix est effectuée conformément à l'Arrêté n° 3-302-15 du 27/11/2015." },
        { kind: 'formula', text: `P = Po [ ${k} + ${a} + ${b} ]` },
        {
          kind: 'para_mixed',
          runs: [{ text: 'Variation plafonnée à (' }, { text: plafond, bold: true }, { text: '%) du montant initial.' }],
        },
      ];
    }
    return [{ kind: 'para', text: 'Les prix du marché sont fermes et non révisables.' }];
  }
}
