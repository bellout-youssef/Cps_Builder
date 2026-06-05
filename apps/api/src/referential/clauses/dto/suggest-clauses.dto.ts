import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class SuggestClausesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  articleIds: string[];
}
