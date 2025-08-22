-- CreateTable
CREATE TABLE `WhatsappMessageLog` (
  `id` VARCHAR(191) NOT NULL,
  `messageId` VARCHAR(191) NOT NULL,
  `recipient` VARCHAR(191) NOT NULL,
  `messageType` VARCHAR(191) NOT NULL,
  `templateName` VARCHAR(191) NULL,
  `language` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL,
  `metadata` JSON NULL,
  `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `clientId` INTEGER NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `WhatsappMessageLog_messageId_key`(`messageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsappIncomingMessage` (
  `id` VARCHAR(191) NOT NULL,
  `messageId` VARCHAR(191) NOT NULL,
  `sender` VARCHAR(191) NOT NULL,
  `messageType` VARCHAR(191) NOT NULL,
  `content` TEXT NULL,
  `language` VARCHAR(191) NULL,
  `metadata` JSON NULL,
  `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `clientId` INTEGER NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `WhatsappIncomingMessage_messageId_key`(`messageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsappConversation` (
  `id` VARCHAR(191) NOT NULL,
  `phoneNumber` VARCHAR(191) NOT NULL,
  `clientId` INTEGER NULL,
  `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `status` VARCHAR(191) NOT NULL,
  `topic` VARCHAR(191) NULL,
  `messageCount` INTEGER NOT NULL DEFAULT 0,
  `metadata` JSON NULL,

  PRIMARY KEY (`id`),
  INDEX `WhatsappConversation_phoneNumber_idx`(`phoneNumber`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsappTemplate` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `displayName` VARCHAR(191) NULL,
  `description` TEXT NULL,
  `category` VARCHAR(191) NULL,
  `languages` JSON NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `components` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `WhatsappTemplate_name_key`(`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WhatsappMessageLog` ADD CONSTRAINT `WhatsappMessageLog_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WhatsappIncomingMessage` ADD CONSTRAINT `WhatsappIncomingMessage_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WhatsappConversation` ADD CONSTRAINT `WhatsappConversation_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
