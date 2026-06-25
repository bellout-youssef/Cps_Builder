"use strict";

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, LevelFormat,
  BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumberElement,
} = require("docx");

// ── Layout A4 (DXA units, 1440 DXA = 1 inch) ─────────────────────────
const PAGE_W    = 11906;
const PAGE_H    = 16838;
const M_TOP     = 1134;
const M_BOT     = 1134;
const M_LEFT    = 1418;
const M_RIGHT   = 1134;
const CONTENT_W = PAGE_W - M_LEFT - M_RIGHT;

// ── Brand colours (hex without #) ────────────────────────────────────
const C_NAVY   = "0a1f3c";
const C_ORANGE = "E05C1A";
const C_DGREY  = "CCCCCC";
const C_WHITE  = "FFFFFF";
const C_TEXT   = "1A1A2E";

// ── Low-level helpers ─────────────────────────────────────────────────
function sp(bef, aft) {
  return { spacing: { before: bef || 0, after: aft || 0 } };
}

function txt(text, opts) {
  opts = opts || {};
  return new TextRun({
    text: String(text),
    font: "Arial",
    size: opts.size || 22,
    bold: opts.bold || false,
    italics: opts.italic || false,
    color: opts.color || undefined,
  });
}

function para(children, opts) {
  opts = opts || {};
  if (typeof children === "string") children = [txt(children, opts)];
  return new Paragraph({
    children,
    alignment: opts.align || AlignmentType.JUSTIFIED,
    spacing: { before: opts.bef || 0, after: opts.aft || 0 },
    indent: opts.indent ? { left: opts.indent } : undefined,
    heading: opts.heading || undefined,
    pageBreakBefore: opts.pageBreak || false,
    numbering: opts.numbering || undefined,
    border: opts.borderBottom
      ? { bottom: { style: BorderStyle.SINGLE, size: 12, color: C_ORANGE, space: 6 } }
      : undefined,
  });
}

function h1(text, pageBreak) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Arial", size: 28, bold: true, color: C_WHITE })],
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 120 },
    pageBreakBefore: !!pageBreak,
    shading: { fill: C_NAVY, type: ShadingType.CLEAR },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C_ORANGE, space: 0 } },
    indent: { left: 120 },
  });
}

function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: C_NAVY })],
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C_ORANGE, space: 4 } },
  });
}

function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color: C_NAVY })],
    alignment: AlignmentType.LEFT,
    spacing: { before: 160, after: 40 },
  });
}

function bullet(text) {
  return new Paragraph({
    children: [txt(text)],
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function bullets(lines) {
  return lines.filter(l => l.trim()).map(l => bullet(l.replace(/^[-–•]\s*/, "")));
}

function splitLines(str) {
  if (!str || str === "—") return [];
  return str.split("\n").map(s => s.trim()).filter(Boolean);
}

function mkTableRow(cells, isHeader) {
  const bg        = isHeader ? C_NAVY : C_WHITE;
  const textColor = isHeader ? C_WHITE : C_TEXT;
  const colW      = Math.floor(CONTENT_W / cells.length);
  const border    = { style: BorderStyle.SINGLE, size: 4, color: C_DGREY };
  const borders   = { top: border, bottom: border, left: border, right: border };
  return new TableRow({
    tableHeader: !!isHeader,
    children: cells.map(c => new TableCell({
      borders,
      shading: { fill: bg, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      width: { size: colW, type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({ text: String(c || ""), font: "Arial", size: 20, bold: !!isHeader, color: textColor })],
        alignment: AlignmentType.LEFT,
      })],
    })),
  });
}

function mkTable(rows, headers) {
  const allRows = [];
  if (headers && headers.length) allRows.push(mkTableRow(headers, true));
  rows.forEach(r => allRows.push(mkTableRow(r, false)));
  const cols      = headers ? headers.length : (rows[0] ? rows[0].length : 2);
  const colWidths = Array(cols).fill(Math.floor(CONTENT_W / cols));
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: colWidths, rows: allRows });
}

function space(pt) {
  return new Paragraph({ children: [txt("")], spacing: { before: pt || 80, after: 0 } });
}

// ── Conditional blocks (derived from form data) ───────────────────────

function receptionBlock(delai_type) {
  const items = [];
  if (delai_type === "ferme") {
    items.push(para([txt("Une "), txt("reception provisoire", { bold: true }),
      txt(" sera prononcee a l'achevement de l'ensemble des travaux, conformement a l'article 72 du RGA TMSA.")],
      { bef: 60, aft: 60 }));
    items.push(para([txt("La "), txt("reception definitive", { bold: true }),
      txt(" sera prononcee a l'expiration du delai de garantie, conformement a l'article 75 du RGA TMSA.")],
      { bef: 60, aft: 60 }));
  } else if (delai_type === "partiel") {
    items.push(mkTable([
      ["Une RP partielle sera declaree apres achevement des prestations relatives a chaque delai.",
       "Une RD partielle sera declaree apres la periode de garantie relative a chaque delai partiel."],
      ["Une RP globale sera declaree en meme temps que la derniere RP partielle.",
       "La RD globale sera declaree apres la periode de garantie relative au dernier delai partiel."],
    ], ["Receptions provisoires", "Reception definitive"]));
    items.push(para([txt("Si le delai global a ete respecte, les penalites sur delais partiels seront restituees.", { italic: true })], { bef: 40, aft: 40 }));
  } else if (delai_type === "tranche") {
    items.push(mkTable([
      ["Une RP partielle sera declaree apres achevement des prestations relatives a chaque tranche.",
       "Une RD partielle sera declaree apres la periode de garantie relative a chaque tranche."],
      ["Une RP globale sera declaree en meme temps que la derniere RP partielle.",
       "La RD globale sera declaree apres la periode de garantie relative a la derniere tranche optionnelle."],
    ], ["Receptions provisoires", "Reception definitive"]));
    items.push(para([txt("Tranche optionnelle non activee dans le delai prevu = automatiquement resiliee.", { italic: true })], { bef: 40, aft: 40 }));
  }
  return items;
}

