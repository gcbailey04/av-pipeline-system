/*
  Warnings:

  - You are about to drop the column `address` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `isReturnCustomer` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `lastInteraction` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `integrationCardId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `lastModified` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `path` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `rentalCardId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `salesCardId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `serviceCardId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `uploadDate` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the `IntegrationCard` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RentalCard` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SalesCard` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceCard` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `filePath` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimeType` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PipelineType" AS ENUM ('SALES', 'DESIGN', 'INTEGRATION', 'SERVICE', 'REPAIR', 'RENTAL');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('NEW_LEAD', 'QUALIFIED', 'APPOINTMENT_SCHEDULED', 'APPOINTMENT_COMPLETE', 'PROPOSAL', 'PROPOSAL_SENT', 'REVISIONS', 'WON', 'LOST', 'NEW_DESIGN', 'DESIGN_STARTED', 'DESIGN_VERIFICATION', 'DESIGN_COMPLETE', 'APPROVED', 'DEPOSIT_INVOICE_SENT', 'DEPOSIT_INVOICE_PAID', 'EQUIPMENT_ORDERED', 'EQUIPMENT_RECEIVED', 'SCHEDULED', 'INSTALLATION', 'COMMISSIONING', 'INVOICE', 'INTEGRATION_COMPLETE', 'SERVICE_REQUEST', 'SERVICE_SCHEDULED', 'SERVICE_IN_PROGRESS', 'SERVICE_COMPLETE', 'REPAIR_REQUEST', 'REPAIR_SHIPPED_TO_VENDOR', 'REPAIR_IN_PROGRESS', 'REPAIR_RETURNED', 'REPAIR_COMPLETE', 'RENTAL_REQUEST', 'RENTAL_QUOTE_SENT', 'RENTAL_ACCEPTED', 'RENTAL_SCHEDULED', 'RENTAL_OUT', 'RENTAL_RETURNED', 'RENTAL_INVOICED', 'RENTAL_COMPLETE');

-- CreateEnum
CREATE TYPE "PipelineStatus" AS ENUM ('OPEN', 'ON_HOLD', 'WAITING_DESIGN', 'CLOSED');

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_integrationCardId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_rentalCardId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_salesCardId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_serviceCardId_fkey";

-- DropForeignKey
ALTER TABLE "IntegrationCard" DROP CONSTRAINT "IntegrationCard_customerId_fkey";

-- DropForeignKey
ALTER TABLE "IntegrationCard" DROP CONSTRAINT "IntegrationCard_salesCardId_fkey";

-- DropForeignKey
ALTER TABLE "RentalCard" DROP CONSTRAINT "RentalCard_customerId_fkey";

-- DropForeignKey
ALTER TABLE "SalesCard" DROP CONSTRAINT "SalesCard_customerId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceCard" DROP CONSTRAINT "ServiceCard_customerId_fkey";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "address",
DROP COLUMN "email",
DROP COLUMN "isReturnCustomer",
DROP COLUMN "lastInteraction",
DROP COLUMN "phone",
ADD COLUMN     "grading" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "integrationCardId",
DROP COLUMN "lastModified",
DROP COLUMN "path",
DROP COLUMN "rentalCardId",
DROP COLUMN "salesCardId",
DROP COLUMN "serviceCardId",
DROP COLUMN "type",
DROP COLUMN "uploadDate",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "filePath" TEXT NOT NULL,
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "projectId" TEXT NOT NULL,
ADD COLUMN     "size" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "uploadTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "uploaderId" TEXT;

-- DropTable
DROP TABLE "IntegrationCard";

-- DropTable
DROP TABLE "RentalCard";

-- DropTable
DROP TABLE "SalesCard";

-- DropTable
DROP TABLE "ServiceCard";

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" TEXT DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT,
    "designation" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "jobTitle" TEXT,
    "role" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "locationId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectStatus" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineCard" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "PipelineType" NOT NULL,
    "stage" "PipelineStage" NOT NULL,
    "status" "PipelineStatus" NOT NULL,
    "title" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "notes" TEXT,
    "originating_card_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCardDetails" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "estimatedValue" DOUBLE PRECISION,
    "estimatedCloseDate" TIMESTAMP(3),
    "source" TEXT,
    "nextStepSummary" TEXT,
    "lastActivityDate" TIMESTAMP(3),

    CONSTRAINT "SalesCardDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignCardDetails" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "designRequirements" TEXT,
    "dueDate" TIMESTAMP(3),
    "estimatedHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,
    "assignedDesignerId" TEXT,

    CONSTRAINT "DesignCardDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationCardDetails" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "approvedProposalValue" DOUBLE PRECISION,
    "depositAmount" DOUBLE PRECISION,
    "installationStartDate" TIMESTAMP(3),
    "installationEndDate" TIMESTAMP(3),
    "siteReadinessChecklistComplete" BOOLEAN NOT NULL DEFAULT false,
    "projectManagerId" TEXT,
    "leadTechnicianId" TEXT,

    CONSTRAINT "IntegrationCardDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ContactToProject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ContactToProject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Location_customerId_idx" ON "Location"("customerId");

-- CreateIndex
CREATE INDEX "Contact_customerId_idx" ON "Contact"("customerId");

-- CreateIndex
CREATE INDEX "Contact_email_idx" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Project_customerId_idx" ON "Project"("customerId");

-- CreateIndex
CREATE INDEX "Project_locationId_idx" ON "Project"("locationId");

-- CreateIndex
CREATE INDEX "PipelineCard_projectId_idx" ON "PipelineCard"("projectId");

-- CreateIndex
CREATE INDEX "PipelineCard_assignedUserId_idx" ON "PipelineCard"("assignedUserId");

-- CreateIndex
CREATE INDEX "PipelineCard_type_idx" ON "PipelineCard"("type");

-- CreateIndex
CREATE INDEX "PipelineCard_stage_idx" ON "PipelineCard"("stage");

-- CreateIndex
CREATE INDEX "PipelineCard_status_idx" ON "PipelineCard"("status");

-- CreateIndex
CREATE INDEX "PipelineCard_originating_card_id_idx" ON "PipelineCard"("originating_card_id");

-- CreateIndex
CREATE UNIQUE INDEX "SalesCardDetails_cardId_key" ON "SalesCardDetails"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "DesignCardDetails_cardId_key" ON "DesignCardDetails"("cardId");

-- CreateIndex
CREATE INDEX "DesignCardDetails_assignedDesignerId_idx" ON "DesignCardDetails"("assignedDesignerId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationCardDetails_cardId_key" ON "IntegrationCardDetails"("cardId");

-- CreateIndex
CREATE INDEX "IntegrationCardDetails_projectManagerId_idx" ON "IntegrationCardDetails"("projectManagerId");

-- CreateIndex
CREATE INDEX "IntegrationCardDetails_leadTechnicianId_idx" ON "IntegrationCardDetails"("leadTechnicianId");

-- CreateIndex
CREATE INDEX "_ContactToProject_B_index" ON "_ContactToProject"("B");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Document_projectId_idx" ON "Document"("projectId");

-- CreateIndex
CREATE INDEX "Document_uploaderId_idx" ON "Document"("uploaderId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineCard" ADD CONSTRAINT "PipelineCard_originating_card_id_fkey" FOREIGN KEY ("originating_card_id") REFERENCES "PipelineCard"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PipelineCard" ADD CONSTRAINT "PipelineCard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineCard" ADD CONSTRAINT "PipelineCard_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCardDetails" ADD CONSTRAINT "SalesCardDetails_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "PipelineCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignCardDetails" ADD CONSTRAINT "DesignCardDetails_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "PipelineCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignCardDetails" ADD CONSTRAINT "DesignCardDetails_assignedDesignerId_fkey" FOREIGN KEY ("assignedDesignerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationCardDetails" ADD CONSTRAINT "IntegrationCardDetails_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "PipelineCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationCardDetails" ADD CONSTRAINT "IntegrationCardDetails_projectManagerId_fkey" FOREIGN KEY ("projectManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationCardDetails" ADD CONSTRAINT "IntegrationCardDetails_leadTechnicianId_fkey" FOREIGN KEY ("leadTechnicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContactToProject" ADD CONSTRAINT "_ContactToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContactToProject" ADD CONSTRAINT "_ContactToProject_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
