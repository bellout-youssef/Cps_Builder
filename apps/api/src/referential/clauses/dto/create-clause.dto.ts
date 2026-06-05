import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateClauseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  number!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  content?: string;

  /** null = clause commune non liée à un article */
  @IsOptional()
  @IsString()
  articleId?: string;
}
