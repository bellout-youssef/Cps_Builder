import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { ProjectType } from '@prisma/client';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins un type de projet est requis (A, B, O, M ou E)' })
  @IsEnum(ProjectType, { each: true })
  types!: ProjectType[];
}
