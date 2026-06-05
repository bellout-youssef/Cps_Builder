import { IsArray, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdateFicheDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  /** Remplace l'ensemble des articles liés */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  articleIds?: string[];
}
