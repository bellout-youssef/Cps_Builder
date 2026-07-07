/**
 * Script de test autonome — génération CPS sans base ni auth.
 * Lance : ts-node --transpile-only -P apps/api/tsconfig.scripts.json apps/api/scripts/test-cps-generation.ts
 */
import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';

import { CpsContentBuilderService, CpsQuestionnaireInput } from '../src/documents/cps-content-builder.service';
import { HtmlGeneratorService } from '../src/documents/html-generator.service';
import { CpsDocumentData } from '../src/documents/types/cps-document.types';

// ─── 1. Jeu de réponses COMPLET au questionnaire ─────────────────────────────
// Cas le plus riche : tranche + revisable + variante oui + tous les pivots oui.

const questionnaire: CpsQuestionnaireInput = {

  // ── Identification AO ──────────────────────────────────────────────────────
  ao_num: 'AO-2026-DTT-0042',
  ao_title: 'Construction et équipement du nouveau siège social de la TMPA — Lot unique',
  mode_passation: 'Appel d\'offres ouvert',

  // ── Identité Maître d'ouvrage ──────────────────────────────────────────────
  mo_capital: '500 000 000 DH',
  mo_rc: 'RC Casa 123456',
  mo_ice: '001234567000089',
  mo_if: 'IF 45678901',
  mo_siege: 'Km 7, Route de Rabat, Aïn Sebaâ, Casablanca',
  mo_dg: 'M. Khalid Alaoui',

  // ── Art. 2.1 Objet ────────────────────────────────────────────────────────
  objet_detail: 'construction, équipement et aménagements extérieurs du nouveau siège social de la Tanger Med Port Authority, comprenant un bâtiment R+5 de 4 200 m², parking souterrain de 80 places et VRD complets',
  lieu_exec: 'Zone Franche du Port de Tanger Med, Commune de Ksar Sghir, Province de Fahs-Anjra',

  // ── Art. 2.2 Intervenants ─────────────────────────────────────────────────
  int_mo: 'Tanger Med Port Authority (TMPA) — Direction des Travaux et de la Technique',
  int_moe: 'Groupement ATELIER D\'ARCHITECTURE AMINE & Associés / BET INGÉNIA CONSEIL',
  int_bc: 'Bureau VERITAS Maroc — Agence Nord',
  int_topo: 'Cabinet TOPOMAG — Tanger',

  // ── Art. 2.3 Consistance ──────────────────────────────────────────────────
  consistance: [
    '- Travaux de terrassements généraux et fouilles en grande masse',
    '- Gros-œuvre béton armé (fondations, dalles, voiles, poteaux, poutres)',
    '- Maçonnerie, isolation thermique et acoustique des façades',
    '- Menuiseries aluminium et vitrages haute performance',
    '- Revêtements de sols et de murs intérieurs',
    '- Faux-plafonds, cloisons légères et aménagements intérieurs',
    '- Plomberie sanitaire, réseaux d\'incendie sprinkler',
    '- Électricité courants forts et courants faibles (SSI, contrôle d\'accès, vidéosurveillance)',
    '- CVC : climatisation VRF + ventilation double flux',
    '- Ascenseurs et monte-charge (2 cabines)',
    '- Voirie, réseaux divers extérieurs (VRD) et espaces verts',
    '- Parking souterrain R-1 (béton armé, 80 places)',
  ].join('\n'),

  // ── Art. 2.4 Textes spéciaux ──────────────────────────────────────────────
  textes_speciaux: [
    '- Référentiel Général des Achats TMSA (RGA) — édition 2023',
    '- Décret n° 2-22-431 du 15 mars 2023 relatif aux marchés publics',
    '- Norme marocaine NM 01.4.098 — Béton — Spécification, performance, production et conformité',
    '- NM ISO 9001:2015 — Systèmes de management de la qualité',
    '- Règlement parasismique RPS 2011 (révisé 2019)',
    '- DTU applicable aux travaux du bâtiment',
    '- Loi n° 65-99 relative au Code du Travail',
    '- Loi-cadre n° 99-12 portant Charte Nationale de l\'Environnement et du Développement Durable',
  ].join('\n'),

  // ── Art. 2.5 Cautionnement provisoire ——— PIVOT = oui ─────────────────────
  caut_prov: 'oui',

  // ── Art. 2.6 Délai ——— PIVOT = tranche (cas le plus complet) ─────────────
  delai_type: 'tranche',
  delai_ferme_mois: undefined,      // non utilisé en mode tranche
  delais_partiels: undefined,       // non utilisé en mode tranche

  tranches: [
    {
      label: 'Tranche ferme',
      mois: '18',
      dateCommencement: 'À partir de la date de commencement des prestations prescrites dans l\'ordre de service de l\'OSC 1',
      dateLimiteOsc: 'L\'OSC 1 est donné au plus tard 60 jours après la date de signature du contrat',
    },
    {
      label: 'Tranche optionnelle N°1 — Parking souterrain',
      mois: '10',
      dateCommencement: 'À partir de la date de commencement des prestations prescrites dans l\'ordre de service de l\'OSC afférant à la Tranche optionnelle N°1',
      dateLimiteOsc: 'Le maître d\'ouvrage doit confirmer la Tranche optionnelle N°1 au plus tard dans un délai de 6 mois à partir de la fin du délai d\'exécution de la tranche ferme par OSC',
    },
    {
      label: 'Tranche optionnelle N°2 — Espaces verts et VRD complémentaires',
      mois: '6',
      dateCommencement: 'À partir de la date de commencement des prestations prescrites dans l\'ordre de service de l\'OSC afférant à la Tranche optionnelle N°2',
      dateLimiteOsc: 'Le maître d\'ouvrage doit confirmer la Tranche optionnelle N°2 au plus tard dans un délai de 3 mois à partir de la fin du délai d\'exécution de la Tranche optionnelle N°1 par OSC',
    },
  ],

  // ── Art. 2.6 Maintien d'offre (tranche uniquement) ────────────────────────
  maintien_offre_duree: '90 (quatre-vingt-dix) jours',

  // ── Art. 2.7 Garantie ─────────────────────────────────────────────────────
  delai_garantie: '12 (douze) mois',

  // ── Art. 2.8 Pénalités ────────────────────────────────────────────────────
  penalite_taux: '1/1000',
  penalite_plafond: '10',

  // ── Autres pénalités ——— PIVOT = oui ─────────────────────────────────────
  penalite_autres: 'oui',
  penalite_autres_detail: [
    '- Défaut d\'affichage du panneau de chantier réglementaire : 2 000 DH par jour de manquement constaté',
    '- Non-respect du plan de gestion environnementale : 5 000 DH par infraction constatée',
    '- Absence non justifiée du chef de chantier pendant les heures ouvrables : 1 000 DH par demi-journée',
    '- Non-respect du plan de circulation interne au port : 3 000 DH par infraction',
  ].join('\n'),

  // ── Art. 2.9 Révision des prix ——— PIVOT = revisable ─────────────────────
  revision_prix: 'revisable',
  rev_k: '0,15',
  rev_a: '0,35',   // index matériaux de construction
  rev_b: '0,30',   // index main-d'œuvre BTP
  rev_plafond: '5',

  // ── Art. 2.10 Sous-traitance ──────────────────────────────────────────────
  st_exclus: [
    '- Gros-œuvre béton armé (fondations, structure porteuse)',
    '- Travaux d\'étanchéité des terrasses et du parking souterrain',
    '- Installation électrique courants forts (TGBT et tableaux divisionnaires)',
  ].join('\n'),

  // ── Art. 2.11 Approvisionnements ——— PIVOT = oui ─────────────────────────
  approvi: 'oui',

  // ── Art. 2.13 Variante ——— PIVOT = oui ───────────────────────────────────
  variante: 'oui',
  variante_series: 'Série A-300 (Façades et menuiseries) — value engineering sur le système de façade rideau',

  // ── Chapitre III ──────────────────────────────────────────────────────────
  tech_prescriptions: 'Béton C30/37, aciers FeE500, ciment CEM II/A-L 42,5 N, granulats conformes NM 10.1.271.',
  tech_docs: 'Plans architecturaux A-001 à A-148, Plans béton armé BA-001 à BA-092, CCTP lot gros-œuvre, CCTP lot CVC.',

  // ── Chapitre IV — Bordereau des prix (cdp_lignes) ────────────────────────
  cdp_lignes: [
    { numero: 'A-101', designation: 'Installation et repli de chantier — fourniture et mise en place de toutes installations provisoires', unite: 'Fft' },
    { numero: 'A-102', designation: 'Terrassements en déblais pour fouilles en grande masse, y compris évacuation', unite: 'm³' },
    { numero: 'A-103', designation: 'Terrassements en remblais compactés par couches de 20 cm, matériaux d\'apport', unite: 'm³' },
    { numero: 'B-201', designation: 'Béton de propreté dosé à 150 kg/m³, épaisseur 10 cm', unite: 'm²' },
    { numero: 'B-202', designation: 'Béton armé pour fondations semelles et longrines, dosé à 350 kg/m³', unite: 'm³' },
    { numero: 'B-203', designation: 'Béton armé pour voiles et poteaux en élévation, dosé à 350 kg/m³', unite: 'm³' },
    { numero: 'B-204', designation: 'Béton armé pour dalles et poutres, dosé à 350 kg/m³', unite: 'm³' },
    { numero: 'B-205', designation: 'Maçonnerie en parpaings creux 20 cm, montée au mortier de ciment', unite: 'm²' },
    { numero: 'C-301', designation: 'Menuiserie aluminium — portes et fenêtres à rupture de pont thermique, double vitrage', unite: 'm²' },
    { numero: 'C-302', designation: 'Revêtement de sol en carrelage grès cérame 60×60, pose scellée', unite: 'm²' },
    { numero: 'C-303', designation: 'Faux-plafond en dalles minérales 600×600, structure aluminium', unite: 'm²' },
    { numero: 'D-401', designation: 'Réseau eau froide et eau chaude sanitaire, y compris appareillages', unite: 'Fft' },
    { numero: 'D-402', designation: 'Réseau incendie sprinkler — fourniture, pose et essais complets', unite: 'Fft' },
    { numero: 'E-501', designation: 'Tableau général basse tension (TGBT) — fourniture, pose et raccordement', unite: 'U' },
    { numero: 'E-502', designation: 'Réseau courants forts — câblage, chemins de câbles, luminaires LED', unite: 'Fft' },
    { numero: 'E-503', designation: 'Système de sécurité incendie (SSI) — catégorie A, fourniture et installation', unite: 'Fft' },
    { numero: 'F-601', designation: 'Climatisation VRF — unités intérieures et extérieures, pose et mise en service', unite: 'Fft' },
    { numero: 'F-602', designation: 'Ascenseurs 8 personnes, vitesse 1 m/s — fourniture, pose et mise en service', unite: 'U' },
    { numero: 'G-701', designation: 'Voirie en béton bitumineux 0/10, épaisseur 8 cm, sur grave non traitée 20 cm', unite: 'm²' },
    { numero: 'G-702', designation: 'Réseau EU/EP enterré PVC DN200 à DN400, y compris regards et ouvrages annexes', unite: 'ml' },
  ],
};

