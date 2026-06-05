import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsString()
  @Length(2, 60)
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase alphanumeric with dashes' })
  slug!: string;

  /**
   * true → pré-charge la structure du référentiel TMPA (copie indépendante).
   * false/absent → organisation vide.
   */
  @IsBoolean()
  @IsOptional()
  initFromTmpa?: boolean;
}
