import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsArray,
  ArrayMinSize,
  IsEnum,
} from 'class-validator';
import { RoleName } from '@prisma/client';

/** Rôles assignables dans une organisation — SUPER_ADMIN exclu (réservé à la plateforme). */
const ORG_ROLES = [
  RoleName.ADMIN,
  RoleName.USER,
] as const;

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  temporaryPassword!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(RoleName, { each: true })
  roles!: RoleName[];
}

export { ORG_ROLES };
