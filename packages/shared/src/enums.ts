export enum RoleName {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
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

/**
 * Étapes du workflow CPS.
 *
 * CREATION       – le porteur (créateur ou détenteur actuel) travaille sur le projet.
 * PENDING_REVIEW – le projet est chez un utilisateur désigné pour vérification.
 * ADMIN_REVIEW   – le projet est chez l'administrateur pour validation et publication.
 * PUBLISHED      – CPS publié et figé.
 * ARCHIVED       – ancienne version archivée.
 */
export enum WorkflowStep {
  CREATION = 'CREATION',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ADMIN_REVIEW = 'ADMIN_REVIEW',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Actions de workflow côté frontend (routing vers les bons endpoints).
 * Distinct de l'enum Prisma qui stocke l'historique en base.
 *
 * SEND_TO_USER        → POST /workflow/send  { targetUserId }
 * SEND_TO_ADMIN       → POST /workflow/send  (sans targetUserId)
 * REQUEST_MODIFICATION→ POST /workflow/request-modification
 * REJECT              → POST /workflow/reject
 * PUBLISH             → POST /workflow/publish
 */
export enum WorkflowAction {
  SEND_TO_USER = 'SEND_TO_USER',
  SEND_TO_ADMIN = 'SEND_TO_ADMIN',
  REQUEST_MODIFICATION = 'REQUEST_MODIFICATION',
  REJECT = 'REJECT',
  PUBLISH = 'PUBLISH',
}
