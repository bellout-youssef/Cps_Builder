import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { SharePermission } from '@prisma/client';

export class ShareProjectDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsOptional()
  @IsEnum(SharePermission)
  permission?: SharePermission;
}

export class UpdateShareDto {
  @IsEnum(SharePermission)
  permission!: SharePermission;
}
