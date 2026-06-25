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

const ORG_ROLES = [
  RoleName.ORG_ADMIN,
  RoleName.REF_MANAGER,
  RoleName.CREATOR,
  RoleName.VERIFIER,
  RoleName.VALIDATOR,
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