function delaiBlock(D) {
  const items = [];
  if (D.delai_type === "ferme") {
    items.push(para([txt("Le present marche est conclu pour une duree de ("),
      txt(D.delai_ferme_mois && D.delai_ferme_mois !== "—" ? D.delai_ferme_mois : "XXX", { bold: true }),
      txt(") mois calendaires a compter de la date de notification de l'OSC.")], { bef: 60, aft: 40 }));
    items.push(para("Un mois calendaire est egal a 30 jours.", { bef: 0, aft: 40 }));
  } else if (D.delai_type === "partiel") {
    items.push(para("Le prestataire est tenu de respecter les delais partiels suivants :", { bef: 60, aft: 40 }));
    items.push(mkTable(
      [["Delai 1", "(XXX) mois", "A partir de l'OSC 1, au plus tard 60 jours apres signature", "Achevement sanctionne par PV de RP partielle"]],
      ["", "Delai d'execution", "Date de commencement", "Condition de reception"]
    ));
  } else if (D.delai_type === "tranche") {
    items.push(para("Les prestations seront realisees suivant les delais prescrits dans le tableau suivant :", { bef: 60, aft: 40 }));
    items.push(mkTable([
      ["Tranche ferme", (D.tf_mois && D.tf_mois !== "—" ? `(${D.tf_mois})` : "(XXX)") + " mois",
       "OSC 1 au plus tard 60 jours apres signature", "XXX", "Achevement sanctionne par PV de RP partielle"],
      ["Tranche optionnelle N°1", "(XXX) mois", "A partir de l'OSC afferant",
       "Confirmation MO dans un delai de XXX a partir de la fin de la TF", "Achevement sanctionne par PV de RP partielle"],
    ], ["", "Delai d'execution", "Date de commencement", "Date limite OSC", "Condition de reception"]));
  }
  return items;
}

function penaliteBlock(D) {
  const items  = [];
  const taux   = D.penalite_taux && D.penalite_taux !== "—" ? D.penalite_taux : "X/1000";
  const plafond = D.penalite_plafond && D.penalite_plafond !== "—" ? D.penalite_plafond : "10";

  if (D.delai_type === "ferme") {
    items.push(para([txt("En cas de retard, penalite journaliere de ("), txt(taux, { bold: true }), txt(") du montant du marche.")], { bef: 60, aft: 40 }));
  } else if (D.delai_type === "partiel") {
    items.push(mkTable([["Delai 1", `${taux} du montant du marche`]], ["", "Penalites"]));
    items.push(para([txt("Delai global respecte → penalites partielles restituees.", { bold: true })], { bef: 20, aft: 40 }));
  } else if (D.delai_type === "tranche") {
    items.push(mkTable([
      ["Tranche ferme", `${taux} du montant`],
      ["Tranche optionnelle N°1", `${taux} du montant`],
    ], ["Tranche", "Penalites"]));
  }

  if (D.penalite_autres === "oui" && D.penalite_autres_detail && D.penalite_autres_detail !== "—") {
    items.push(para("Penalites particulieres additionnelles :", { bef: 40, aft: 20 }));
    splitLines(D.penalite_autres_detail).forEach(l => items.push(bullet(l)));
  }

  [
    "Ces penalites seront appliquees de plein droit sans mise en demeure.",
    "Les journees de repos hebdomadaire et jours feries ne sont pas deduites.",
    "Lorsque le plafond est atteint, le MO est en droit de resilier le marche.",
    `L'ensemble des penalites est plafonne a (${plafond}%) du montant initial du marche.`,
  ].forEach(c => items.push(bullet(c)));

  return items;
}

