import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUniteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  symbol?: string;
}
