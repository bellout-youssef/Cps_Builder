import { IsArray, IsEnum } from 'class-validator';
import { RoleName } from '@prisma/client';

export class UpdateRolesDto {
  @IsArray()
  @IsEnum(RoleName, { each: true })
  roles!: RoleName[];
}
