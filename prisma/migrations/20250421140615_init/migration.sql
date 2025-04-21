/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `article` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "article" ADD COLUMN     "comment_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cover_image" VARCHAR(255),
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "like_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "slug" VARCHAR(200),
ADD COLUMN     "summary" VARCHAR(500),
ADD COLUMN     "view_count" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "article_slug_key" ON "article"("slug");
