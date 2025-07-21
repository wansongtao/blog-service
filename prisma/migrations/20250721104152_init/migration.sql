-- AlterTable
ALTER TABLE "article" ADD COLUMN     "encrypted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password_hint" VARCHAR(50);
