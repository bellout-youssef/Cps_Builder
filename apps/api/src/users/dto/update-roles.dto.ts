import { IsArray, IsIn } from 'class-validator';
import { RoleName } from '@prisma/client';
import { ORG_ROLES } from './create-user.dto';

export class UpdateRolesDto {
  @IsArray()
  @IsIn(ORG_ROLES, { each: true })
  roles!: RoleName[];
}
