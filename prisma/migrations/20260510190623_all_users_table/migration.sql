/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "batch" TEXT,
ADD COLUMN     "session" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "name" SET NOT NULL;

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "qualification" TEXT,
    "teacherId" TEXT NOT NULL,
    "joiningDate" TIMESTAMP(3),
    "experienceYears" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_teacherId_key" ON "Teacher"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
