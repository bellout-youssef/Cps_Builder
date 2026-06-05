import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateClauseDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  number?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  articleId?: string;
}