// ─── 2. Construction du CpsDocumentData complet ──────────────────────────────

const documentData: CpsDocumentData = {
  code: '260707_CPS_TMPA_0042',
  projectName: 'Construction et équipement du nouveau siège social TMPA',
  projectDescription: 'Bâtiment R+5 de 4 200 m² + parking souterrain 80 places + VRD — Tanger Med',
  organization: { id: 'org-001', name: 'Tanger Med Port Authority', slug: 'tmpa' },
  createdBy: { id: 'usr-001', name: 'Youssef Bellout' },
  publishedAt: new Date('2026-07-07T10:00:00Z'),
  types: ['B — Bâtiment', 'A — Aménagement'],

  preamble: `<p>Entre la <strong>Tanger Med Port Authority (TMPA)</strong>, représentée par son Directeur Général M. Khalid Alaoui, ci-après dénommée « le Maître d'Ouvrage », d'une part,</p>
<p>et l'Entrepreneur retenu à l'issue de la procédure d'appel d'offres ouvert n° AO-2026-DTT-0042, ci-après dénommé « l'Entrepreneur », d'autre part,</p>
<p><strong>IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :</strong></p>`,

  chapter1: [
    {
      id: 'cl-001',
      number: '1.1',
      title: 'PIÈCES CONSTITUTIVES DU MARCHÉ',
      content: '<p>Les pièces constitutives du marché sont, par ordre de priorité :<br>1° Le présent CPS ;<br>2° Le Bordereau des Prix Détail Estimatif ;<br>3° Les plans et documents techniques joints au DCE ;<br>4° Le Référentiel Général des Achats TMSA.</p>',
      isModifiedLocally: false,
    },
    {
      id: 'cl-002',
      number: '1.2',
      title: 'NANTISSEMENT',
      content: '<p>Dans l\'éventualité d\'une affectation en nantissement, il sera fait application des dispositions de la loi n° 112-13 relative au nantissement des marchés publics.</p>',
      isModifiedLocally: false,
    },
    {
      id: 'cl-003',
      number: '1.3',
      title: 'REPRÉSENTANT DU MAÎTRE D\'OUVRAGE SUR LE CHANTIER',
      content: '<p>Le maître d\'ouvrage sera représenté sur le chantier par le maître d\'œuvre désigné à l\'article 2.2, assisté du bureau de contrôle. Tout ordre de service est signé par le représentant désigné du maître d\'ouvrage.</p>',
      isModifiedLocally: false,
    },
  ],

  // chapter2 rempli par le builder (voir ci-dessous)
  chapter2: [],
  chapter2Content: undefined, // sera rempli ci-dessous

  chapter3: [
    {
      id: 'ct-001',
      number: 'CT-B-001',
      title: 'PRESCRIPTIONS GÉNÉRALES POUR LES TRAVAUX DE GROS-ŒUVRE',
      content: '<p>L\'entrepreneur doit se conformer aux prescriptions des normes marocaines en vigueur pour tous les matériaux utilisés. Le béton armé sera exécuté conformément aux règles BAEL 91 révisées 99 et au RPS 2011. Tout béton utilisé doit faire l\'objet d\'une étude de formulation préalablement soumise à l\'approbation du bureau de contrôle.</p>',
      isModifiedLocally: false,
      subClauses: [
        {
          title: 'Armatures',
          content: '<p>Les aciers utilisés seront de nuance FeE500 soudable (aciers à haute adhérence). Les plans de ferraillage seront soumis au visa du bureau d\'études et du bureau de contrôle avant toute mise en œuvre.</p>',
        },
        {
          title: 'Coffrages',
          content: '<p>Les coffrages seront de type soigné pour les parements vus. L\'entrepreneur présentera un plan de coffrage pour chaque niveau avant exécution.</p>',
        },
      ],
    },
    {
      id: 'ct-002',
      number: 'CT-B-002',
      title: 'PRESCRIPTIONS POUR LES TRAVAUX D\'ÉTANCHÉITÉ',
      content: '<p>L\'étanchéité des toitures-terrasses et du plancher haut du parking souterrain sera réalisée par membrane bitumineuse bicouche soudée à la flamme, avec protection lourde en dalles béton de 4 cm. Garantie décennale obligatoire. Essais d\'arrosage contradictoires avant réception.</p>',
      isModifiedLocally: true,
    },
    {
      id: 'ct-003',
      number: 'CT-B-003',
      title: 'PRESCRIPTIONS POUR LES INSTALLATIONS ÉLECTRIQUES',
      content: '<p>Toutes les installations électriques seront conformes aux normes NF C 15-100 et NM 07.3.010. Le TGBT sera de classe II. L\'entrepreneur fournira les schémas unifilaires, plans d\'installation et notes de calcul pour approbation avant tout commencement de travaux électriques.</p>',
      isModifiedLocally: false,
    },
  ],

  chapter4: (questionnaire.cdp_lignes ?? []).map((ligne) => ({
    code: ligne.numero,
    title: ligne.designation,
    unit: ligne.unite,
    description: `Prix ${ligne.numero} — ${ligne.designation}.\nCe prix rémunère au forfait ou à l'unité tous les travaux, fournitures, main-d'œuvre, matériaux, matériels, frais généraux et bénéfice nécessaires à la réalisation complète de la prestation désignée, conformément aux plans, CCTP et prescriptions du présent CPS.\nUnité : ${ligne.unite}.`,
  })),

  bdpLots: [
    {
      lotCode: 'LOT A',
      lotTitle: 'TERRASSEMENTS ET INFRASTRUCTURE',
      subSections: [
        {
          title: 'Installation et terrassements',
          items: [
            { priceCode: 'A-101', designation: 'Installation et repli de chantier', unit: 'Fft' },
            { priceCode: 'A-102', designation: 'Terrassements en déblais', unit: 'm³' },
            { priceCode: 'A-103', designation: 'Terrassements en remblais compactés', unit: 'm³' },
          ],
        },
      ],
      totalLabel: 'Total LOT A',
      totalAmount: 1_850_000,
    },
    {
      lotCode: 'LOT B',
      lotTitle: 'GROS-ŒUVRE ET MAÇONNERIE',
      subSections: [
        {
          title: 'Béton armé',
          items: [
            { priceCode: 'B-201', designation: 'Béton de propreté', unit: 'm²' },
            { priceCode: 'B-202', designation: 'Béton armé fondations', unit: 'm³' },
            { priceCode: 'B-203', designation: 'Béton armé voiles et poteaux', unit: 'm³' },
            { priceCode: 'B-204', designation: 'Béton armé dalles et poutres', unit: 'm³' },
          ],
        },
        {
          title: 'Maçonnerie',
          items: [
            { priceCode: 'B-205', designation: 'Maçonnerie en parpaings creux 20 cm', unit: 'm²' },
          ],
        },
      ],
      totalLabel: 'Total LOT B',
      totalAmount: 6_420_000,
    },
    {
      lotCode: 'LOT C',
      lotTitle: 'CORPS D\'ÉTAT SECONDAIRES',
      subSections: [
        {
          title: 'Menuiseries et finitions',
          items: [
            { priceCode: 'C-301', designation: 'Menuiserie aluminium RPT + double vitrage', unit: 'm²' },
            { priceCode: 'C-302', designation: 'Revêtement sol grès cérame 60×60', unit: 'm²' },
            { priceCode: 'C-303', designation: 'Faux-plafond dalles minérales 600×600', unit: 'm²' },
          ],
        },
      ],
      totalLabel: 'Total LOT C',
      totalAmount: 3_180_000,
    },
    {
      lotCode: 'LOT D',
      lotTitle: 'PLOMBERIE SANITAIRE ET INCENDIE',
      subSections: [
        {
          title: 'Réseaux fluides',
          items: [
            { priceCode: 'D-401', designation: 'Réseau eau froide / eau chaude sanitaire', unit: 'Fft' },
            { priceCode: 'D-402', designation: 'Réseau incendie sprinkler', unit: 'Fft' },
          ],
        },
      ],
      totalLabel: 'Total LOT D',
      totalAmount: 1_240_000,
    },
    {
      lotCode: 'LOT E',
      lotTitle: 'ÉLECTRICITÉ ET COURANTS FAIBLES',
      subSections: [
        {
          title: 'Installations électriques',
          items: [
            { priceCode: 'E-501', designation: 'Tableau général basse tension (TGBT)', unit: 'U' },
            { priceCode: 'E-502', designation: 'Réseau courants forts — câblage et luminaires LED', unit: 'Fft' },
            { priceCode: 'E-503', designation: 'Système SSI catégorie A', unit: 'Fft' },
          ],
        },
      ],
      totalLabel: 'Total LOT E',
      totalAmount: 2_650_000,
    },
    {
      lotCode: 'LOT F',
      lotTitle: 'CVC ET ÉQUIPEMENTS SPÉCIAUX',
      subSections: [
        {
          title: 'Équipements techniques',
          items: [
            { priceCode: 'F-601', designation: 'Climatisation VRF — fourniture, pose, mise en service', unit: 'Fft' },
            { priceCode: 'F-602', designation: 'Ascenseurs 8 personnes (2 cabines)', unit: 'U' },
          ],
        },
      ],
      totalLabel: 'Total LOT F',
      totalAmount: 2_100_000,
    },
    {
      lotCode: 'LOT G',
      lotTitle: 'VRD ET AMÉNAGEMENTS EXTÉRIEURS',
      subSections: [
        {
          title: 'Voirie et réseaux',
          items: [
            { priceCode: 'G-701', designation: 'Voirie en béton bitumineux 0/10', unit: 'm²' },
            { priceCode: 'G-702', designation: 'Réseau EU/EP enterré PVC', unit: 'ml' },
          ],
        },
      ],
      totalLabel: 'Total LOT G',
      totalAmount: 1_560_000,
    },
  ],

  estimLots: [
    {
      lotCode: 'LOT A',
      lotTitle: 'TERRASSEMENTS ET INFRASTRUCTURE',
      subSections: [
        {
          title: 'Installation et terrassements',
          items: [
            { priceCode: 'A-101', designation: 'Installation et repli de chantier', unit: 'Fft', quantity: 1, unitPrice: 450_000, totalPrice: 450_000 },
            { priceCode: 'A-102', designation: 'Terrassements en déblais', unit: 'm³', quantity: 8_500, unitPrice: 85, totalPrice: 722_500 },
            { priceCode: 'A-103', designation: 'Terrassements en remblais compactés', unit: 'm³', quantity: 3_200, unitPrice: 87, totalPrice: 278_400 },
          ],
        },
      ],
      totalLabel: 'Total LOT A',
      totalAmount: 1_450_900,
    },
    {
      lotCode: 'LOT B',
      lotTitle: 'GROS-ŒUVRE ET MAÇONNERIE',
      subSections: [
        {
          title: 'Béton armé',
          items: [
            { priceCode: 'B-201', designation: 'Béton de propreté', unit: 'm²', quantity: 1_200, unitPrice: 95, totalPrice: 114_000 },
            { priceCode: 'B-202', designation: 'Béton armé fondations', unit: 'm³', quantity: 680, unitPrice: 2_800, totalPrice: 1_904_000 },
            { priceCode: 'B-203', designation: 'Béton armé voiles et poteaux', unit: 'm³', quantity: 520, unitPrice: 3_200, totalPrice: 1_664_000 },
            { priceCode: 'B-204', designation: 'Béton armé dalles et poutres', unit: 'm³', quantity: 840, unitPrice: 2_950, totalPrice: 2_478_000 },
          ],
        },
        {
          title: 'Maçonnerie',
          items: [
            { priceCode: 'B-205', designation: 'Maçonnerie en parpaings creux 20 cm', unit: 'm²', quantity: 3_600, unitPrice: 280, totalPrice: 1_008_000 },
          ],
        },
      ],
      totalLabel: 'Total LOT B',
      totalAmount: 7_168_000,
    },
    {
      lotCode: 'LOT C',
      lotTitle: 'CORPS D\'ÉTAT SECONDAIRES',
      subSections: [
        {
          title: 'Menuiseries et finitions',
          items: [
            { priceCode: 'C-301', designation: 'Menuiserie aluminium RPT + double vitrage', unit: 'm²', quantity: 1_800, unitPrice: 1_450, totalPrice: 2_610_000 },
            { priceCode: 'C-302', designation: 'Revêtement sol grès cérame 60×60', unit: 'm²', quantity: 3_800, unitPrice: 320, totalPrice: 1_216_000 },
            { priceCode: 'C-303', designation: 'Faux-plafond dalles minérales 600×600', unit: 'm²', quantity: 3_200, unitPrice: 195, totalPrice: 624_000 },
          ],
        },
      ],
      totalLabel: 'Total LOT C',
      totalAmount: 4_450_000,
    },
    {
      lotCode: 'LOT D',
      lotTitle: 'PLOMBERIE SANITAIRE ET INCENDIE',
      subSections: [
        {
          title: 'Réseaux fluides',
          items: [
            { priceCode: 'D-401', designation: 'Réseau EF/ECS sanitaire', unit: 'Fft', quantity: 1, unitPrice: 680_000, totalPrice: 680_000 },
            { priceCode: 'D-402', designation: 'Réseau incendie sprinkler', unit: 'Fft', quantity: 1, unitPrice: 520_000, totalPrice: 520_000 },
          ],
        },
      ],
      totalLabel: 'Total LOT D',
      totalAmount: 1_200_000,
    },
    {
      lotCode: 'LOT E',
      lotTitle: 'ÉLECTRICITÉ ET COURANTS FAIBLES',
      subSections: [
        {
          title: 'Installations électriques',
          items: [
            { priceCode: 'E-501', designation: 'Tableau général basse tension (TGBT)', unit: 'U', quantity: 1, unitPrice: 380_000, totalPrice: 380_000 },
            { priceCode: 'E-502', designation: 'Réseau courants forts', unit: 'Fft', quantity: 1, unitPrice: 1_450_000, totalPrice: 1_450_000 },
            { priceCode: 'E-503', designation: 'Système SSI catégorie A', unit: 'Fft', quantity: 1, unitPrice: 720_000, totalPrice: 720_000 },
          ],
        },
      ],
      totalLabel: 'Total LOT E',
      totalAmount: 2_550_000,
    },
    {
      lotCode: 'LOT F',
      lotTitle: 'CVC ET ÉQUIPEMENTS SPÉCIAUX',
      subSections: [
        {
          title: 'Équipements techniques',
          items: [
            { priceCode: 'F-601', designation: 'Climatisation VRF complète', unit: 'Fft', quantity: 1, unitPrice: 1_650_000, totalPrice: 1_650_000 },
            { priceCode: 'F-602', designation: 'Ascenseurs 8 personnes (2 cabines)', unit: 'U', quantity: 2, unitPrice: 280_000, totalPrice: 560_000 },
          ],
        },
      ],
      totalLabel: 'Total LOT F',
      totalAmount: 2_210_000,
    },
    {
      lotCode: 'LOT G',
      lotTitle: 'VRD ET AMÉNAGEMENTS EXTÉRIEURS',
      subSections: [
        {
          title: 'Voirie et réseaux',
          items: [
            { priceCode: 'G-701', designation: 'Voirie en béton bitumineux 0/10', unit: 'm²', quantity: 4_200, unitPrice: 185, totalPrice: 777_000 },
            { priceCode: 'G-702', designation: 'Réseau EU/EP enterré PVC', unit: 'ml', quantity: 680, unitPrice: 850, totalPrice: 578_000 },
          ],
        },
      ],
      totalLabel: 'Total LOT G',
      totalAmount: 1_355_000,
    },
  ],

  estimRecap: [
    { lotCode: 'LOT A', lotTitle: 'Terrassements et infrastructure', surface: undefined, ratio: undefined, totalPrice: 1_450_900 },
    { lotCode: 'LOT B', lotTitle: 'Gros-œuvre et maçonnerie', surface: 4_200, ratio: 1_707, totalPrice: 7_168_000 },
    { lotCode: 'LOT C', lotTitle: 'Corps d\'état secondaires', surface: 4_200, ratio: 1_060, totalPrice: 4_450_000 },
    { lotCode: 'LOT D', lotTitle: 'Plomberie sanitaire et incendie', surface: 4_200, ratio: 286, totalPrice: 1_200_000 },
    { lotCode: 'LOT E', lotTitle: 'Électricité et courants faibles', surface: 4_200, ratio: 607, totalPrice: 2_550_000 },
    { lotCode: 'LOT F', lotTitle: 'CVC et équipements spéciaux', surface: 4_200, ratio: 526, totalPrice: 2_210_000 },
    { lotCode: 'LOT G', lotTitle: 'VRD et aménagements extérieurs', surface: undefined, ratio: undefined, totalPrice: 1_355_000 },
  ],

  annexes: [
    {
      title: 'Modèle de caution provisoire',
      content: '<p>Modèle de caution provisoire conforme au Référentiel Général des Achats TMSA — à compléter par la banque de l\'entrepreneur.</p>',
    },
    {
      title: 'Liste des plans et documents du DCE',
      content: `<p>Plans architecturaux : A-001 à A-148<br>
Plans béton armé : BA-001 à BA-092<br>
Plans fluides : FL-001 à FL-045<br>
Plans électricité : EL-001 à EL-067<br>
Plans VRD : VRD-001 à VRD-028</p>`,
    },
  ],
};

