-- CreateTable
CREATE TABLE "WhatsappMessageLog" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "messageType" TEXT NOT NULL,
  "templateName" TEXT,
  "language" TEXT,
  "status" TEXT NOT NULL,
  "metadata" JSONB,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clientId" INTEGER,

  CONSTRAINT "WhatsappMessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappIncomingMessage" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "sender" TEXT NOT NULL,
  "messageType" TEXT NOT NULL,
  "content" TEXT,
  "language" TEXT,
  "metadata" JSONB,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clientId" INTEGER,

  CONSTRAINT "WhatsappIncomingMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappConversation" (
  "id" TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "clientId" INTEGER,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL,
  "topic" TEXT,
  "messageCount" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,

  CONSTRAINT "WhatsappConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "displayName" TEXT,
  "description" TEXT,
  "category" TEXT,
  "languages" TEXT[],
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "components" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WhatsappTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappMessageLog_messageId_key" ON "WhatsappMessageLog"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappIncomingMessage_messageId_key" ON "WhatsappIncomingMessage"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappTemplate_name_key" ON "WhatsappTemplate"("name");

-- AddForeignKey
ALTER TABLE "WhatsappMessageLog" ADD CONSTRAINT "WhatsappMessageLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappIncomingMessage" ADD CONSTRAINT "WhatsappIncomingMessage_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappConversation" ADD CONSTRAINT "WhatsappConversation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
