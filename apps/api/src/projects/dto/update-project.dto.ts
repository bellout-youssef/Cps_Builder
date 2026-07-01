import { IsString, IsOptional, IsObject, IsArray, IsEnum, MaxLength } from 'class-validator';
import { ProjectType } from '@prisma/client';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ProjectType, { each: true })
  types?: ProjectType[];

  @IsOptional()
  @IsObject()
  chapter2Answers?: Record<string, unknown>;
}
