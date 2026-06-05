import { IsArray, IsString, IsNotEmpty, ArrayMinSize, IsOptional, IsBoolean } from 'class-validator';

export class SelectArticlesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  articleIds!: string[];

  /// Si false, ne propose pas automatiquement les clauses liées
  @IsOptional()
  @IsBoolean()
  autoSuggest?: boolean;
}

export class RemoveArticleDto {
  @IsString()
  @IsNotEmpty()
  articleId!: string;
}
