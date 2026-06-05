import { IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ProjectType } from '@prisma/client';

export class CreateModeleCpsDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ProjectType, { each: true })
  projectTypes?: ProjectType[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  templatePath?: string;
}
