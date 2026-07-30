-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED', 'GRADUATED', 'DROPPED', 'TRANSFERRED');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "status" "StudentStatus" NOT NULL DEFAULT 'PENDING_ACTIVATION',
ALTER COLUMN "roll" DROP NOT NULL,
ALTER COLUMN "registrationNo" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Admission" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'PENDING',
    "isFeeVerified" BOOLEAN NOT NULL DEFAULT false,
    "isDocumentVerified" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admission_studentId_key" ON "Admission"("studentId");

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
