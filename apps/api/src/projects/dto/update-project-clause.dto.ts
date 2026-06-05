import { IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';

export class UpdateProjectClauseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;
}

export class AddClauseToProjectDto {
  @IsString()
  @IsNotEmpty()
  clauseId!: string;
}
