import { ArticleCycle, PrismaClient, RoleName } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function upsertUserRole(
  userId: string,
  roleName: RoleName,
  orgId: string | null,
): Promise<void> {
  const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
  const exists = await prisma.userRole.findFirst({
    where: { userId, roleId: role.id, organizationId: orgId },
  });
  if (!exists) {
    await prisma.userRole.create({
      data: { userId, roleId: role.id, organizationId: orgId },
    });
  }
}

async function main(): Promise<void> {
  // ── 1. Rôles ────────────────────────────────────────────────────────────────
  const roleDefinitions: { name: RoleName; description: string }[] = [
    { name: RoleName.SUPER_ADMIN,  description: 'Gestion globale : organisations, abonnements, licences, monitoring.' },
    { name: RoleName.ORG_ADMIN,    description: 'Administration de l\'organisation : utilisateurs, rôles, paramètres.' },
    { name: RoleName.REF_MANAGER,  description: 'Référentiel : articles, clauses, publication CPS.' },
    { name: RoleName.CREATOR,      description: 'Crée et modifie les projets CPS et les brouillons.' },
    { name: RoleName.VERIFIER,     description: 'Vérifie les projets CPS.' },
    { name: RoleName.VALIDATOR,    description: 'Valide le contenu métier des projets CPS.' },
  ];

  for (const def of roleDefinitions) {
    await prisma.role.upsert({
      where:  { name: def.name },
      update: { description: def.description },
      create: def,
    });
  }
  console.log('✓ Rôles');

  // ── 2. Super Admin (sans org) ────────────────────────────────────────────────
  const pw = await argon2.hash('Admin@1234!');

  const superAdmin = await prisma.user.upsert({
    where:  { email: 'superadmin@cps.dev' },
    update: {},
    create: { email: 'superadmin@cps.dev', name: 'Super Administrateur', passwordHash: pw, organizationId: null },
  });
  await upsertUserRole(superAdmin.id, RoleName.SUPER_ADMIN, null);
  console.log('✓ superadmin@cps.dev  /  Admin@1234!');

  // ── 3. Organisation TMPA Démo ────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where:  { slug: 'demo-tmpa' },
    update: {},
    create: { name: 'Organisation TMPA Démo', slug: 'demo-tmpa' },
  });
  console.log(`✓ Org: ${org.name} (${org.id})`);

  // ── 4. Utilisateurs (un par rôle métier) ─────────────────────────────────────
  const users: { email: string; name: string; role: RoleName }[] = [
    { email: 'orgadmin@cps.dev',    name: 'Admin Organisation',       role: RoleName.ORG_ADMIN    },
    { email: 'refmanager@cps.dev',  name: 'Responsable Référentiel',  role: RoleName.REF_MANAGER  },
    { email: 'createur@cps.dev',    name: 'Créateur CPS',             role: RoleName.CREATOR      },
    { email: 'verificateur@cps.dev',name: 'Vérificateur CPS',         role: RoleName.VERIFIER     },
    { email: 'validateur@cps.dev',  name: 'Validateur Métier',        role: RoleName.VALIDATOR    },
  ];

  const userMap: Record<string, { id: string }> = {};
  for (const u of users) {
    const created = await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: { email: u.email, name: u.name, passwordHash: pw, organizationId: org.id },
    });
    await upsertUserRole(created.id, u.role, org.id);
    userMap[u.role] = { id: created.id };
    console.log(`✓ ${u.email}  /  Admin@1234!`);
  }

  const refManagerId = userMap[RoleName.REF_MANAGER].id;
  const creatorId    = userMap[RoleName.CREATOR].id;
  const verifierId   = userMap[RoleName.VERIFIER].id;

  // ── 5. Séries ─────────────────────────────────────────────────────────────────
  type SerieInput = { code: string; name: string; description: string };
  const seriesDefs: SerieInput[] = [
    { code: 'A-100', name: 'Terrassements',          description: 'Déblais, remblais, compactage' },
    { code: 'A-200', name: 'Assainissement',          description: 'Réseaux EU, EP, collecteurs'  },
    { code: 'A-300', name: 'Voirie',                  description: 'Chaussées, trottoirs, bordures'},
    { code: 'B-100', name: 'Gros Œuvre',              description: 'Béton, maçonnerie, structure'  },
    { code: 'B-200', name: 'Menuiseries',             description: 'Portes, fenêtres, vitrages'   },
    { code: 'E-100', name: 'Génie Électrique MT/BT',  description: 'HTA, BT, éclairage'           },
  ];

  const serieMap: Record<string, string> = {};
  for (const s of seriesDefs) {
    const serie = await prisma.serie.upsert({
      where:  { id: (await prisma.serie.findFirst({ where: { code: s.code, organizationId: org.id } }))?.id ?? 'none' },
      update: {},
      create: { code: s.code, name: s.name, description: s.description, organizationId: org.id, createdById: refManagerId },
    });
    serieMap[s.code] = serie.id;
  }
  console.log('✓ Séries');

  // ── 6. Unités ─────────────────────────────────────────────────────────────────
  const unitesDefs = [
    { label: 'Mètre linéaire',  symbol: 'ML'  },
    { label: 'Mètre carré',     symbol: 'M2'  },
    { label: 'Mètre cube',      symbol: 'M3'  },
    { label: 'Unité',           symbol: 'U'   },
    { label: 'Tonne',           symbol: 'T'   },
    { label: 'Kilogramme',      symbol: 'Kg'  },
    { label: 'Forfait',         symbol: 'Fft' },
  ];

  for (const u of unitesDefs) {
    await prisma.unite.upsert({
      where:  { organizationId_label: { organizationId: org.id, label: u.label } },
      update: {},
      create: { label: u.label, symbol: u.symbol, organizationId: org.id, createdById: refManagerId },
    });
  }
  console.log('✓ Unités');

  // ── 7. Articles ───────────────────────────────────────────────────────────────
  type ArticleInput = { code?: string; title: string; description: string; unit: string; cycle: ArticleCycle; serieCode: string };
  const articlesDefs: ArticleInput[] = [
    {
      code:        'A-101',
      title:       'Déblai en terrain ordinaire',
      description: 'Extraction et évacuation de terres, chargement et transport sur décharge agréée.',
      unit:        'M3',
      cycle:       ArticleCycle.PUBLISHED,
      serieCode:   'A-100',
    },
    {
      code:        'A-201',
      title:       'Fourniture et pose de canalisation béton Ø300',
      description: 'Canalisations béton armé classe 90A, y compris fouilles et remblaiement.',
      unit:        'ML',
      cycle:       ArticleCycle.PUBLISHED,
      serieCode:   'A-200',
    },
    {
      code:        'A-301',
      title:       'Couche de base en grave non traitée 0/31,5',
      description: 'GNT type B, épaisseur 20 cm après compactage, y compris répandage et compactage.',
      unit:        'M2',
      cycle:       ArticleCycle.PUBLISHED,
      serieCode:   'A-300',
    },
    {
      code:        'B-101',
      title:       'Béton de propreté dosé à 150 kg/m³',
      description: 'Béton maigre pour fond de fouille, épaisseur 10 cm.',
      unit:        'M3',
      cycle:       ArticleCycle.PUBLISHED,
      serieCode:   'B-100',
    },
    {
      title:       'Déblai en terrain rocheux',
      description: 'Extraction par engin ou explosif, évacuation en décharge.',
      unit:        'M3',
      cycle:       ArticleCycle.DRAFT,
      serieCode:   'A-100',
    },
    {
      title:       'Fourniture et pose de regards en béton',
      description: 'Regards préfabriqués, y compris tampon fonte de classe D400.',
      unit:        'U',
      cycle:       ArticleCycle.DRAFT,
      serieCode:   'A-200',
    },
  ];

  const articleMap: Record<string, string> = {};
  for (const a of articlesDefs) {
    const existing = a.code
      ? await prisma.article.findFirst({ where: { code: a.code, organizationId: org.id } })
      : await prisma.article.findFirst({ where: { title: a.title, organizationId: org.id } });

    const article = existing ?? await prisma.article.create({
      data: {
        organizationId: org.id,
        code:           a.code ?? null,
        title:          a.title,
        description:    a.description,
        unit:           a.unit,
        cycle:          a.cycle,
        serieId:        serieMap[a.serieCode],
        createdById:    refManagerId,
      },
    });
    articleMap[a.title] = article.id;
  }
  console.log('✓ Articles');

  // ── 8. Clauses techniques ─────────────────────────────────────────────────────
  type ClauseInput = { number: string; title: string; content: string; articleTitle: string | null };
  const clausesDefs: ClauseInput[] = [
    {
      number:       'CT-A-001',
      title:        'Prescriptions générales – Terrassements',
      content:      `<h3>1. Généralités</h3>
<p>Les travaux de terrassement comprennent toutes les opérations nécessaires à l'exécution des fouilles,
des déblais et des remblais conformément aux plans et profils définis par le Maître d'Œuvre.</p>
<h3>2. Matériaux</h3>
<p>Les matériaux provenant des déblais ne peuvent être réutilisés en remblais qu'après agrément du
Maître d'Œuvre sur la base d'une étude géotechnique.</p>
<h3>3. Exécution</h3>
<p>Le fond de fouille doit être réceptionné avant tout commencement des travaux suivants.
Le compactage doit atteindre 95 % de l'OPM.</p>`,
      articleTitle: 'Déblai en terrain ordinaire',
    },
    {
      number:       'CT-A-002',
      title:        'Prescriptions – Canalisation béton',
      content:      `<h3>1. Nature des canalisations</h3>
<p>Les canalisations seront en béton armé de classe 90A minimum,
conformes à la norme NM 10.4.007.</p>
<h3>2. Pose</h3>
<p>La pose se fait en tranchée après exécution d'un lit de sable de 10 cm d'épaisseur minimum.
Les joints seront réalisés au mortier de ciment.</p>
<h3>3. Essais</h3>
<p>Essai d'étanchéité à l'eau à la pression de 0,5 bar pendant 30 minutes.</p>`,
      articleTitle: 'Fourniture et pose de canalisation béton Ø300',
    },
    {
      number:       'CT-A-003',
      title:        'Prescriptions – Couche de base GNT',
      content:      `<h3>1. Matériaux</h3>
<p>Grave non traitée type B 0/31,5 mm conforme à la norme NM 13.1.040,
provenant de carrières agréées par le Maître d'Œuvre.</p>
<h3>2. Mise en œuvre</h3>
<p>Répandage mécanique, épaisseur minimale après compactage : 20 cm.
Indice de portance CBR ≥ 80 à 95 % OPM.</p>`,
      articleTitle: 'Couche de base en grave non traitée 0/31,5',
    },
    {
      number:       'CT-B-001',
      title:        'Prescriptions – Béton de propreté',
      content:      `<h3>1. Composition</h3>
<p>Béton maigre dosé à 150 kg de ciment CEM II/A 42,5 par m³,
granulats 0/16, rapport E/C ≤ 0,65.</p>
<h3>2. Mise en œuvre</h3>
<p>Coulé directement sur le fond de fouille réceptionné,
épaisseur uniforme de 10 cm, surface plane et horizontale.</p>`,
      articleTitle: 'Béton de propreté dosé à 150 kg/m³',
    },
    {
      number:       'CT-GEN-001',
      title:        'Clause commune – Hygiène et sécurité',
      content:      `<h3>Obligations de l'Entrepreneur</h3>
<p>L'Entrepreneur est tenu d'assurer, pendant toute la durée des travaux,
la sécurité de son personnel et des tiers. Il doit disposer d'un Plan d'Hygiène,
Sécurité et Environnement (PHSE) approuvé avant tout démarrage des travaux.</p>`,
      articleTitle: null,
    },
  ];

  for (const c of clausesDefs) {
    const existing = await prisma.clause.findFirst({
      where: { number: c.number, organizationId: org.id },
    });
    if (!existing) {
      await prisma.clause.create({
        data: {
          organizationId: org.id,
          number:         c.number,
          title:          c.title,
          content:        c.content,
          articleId:      c.articleTitle ? articleMap[c.articleTitle] : null,
          createdById:    refManagerId,
        },
      });
    }
  }
  console.log('✓ Clauses techniques');

  // ── 9. Fiches techniques ──────────────────────────────────────────────────────
  const fichesDefs = [
    {
      title:       'Fiche technique – Canalisation béton armé NM 10.4.007',
      url:         'https://www.imanor.gov.ma/norme/nm-10-4-007',
      description: 'Norme marocaine pour les tuyaux en béton armé non précontraint.',
    },
    {
      title:       'Fiche technique – Grave Non Traitée 0/31,5',
      url:         'https://www.imanor.gov.ma/norme/nm-13-1-040',
      description: 'Spécifications des granulats pour couches de fondation et base de chaussée.',
    },
    {
      title:       'Guide SETRA – Terrassements routiers',
      url:         'https://www.cerema.fr/fr/centre-ressources/boutique/guide-terrassements-routiers',
      description: 'Guide technique pour la réalisation des remblais et couches de forme.',
    },
  ];

  const ficheMap: Record<string, string> = {};
  for (const f of fichesDefs) {
    const existing = await prisma.ficheTechnique.findFirst({
      where: { title: f.title, organizationId: org.id },
    });
    const fiche = existing ?? await prisma.ficheTechnique.create({
      data: { title: f.title, url: f.url, description: f.description, organizationId: org.id, createdById: refManagerId },
    });
    ficheMap[f.title] = fiche.id;
  }

  // Rattacher les fiches aux articles
  const ficheLinksDefs: { ficheTitle: string; articleTitle: string }[] = [
    { ficheTitle: 'Fiche technique – Canalisation béton armé NM 10.4.007', articleTitle: 'Fourniture et pose de canalisation béton Ø300' },
    { ficheTitle: 'Fiche technique – Grave Non Traitée 0/31,5',            articleTitle: 'Couche de base en grave non traitée 0/31,5'   },
    { ficheTitle: 'Guide SETRA – Terrassements routiers',                  articleTitle: 'Déblai en terrain ordinaire'                  },
  ];
  for (const link of ficheLinksDefs) {
    const ficheId   = ficheMap[link.ficheTitle];
    const articleId = articleMap[link.articleTitle];
    if (ficheId && articleId) {
      await prisma.articleFiche.upsert({
        where:  { articleId_ficheId: { articleId, ficheId } },
        update: {},
        create: { articleId, ficheId },
      });
    }
  }
  console.log('✓ Fiches techniques');

  // ── 10. Documents de référence ────────────────────────────────────────────────
  const docRefsDefs = [
    { title: 'Fascicule 70 – Ouvrages d\'assainissement', reference: 'DR-0001', description: 'Cahier des clauses techniques générales applicables aux marchés publics de travaux.' },
    { title: 'CCTG Fascicule 2 – Terrassements',          reference: 'DR-0002', description: 'Exécution des travaux à ciel ouvert – terrassements.' },
    { title: 'NM 10.1.008 – Ciments courants',            reference: 'DR-0003', description: 'Spécification, performance, conformité et critères de conformité.' },
  ];

  for (const d of docRefsDefs) {
    const existing = await prisma.documentReference.findFirst({
      where: { reference: d.reference, organizationId: org.id },
    });
    if (!existing) {
      await prisma.documentReference.create({
        data: { title: d.title, reference: d.reference, description: d.description, organizationId: org.id, createdById: refManagerId },
      });
    }
  }
  console.log('✓ Documents de référence');

  // ── 11. Formule révision des prix ─────────────────────────────────────────────
  const revDefs = [
    {
      title:       'Formule FRP-T-001 – Travaux routiers',
      formula:     'P = P0 × (0,15 + 0,40 × BT/BT0 + 0,30 × S/S0 + 0,15 × Ener/Ener0)',
      description: 'Formule standard TMPA pour les marchés de travaux routiers. Indices : BT (bâtiment travaux), S (salaires), Ener (énergie).',
    },
    {
      title:       'Formule FRP-A-001 – Assainissement',
      formula:     'P = P0 × (0,10 + 0,35 × BTP/BTP0 + 0,35 × TP/TP0 + 0,20 × S/S0)',
      description: 'Formule pour marchés d\'assainissement et réseaux. Indices : BTP, TP (travaux publics), S (salaires).',
    },
  ];

  for (const r of revDefs) {
    const existing = await prisma.revisionPrix.findFirst({
      where: { title: r.title, organizationId: org.id },
    });
    if (!existing) {
      await prisma.revisionPrix.create({
        data: { title: r.title, formula: r.formula, description: r.description, organizationId: org.id, createdById: refManagerId },
      });
    }
  }
  console.log('✓ Formules révision des prix');

  // ── 12. Modèle CPS ────────────────────────────────────────────────────────────
  const existingModele = await prisma.modeleCPS.findFirst({
    where: { organizationId: org.id, name: 'Modèle TMPA – Travaux routiers (MCPS-T-001)' },
  });
  if (!existingModele) {
    await prisma.modeleCPS.create({
      data: {
        name:         'Modèle TMPA – Travaux routiers (MCPS-T-001)',
        description:  'Modèle standard TMPA pour les CPS de travaux routiers et voirie. Inclut les chapitres I à V.',
        projectTypes: ['A'],
        organizationId: org.id,
        createdById:    refManagerId,
      },
    });
  }
  console.log('✓ Modèle CPS');

  // ── 13. Projet CPS de démo ────────────────────────────────────────────────────
  const existingProject = await prisma.project.findFirst({
    where: { organizationId: org.id, name: 'Projet démo – Voirie RN12' },
  });

  if (!existingProject) {
    const project = await prisma.project.create({
      data: {
        organizationId: org.id,
        name:           'Projet démo – Voirie RN12',
        description:    'Réhabilitation de la route nationale RN12 sur 15 km. Travaux de terrassement, assainissement et chaussée.',
        isPrivate:      false,
        createdById:    creatorId,
        types: { create: [{ type: 'A' }] },
      },
    });

    // Ajouter les articles publiés au projet
    const publishedArticleIds = Object.entries(articleMap)
      .filter(([title]) =>
        ['Déblai en terrain ordinaire', 'Fourniture et pose de canalisation béton Ø300', 'Couche de base en grave non traitée 0/31,5'].includes(title),
      )
      .map(([, id]) => id);

    if (publishedArticleIds.length > 0) {
      await prisma.projectArticle.createMany({
        data:          publishedArticleIds.map((articleId) => ({ projectId: project.id, articleId })),
        skipDuplicates: true,
      });

      // Ajouter les clauses correspondantes
      const clauses = await prisma.clause.findMany({
        where: { organizationId: org.id, articleId: { in: publishedArticleIds } },
      });
      await prisma.projectClause.createMany({
        data: clauses.map((c) => ({
          projectId:          project.id,
          clauseId:           c.id,
          title:              c.title,
          number:             c.number,
          referentialVersion: c.version,
          isAutomatic:        true,
        })),
        skipDuplicates: true,
      });
    }

    // Partager le projet avec le vérificateur
    await prisma.projectShare.create({
      data: { projectId: project.id, userId: verifierId, permission: 'READ' },
    });

    console.log(`✓ Projet CPS démo: ${project.id}`);
  } else {
    console.log('✓ Projet CPS démo (déjà existant)');
  }

  // ── 14. Résumé des identifiants ────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅  Seed terminé — Identifiants de connexion :');
  console.log('───────────────────────────────────────────────────────');
  console.log('  superadmin@cps.dev      / Admin@1234!  (Super Admin)');
  console.log('  orgadmin@cps.dev        / Admin@1234!  (Admin Organisation)');
  console.log('  refmanager@cps.dev      / Admin@1234!  (Responsable Référentiel)');
  console.log('  createur@cps.dev        / Admin@1234!  (Créateur)');
  console.log('  verificateur@cps.dev    / Admin@1234!  (Vérificateur)');
  console.log('  validateur@cps.dev      / Admin@1234!  (Validateur)');
  console.log('═══════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
