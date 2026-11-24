/*
  Warnings:

  - You are about to drop the column `url` on the `project_links` table. All the data in the column will be lost.
  - Added the required column `url_encrypted` to the `project_links` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Category" AS ENUM ('personal', 'trabajo');

-- AlterTable
ALTER TABLE "project_links" DROP COLUMN "url",
ADD COLUMN     "url_encrypted" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "category" "Category" NOT NULL DEFAULT 'personal';
