export enum RoleName {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  REF_MANAGER = 'REF_MANAGER',
  CREATOR = 'CREATOR',
  VERIFIER = 'VERIFIER',
  VALIDATOR = 'VALIDATOR',
}

export enum ArticleCycle {
  DRAFT = 'DRAFT',
  PUBLISHING = 'PUBLISHING',
  PUBLISHED = 'PUBLISHED',
  ARCHIVING = 'ARCHIVING',
}

/** A=Aménagement, B=Bâtiment, O=Ouvrages d'art, M=Maritime et Portuaire, E=MT/BT */
export enum ProjectType {
  A = 'A',
  B = 'B',
  O = 'O',
  M = 'M',
  E = 'E',
}

/** Étapes du workflow : Créateur → Vérificateur → Validateur Métier → Resp. Référentiel → Publication */
export enum WorkflowStep {
  CREATION = 'CREATION',
  VERIFICATION = 'VERIFICATION',
  BUSINESS_VALIDATION = 'BUSINESS_VALIDATION',
  REF_VALIDATION = 'REF_VALIDATION',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}