function revisionBlock(D) {
  const items = [];
  if (D.revision_prix === "revisable") {
    items.push(para("La revision des prix est effectuee conformement a l'Arrete n° 3-302-15 du 27/11/2015.", { bef: 60, aft: 40 }));
    const k = D.rev_k && D.rev_k !== "—" ? D.rev_k : "k";
    const a = D.rev_a && D.rev_a !== "—" ? D.rev_a : "a(I/Io)";
    const b = D.rev_b && D.rev_b !== "—" ? D.rev_b : "b(..)";
    items.push(new Paragraph({
      children: [new TextRun({ text: `P = Po [ ${k} + ${a} + ${b} ]`, font: "Courier New", size: 22, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
    }));
    items.push(para([txt("Variation plafonnee a ("), txt(D.rev_plafond && D.rev_plafond !== "—" ? D.rev_plafond : "5", { bold: true }), txt("%) du montant initial.")], { bef: 40, aft: 40 }));
  } else {
    items.push(para("Les prix du marche sont fermes et non revisables.", { bef: 60, aft: 40 }));
  }
  return items;
}

// ── Document sections ─────────────────────────────────────────────────

function buildCoverPage(D) {
  return [
    space(400),
    new Paragraph({ children: [new TextRun({ text: "ROYAUME DU MAROC", font: "Arial", size: 28, bold: true, color: C_NAVY, allCaps: true })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 } }),
    new Paragraph({ children: [new TextRun({ text: "TANGER MED PORT AUTHORITY", font: "Arial", size: 32, bold: true, color: C_ORANGE, allCaps: true })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 } }),
    new Paragraph({ children: [txt("")], border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C_ORANGE } }, spacing: { before: 0, after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: `AO N° ${D.ao_num || "TMPA_AO_____"}`, font: "Arial", size: 26, bold: true, color: C_NAVY })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 } }),
    new Paragraph({ children: [new TextRun({ text: (D.ao_title || "[Intitule]").toUpperCase(), font: "Arial", size: 28, bold: true, color: C_TEXT })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 } }),
    new Paragraph({ children: [txt("")], border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C_DGREY } }, spacing: { before: 0, after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: "CAHIER DES CHARGES", font: "Arial", size: 40, bold: true, color: C_NAVY, allCaps: true })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 } }),
    new Paragraph({ children: [new TextRun({ text: D.dce_ref || "AAMMJJ_DCE_CPS_TMPA_DTT_XXXXX", font: "Arial", size: 18, color: "888888" })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 } }),
    space(120),
    new Paragraph({ children: [new TextRun({ text: "PIECES ECRITES", font: "Arial", size: 24, bold: true, color: C_NAVY })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 } }),
    ...[
      "CHAPITRE I : CLAUSES ADMINISTRATIVES ET FINANCIERES COMMUNES",
      "CHAPITRE II : CLAUSES ADMINISTRATIVES ET FINANCIERES SPECIFIQUES",
      "CHAPITRE III : CLAUSES TECHNIQUES",
      "CHAPITRE IV : DEFINITION DES PRIX",
      "CHAPITRE V : BORDEREAU DES PRIX – DETAIL ESTIMATIF",
    ].map(t => new Paragraph({ children: [new TextRun({ text: `- ${t}`, font: "Arial", size: 20, color: C_NAVY })], alignment: AlignmentType.LEFT, indent: { left: 1440 }, spacing: { before: 40, after: 40 } })),
  ];
}

function buildPreambule(D) {
  return [
    h1("PREAMBULE", true),
    para([txt("Marche passe par "), txt(D.mode_passation || "[mode de passation]", { bold: true })], { bef: 80, aft: 80 }),
    para([txt("ENTRE", { bold: true })], { align: AlignmentType.CENTER, bef: 80, aft: 80 }),
    para([
      txt("Le Maitre d'Ouvrage est represente", { bold: true }),
      txt(`, par abreviation « MO », societe anonyme au capital social de `),
      txt(D.mo_capital || "XXX", { bold: true }), txt(" DH, RC Tanger n° "),
      txt(D.mo_rc || "XXX", { bold: true }), txt(", ICE : "), txt(D.mo_ice || "XXX", { bold: true }),
      txt(", IF : "), txt(D.mo_if || "XXX", { bold: true }), txt(", siege : "),
      txt(D.mo_siege || "XXX", { bold: true }), txt(", Maroc, represente par "),
      txt(D.mo_dg || "Monsieur XXX", { bold: true }),
      txt(" en sa qualite de Directeur General, designe ci-apres « TMPA »,"),
    ], { bef: 60, aft: 80 }),
    para([txt("D'UNE PART", { bold: true })], { align: AlignmentType.CENTER, bef: 0, aft: 80 }),
    para([txt("ET", { bold: true })], { align: AlignmentType.CENTER, bef: 0, aft: 80 }),
    para([txt("Cas d'une personne morale", { bold: true, italic: true })], { bef: 0, aft: 40 }),
    ...[
      "M……………………………………………………………… qualite ..",
      "Agissant au nom et pour le compte de …………………………………………… (Raison sociale et forme juridique)",
      "Au capital social . Patente n° ………………………………………………",
      "Registre de commerce de ………… Sous le n°……………………………",
      "Affilie a la CNSS sous n° …………………………………………………",
      "Faisant election de domicile au ……………………………………………",
      "Compte bancaire RIB (24 positions) …………………………………………",
      "Ouvert aupres de ……………………………………………………………",
    ].map(t => para(t, { bef: 30, aft: 30 })),
    para([txt("Designe ci-apres par le terme « ENTREPRENEUR »", { bold: true })], { bef: 40, aft: 80 }),
    para([txt("D'AUTRE PART", { bold: true })], { align: AlignmentType.CENTER, bef: 0, aft: 120 }),
    new Paragraph({
      children: [new TextRun({ text: "IL A ETE CONVENU ET ARRETE CE QUI SUIT", font: "Arial", size: 24, bold: true, color: C_NAVY })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: C_ORANGE }, bottom: { style: BorderStyle.SINGLE, size: 6, color: C_ORANGE } },
    }),
  ];
}

