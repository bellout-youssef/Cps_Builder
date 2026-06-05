import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(2, 100)
  name!: string;

  /**
   * Min 8 chars, au moins 1 majuscule, 1 chiffre, 1 caractère spécial.
   */
  @IsString()
  @Length(8, 128)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])/, {
    message: 'Password must contain at least one uppercase letter, one digit, and one special character',
  })
  password!: string;

  @IsString()
  @IsOptional()
  organizationId?: string;
}
