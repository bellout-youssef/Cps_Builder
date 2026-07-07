import { Injectable } from '@nestjs/common';
import { BlockItem, CpsArticleSection, CpsChapterContent } from './types/cps-document.types';

/**
 * Reproduit le contenu du Chapitre II à l'identique du modèle
 * 250305_model_CPS_type travaux.docx — textes contractuels TMPA.
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
  maintien_offre_duree?: string;
  delai_garantie?: string;
  penalite_taux?: string;
  penalite_plafond?: string;
  penalite_autres?: 'oui' | 'non' | '';
  penalite_autres_detail?: string;
  revision_prix?: 'ferme' | 'revisable' | '';
  rev_k?: string;
  rev_a?: string;
  rev_b?: string;
  rev_c?: string;
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

  // ─── Articles 2.1 → 2.14 — textes repris mot pour mot du modèle ──────────

  private art21(q: CpsQuestionnaireInput): CpsArticleSection {
    const objet = this.str(q.objet_detail) || '……………………………………………………………………………………………………………………………';
    const lieu = this.str(q.lieu_exec) || '…. (lieu)……………………………';
    return {
      num: '2.1',
      title: 'OBJET DU MARCHÉ',
      blocks: [
        {
          kind: 'para_mixed',
          runs: [
            { text: 'Le présent marché a pour objet la réalisation de travaux relatifs à ' },
            { text: objet },
          ],
        },
        {
          kind: 'para_mixed',
          runs: [{ text: 'à ' }, { text: lieu }],
        },
      ],
    };
  }

  private art22(q: CpsQuestionnaireInput): CpsArticleSection {
    const mo = this.str(q.int_mo) || '……………………………………………………';
    const moe = this.str(q.int_moe) || '……………………………………………………';
    const bc = this.str(q.int_bc) || '……………………';
    const topo = this.str(q.int_topo) || '…………………………………';
    return {
      num: '2.2',
      title: 'INTERVENANTS',
      blocks: [
        { kind: 'para', text: 'Les intervenants du présent marchés sont :' },
        { kind: 'para_mixed', runs: [{ text: "Le maitre d'ouvrage  :" }, { text: mo }] },
        { kind: 'para_mixed', runs: [{ text: "Le maitre d'œuvre (Architecte, BET…):" }, { text: moe }] },
        { kind: 'para_mixed', runs: [{ text: 'Bureau de Contrôle:' }, { text: bc }] },
        { kind: 'para_mixed', runs: [{ text: 'Cabinet topographique ;' }, { text: topo }] },
      ],
    };
  }

  private art23(q: CpsQuestionnaireInput): CpsArticleSection {
    const blocks: BlockItem[] = [
      { kind: 'para', text: 'Les travaux à exécuter au titre du présent marché consistent en ce qui suit :' },
    ];
    const lines = this.splitLines(q.consistance);
    if (lines.length) {
      blocks.push({ kind: 'bullets', items: lines.map((l) => l.replace(/^[-–•]\s*/, '')) });
    } else {
      blocks.push({ kind: 'para', text: '…………………… ……………………………………………………………………………………………………….' });
      blocks.push({ kind: 'para', text: '………………….. ……………………………………………………………………………..………………………….' });
    }
    return { num: '2.3', title: 'CONSISTANCE DES TRAVAUX', blocks };
  }

  private art24(q: CpsQuestionnaireInput): CpsArticleSection {
    const lines = this.splitLines(q.textes_speciaux);
    const blocks: BlockItem[] = [
      { kind: 'para', text: 'Le titulaire du marché est soumis aux dispositions des textes suivants :' },
    ];
    if (lines.length) {
      blocks.push({ kind: 'bullets', items: lines.map((l) => l.replace(/^[-–•]\s*/, '')) });
    } else {
      blocks.push({
        kind: 'bullets',
        items: [
          "Le devis général d'architecture (édition 1956) du royaume du Maroc approuvé par la décision du ministre de l'habitat et de l'urbanisme du 27 février 1956 et rendu applicable par le décret royal n° 406-67 du 17 juillet 1967",
          "La loi n° 12-90 du 15 hijja 1412 (17 juin 1972) relative à l'urbanisme",
          "Le décret n° 2.02.177 du 22 février 2002 approuvant le règlement parasismique (RPS 2000) applicable aux bâtiments, fixant les règles parasismiques et instituant le comité national de génie parasismique",
          'Les règles de calcul de béton armé CCBA 68 et BAEL.',
          '………….',
        ],
      });
    }
    blocks.push({
      kind: 'para',
      text: "Ainsi que tous les textes relatifs à la conformité légale et réglementaire ayant trait à l'aspect environnemental en vigueur à la date de la signature du contrat, demeurent applicables.",
    });
    blocks.push({
      kind: 'para',
      text: "L'entrepreneur devra se procurer ces documents s'il ne les possède pas et ne pourra en aucun cas exciper de l'ignorance de ceux-ci et se dérober aux obligations qui y sont contenues.",
    });
    blocks.push({
      kind: 'para',
      text: 'En cas de contradiction entre ces textes, les prescriptions des documents les plus récents primeront.',
    });
    return { num: '2.4', title: 'RÉFÉRENCE AUX TEXTES SPÉCIAUX APPLICABLES AU MARCHÉ', blocks };
  }

  private art25(q: CpsQuestionnaireInput): CpsArticleSection {
    const blocks: BlockItem[] = [
      {
        kind: 'para',
        text: "Le montant du cautionnement définitif est fixé à (3%) du montant initial du marché éventuellement complété par les avenants intervenus.",
      },
    ];
    if (q.caut_prov === 'oui') {
      blocks.push({
        kind: 'para',
        text: "Si l'entrepreneur ne réalise pas le cautionnement définitif dans un délai de 30 jours à compter de la date de la notification de l'approbation du présent marché, le cautionnement provisoire reste acquis au Maitre d'ouvrage.",
      });
    } else {
      blocks.push({
        kind: 'para',
        text: "Si l'entrepreneur ne réalise pas le cautionnement définitif dans un délai de 30 jours à compter de la date de la notification de l'approbation du présent marché, il lui sera appliqué une pénalité fixée à un pour cent (1%) du montant initial du marché.",
      });
    }
    blocks.push({
      kind: 'para',
      text: 'Dans le cas de non-production, le montant total du cautionnement définitif, sera retenu sur les sommes dues à partir du premier décompte.',
    });
    blocks.push({
      kind: 'para',
      text: "Le cautionnement définitif doit être établi, selon le modèle prévu à cet effet, auprès des banques agrées par les autorités marocaines.",
    });
    blocks.push({
      kind: 'para',
      text: "Les conditions de restitution des garanties pécuniaires ou libération des cautions sont celles énumérée l'Article 15 du Référentiel Général des Achats -TMSA- fixant les Conditions Administratives Générales applicables aux Marches de Travaux et de Fournitures",
    });
    return { num: '2.5', title: 'CAUTIONNEMENT DÉFINITIF', blocks };
  }

  private art26(q: CpsQuestionnaireInput): CpsArticleSection {
    return {
      num: '2.6',
      title: "DURÉE, DÉLAI D'EXÉCUTION OU DATE D'ACHÈVEMENT",
      blocks: this.delaiBlock(q),
    };
  }

  private art27(q: CpsQuestionnaireInput): CpsArticleSection {
    const garantie = this.str(q.delai_garantie) || 'XXXX';
    return {
      num: '2.7',
      title: 'DÉLAI DE GARANTIE',
      blocks: [
        {
          kind: 'para_mixed',
          runs: [
            { text: 'Le délai de garantie est fixé à ' },
            { text: garantie, bold: true },
            { text: " à compter de la date de la réception provisoire ou à défaut de la date de la réception provisoire partielle." },
          ],
        },
        {
          kind: 'para',
          text: "Pendant le délai de garantie, l'entrepreneur sera tenu de remettre au maître d'ouvrage les plans des ouvrages conformes à l'exécution, de procéder aux rectifications qui lui seraient demandées en cas de malfaçons ou d'insuffisances constatées et de remédier à l'ensemble des défectuosités, sans pour autant que ces travaux supplémentaires puissent donner lieu au paiement à l'exception de ceux résultant de l'usure normale, d'un abus d'usage ou de dommages causés par des tiers.",
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
        text: "Conformément aux dispositions de l'Article 32 du Référentiel Général des Achats -TMSA- fixant les Conditions Administratives Générales applicables aux Marches de Travaux et de Fournitures, et si l'entrepreneur envisage de sous-traiter une partie du marché, il doit requérir l'accord préalable écrit du maître d'ouvrage dans les conditions fixées par ledit article.",
      },
      {
        kind: 'para',
        text: "La sous-traitance ne peut en aucun cas dépasser (50%) du montant du marché ni porter sur le lot ou le corps d'état principal du marché.",
      },
      { kind: 'para', text: "Les travaux énumérés ci-après ne peuvent faire l'objet de sous-traitance :" },
    ];
    const stLines = this.splitLines(q.st_exclus);
    if (stLines.length) {
      blocks.push({ kind: 'bullets', items: stLines.map((l) => l.replace(/^[-–•]\s*/, '')) });
    } else {
      blocks.push({ kind: 'para', text: '……………………………………………………………………………………………………………………………' });
      blocks.push({ kind: 'para', text: '…………………………………………………………………………………………………………………………………' });
      blocks.push({ kind: 'para', text: '……………………………………………………………………………………………………………………………' });
    }
    blocks.push({
      kind: 'para',
      text: "Le titulaire demeure personnellement responsable de toutes les obligations résultant du marché tant envers le maître d'ouvrage que vis-à-vis des ouvriers et les tiers.",
    });
    return { num: '2.10', title: 'SOUS-TRAITANCE', blocks };
  }

  private art211(q: CpsQuestionnaireInput): CpsArticleSection {
    const blocks: BlockItem[] =
      q.approvi === 'oui'
        ? [
            {
              kind: 'para',
              text: "Les approvisionnements en matériaux et matières premières destinés à entrer dans la composition des travaux objet du marché peuvent donner lieu à des acomptes sous réserve :",
            },
            {
              kind: 'bullets',
              items: [
                "Qu'ils aient été acquis en toute propriété et effectivement payés par l'entrepreneur",
                "Qu'ils soient lotis sur le chantier de manière telle que leur destination ne fasse aucun doute et qu'ils puissent être facilement contrôlés",
                "Qu'ils soient nécessaires à l'exécution du marché.",
              ],
            },
            {
              kind: 'para',
              text: "Les acomptes sur approvisionnements seront réglés conformément aux prescriptions de l'article 62 de CAG.",
            },
          ]
        : [
            {
              kind: 'para',
              text: "Le présent marché ne prévoit pas d'acompte sur approvisionnements de matériaux et matières premières destinés à entrer dans la composition des travaux objet du marché.",
            },
          ];
    return { num: '2.11', title: 'APPROVISIONNEMENTS', blocks };
  }

  private art212(): CpsArticleSection {
    return {
      num: '2.12',
      title: 'CAS DE FORCE MAJEURE',
      blocks: [
        {
          kind: 'para',
          text: "On entend par force majeure tout acte ou événement imprévisible, irrésistible, hors du contrôle des parties et qui rend l'exécution du Marché pratiquement impossible, tel que catastrophes naturelles, incendies, explosions, guerre, mobilisation, grèves générales, tremblements de terre, mais non les événements qui rendraient seulement l'exécution d'une obligation plus difficile ou plus onéreuse pour son débiteur.",
        },
        {
          kind: 'para',
          text: "En cas de survenance d'un événement de force majeure, l'entrepreneur a droit à une augmentation raisonnable des délais d'exécution.",
        },
        { kind: 'para', text: 'Deux cas se présentent :' },
        {
          kind: 'bullets',
          items: [
            "Un ou des événements dont l'incidence contractuelle se limite à un arrêt de travail qui fera l'objet d'un ordre de service précisant la durée de prolongation.",
            "Un événement ayant occasionné des incidences contractuelles autres que l'arrêt de travail fera l'objet d'un avenant si nécessaire.",
          ],
        },
        {
          kind: 'para',
          text: "Les durées d'arrêts doivent être constatées et formalisées à travers un PV par le Maitre d'Ouvrage ou son représentant. Le PV décrit l'événement ainsi que les incidences causées par l'arrêt (la durée de l'arrêt…)",
        },
        {
          kind: 'para',
          text: "Aucune indemnité ne peut être accordée au titulaire pour perte totale ou partielle de son matériel, les frais d'assurance de ce matériel étant réputés compris dans les prix du marché.",
        },
        {
          kind: 'para',
          text: 'Les seuils des intempéries qui sont réputés constituer un événement de force majeure sont définis comme suit :',
        },
        {
          kind: 'table',
          headers: ['Evénement', 'Travaux Maritimes', 'Aménagement', 'Bâtiment'],
          rows: [
            ['Pluie', '15 mm/Jour', '5 mm/Jour', '10 mm/Jour'],
            ['Vent', 'Rafales dépassant 60 Km/h', 'Rafales dépassant 60 Km/h', 'Rafales dépassant 60 Km/h'],
            ['Houle', '6 m', 'NA', 'NA'],
            ["Séisme", "4 degrés sur l'échelle de Richter", "4 degrés sur l'échelle de Richter", "4 degrés sur l'échelle de Richter"],
          ],
        },
        {
          kind: 'para',
          text: "Dans le cas d'intempéries dépassant le seuil fixé par le marché, entraînant un arrêt de travail sur les chantiers, les délais d'exécution des travaux sont prolongés. Cette prolongation est notifiée à l'Entrepreneur par un ordre de service qui en précise la durée, laquelle est égale au nombre de journées réellement constaté au cours desquelles le travail a été arrêté du fait des intempéries.",
        },
        {
          kind: 'para',
          text: "En tout état de cause, l'entrepreneur qui invoque le cas de force majeure, devra aussitôt après l'apparition d'un tel cas, et dans un délai maximum de sept (7) jours, adresser au maître d'ouvrage une notification par lettre recommandée établissant les éléments constitutifs de la force majeure et ses conséquences probables sur la réalisation du marché.",
        },
        {
          kind: 'para',
          text: "Dans tous les cas, le titulaire doit prendre toutes dispositions utiles pour assurer, dans les plus brefs délais, la reprise normale de l'exécution des obligations affectées par le cas de force majeure.",
        },
        {
          kind: 'para',
          text: "Si, par la suite de cas de force majeure, le titulaire ne peut plus exécuter les prestations telles que prévues au marché pendant une période de (30) jours, il doit examiner dans les plus brefs délais avec le maître d'ouvrage les incidences contractuelles desdits événements sur l'exécution du marché, les délais et les obligations respectives de chacune des parties.",
        },
        {
          kind: 'para',
          text: "Quand une situation de force majeure persiste pendant une période de soixante (60) jours au moins, le marché peut être résilié à l'initiative du maître d'ouvrage ou à la demande de l'entrepreneur.",
        },
      ],
    };
  }

  private art213(q: CpsQuestionnaireInput): CpsArticleSection {
    let blocks: BlockItem[];
    if (q.variante === 'oui') {
      blocks = [
        {
          kind: 'para',
          text: "Le Maître d'Ouvrage optera pour une quantité des prix plafonnée des ouvrages ou partie d'ouvrage impactée par la variante avec value engineering. Conformément aux règles suivantes :",
        },
        {
          kind: 'para',
          text: "le titulaire s'engage sur le coût global de son offre variante ou de la / les séries objets de sa variante proposée ou impactées par la variante proposée. En aucun cas, les études réalisées durant la phase d'exécution ne pourront donner lieu à une augmentation de la rémunération de l'Entrepreneur présentée dans son offre variante.",
        },
        {
          kind: 'para',
          text: "En tout état de cause, les quantités de la / les séries objets de sa variante proposée ou impactées par la variante proposée mentionnées dans son bordereau des prix détail estimatif de l'offre financière « variante » ne pourront en aucun cas être dépassées. Tout dépassement éventuel dans les quantités réellement exécutées sera entièrement pris en charge par l'Entrepreneur à ses frais et ne pourra formuler aucune réclamation à ce sujet. A contrario, en cas de diminution dans les quantités de certains postes de prix objets de sa variante proposée ou impactées par la variante proposée, le titulaire ne sera réglé qu'à hauteur des quantités réellement réalisées augmentées de la moitié (50%) de l'écart entre les quantités indiquées au bordereau des prix détail estimatif de la variante et les quantités réellement exécutées. Le paiement des quantités de postes de prix objets de sa variante proposée ou impactées par la variante proposée se fera selon la règle suivante :",
        },
        {
          kind: 'bullets',
          items: [
            "Si quantité réalisée ≥ quantité du bordereau de la variante : Quantité à payer = Quantité du bordereau de la variante",
            "Si quantité réalisée < quantité du bordereau de la variante : Quantité à payer = Quantité réalisée + 0.5 x (Quantité du bordereau de la variante – Quantité réalisée).",
          ],
        },
      ];
    } else {
      blocks = [{ kind: 'para', text: 'Dispositions Non Applicables' }];
    }
    return { num: '2.13', title: 'CONDITIONS ET EXÉCUTION DE LA VARIANTE', blocks };
  }

  private art214(q: CpsQuestionnaireInput): CpsArticleSection {
    return { num: '2.14', title: 'RÉCEPTIONS', blocks: this.receptionBlock(this.str(q.delai_type)) };
  }

  // ─── Fonctions pivots ─────────────────────────────────────────────────────

  private delaiBlock(q: CpsQuestionnaireInput): BlockItem[] {
    const delaiType = this.str(q.delai_type);

    if (delaiType === 'ferme') {
      const mois = this.str(q.delai_ferme_mois) || 'XXX';
      return [
        {
          kind: 'para_mixed',
          runs: [
            { text: 'Le présent marché est conclu pour une durée (' },
            { text: mois, bold: true },
            { text: ") mois calendaire à compter de la date de notification de l'ordre de service de commencement." },
          ],
        },
        { kind: 'para', text: 'Un mois calendaire est égal à 30 jours.' },
        { kind: 'para', text: 'OSC : ordre service pour commencer des prestations' },
        {
          kind: 'para',
          text: "Le délai d'exécution court à partir de la date prévue par l'ordre de service prescrivant le commencement de l'exécution des prestations ou, à défaut, à partir de la date de notification dudit ordre de service.",
        },
        { kind: 'para', text: "Ce délai s'applique à l'achèvement de tous les travaux incombant au fournisseur." },
      ];
    }

    if (delaiType === 'partiel') {
      const partiels = q.delais_partiels ?? [];
      const rows: string[][] = partiels.length
        ? partiels.map((p) => [p.label, `(${p.mois || 'XXX'}) mois`, p.dateCommencement, p.conditionReception])
        : [
            [
              'Délai 1',
              '(X1) mois',
              "À partir de la date de commencement des prestations prescrites dans l'ordre de service de l'OSC 1 au plus tard 60 jours après la date de signature du contrat",
              "À l'achèvement de toutes les prestations relatives à ce délai y compris livrables sanctionné par un pv de réception provisoire partielle",
            ],
            [
              'Délai n',
              '(Xn) mois',
              "À partir de la date de commencement des prestations prescrites dans l'ordre de service de l'OSC n",
              "À l'achèvement de toutes les prestations relatives à ce délai y compris livrables sanctionné par un pv de réception provisoire partielle",
            ],
          ];
      return [
        { kind: 'para', text: "Le délai global d'exécution est ……………………………………" },
        { kind: 'para', text: 'Le prestataire est tenu de respecter les délais partiels suivants :' },
        {
          kind: 'table',
          headers: ['', "Délai d'exécution", 'Date de commencement', 'Condition de réception'],
          rows,
        },
        { kind: 'para', text: 'OSC : ordre service pour commencer des prestations' },
        {
          kind: 'para',
          text: "Un mois calendaire est égal à 30 jours. Les délais partiels d'exécution courent à partir des dates prévues par le ou les ordres de services prescrivant le commencement de l'exécution des travaux y afférents ou, à défaut, à partir du lendemain des dates de notification desdits ordres de service.",
        },
      ];
    }

    if (delaiType === 'tranche') {
      const tranches = q.tranches ?? [];
      const rows: string[][] = tranches.length
        ? tranches.map((t) => [
            t.label,
            `(${t.mois || 'XXX'}) mois`,
            t.dateCommencement,
            t.dateLimiteOsc,
            "À l'achèvement de toutes les prestations relatives à ce délai y compris livrables sanctionné par un pv de réception provisoire partielle",
          ])
        : [
            [
              'Tranche ferme',
              '(X1) mois',
              "À partir de la date de commencement des prestations prescrites dans l'ordre de service de l'OSC 1",
              "L'OSC 1 est donné au plus tard 60 jours après la date de signature du contrat",
              "À l'achèvement de toutes les prestations relatives à ce délai y compris livrables sanctionné par un pv de réception provisoire partielle",
            ],
            [
              'Tranche optionnelle (N°1)',
              '(Xn) mois',
              "À partir de la date de commencement des prestations prescrites dans l'ordre de service de l'OSC afférant à la tranche concernée",
              "Le maitre d'ouvrage doit confirmer la tranche optionnelle, au plus tard dans un délai de XXX à partir de la fin du délai d'exécution de la tranche ferme par OSC",
              "À l'achèvement de toutes les prestations relatives à ce délai y compris livrables sanctionné par un pv de réception provisoire partielle",
            ],
          ];
      return [
        { kind: 'para', text: 'Les prestations du présent marché seront réalisées suivant les délais prescrits dans le tableau suivant :' },
        {
          kind: 'table',
          headers: ['', "Délai d'exécution", 'Date de commencement', "Date limite de l'OSC", 'Condition de réception'],
          rows,
        },
        { kind: 'para', text: 'OSC : ordre service pour commencer des prestations' },
        { kind: 'para', text: 'Un mois calendaire est égal à 30 jours.' },
        {
          kind: 'para_mixed',
          runs: [
            { text: "Si la tranche optionnelle n'a pas été confirmée dans le délai prévu, le maitre d'ouvrage demande au prestataire le maintien de son offre pour une durée de " },
            { text: this.str(q.maintien_offre_duree) || '……', bold: !!this.str(q.maintien_offre_duree) },
            { text: ", à défaut la tranche en question est annulée." },
          ],
        },
        {
          kind: 'para',
          text: "N.B. Le prestataire peut refuser le maintien de l'offre, dans ce cas de figure, la tranche optionnelle est automatiquement annulée.",
        },
      ];
    }

    return [{ kind: 'para', text: '……………………………………………………………………………………………………………', italic: true }];
  }

  private penaliteBlock(q: CpsQuestionnaireInput): BlockItem[] {
    const taux = this.str(q.penalite_taux) || 'X/1000';
    const plafond = this.str(q.penalite_plafond) || '10';
    const delaiType = this.str(q.delai_type);

    const autresPenalites = (): BlockItem[] => {
      const result: BlockItem[] = [{ kind: 'para', text: "D'autres pénalités applicables :" }];
      if (q.penalite_autres === 'oui' && this.str(q.penalite_autres_detail)) {
        const lines = this.splitLines(q.penalite_autres_detail);
        result.push({ kind: 'bullets', items: lines.map((l) => l.replace(/^[-–•]\s*/, '')) });
      } else {
        result.push({ kind: 'para', text: ' -…………..', });
        result.push({ kind: 'para', text: '-…………..', });
      }
      return result;
    };

    const plafondPara = (): BlockItem => ({
      kind: 'para_mixed',
      runs: [
        { text: "L'ensemble des montants des pénalités est plafonné à (" },
        { text: plafond, bold: true },
        { text: "%) du montant initial du marché éventuellement complété par les montants correspondant aux travaux supplémentaires et à l'augmentation dans la masse des prestations." },
      ],
    });

    // Paragraphes communs aux 3 cas (avec légère variante pour "déduites" dans cas tranche)
    const closingParagraphs = (déduitesForm: 'déduits' | 'déduites'): BlockItem[] => [
      {
        kind: 'para',
        text: "L'application de ces pénalités ne libère en rien le Prestataire de l'ensemble des autres obligations et responsabilités qu'il a souscrites au titre du marché.",
      },
      {
        kind: 'para',
        text: "Dans le cas de résiliation suite à la défaillance de l'entrepreneur, les pénalités sont appliquées jusqu'au jour d'ultimatum indiqué dans la dernière mise en demeure notifiée au prestataire ou jusqu'au jour d'arrêt de l'exploitation de l'entreprise si la résiliation résulte d'une liquidation ou redressement judiciaire, Décès ou incapacité physique de l'entrepreneur.",
      },
      {
        kind: 'para',
        text: "La résiliation, si elle est prononcée, prend effet à la date de la décision du syndic de renoncer à poursuivre l'exécution du Marché ou de l'expiration du délai de (1) mois ci-dessus. Elle n'ouvre droit, pour l'Entrepreneur, à aucune indemnité",
      },
      {
        kind: 'para',
        text: `Les journées de repos hebdomadaire ainsi que les jours fériés ou chômés ne sont pas ${déduitesForm} pour le calcul des montants des pénalités.`,
      },
      {
        kind: 'para',
        text: "Lorsque le plafond des pénalités est atteint, le Maître d'ouvrage est en droit de résilier le marché sans mise en demeure préalable",
      },
    ];

    if (delaiType === 'ferme') {
      return [
        {
          kind: 'para',
          text: "En cas de retard dans l'exécution des travaux, il est appliqué une pénalité par jour calendaire de retard à l'encontre du prestataire ;",
        },
        {
          kind: 'para_mixed',
          runs: [
            { text: 'Le montant de cette pénalité est fixé à (' },
            { text: taux, bold: true },
            { text: ') du montant du marché.' },
          ],
        },
        {
          kind: 'para',
          text: "Ledit montant est celui du marché initial, éventuellement majoré par les montants correspondants aux travaux supplémentaires et à l'augmentation dans la masse des travaux.",
        },
        ...autresPenalites(),
        { kind: 'para', text: "Ces pénalités seront appliquées de plein droit et sans mise en demeure sur toutes les sommes dues au prestataire." },
        {
          kind: 'para',
          text: "Les pénalités sont encourues du simple fait de la constatation du retard ou écart par le Maître d'Ouvrage qui, sans préjudice de toute autre méthode de recouvrement, déduit d'office le montant de ces pénalités de toutes les sommes dont titulaire est redevable.",
        },
        ...closingParagraphs('déduits'),
        plafondPara(),
      ];
    }

    if (delaiType === 'partiel') {
      const partiels = q.delais_partiels ?? [];
      const rows: string[][] = partiels.length
        ? partiels.map((p) => [p.label, `(${taux}) du montant du marché`])
        : [
            ['Délai 1', '[En numéraire] Ou en [pourcentage_ ___du montant du marché ]'],
            ['Délai n', '[En numéraire] Ou en [pourcentage_ ___du montant du marché ]'],
            ['Délai n+1', '[En numéraire ] Ou en [ pourcentage_ ___du montant du marché ]'],
          ];
      return [
        { kind: 'para', text: "En cas de retard dans l'exécution des prestations, il est appliqué une pénalité comme suit :" },
        { kind: 'table', headers: ['Pénalités', ''], rows },
        {
          kind: 'para',
          text: "Ledit montant est celui du marché initial, éventuellement majoré par les montants correspondants aux travaux supplémentaires et à l'augmentation dans la masse des travaux.",
        },
        { kind: 'para', text: "Ces pénalités seront appliquées de plein droit et sans mise en demeure sur toutes les sommes dues au prestataire." },
        ...autresPenalites(),
        {
          kind: 'para',
          text: "Les pénalités sont encourues du simple fait de la constatation du retard ou écart par le Maître d'Ouvrage qui, sans préjudice de toute autre méthode de recouvrement, déduit d'office le montant de ces pénalités de toutes les sommes dont titulaire est redevable.",
        },
        ...closingParagraphs('déduits'),
        plafondPara(),
        {
          kind: 'para',
          text: "Si le délai global d'exécution a été respecté les pénalités par rapport aux délais partiels seront restituées.",
        },
      ];
    }

    if (delaiType === 'tranche') {
      const tranches = q.tranches ?? [];
      const rows: string[][] = tranches.length
        ? tranches.map((t) => [t.label, `(${taux}) du montant du marché`])
        : [
            ['Tranche ferme', '[En numéraire] Ou en [pourcentage_ ___du montant du marché ]'],
            ['Tranche optionnelle (N°1)', '[En numéraire] Ou en [pourcentage_ ___du montant du marché ]'],
            ['Tranche optionnelle (N°2)', '[En numéraire ] Ou en [ pourcentage_ ___du montant du marché ]'],
          ];
      return [
        {
          kind: 'para',
          text: "En cas de retard dans l'exécution des prestations, il est appliqué une pénalité par jour calendaire de retard à l'encontre du Prestataire, si le retard affecte le délai principal du marché.",
        },
        { kind: 'table', headers: ['Tranche', 'Pénalités'], rows },
        {
          kind: 'para',
          text: "Ledit montant est celui du marché initial, éventuellement majoré par les montants correspondants aux travaux supplémentaires et à l'augmentation dans la masse des travaux.",
        },
        { kind: 'para', text: "Ces pénalités seront appliquées de plein droit et sans mise en demeure sur toutes les sommes dues au prestataire." },
        {
          kind: 'para',
          text: "Les pénalités sont encourues du simple fait de la constatation du retard ou écart par le Maître d'Ouvrage qui, sans préjudice de toute autre méthode de recouvrement, déduit d'office le montant de ces pénalités de toutes les sommes dont titulaire est redevable.",
        },
        ...closingParagraphs('déduites'), // "déduites" dans le cas tranche (accord pluriel féminin)
        ...autresPenalites(),
        plafondPara(),
        {
          kind: 'para',
          text: "Les pénalités particulières sont prélevées dans les mêmes conditions que celles prévues pour les pénalités pour retard dans l'exécution des prestations.",
        },
      ];
    }

    return [{ kind: 'para', text: '……………………………………………………………………………………………………………', italic: true }];
  }

  private revisionBlock(q: CpsQuestionnaireInput): BlockItem[] {
    if (q.revision_prix === 'revisable') {
      const kVal = this.str(q.rev_k);
      const aVal = this.str(q.rev_a);
      const bVal = this.str(q.rev_b);
      const cVal = this.str(q.rev_c);

      // Formula: substitute actual values, keep placeholder letter when field is empty
      const hasSomeValue = !!(kVal || aVal || bVal || cVal);
      const fk = kVal || 'k';
      const fa = aVal || 'a';
      const fb = bVal || 'b';
      // Show c term only when c has a value, or (if nothing filled) keep generic formula with c
      const fcPart = cVal ? ` + ${cVal}(..)` : (hasSomeValue ? '' : ' + c(..)');
      const formulaText = `P = Po [${fk} + ${fa} (I/Io) + ${fb} (..)${fcPart}] ; où`;

      // Coefficient definition lines
      const kLine = kVal ? `k = ${kVal} : est la partie fixe` : 'K : est la partie fixe';

      let sumLine: string;
      if (hasSomeValue) {
        const parts: string[] = [
          kVal ? `k = ${kVal}` : 'k',
          aVal ? `a = ${aVal}` : 'a',
          bVal ? `b = ${bVal}` : 'b',
        ];
        if (cVal) parts.push(`c = ${cVal}`);
        const sumLetters = ['k', 'a', 'b', ...(cVal ? ['c'] : [])].join('+');
        sumLine = `${parts.join(' ; ')} : coefficients invariables tels que ${sumLetters} = 1`;
      } else {
        sumLine = 'K, a, b, c ... sont des coefficients invariables tels que k+a+b+c+ …=1';
      }

      return [
        {
          kind: 'para',
          text: "La révision des prix, il est passé conformément à Arrêté du Chef du gouvernement n° 3-302-15 du 15 safar 1437 fixant les règles et les conditions de révision des prix des marchés publics. (B.O. n° 6422 du 17 décembre 2015).",
        },
        {
          kind: 'para',
          text: "Si pendant le délai contractuel, des variations sont constatées dans la valeur des index de références, les prix du marché sont révisés par application de la formule ci-dessous.",
        },
        { kind: 'formula', text: formulaText },
        {
          kind: 'bullets',
          items: [
            'P : est le montant hors taxe révisé de la prestation considérée',
            'Po : le montant initial hors taxe de cette même prestation',
            kLine,
            sumLine,
            'P/Po : étant le coefficient de révision des prix',
            "Io : est la valeur de l'index global relatif à la prestation considérée au mois : * de la date limite de remise des offres ; * de la date de la signature du marché par l'attributaire lorsque ce dernier est négocié.",
            "I : est la valeur de l'index du mois de la date de l'exigibilité de la révision.",
          ],
        },
        {
          kind: 'para',
          text: "La révision des prix sera appliquée aux travaux qui restent à exécuter à partir de la date de variation des index constatée par les décisions prises à cet effet par le ministre chargé de l'équipement.",
        },
        {
          kind: 'para',
          text: 'La variation de la révision des prix est limitée à cinq pour cent (5%) du montant initial du marché.',
        },
        {
          kind: 'para',
          text: "Pour les avenants, l'époque de base pour le calcul de la révision des prix est la date de signature de l'avenant par le maître d'ouvrage.",
        },
        {
          kind: 'para',
          text: "En cas d'un retard dans l'exécution des travaux imputables à l'Entrepreneur, les prestations réalisées après le délai contractuel d'exécution seront payées sur la base des prix révisés au jour de l'expiration du délai contractuel d'exécution (lui-même, éventuellement prorogé de la durée des retards non imputables à l'Entrepreneur).",
        },
      ];
    }
    return [{ kind: 'para', text: 'Les prix du marché sont fermes et non révisables.' }];
  }

  private receptionBlock(delaiType: string): BlockItem[] {
    if (delaiType === 'ferme') {
      return [
        {
          kind: 'para',
          text: "cet article n'aura pas lieu, on garde uniquement les articles déjà prévus au niveau des clauses communes.",
        },
      ];
    }
    if (delaiType === 'partiel') {
      return [
        { kind: 'para', text: 'Réception provisoires', bold: true },
        {
          kind: 'para',
          text: 'Une Réception provisoire partielle sera déclarée après achèvement des prestation relatives à chaque délai.',
        },
        { kind: 'para', text: 'Réception définitive', bold: true },
        {
          kind: 'para',
          text: 'Réception définitive partielle sera déclarée après la période de garantie, relative à chaque délai partiel, à compter de sa réception provisoire partielle.',
        },
        {
          kind: 'para',
          text: 'Une réception provisoire globale sera déclarée en même temps que la dernière réception provisoire partielle.',
        },
        {
          kind: 'para',
          text: 'La réception définitive globale sera déclarée après la période de garantie relative au dernier délai partiel.',
        },
      ];
    }
    if (delaiType === 'tranche') {
      return [
        { kind: 'para', text: 'Réception provisoires', bold: true },
        {
          kind: 'para',
          text: 'Une Réception provisoire partielle sera déclarée après achèvement des prestation relatives à chaque tranche.',
        },
        { kind: 'para', text: 'Réception définitive', bold: true },
        {
          kind: 'para',
          text: 'Réception définitive partielle sera déclarée après la période de garantie, relative à chaque tranche à compter de sa réception provisoire partielle.',
        },
        {
          kind: 'para',
          text: 'Une réception provisoire globale sera déclarée en même temps que la dernière réception provisoire partielle.',
        },
        {
          kind: 'para',
          text: 'La réception définitive globale sera déclarée après la période de garantie relative à la dernière tranche optionnelle.',
        },
        {
          kind: 'para',
          text: "Si la tranche optionnelle n'a pas été activée, la tranche optionnelle est automatiquement résiliée. Dans ce cas, les modalités de réceptions prévues au niveau des clauses communes seront appliquées.",
        },
      ];
    }
    return [{ kind: 'para', text: '……………………………………………………………………………………………………………', italic: true }];
  }
}
