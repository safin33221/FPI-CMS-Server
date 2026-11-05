-- AlterTable
ALTER TABLE "Room" RENAME COLUMN "name" TO "buildingName";
ALTER TABLE "Room" RENAME COLUMN "code" TO "roomCode";

-- RenameIndex
ALTER INDEX "Room_code_key" RENAME TO "Room_roomCode_key";

