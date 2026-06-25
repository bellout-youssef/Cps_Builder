-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "dceCounter" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "dceRef" TEXT;
