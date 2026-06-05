import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export type SearchResultType = 'project' | 'article' | 'clause' | 'fiche' | 'document' | 'formula';

const VALID_TYPES: SearchResultType[] = ['project', 'article', 'clause', 'fiche', 'document', 'formula'];

export class SearchQueryDto {
  @IsString()
  @MinLength(2)
  q!: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value) ? value : value ? [value] : undefined,
  )
  @IsArray()
  @IsIn(VALID_TYPES, { each: true })
  types?: SearchResultType[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
