import { Injectable } from '@nestjs/common';
import {
  CpsDocumentData,
  CpsClause,
  CpsEstimLot,
  CpsBdpLot,
  CpsRecapRow,
  BlockItem,
  CpsChapterContent,
} from './types/cps-document.types';

const TMPA_CSS = `
/* ─── Base ─────────────────────────────────────────────────────── */
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11pt;
  color: #000000;
  line-height: 1.45;
  background: #ffffff;
}

/* ─── Print / Page ──────────────────────────────────────────────── */
@media print {
  @page { size: A4; margin: 2.54cm 2.54cm 3.5cm 2.54cm; }
  h1, h2, h3 { page-break-after: avoid; }
  .page-break { page-break-before: always; }
  .no-break { page-break-inside: avoid; }
}

/* ─── Headings ──────────────────────────────────────────────────── */
h1 {
  font-family: Calibri, 'Trebuchet MS', sans-serif;
  font-size: 18pt;
  font-weight: 700;
  color: #0F4761;
  margin: 18pt 0 4pt;
  page-break-after: avoid;
}
h2 {
  font-family: 'Calibri Light', Calibri, 'Trebuchet MS', sans-serif;
  font-size: 16pt;
  font-weight: 700;
  color: #4472C4;
  font-variant: small-caps;
  border-bottom: 1pt solid #5B9BD5;
  margin: 14pt 0 8pt;
  padding-bottom: 4pt;
  page-break-after: avoid;
}
h3 {
  font-size: 13pt;
  font-weight: 700;
  color: #000000;
  margin: 12pt 0 3pt;
  page-break-after: avoid;
}
h4 {
  font-size: 11pt;
  font-weight: 700;
  margin: 8pt 0 2pt;
}

/* ─── Cover ─────────────────────────────────────────────────────── */
.cover {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  min-height: 100vh;
  padding: 60pt 50pt;
  page-break-after: always;
}
.cover-org {
  align-self: flex-start;
  font-family: 'Calibri Light', Calibri, sans-serif;
  font-size: 12pt;
  font-variant: small-caps;
  color: #0070C0;
  font-weight: 700;
}
.cover-body {
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16pt;
}
.cover-label {
  font-family: 'Calibri Light', Calibri, sans-serif;
  font-size: 11pt;
  font-variant: small-caps;
  color: #4472C4;
  letter-spacing: 4pt;
  text-transform: uppercase;
}
.cover-title {
  font-family: Calibri, 'Trebuchet MS', sans-serif;
  font-size: 22pt;
  font-weight: 700;
  color: #0F4761;
  line-height: 1.3;
}
.cover-type-badge {
  display: inline-block;
  background: #0070C0;
  color: white;
  font-size: 9pt;
  font-variant: small-caps;
  padding: 3pt 8pt;
  margin: 2pt;
  border-radius: 2pt;
}
.cover-meta {
  font-size: 10pt;
  color: #555555;
  line-height: 1.8;
  text-align: center;
}
.cover-code {
  align-self: stretch;
  font-family: 'Calibri Light', Calibri, sans-serif;
  font-size: 11pt;
  font-weight: 700;
  color: #0070C0;
  font-variant: small-caps;
  text-align: right;
  border-top: 1pt solid #0070C0;
  border-bottom: 1pt solid #0070C0;
  padding: 6pt 0;
  letter-spacing: 1pt;
}

/* ─── TOC ───────────────────────────────────────────────────────── */
.toc { margin: 20pt 0; }
.toc-item {
  display: flex;
  align-items: baseline;
  margin-bottom: 5pt;
}
.toc-item-label {
  font-family: 'Calibri Light', Calibri, sans-serif;
  font-variant: small-caps;
  white-space: nowrap;
}
.toc-item-label.lvl1 {
  font-weight: 700;
  color: #0070C0;
  font-size: 9pt;
}
.toc-item-label.lvl2 {
  font-size: 9pt;
  margin-left: 20pt;
}
.toc-dots {
  flex: 1;
  border-bottom: 0.5pt dotted #888;
  margin: 0 6pt;
  min-width: 20pt;
}
.toc-page {
  font-family: 'Calibri Light', Calibri, sans-serif;
  font-size: 9pt;
  color: #0070C0;
  white-space: nowrap;
}

/* ─── Clauses ───────────────────────────────────────────────────── */
.clause { margin-bottom: 18pt; }
.clause-header { display: flex; align-items: baseline; gap: 8pt; margin-bottom: 4pt; }
.clause-number {
  font-family: 'Calibri Light', Calibri, sans-serif;
  font-size: 10pt;
  font-weight: 700;
  color: #0070C0;
  font-variant: small-caps;
  white-space: nowrap;
}
.clause-title { font-weight: 700; font-size: 11pt; }
.clause-content { text-align: justify; line-height: 1.5; }
.clause-modified {
  border-left: 3pt solid #FFC000;
  padding-left: 8pt;
  background-color: #FFFBEE;
}
.clause-badge {
  display: inline-block;
  font-size: 8pt;
  color: #B07000;
  font-style: italic;
  margin-bottom: 4pt;
}
.sub-clause { margin: 8pt 0 0 24pt; }
.sub-clause-title { font-weight: 700; font-size: 10pt; margin-bottom: 2pt; }

/* ─── Chapitre II Questionnaire ─────────────────────────────────── */
.q-item { margin-bottom: 14pt; }
.q-question { font-weight: 700; margin-bottom: 4pt; }
.q-answer {
  padding: 6pt 8pt;
  border: 0.5pt solid #CCCCCC;
  background: #F8F8F8;
  text-align: justify;
}

/* ─── Chapitre IV Définition des prix ───────────────────────────── */
.prix-item {
  border: 0.5pt solid #DDDDDD;
  margin-bottom: 12pt;
  page-break-inside: avoid;
}
.prix-header {
  background-color: #0F4761;
  color: white;
  font-weight: 700;
  padding: 5pt 8pt;
  font-size: 10pt;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.prix-code { font-variant: small-caps; letter-spacing: 1pt; }
.prix-unit { font-size: 9pt; font-style: italic; }
.prix-desc { padding: 8pt; font-size: 10.5pt; line-height: 1.5; text-align: justify; white-space: pre-wrap; }

/* ─── Tables TMPA (BDP / ESTIM) ─────────────────────────────────── */
.table-tmpa {
  border-collapse: collapse;
  width: 100%;
  font-size: 9pt;
  margin-bottom: 24pt;
}
.table-tmpa th {
  background-color: #0070C0;
  color: #ffffff;
  font-weight: 700;
  padding: 5pt 4pt;
  border: 0.5pt solid #004E90;
  text-align: center;
  font-variant: small-caps;
}
.table-tmpa td {
  border: 0.5pt solid #CCCCCC;
  padding: 3pt 4pt;
  vertical-align: top;
}
.table-tmpa .td-num {
  text-align: right;
  white-space: nowrap;
}
.table-tmpa .td-center { text-align: center; }
.table-tmpa .row-lot td {
  background-color: #0F4761;
  color: #ffffff;
  font-weight: 700;
  font-variant: small-caps;
  font-size: 9.5pt;
}
.table-tmpa .row-section td {
  background-color: #DEEAF1;
  color: #0F4761;
  font-weight: 700;
  font-style: italic;
}
.table-tmpa .row-sub-section td {
  background-color: #EBF3FB;
  color: #4472C4;
  font-weight: 700;
}
.table-tmpa .row-total td {
  background-color: #4472C4;
  color: #ffffff;
  font-weight: 700;
}
.table-tmpa .row-grand-total td {
  background-color: #0F4761;
  color: #ffffff;
  font-weight: 700;
  font-variant: small-caps;
}

/* ─── RECAP (Estimation) ────────────────────────────────────────── */
.recap-title {
  font-family: Calibri, sans-serif;
  font-variant: small-caps;
  font-weight: 700;
  color: #0F4761;
  font-size: 12pt;
  margin-bottom: 8pt;
}
`;

