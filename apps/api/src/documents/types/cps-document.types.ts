export interface CpsOrganization {
  id: string;
  name: string;
  slug: string;
}

export interface CpsUser {
  id: string;
  name: string;
}

export interface CpsClause {
  id: string;
  number: string;
  title: string;
  content: string;
  isModifiedLocally: boolean;
  subClauses?: CpsSubClause[];
}

export interface CpsSubClause {
  title: string;
  content: string;
}

export interface CpsChapter2Answer {
  question: string;
  answer: string;
}

export interface CpsPriceDefinition {
  code: string;
  title: string;
  unit: string;
  description: string;
}

export interface CpsBdpLineItem {
  priceCode: string;
  designation: string;
  unit: string;
  unitPrice?: number;
}

export interface CpsEstimLineItem extends CpsBdpLineItem {
  quantity?: number;
  totalPrice?: number;
  surface?: number;
  ratio?: number;
}

export interface CpsBdpSubSection {
  title: string;
  items: CpsBdpLineItem[];
}

export interface CpsEstimSubSection {
  title: string;
  items: CpsEstimLineItem[];
}

export interface CpsBdpLot {
  lotCode: string;
  lotTitle: string;
  subSections: CpsBdpSubSection[];
  totalLabel: string;
  totalAmount?: number;
}

export interface CpsEstimLot {
  lotCode: string;
  lotTitle: string;
  subSections: CpsEstimSubSection[];
  totalLabel: string;
  surface?: number;
  ratio?: number;
  totalAmount?: number;
}

export interface CpsRecapRow {
  lotCode: string;
  lotTitle: string;
  surface?: number;
  ratio?: number;
  totalPrice?: number;
}

export interface CpsAnnex {
  title: string;
  content: string;
}

// ─── Neutral block types for Chapter II conditional content ──────────────────

export type BlockItem =
  | { kind: 'para'; text: string; bold?: boolean; italic?: boolean; center?: boolean }
  | { kind: 'para_mixed'; runs: Array<{ text: string; bold?: boolean; italic?: boolean }>; center?: boolean }
  | { kind: 'formula'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'table'; headers: string[]; rows: string[][] };

export interface CpsArticleSection {
  num: string;   // e.g. "2.1" — empty string for unnumbered sections
  title: string;
  blocks: BlockItem[];
}

export interface CpsChapterContent {
  articles: CpsArticleSection[];
}

export interface CpsDocumentData {
  code: string;
  projectName: string;
  projectDescription?: string;
  organization: CpsOrganization;
  createdBy: CpsUser;
  publishedAt: Date;
  types: string[];

  preamble?: string;
  chapter1: CpsClause[];
  chapter2: CpsChapter2Answer[];
  chapter2Content?: CpsChapterContent;  // built from questionnaire — takes precedence when present
  chapter3: CpsClause[];
  chapter4: CpsPriceDefinition[];

  bdpLots: CpsBdpLot[];
  estimLots: CpsEstimLot[];
  estimRecap: CpsRecapRow[];

  annexes: CpsAnnex[];
}
