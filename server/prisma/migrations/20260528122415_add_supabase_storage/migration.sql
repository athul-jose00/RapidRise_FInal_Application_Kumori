-- AlterTable
ALTER TABLE "File" ADD COLUMN     "storageBackend" TEXT,
ADD COLUMN     "supabasePath" TEXT,
ALTER COLUMN "cloudinaryPublicId" DROP NOT NULL,
ALTER COLUMN "cloudinaryResourceType" DROP NOT NULL,
ALTER COLUMN "cloudinaryUrl" DROP NOT NULL;
