/*
  Warnings:

  - You are about to drop the column `slug` on the `article` table. All the data in the column will be lost.
  - You are about to alter the column `summary` on the `article` table. The data in that column could be lost. The data in that column will be cast from `VarChar(500)` to `VarChar(200)`.
  - You are about to drop the `user_in_article` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `author_id` to the `article` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "user_in_article" DROP CONSTRAINT "user_in_article_article_id_fkey";

-- DropForeignKey
ALTER TABLE "user_in_article" DROP CONSTRAINT "user_in_article_user_id_fkey";

-- DropIndex
DROP INDEX "article_slug_key";

-- AlterTable
ALTER TABLE "article" DROP COLUMN "slug",
ADD COLUMN     "author_id" TEXT NOT NULL,
ADD COLUMN     "theme" VARCHAR(50),
ALTER COLUMN "visibility" SET DATA TYPE VARCHAR(30),
ALTER COLUMN "summary" SET DATA TYPE VARCHAR(200);

-- DropTable
DROP TABLE "user_in_article";

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "article_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
