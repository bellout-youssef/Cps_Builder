import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ArticlesController } from './articles/articles.controller';
import { ArticlesService } from './articles/articles.service';
import { ClausesController } from './clauses/clauses.controller';
import { ClausesService } from './clauses/clauses.service';
import { FichesController } from './fiches/fiches.controller';
import { FichesService } from './fiches/fiches.service';
import { SeriesController } from './series/series.controller';
import { SeriesService } from './series/series.service';
import { UnitesController } from './unites/unites.controller';
import { UnitesService } from './unites/unites.service';
import { RevisionPrixController } from './revision-prix/revision-prix.controller';
import { RevisionPrixService } from './revision-prix/revision-prix.service';
import { DocumentReferencesController } from './document-references/document-references.controller';
import { DocumentReferencesService } from './document-references/document-references.service';
import { ModelesCpsController } from './modeles-cps/modeles-cps.controller';
import { ModelesCpsService } from './modeles-cps/modeles-cps.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    ArticlesController,
    ClausesController,
    FichesController,
    SeriesController,
    UnitesController,
    RevisionPrixController,
    DocumentReferencesController,
    ModelesCpsController,
  ],
  providers: [
    ArticlesService,
    ClausesService,
    FichesService,
    SeriesService,
    UnitesService,
    RevisionPrixService,
    DocumentReferencesService,
    ModelesCpsService,
  ],
  exports: [ArticlesService, ClausesService],
})
export class ReferentialModule {}