@Injectable()
export class HtmlGeneratorService {
  generate(data: CpsDocumentData): string {
    const sections: string[] = [
      this.renderCover(data),
      this.renderToc(),
      this.renderPreamble(data.preamble),
      this.renderChapter1(data.chapter1),
      this.renderChapter2(data.chapter2, data.chapter2Content),
      this.renderChapter3(data.chapter3),
      this.renderChapter4(data.chapter4),
      this.renderChapter5(data),
      ...data.annexes.map((a, i) => this.renderAnnex(a, i + 1)),
    ];

    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CPS — ${this.esc(data.code)}</title>
<style>${TMPA_CSS}</style>
</head>
<body>
${sections.join('\n')}
</body>
</html>`;
  }

  private renderCover(data: CpsDocumentData): string {
    const typeBadges = data.types
      .map((t) => `<span class="cover-type-badge">${this.esc(t)}</span>`)
      .join(' ');

    const dateStr = data.publishedAt.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    return `<section class="cover">
  <div class="cover-org">${this.esc(data.organization.name)}</div>
  <div class="cover-body">
    <div class="cover-label">Cahier des Prescriptions Spéciales</div>
    <div class="cover-title">${this.esc(data.projectName)}</div>
    ${data.projectDescription ? `<div style="color:#555;font-size:10pt;text-align:center;max-width:80%">${this.esc(data.projectDescription)}</div>` : ''}
    <div>${typeBadges}</div>
    <div class="cover-meta">
      Créé par : <strong>${this.esc(data.createdBy.name)}</strong><br>
      Publié le : <strong>${dateStr}</strong>
    </div>
  </div>
  <div class="cover-code">${this.esc(data.code)}</div>
</section>`;
  }

  private renderToc(): string {
    const items = [
      { label: 'Préambule', level: 1 },
      { label: 'Chapitre I — Clauses Communes', level: 1 },
      { label: 'Chapitre II — Questionnaire', level: 1 },
      { label: 'Chapitre III — Clauses Techniques', level: 1 },
      { label: 'Chapitre IV — Définition des Prix', level: 1 },
      { label: 'Chapitre V — Bordereau des Prix et Estimation', level: 1 },
      { label: 'Bordereau des Prix Détail', level: 2 },
      { label: 'Estimation', level: 2 },
      { label: 'Annexes', level: 1 },
    ];

    const rows = items
      .map(
        (it) =>
          `<div class="toc-item">
    <span class="toc-item-label ${it.level === 1 ? 'lvl1' : 'lvl2'}">${this.esc(it.label)}</span>
    <span class="toc-dots"></span>
    <span class="toc-page">—</span>
  </div>`,
      )
      .join('\n');

    return `<section class="page-break">
<h1>Sommaire</h1>
<div class="toc">${rows}</div>
</section>`;
  }

  private renderPreamble(content?: string): string {
    const body = content ?? '<p>Le présent CPS définit les conditions dans lesquelles seront exécutés les travaux.</p>';
    return `<section class="page-break">
<h1>Préambule</h1>
<div>${body}</div>
</section>`;
  }

  private renderChapter1(clauses: CpsClause[]): string {
    return `<section class="page-break">
<h1>Chapitre I — Clauses Communes</h1>
${clauses.map((c) => this.renderClause(c)).join('\n')}
</section>`;
  }

  private renderChapter2(answers: Array<{ question: string; answer: string }>, content?: CpsChapterContent): string {
    if (content) {
      return this.renderChapterContent(
        'Chapitre II — Clauses Administratives et Financières Spécifiques',
        content,
      );
    }
    if (!answers.length) return '';
    const rows = answers
      .map(
        (a) =>
          `<div class="q-item">
  <div class="q-question">${this.esc(a.question)}</div>
  <div class="q-answer">${this.esc(a.answer)}</div>
</div>`,
      )
      .join('\n');

    return `<section class="page-break">
<h1>Chapitre II — Questionnaire</h1>
${rows}
</section>`;
  }

  /** Render a CpsChapterContent (neutral blocks) as HTML. */
  private renderChapterContent(chapterTitle: string, content: CpsChapterContent): string {
    const articles = content.articles
      .map((art) => {
        const heading = art.num
          ? `<h2>Article ${this.esc(art.num)} — ${this.esc(art.title)}</h2>`
          : `<h2>${this.esc(art.title)}</h2>`;
        const blocks = art.blocks.map((b) => this.renderBlock(b)).join('\n');
        return `${heading}\n${blocks}`;
      })
      .join('\n');

    return `<section class="page-break">
<h1>${this.esc(chapterTitle)}</h1>
${articles}
</section>`;
  }

  private renderBlock(b: BlockItem): string {
    switch (b.kind) {
      case 'para': {
        const styles: string[] = [];
        if (b.italic) styles.push('font-style:italic');
        if (b.center) styles.push('text-align:center');
        const styleAttr = styles.length ? ` style="${styles.join(';')}"` : '';
        const inner = b.bold ? `<strong>${this.esc(b.text)}</strong>` : this.esc(b.text);
        return `<p${styleAttr}>${inner}</p>`;
      }
      case 'para_mixed': {
        const runs = b.runs
          .map((r) => (r.bold ? `<strong>${this.esc(r.text)}</strong>` : this.esc(r.text)))
          .join('');
        const align = b.center ? ' style="text-align:center"' : '';
        return `<p${align}>${runs}</p>`;
      }
      case 'formula':
        return `<p style="font-family:monospace;font-size:12pt;font-weight:bold;text-align:center;margin:12pt 0">${this.esc(b.text)}</p>`;
      case 'bullets':
        return `<ul>${b.items.map((i) => `<li>${this.esc(i)}</li>`).join('')}</ul>`;
      case 'table': {
        const thead = `<tr>${b.headers.map((h) => `<th>${this.esc(h)}</th>`).join('')}</tr>`;
        const tbody = b.rows.map((row) => `<tr>${row.map((c) => `<td>${this.esc(c)}</td>`).join('')}</tr>`).join('');
        return `<table class="table-tmpa"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
      }
    }
  }

  private renderChapter3(clauses: CpsClause[]): string {
    return `<section class="page-break">
<h1>Chapitre III — Clauses Techniques</h1>
${clauses.map((c) => this.renderClause(c)).join('\n')}
</section>`;
  }

  private renderChapter4(prices: Array<{ code: string; title: string; unit: string; description: string }>): string {
    if (!prices.length) {
      return `<section class="page-break">
<h1>Chapitre IV — Définition des Prix</h1>
<p class="cl-para"><em>Aucun prix défini.</em></p>
</section>`;
    }
    const rows = prices
      .map(
        (p) =>
          `<div class="prix-item no-break">
  <div class="prix-header">
    <span class="prix-code">${this.esc(p.code)} — ${this.esc(p.title)}</span>
    <span class="prix-unit">${this.esc(p.unit)}</span>
  </div>
  <div class="prix-desc">${this.esc(p.description)}</div>
</div>`,
      )
      .join('\n');

    return `<section class="page-break">
<h1>Chapitre IV — Définition des Prix</h1>
${rows}
</section>`;
  }

  private renderChapter5(data: CpsDocumentData): string {
    const bdp = this.renderBdpTable(data.bdpLots);
    const estim = this.renderEstimTable(data.estimLots, data.estimRecap);

    return `<section class="page-break">
<h1>Chapitre V — Bordereau des Prix et Estimation</h1>
<h2>A — Bordereau des Prix Détail</h2>
${bdp}
<h2>B — Estimation</h2>
${estim}
</section>`;
  }

  private renderBdpTable(lots: CpsBdpLot[]): string {
    if (!lots.length) return '<p><em>Aucun prix défini.</em></p>';

    const rows = lots
      .map((lot) => {
        const subRows = lot.subSections
          .map((sec) => {
            const secHeader = `<tr class="row-section"><td colspan="3"><em>${this.esc(sec.title)}</em></td></tr>`;
            const items = sec.items
              .map(
                (item) =>
                  `<tr>
  <td style="white-space:nowrap">${this.esc(item.priceCode)}</td>
  <td>${this.esc(item.designation)}</td>
  <td class="td-center">${this.esc(item.unit)}</td>
</tr>`,
              )
              .join('\n');
            return secHeader + '\n' + items;
          })
          .join('\n');

        const total = lot.totalAmount != null
          ? `<tr class="row-total"><td colspan="2">${this.esc(lot.totalLabel)}</td><td class="td-num">${this.formatNum(lot.totalAmount)} DH HT</td></tr>`
          : '';

        return `<tr class="row-lot"><td colspan="3">${this.esc(lot.lotCode)} : ${this.esc(lot.lotTitle)}</td></tr>
${subRows}
${total}`;
      })
      .join('\n');

    return `<table class="table-tmpa">
<thead>
  <tr>
    <th style="width:12%">N° de Prix</th>
    <th>Désignation des Prestations</th>
    <th style="width:8%">U</th>
  </tr>
</thead>
<tbody>
${rows}
</tbody>
</table>`;
  }

  private renderEstimTable(lots: CpsEstimLot[], recap: CpsRecapRow[]): string {
    if (!lots.length) return '<p><em>Aucune estimation disponible.</em></p>';

    const recapRows = recap
      .map(
        (r) =>
          `<tr>
  <td>${this.esc(r.lotCode)}</td>
  <td>${this.esc(r.lotTitle)}</td>
  <td class="td-num">${r.surface != null ? this.formatNum(r.surface) : ''}</td>
  <td class="td-num">${r.ratio != null ? this.formatNum(r.ratio) : ''}</td>
  <td class="td-num">${r.totalPrice != null ? this.formatNum(r.totalPrice) : ''}</td>
</tr>`,
      )
      .join('\n');

    const recapTable = recap.length
      ? `<div class="recap-title">Récapitulation</div>
<table class="table-tmpa" style="margin-bottom:32pt">
<thead>
  <tr>
    <th style="width:10%">Lot</th>
    <th>Désignation</th>
    <th style="width:12%">Surface (m²)</th>
    <th style="width:10%">Ratio</th>
    <th style="width:15%">Prix Total DH HT</th>
  </tr>
</thead>
<tbody>${recapRows}</tbody>
</table>`
      : '';

    const lotRows = lots
      .map((lot) => {
        const subRows = lot.subSections
          .map((sec) => {
            const secHeader = `<tr class="row-section"><td colspan="6"><em>${this.esc(sec.title)}</em></td></tr>`;
            const items = sec.items
              .map(
                (item) =>
                  `<tr>
  <td style="white-space:nowrap">${this.esc(item.priceCode)}</td>
  <td>${this.esc(item.designation)}</td>
  <td class="td-center">${this.esc(item.unit)}</td>
  <td class="td-num">${item.quantity != null ? this.formatNum(item.quantity) : ''}</td>
  <td class="td-num">${item.unitPrice != null ? this.formatNum(item.unitPrice) : ''}</td>
  <td class="td-num">${item.totalPrice != null ? this.formatNum(item.totalPrice) : ''}</td>
</tr>`,
              )
              .join('\n');
            return secHeader + '\n' + items;
          })
          .join('\n');

        const total = lot.totalAmount != null
          ? `<tr class="row-total"><td colspan="5">${this.esc(lot.totalLabel)}</td><td class="td-num">${this.formatNum(lot.totalAmount)} DH HT</td></tr>`
          : '';

        return `<tr class="row-lot"><td colspan="6">${this.esc(lot.lotCode)} : ${this.esc(lot.lotTitle)}</td></tr>
${subRows}
${total}`;
      })
      .join('\n');

    return `${recapTable}
<table class="table-tmpa">
<thead>
  <tr>
    <th style="width:10%">N° de Prix</th>
    <th>Désignation des Prestations</th>
    <th style="width:6%">U</th>
    <th style="width:10%">Qté Totale</th>
    <th style="width:12%">PU HT</th>
    <th style="width:14%">PT HT</th>
  </tr>
</thead>
<tbody>
${lotRows}
</tbody>
</table>`;
  }

  private renderClause(c: CpsClause): string {
    const modifiedClass = c.isModifiedLocally ? ' clause-modified' : '';
    const badge = c.isModifiedLocally
      ? `<span class="clause-badge">&#9888; Modifié localement</span><br>`
      : '';

    const subClauses = (c.subClauses ?? [])
      .map(
        (sc) =>
          `<div class="sub-clause">
  <div class="sub-clause-title">${this.esc(sc.title)}</div>
  <div class="clause-content">${sc.content}</div>
</div>`,
      )
      .join('\n');

    return `<div class="clause${modifiedClass}">
  ${badge}
  <div class="clause-header">
    <span class="clause-number">${this.esc(c.number)}</span>
    <span class="clause-title">${this.esc(c.title)}</span>
  </div>
  <div class="clause-content">${c.content}</div>
  ${subClauses}
</div>`;
  }

  private renderAnnex(annex: { title: string; content: string }, index: number): string {
    return `<section class="page-break">
<h1>Annexe ${index} — ${this.esc(annex.title)}</h1>
<div>${annex.content}</div>
</section>`;
  }

  private esc(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private formatNum(n: number): string {
    return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  }
}
