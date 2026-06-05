import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRevisionPrixDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  formula?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
