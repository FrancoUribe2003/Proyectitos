/*
  Warnings:

  - You are about to drop the column `content` on the `notes` table. All the data in the column will be lost.
  - Added the required column `content_encrypted` to the `notes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "notes" DROP COLUMN "content",
ADD COLUMN     "content_encrypted" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "notes_project_id_idx" ON "notes"("project_id");

-- CreateIndex
CREATE INDEX "tasks_project_id_assignee_id_idx" ON "tasks"("project_id", "assignee_id");
