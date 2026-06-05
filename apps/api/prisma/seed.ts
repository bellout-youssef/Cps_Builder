import { PrismaClient, RoleName } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // ─── 1. Seed des rôles ──────────────────────────────────────────────────────
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
      where: { name: def.name },
      update: { description: def.description },
      create: def,
    });
  }
  console.log('✓ Roles seeded');

  // ─── 2. Super Admin ─────────────────────────────────────────────────────────
  const superAdminEmail = 'superadmin@cps.dev';
  const superAdminPassword = await argon2.hash('Admin@1234!');

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      name: 'Super Administrateur',
      passwordHash: superAdminPassword,
      organizationId: null,
    },
  });

  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.SUPER_ADMIN } });
  const existingSaRole = await prisma.userRole.findFirst({
    where: { userId: superAdmin.id, roleId: superAdminRole.id, organizationId: null },
  });
  if (!existingSaRole) {
    await prisma.userRole.create({
      data: { userId: superAdmin.id, roleId: superAdminRole.id, organizationId: null },
    });
  }
  console.log(`✓ Super Admin: ${superAdminEmail} / Admin@1234!`);

  // ─── 3. Organisation de démo ────────────────────────────────────────────────
  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'demo-tmpa' },
    update: {},
    create: { name: 'Organisation TMPA Démo', slug: 'demo-tmpa' },
  });
  console.log(`✓ Org: ${demoOrg.name} (${demoOrg.id})`);

  // ─── 4. Admin Organisation de démo ─────────────────────────────────────────
  const orgAdminEmail = 'orgadmin@cps.dev';
  const orgAdminPassword = await argon2.hash('Admin@1234!');

  const orgAdmin = await prisma.user.upsert({
    where: { email: orgAdminEmail },
    update: {},
    create: {
      email: orgAdminEmail,
      name: 'Admin Organisation Démo',
      passwordHash: orgAdminPassword,
      organizationId: demoOrg.id,
    },
  });

  const orgAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.ORG_ADMIN } });
  const existingRole = await prisma.userRole.findFirst({
    where: { userId: orgAdmin.id, roleId: orgAdminRole.id, organizationId: demoOrg.id },
  });
  if (!existingRole) {
    await prisma.userRole.create({
      data: { userId: orgAdmin.id, roleId: orgAdminRole.id, organizationId: demoOrg.id },
    });
  }
  console.log(`✓ Org Admin: ${orgAdminEmail} / Admin@1234! (org: ${demoOrg.slug})`);

  console.log('\n✅ Seed terminé');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
