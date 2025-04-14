-- AlterTable
ALTER TABLE "category" ADD COLUMN     "pid" SMALLINT;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_pid_fkey" FOREIGN KEY ("pid") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
