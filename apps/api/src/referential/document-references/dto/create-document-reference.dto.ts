import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateDocumentReferenceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
