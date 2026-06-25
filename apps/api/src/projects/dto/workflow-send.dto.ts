import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class WorkflowSendDto {
  /** Si présent : envoi vers ce user (PENDING_REVIEW). Absent : envoi vers l'admin (ADMIN_REVIEW). */
  @IsOptional()
  @IsUUID()
  targetUserId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
