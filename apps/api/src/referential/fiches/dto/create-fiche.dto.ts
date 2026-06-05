import { IsArray, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateFicheDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  /** IDs des articles auxquels rattacher cette fiche */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  articleIds?: string[];
}