// Chapitre I is frozen — content never changes between markets
function buildChapitreI() {
  const arts = [
    { num: "1.1", titre: "DOCUMENTS CONSTITUTIFS DU MARCHE", content: () => [
      para("Les documents constitutifs du marche sont ceux enumeres ci-apres :", { bef: 60, aft: 40 }),
      ...bullets(["L'acte d'engagement", "Le cahier des prescriptions speciales et ses annexes", "Le bordereau des prix detail estimatif", "Le sous-detail des prix, le cas echeant", "Le bordereau des prix des approvisionnements lorsqu'il est exige", "L'offre technique de l'entreprise lorsqu'elle est exigee", "Le Referentiel General des Achats -TMSA-."]),
      para("En cas de discordance, les documents prevalent dans l'ordre enumere ci-dessus.", { bef: 60, aft: 40 }),
      para("Seront egalement pieces contractuelles :", { bef: 0, aft: 40 }),
      ...bullets(["Les ordres de service ;", "Les avenants."]),
    ]},
    { num: "1.2", titre: "REFERENCE AUX TEXTES GENERAUX APPLICABLES AU MARCHE", content: () => [
      para("Le titulaire du marche est soumis aux dispositions des textes suivants :", { bef: 60, aft: 40 }),
      ...bullets([
        "Le Referentiel General des Achats -TMSA-",
        "Dahir N° 1-15-05 du 29 rabii II 1436 (19 fevrier 2015) — loi 112-13 relative au nantissement des marches publics",
        "Dahir n°1-56-211 du 11 Decembre 1956 — garanties pecuniaires des soumissionnaires",
        "Loi n°65-99 relative au code du travail (Dahir n° 1-03-194 du 11 septembre 2003)",
        "Circulaire n° 72/CAB du 26 novembre 1992",
        "Textes legislatifs et reglementaires concernant l'emploi et les salaires",
        "Loi 17/99 portant code des assurances (modifiee par loi 39/05)",
        "Code General des Impots (loi de finances n° 43-06)",
        "Arrete n°3-302-15 du 27 novembre 2015 — revision des prix des marches publics",
        "Decret n° 2-14-272 du 14 mai 2014 — avances en matiere des marches publics",
        "Dahir du 12 aout 1913 — code des obligations et contrats",
        "Reglements locaux — alimentation en eau et en electricite",
        "Loi N° 55.19 — simplification des procedures administratives",
        "Les CPC relatifs aux prestations concernees",
      ]),
      para("En cas de contradiction, les prescriptions des documents les plus recents primeront.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.3", titre: "VALIDITE ET DELAI DE NOTIFICATION DE LA SIGNATURE DU MARCHE", content: () => [
      para([txt("La signature sera notifiee dans un "), txt("delai maximum de 120 jours", { bold: true }), txt(" a compter de la "), txt("date limite de remise des plis", { bold: true }), txt(".")], { bef: 60, aft: 40 }),
    ]},
    { num: "1.4", titre: "ELECTION DU DOMICILE DE L'ENTREPRENEUR", content: () => [
      para("Toutes les notifications relatives au marche sont valables lorsqu'elles ont ete faites au siege de l'entreprise indique dans l'acte d'engagement. L'entrepreneur doit aviser le MO dans un delai de 15 jours en cas de changement.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.5", titre: "ASSURANCES", content: () => [
      para("Avant tout commencement des travaux, l'Entrepreneur doit adresser au MO des attestations justifiant la souscription de polices d'assurances couvrant :", { bef: 60, aft: 40 }),
      ...bullets(["Vehicule et engins ;", "Accidents de travail ;", "Responsabilite civile ;", "Tous risques de chantier."]),
      para([txt("Le montant garanti sera "), txt("au moins egal a celui mentionne dans l'acte d'engagement", { bold: true }), txt(".")], { bef: 60, aft: 40 }),
    ]},
    { num: "1.6", titre: "NANTISSEMENT", content: () => [
      para("Application du Dahir N° 1-15-05 du 29 rabii II 1436 (loi 112-13 — nantissement des marches publics).", { bef: 60, aft: 40 }),
    ]},
    { num: "1.7", titre: "ACCES AU PORT ET AUX ZONES FRANCHES", content: () => [
      para("Dans le cadre du Code ISPS, l'acces au port et aux zones Franches est reserve aux personnes disposant des badges delivres par l'autorite competente. L'entrepreneur doit effectuer les demarches necessaires des la notification du marche.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.8", titre: "CONNAISSANCE DES LIEUX", content: () => [
      para([txt("L'entrepreneur reconnait avoir visite les lieux. L'ignorance des conditions ne pourra etre evoquee pour reclamer "), txt("une augmentation du delai ou des prix contractuels", { bold: true }), txt(".")], { bef: 60, aft: 40 }),
    ]},
    { num: "1.9", titre: "RESPONSABILITE DE L'ENTREPRENEUR", content: () => [
      para("L'Entrepreneur est seul responsable de tous accidents ou dommages dus aux travaux, fournitures ou causés par son personnel ou son materiel, pendant et apres l'execution.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.10", titre: "RELATION ENTRE DIVERS ENTREPRENEURS SUR LE MEME CHANTIER", content: () => [
      para("Lorsque plusieurs titulaires interviennent, un planning general est etabli par le MO et l'ensemble des titulaires.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.11", titre: "ORIGINE, QUALITE ET MISE EN OEUVRE DES MATERIAUX ET PRODUITS", content: () => bullets([
      "L'Entrepreneur a le libre choix de la provenance des materiaux ou composants.",
      "Les materiaux doivent etre conformes aux normes marocaines homologuees ou, a defaut, aux normes internationales.",
      "Les materiaux doivent etre de bonne qualite, travailles et mis en oeuvre conformement aux regles de l'art.",
    ])},
    { num: "1.12", titre: "CHOIX DES COLLABORATEURS ET PROTECTION DES EMPLOYES", content: () => [
      para("L'entrepreneur doit recruter des collaborateurs qualifies. Le MO a le droit d'exiger le changement d'un collaborateur pour incapacite professionnelle ou defaut de probite.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.13", titre: "MESURES DE SECURITE ET D'HYGIENE", content: () => [
      para("L'entrepreneur est tenu de faire porter par son personnel un dispositif d'identification. Le MO peut ordonner l'arret du chantier si les mesures de securite sont insuffisantes.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.14", titre: "GESTION DES DECHETS DU CHANTIER", content: () => [
      para("L'elimination des dechets generes par les travaux est a la responsabilite du titulaire. Pour les dechets dangereux, l'usage d'un bordereau de suivi est obligatoire.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.15", titre: "RECEPTIONS DES EQUIPEMENTS", content: () => [
      para([txt("Receptions en usine :", { bold: true })], { bef: 60, aft: 20 }),
      para("Si exige par les prescriptions techniques, les fournitures ne seront livrees qu'apres recette en usine.", { bef: 0, aft: 40 }),
      para([txt("Reception sur site :", { bold: true })], { bef: 40, aft: 20 }),
      para("Un PV de reception sur site sera etabli et signe conjointement par les representants du MO et l'entrepreneur.", { bef: 0, aft: 40 }),
    ]},
    { num: "1.16", titre: "CONTROLE ET VERIFICATION", content: () => [
      para("Les fournitures non conformes aux specifications seront refusees par le MO. Le titulaire devra les remplacer sans frais et sans depasser le delai contractuel.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.17", titre: "GARANTIE PARTICULIERE", content: () => [
      para("Le titulaire garantit que toutes les fournitures livrees sont neuves, du modele le plus recent, et sans defectuosite due a leur conception ou aux materiaux.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.18", titre: "RETENUE DE GARANTIE", content: () => [
      para("Sauf stipulation contraire :", { bef: 60, aft: 40 }),
      ...bullets([
        "Retenue d'un dixieme (1/10) sur chaque acompte.",
        "La retenue de garantie cesse de croitre a sept pour cent (7%) du montant initial du marche.",
        "La retenue peut etre remplacee par une caution personnelle et solidaire.",
      ]),
    ]},
    { num: "1.19", titre: "GARANTIE DECENNALE", content: () => [
      para("Sauf stipulations contraires :", { bef: 60, aft: 40 }),
      ...bullets([
        "Police d'assurance responsabilite decennale a presenter au plus tard a la reception definitive.",
        "Exigee uniquement pour les ouvrages neufs (structure et etancheite).",
        "Validite : de la reception definitive jusqu'a la fin de la dixieme annee.",
      ]),
    ]},
    { num: "1.20", titre: "BREVETS", content: () => [
      para("Le prestataire garantit le MO contre toute reclamation relative a la contrefacon ou exploitation non autorisee de droits de propriete industrielle.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.21", titre: "NORMES", content: () => [
      para("Les prestations seront conformes aux normes fixees aux prescriptions et specifications techniques du present marche.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.22", titre: "RECEPTION PROVISOIRE", content: () => [
      para("Modalites conformes a l'article 72 du Referentiel General des Achats -TMSA-.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.23", titre: "RECEPTION DEFINITIVE", content: () => [
      para("L'entrepreneur demande la reception definitive apres l'expiration du delai de garantie, conformement a l'article 75 du RGA -TMSA-.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.24", titre: "NATURE DES PRIX", content: () => [
      para("Les prestations seront remunerees sur la base de prix unitaires et/ou prix globaux. Les prix comprennent tous les droits, impots, taxes, frais generaux et marge de l'entrepreneur.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.25", titre: "MODALITES DE REGLEMENT", content: () => [
      para([txt("Paiement dans un delai de "), txt("60 jours fin de mois", { bold: true }), txt(" a compter du "), txt("depot electronique", { bold: true }), txt(" des factures accompagnees des attachements dument vises.")], { bef: 60, aft: 40 }),
    ]},
    { num: "1.26", titre: "MODE DE PAIEMENT", content: () => [
      para("Paiement par credit au compte de l'entrepreneur indique sur l'Acte d'Engagement. Le titulaire s'engage a respecter les processus de validation systeme des travaux du MO.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.27", titre: "DROITS ET TAXES", content: () => [
      para("Prix TTC DDP. Pour les travaux en zone d'acceleration economique, l'entrepreneur designe son propre transitaire pour les declarations ADII.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.28", titre: "AVANCES", content: () => [
      para("Sauf stipulation contraire, le present marche ne prevoit pas d'avances.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.29", titre: "MOYENS DE COMMUNICATIONS", content: () => [
      para("Le MO transmet ses instructions selon les moyens suivants :", { bef: 60, aft: 40 }),
      mkTable([
        ["Decisions impactant l'execution ; commencement des prestations.", "Ordre de service"],
        ["Gestion courante ; demandes d'intervention ; remise des livrables.", "GMAO/JIRA ou courrier/mail"],
      ], ["Engagement", "Moyen de communication"]),
    ]},
    { num: "1.30", titre: "RESILIATION DU MARCHE", content: () => [
      para("Resiliation conformement au RGA -TMSA-. L'entrepreneur defaillant peut etre exclu temporairement ou definitivement des marches du Groupe Tanger Med.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.31", titre: "LUTTE CONTRE LA FRAUDE ET LA CORRUPTION", content: () => [
      para("Le prestataire s'interdit toute pratique de fraude ou corruption dans les procedures de passation, de gestion et d'execution du marche.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.32", titre: "REGLEMENT DES DIFFERENDS ET LITIGES", content: () => [
      para("Reglement des litiges conformement aux dispositions du RGA -TMSA- Conditions Administratives Generales.", { bef: 60, aft: 40 }),
    ]},
    { num: "1.33", titre: "RESPONSABILITE SOCIALE, SOCIETALE ET ENVIRONNEMENTALE (RSE)", content: () => [
      para("La vision du MO s'inscrit dans une demarche de developpement durable. Les axes RSE a observer :", { bef: 60, aft: 40 }),
      ...bullets([
        "1 - Assurer le bien-etre des salaries et un environnement de travail sain",
        "2 - Gouvernance credible et exemplaire",
        "3 - Protection de l'environnement (eau, air, bruit)",
        "4 - Bonnes pratiques des affaires et prevention de la corruption",
        "5 - Egalite des chances et non-discrimination",
        "6 - Engagement societal",
      ]),
    ]},
    { num: "1.34", titre: "CLAUSES QSE ET SURETE", content: () => [
      para("Le titulaire s'engage a respecter le SMI QSE et le Plan de Surete (Code ISPS) :", { bef: 60, aft: 40 }),
      ...bullets([
        "Qualite : respecter le systeme de management qualite et etablir le reporting necessaire.",
        "Sante Securite : respecter le code du travail, evaluer les risques et definir un plan de prevention.",
        "Environnement : respecter la politique environnementale du MO et proceder a une analyse environnementale.",
        "Surete : designer un correspondant surete, fournir les documents requis, restituer les badges en cas de depart.",
      ]),
    ]},
    { num: "1.35", titre: "SECRET, SECURITE ET CONFIDENTIALITE DES DONNEES", content: () => [
      para("Le prestataire s'engage a :", { bef: 60, aft: 40 }),
      ...bullets([
        "Prendre toutes precautions utiles pour preserver la securite des donnees et empecher tout acces non autorise.",
        "Ne traiter les donnees que dans le cadre des instructions du MO.",
        "Ne pas recourir a un sous-traitant sans habilitation prealable du MO.",
        "Prendre toutes mesures de securite materielle et logique pour assurer l'integrite des donnees.",
        "Proceder en fin de contrat a la destruction des donnees.",
      ]),
    ]},
  ];

  const result = [h1("CHAPITRE I : CLAUSES ADMINISTRATIVES ET FINANCIERES COMMUNES", true)];
  arts.forEach(a => {
    result.push(h2(`Article ${a.num} : ${a.titre}`));
    a.content().forEach(item => result.push(item));
  });
  return result;
}

function buildChapitreII(D) {
  const items = [h1("CHAPITRE II : CLAUSES ADMINISTRATIVES ET FINANCIERES SPECIFIQUES", true)];

  items.push(h2("Article 2.1 : OBJET DU MARCHE"));
  items.push(para([txt("Le present marche a pour objet : "), txt(D.objet_detail || "[XXX]", { bold: true })], { bef: 60, aft: 40 }));
  if (D.lieu_exec && D.lieu_exec !== "—")
    items.push(para([txt("Lieu d'execution : "), txt(D.lieu_exec, { bold: true })], { bef: 0, aft: 40 }));

  items.push(h2("Article 2.2 : INTERVENANTS"));
  items.push(para("Les intervenants du present marche sont :", { bef: 60, aft: 40 }));
  [
    ["Le Maitre d'ouvrage", D.int_mo || "Tanger Med Port Authority (TMPA)"],
    ["Le Maitre d'oeuvre (Architecte, BET)", D.int_moe || "[A completer]"],
    ["Bureau de Controle", D.int_bc || "[A completer]"],
    ["Cabinet topographique", D.int_topo || "[A completer]"],
  ].forEach(([k, v]) => items.push(para([txt(`${k} : `, { bold: true }), txt(v)], { bef: 30, aft: 30 })));

  items.push(h2("Article 2.3 : CONSISTANCE DES TRAVAUX"));
  items.push(para("Les travaux a executer consistent en ce qui suit :", { bef: 60, aft: 40 }));
  (splitLines(D.consistance) || ["[A completer]"]).forEach(l => items.push(bullet(l.replace(/^-\s*/, ""))));

  items.push(h2("Article 2.4 : REFERENCE AUX TEXTES SPECIAUX APPLICABLES AU MARCHE"));
  items.push(para("Le titulaire est egalement soumis aux textes suivants :", { bef: 60, aft: 40 }));
  (splitLines(D.textes_speciaux).length ? splitLines(D.textes_speciaux) : ["Par Exemple : Devis general d'architecture (1956)", "Par Exemple : Regles BAEL / CCBA 68"])
    .forEach(l => items.push(bullet(l.replace(/^-\s*/, ""))));
  items.push(para("En cas de contradiction, les prescriptions des documents les plus recents primeront.", { bef: 40, aft: 40 }));

  items.push(h2("Article 2.5 : CAUTIONNEMENT DEFINITIF"));
  items.push(para("Le montant du cautionnement definitif est fixe a (3%) du montant initial du marche.", { bef: 60, aft: 40 }));
  items.push(para(D.caut_prov === "oui"
    ? "Si non realise dans 30 jours → le cautionnement provisoire reste acquis au MO."
    : "Si non realise dans 30 jours → penalite de 1% du montant initial.", { bef: 0, aft: 40 }));
  items.push(para("En cas de non-production, le montant total du cautionnement definitif sera retenu sur les sommes dues a partir du premier decompte.", { bef: 0, aft: 40 }));

  items.push(h2("Article 2.6 : DUREE, DELAI D'EXECUTION OU DATE D'ACHEVEMENT"));
  delaiBlock(D).forEach(i => items.push(i));

  items.push(h2("Article 2.7 : DELAI DE GARANTIE"));
  items.push(para([txt("Le delai de garantie est fixe a "),
    txt(D.delai_garantie && D.delai_garantie !== "—" ? D.delai_garantie : "XXX", { bold: true }),
    txt(" a compter de la date de la reception provisoire.")], { bef: 60, aft: 40 }));
  items.push(para("Pendant ce delai, l'entrepreneur remettra les plans conformes a l'execution et remediera a toutes les defectuosites constatees.", { bef: 0, aft: 40 }));

  items.push(h2("Article 2.8 : PENALITES POUR RETARD"));
  penaliteBlock(D).forEach(i => items.push(i));

  items.push(h2("Article 2.9 : REVISION DES PRIX"));
  revisionBlock(D).forEach(i => items.push(i));

  items.push(h2("Article 2.10 : SOUS-TRAITANCE"));
  items.push(para("Accord prealable ecrit du MO requis. La sous-traitance ne peut depasser (50%) du montant du marche ni porter sur le lot principal.", { bef: 60, aft: 40 }));
  const stLines = splitLines(D.st_exclus);
  if (stLines.length) {
    items.push(para("Travaux exclus de la sous-traitance :", { bef: 0, aft: 40 }));
    stLines.forEach(l => items.push(bullet(l.replace(/^-\s*/, ""))));
  }
  items.push(para("Le titulaire demeure personnellement responsable de toutes les obligations resultant du marche.", { bef: 40, aft: 40 }));

  items.push(h2("Article 2.11 : APPROVISIONNEMENTS"));
  if (D.approvi === "oui") {
    items.push(para("Les approvisionnements peuvent donner lieu a des acomptes sous reserve :", { bef: 60, aft: 40 }));
    bullets(["Acquired en toute propriete et effectivement payes", "Lotis sur le chantier", "Necessaires a l'execution"]).forEach(i => items.push(i));
  } else {
    items.push(para("Le present marche ne prevoit pas d'acomptes sur approvisionnements.", { bef: 60, aft: 40 }));
  }

  items.push(h2("Article 2.12 : CAS DE FORCE MAJEURE"));
  items.push(para("Evenement imprevisible, irresistible, hors du controle des parties rendant l'execution pratiquement impossible. Seuils intemperies :", { bef: 60, aft: 40 }));
  items.push(mkTable([
    ["Pluie", "15 mm/j", "5 mm/j", "10 mm/j"],
    ["Vent", ">60 km/h", ">60 km/h", ">60 km/h"],
    ["Houle", "6 m", "NA", "NA"],
    ["Seisme", "4° Richter", "4° Richter", "4° Richter"],
  ], ["Evenement", "Travaux Maritimes", "Amenagement", "Batiment"]));
  items.push(para("Apres 60 jours de force majeure, le marche peut etre resilie.", { bef: 40, aft: 40 }));

  items.push(h2("Article 2.13 : CONDITIONS ET EXECUTION DE LA VARIANTE"));
  if (D.variante === "oui") {
    if (D.variante_series && D.variante_series !== "—")
      items.push(para([txt("Series / lots concernes : "), txt(D.variante_series, { bold: true })], { bef: 60, aft: 40 }));
    bullets([
      "Le titulaire s'engage sur le cout global de son offre variante.",
      "Q realisee >= Q bordereau → Quantite a payer = Q bordereau.",
      "Q realisee < Q bordereau → Quantite a payer = Q realisee + 0,5 × (Q bordereau − Q realisee).",
    ]).forEach(i => items.push(i));
  } else {
    items.push(para("Dispositions Non Applicables.", { bef: 60, aft: 40 }));
  }

  items.push(h2("Article 2.14 : RECEPTIONS"));
  receptionBlock(D.delai_type).forEach(i => items.push(i));

  return items;
}

function buildChapitreIII(D) {
  const items = [h1("CHAPITRE III : CLAUSES TECHNIQUES", true)];
  const plines = splitLines(D.tech_prescriptions);
  const dlines = splitLines(D.tech_docs);
  if (plines.length) { items.push(h2("Prescriptions techniques particulieres")); plines.forEach(l => items.push(bullet(l.replace(/^-\s*/, "")))); }
  if (dlines.length) { items.push(h2("Documents techniques a fournir")); dlines.forEach(l => items.push(bullet(l.replace(/^-\s*/, "")))); }
  if (!plines.length && !dlines.length) items.push(para("[Clauses techniques a completer.]", { bef: 60, aft: 40, italic: true }));
  return items;
}

function buildChapitreIV(D) {
  const items = [h1("CHAPITRE IV : DEFINITION DES PRIX", true)];
  const lines = splitLines(D.cdp_prix);
  if (!lines.length) { items.push(para("[Definitions de prix a completer.]", { bef: 60, aft: 40, italic: true })); return items; }
  lines.forEach((l, i) => {
    const parts = l.split("|").map(s => s.trim());
    items.push(new Paragraph({ children: [new TextRun({ text: `Prix ${parts[0] || i+1}`, font: "Arial", size: 22, bold: true, color: C_NAVY })], spacing: { before: 120, after: 20 } }));
    items.push(para([txt("Designation : "), txt(parts[1] || "[Designation]", { bold: true })], { bef: 0, aft: 20 }));
    items.push(para([txt("Unite : "), txt(parts[2] || "[Unite]", { bold: true })], { bef: 0, aft: 60 }));
  });
  return items;
}

function buildChapitreV() {
  return [
    h1("CHAPITRE V : BORDEREAU DES PRIX – DETAIL ESTIMATIF", true),
    para("[Le BDP est joint en piece annexe au present CPS.]", { bef: 80, aft: 80, italic: true }),
  ];
}

function buildDernierePage(D) {
  const border  = { style: BorderStyle.SINGLE, size: 6, color: C_DGREY };
  const borders = { top: border, bottom: border, left: border, right: border };
  const cellW   = Math.floor(CONTENT_W / 2);
  const sigCell = (label) => new TableCell({
    borders, width: { size: cellW, type: WidthType.DXA }, margins: { top: 120, bottom: 400, left: 180, right: 180 },
    children: [
      new Paragraph({ children: [new TextRun({ text: label, font: "Arial", size: 20, bold: true })] }),
      new Paragraph({ children: [new TextRun({ text: "A . . . . . . . . . . , le //    ", font: "Arial", size: 18, color: "666666" })] }),
    ],
  });
  const sigCellFull = (label) => new TableCell({
    borders, width: { size: CONTENT_W, type: WidthType.DXA }, columnSpan: 2, margins: { top: 120, bottom: 400, left: 180, right: 180 },
    children: [
      new Paragraph({ children: [new TextRun({ text: label, font: "Arial", size: 20, bold: true })] }),
      new Paragraph({ children: [new TextRun({ text: "A . . . . . . . . . . , le //    ", font: "Arial", size: 18, color: "666666" })] }),
    ],
  });
  return [
    new Paragraph({ children: [txt("")], pageBreakBefore: true }),
    new Paragraph({ children: [new TextRun({ text: "DERNIERE PAGE", font: "Arial", size: 28, bold: true, color: C_NAVY, allCaps: true })], alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 } }),
    new Paragraph({ children: [new TextRun({ text: `CONTRAT N° ${D.ao_num || "____/____"}`, font: "Arial", size: 22, bold: true })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: `Objet : ${D.ao_title || "[Intitule]"}`, font: "Arial", size: 20 })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: "Montant du marche : ………………………………………………………", font: "Arial", size: 20 })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 } }),
    space(40),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [cellW, cellW],
      rows: [
        new TableRow({ children: [sigCell("Dresse par :"), sigCell("Lu et accepte par :\n(L'entrepreneur)")] }),
        new TableRow({ children: [sigCell("Vu et Verifie par :"), sigCell("Presente par :")] }),
        new TableRow({ children: [sigCellFull("Signe par :")] }),
      ],
    }),
    space(80),
    new Paragraph({ children: [new TextRun({ text: `CAHIER DES CHARGES — ${D.dce_ref || ""}`, font: "Arial", size: 18, color: "888888" })], alignment: AlignmentType.CENTER, spacing: { before: 80, after: 0 } }),
  ];
}

function makeHeader(D) {
  return new Header({
    children: [new Paragraph({
      children: [
        new TextRun({ text: "TANGER MED PORT AUTHORITY  |  ", font: "Arial", size: 16, bold: true, color: C_NAVY }),
        new TextRun({ text: `${D.ao_num || ""}  —  ${(D.ao_title || "").substring(0, 60)}`, font: "Arial", size: 16, color: "666666" }),
      ],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C_ORANGE } },
      spacing: { before: 0, after: 60 },
    })],
  });
}

function makeFooter(D) {
  return new Footer({
    children: [new Paragraph({
      children: [
        new TextRun({ text: `${D.dce_ref || ""}  |  Page `, font: "Arial", size: 16, color: "888888" }),
        new PageNumberElement({}),
      ],
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: C_DGREY } },
      spacing: { before: 60, after: 0 },
      alignment: AlignmentType.RIGHT,
    })],
  });
}

// ── Main exported function ────────────────────────────────────────────

/**
 * Generate a CPS Word document from form data.
 * @param {Object} data   - Form data object (see field list below)
 * @returns {Promise<Buffer>} - Resolves with the .docx file as a Node.js Buffer
 *
 * Required fields in `data`:
 *   ao_num, ao_title, dce_ref, mode_passation
 *   mo_capital, mo_rc, mo_ice, mo_if, mo_siege, mo_dg
 *   objet_detail, lieu_exec, int_mo, int_moe, int_bc, int_topo
 *   consistance, textes_speciaux
 *   caut_prov          ("oui" | "non")
 *   delai_type         ("ferme" | "partiel" | "tranche")
 *   delai_ferme_mois   (string, used when delai_type="ferme")
 *   tf_mois            (string, used when delai_type="tranche")
 *   delai_garantie
 *   penalite_taux, penalite_plafond
 *   penalite_autres    ("oui" | "non")
 *   penalite_autres_detail
 *   revision_prix      ("ferme" | "revisable")
 *   rev_k, rev_a, rev_b, rev_plafond
 *   st_exclus
 *   approvi            ("oui" | "non")
 *   variante           ("oui" | "non")
 *   variante_series
 *   tech_prescriptions, tech_docs
 *   cdp_prix           ("101 | Designation | m³\n102 | ..." format)
 */
async function generateCPS(data) {
  const D = data;

  const allContent = [
    ...buildCoverPage(D),
    ...buildPreambule(D),
    ...buildChapitreI(),
    ...buildChapitreII(D),
    ...buildChapitreIII(D),
    ...buildChapitreIV(D),
    ...buildChapitreV(),
    ...buildDernierePage(D),
  ];

  const doc = new Document({
    numbering: {
      config: [{
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "–",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      }],
    },
    styles: {
      default: { document: { run: { font: "Arial", size: 22, color: C_TEXT } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { font: "Arial", size: 28, bold: true, color: C_WHITE },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { font: "Arial", size: 24, bold: true, color: C_NAVY },
          paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 } },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H },
          margin: { top: M_TOP, right: M_RIGHT, bottom: M_BOT, left: M_LEFT },
        },
      },
      headers: { default: makeHeader(D) },
      footers: { default: makeFooter(D) },
      children: allContent,
    }],
  });

  return Packer.toBuffer(doc);
}

module.exports = { generateCPS };
