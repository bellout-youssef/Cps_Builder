import { IsEmail, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  /** Contexte organisation pour les rôles (null → scope global SUPER_ADMIN) */
  @IsString()
  @IsOptional()
  organizationId?: string;
}
