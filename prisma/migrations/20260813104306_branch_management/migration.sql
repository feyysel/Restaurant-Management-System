-- CreateEnum
CREATE TYPE "BranchRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "parentId" TEXT;

-- CreateTable
CREATE TABLE "BranchRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "status" "BranchRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "parentRestaurantId" TEXT NOT NULL,
    "branchId" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BranchRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BranchRequest_parentRestaurantId_idx" ON "BranchRequest"("parentRestaurantId");

-- CreateIndex
CREATE INDEX "BranchRequest_requestedById_idx" ON "BranchRequest"("requestedById");

-- CreateIndex
CREATE INDEX "BranchRequest_status_idx" ON "BranchRequest"("status");

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchRequest" ADD CONSTRAINT "BranchRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchRequest" ADD CONSTRAINT "BranchRequest_parentRestaurantId_fkey" FOREIGN KEY ("parentRestaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchRequest" ADD CONSTRAINT "BranchRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
