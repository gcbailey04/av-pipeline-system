-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isReturnCustomer" BOOLEAN NOT NULL DEFAULT false,
    "lastInteraction" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModified" TIMESTAMP(3) NOT NULL,
    "salesCardId" TEXT,
    "serviceCardId" TEXT,
    "rentalCardId" TEXT,
    "integrationCardId" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCard" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "projectNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModified" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "lastInteraction" TIMESTAMP(3) NOT NULL,
    "stage" TEXT NOT NULL,
    "estimateValue" DOUBLE PRECISION NOT NULL,
    "appointmentDate" TIMESTAMP(3),
    "proposalSentDate" TIMESTAMP(3),
    "emailLogged" BOOLEAN NOT NULL DEFAULT false,
    "alertsSent" BOOLEAN NOT NULL DEFAULT false,
    "documentsGenerated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SalesCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationCard" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "projectNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModified" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "lastInteraction" TIMESTAMP(3) NOT NULL,
    "stage" TEXT NOT NULL,
    "salesCardId" TEXT NOT NULL,
    "equipmentOrdered" BOOLEAN NOT NULL DEFAULT false,
    "equipmentReceived" BOOLEAN NOT NULL DEFAULT false,
    "installedDate" TIMESTAMP(3),
    "installationDate" TIMESTAMP(3),
    "emailLogged" BOOLEAN NOT NULL DEFAULT false,
    "alertsSent" BOOLEAN NOT NULL DEFAULT false,
    "documentsGenerated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "IntegrationCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCard" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "projectNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModified" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "lastInteraction" TIMESTAMP(3) NOT NULL,
    "stage" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "rmaNumber" TEXT,
    "partsRequired" TEXT[],
    "emailLogged" BOOLEAN NOT NULL DEFAULT false,
    "alertsSent" BOOLEAN NOT NULL DEFAULT false,
    "documentsGenerated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ServiceCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalCard" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "projectNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModified" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "lastInteraction" TIMESTAMP(3) NOT NULL,
    "stage" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3),
    "equipmentList" TEXT[],
    "quoteValue" DOUBLE PRECISION NOT NULL,
    "emailLogged" BOOLEAN NOT NULL DEFAULT false,
    "alertsSent" BOOLEAN NOT NULL DEFAULT false,
    "documentsGenerated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RentalCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesCard_projectNumber_key" ON "SalesCard"("projectNumber");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationCard_projectNumber_key" ON "IntegrationCard"("projectNumber");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationCard_salesCardId_key" ON "IntegrationCard"("salesCardId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCard_projectNumber_key" ON "ServiceCard"("projectNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RentalCard_projectNumber_key" ON "RentalCard"("projectNumber");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_salesCardId_fkey" FOREIGN KEY ("salesCardId") REFERENCES "SalesCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_serviceCardId_fkey" FOREIGN KEY ("serviceCardId") REFERENCES "ServiceCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_rentalCardId_fkey" FOREIGN KEY ("rentalCardId") REFERENCES "RentalCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_integrationCardId_fkey" FOREIGN KEY ("integrationCardId") REFERENCES "IntegrationCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCard" ADD CONSTRAINT "SalesCard_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationCard" ADD CONSTRAINT "IntegrationCard_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationCard" ADD CONSTRAINT "IntegrationCard_salesCardId_fkey" FOREIGN KEY ("salesCardId") REFERENCES "SalesCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCard" ADD CONSTRAINT "ServiceCard_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalCard" ADD CONSTRAINT "RentalCard_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
