import { IsString, IsOptional, MaxLength } from 'class-validator';

export class WorkflowActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
