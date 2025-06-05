/*
  Warnings:

  - Changed the type of `category_name` on the `article` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "article" DROP CONSTRAINT "article_category_name_fkey";

-- AlterTable
ALTER TABLE "article" DROP COLUMN "category_name",
ADD COLUMN     "category_name" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "article_category_name_fkey" FOREIGN KEY ("category_name") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