// ─── 3. Génération ────────────────────────────────────────────────────────────

const builder = new CpsContentBuilderService();
const htmlGen = new HtmlGeneratorService();

// Injecter le contenu du Chapitre II construit à partir du questionnaire
documentData.chapter2Content = builder.buildChapterII(questionnaire);

const html = htmlGen.generate(documentData);

// ─── 4. Écriture du fichier ───────────────────────────────────────────────────

const outDir = path.resolve(__dirname, '../output-test');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'test-cps.html');
fs.writeFileSync(outFile, html, 'utf-8');

console.log('\n✅  HTML généré avec succès :');
console.log(`   ${outFile}`);
console.log(`   Taille : ${(html.length / 1024).toFixed(1)} Ko\n`);

// ─── 5. Résumé des pivots utilisés ───────────────────────────────────────────
console.log('── Pivots du questionnaire ──────────────────────────────');
console.log(`   delai_type       = ${questionnaire.delai_type}    (→ Art.2.6, 2.8, 2.14 : tableau tranches)`);
console.log(`   revision_prix    = ${questionnaire.revision_prix} (→ Art.2.9 : formule complète)`);
console.log(`   variante         = ${questionnaire.variante}          (→ Art.2.13 : bloc value engineering actif)`);
console.log(`   caut_prov        = ${questionnaire.caut_prov}          (→ Art.2.5 : cautionnement provisoire acquis)`);
console.log(`   approvi          = ${questionnaire.approvi}          (→ Art.2.11 : acomptes sur approvisionnements)`);
console.log(`   penalite_autres  = ${questionnaire.penalite_autres}          (→ Art.2.8 : 4 pénalités particulières listées)`);
console.log(`   Tranches         = ${questionnaire.tranches?.length} (ferme + 2 optionnelles)`);
console.log(`   Prix (Chap.IV)   = ${questionnaire.cdp_lignes?.length} lignes sur 7 lots`);
console.log('─────────────────────────────────────────────────────────\n');
