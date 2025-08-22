-- SQL commands to add missing tables: MaintenanceRequest, Complaint, and ContactForm

-- Create MaintenanceRequest table if it doesn't exist
CREATE TABLE IF NOT EXISTS `MaintenanceRequest` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `clientId` INT NOT NULL,
  `propertyId` INT,
  `unitId` INT,
  `description` TEXT NOT NULL,
  `isExpired` BOOLEAN NOT NULL DEFAULT false,
  `lastRequestTime` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
  `technicianNotified` BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (`id`),
  CONSTRAINT `MaintenanceRequest_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `MaintenanceRequest_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `MaintenanceRequest_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create Complaint table if it doesn't exist
CREATE TABLE IF NOT EXISTS `Complaint` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `clientId` INT NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `category` ENUM('PROPERTY_ISSUE', 'RENT_ISSUE', 'NEIGHBOR_ISSUE', 'MAINTENANCE_ISSUE', 'NOISE_ISSUE', 'SECURITY_ISSUE', 'PAYMENT_ISSUE', 'OTHER') NOT NULL,
  `status` ENUM('PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `propertyId` INT,
  `unitId` INT,
  `attachments` TEXT,
  `responseText` TEXT,
  `responseDate` DATETIME(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `Complaint_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Complaint_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Complaint_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create ContactForm table if it doesn't exist
CREATE TABLE IF NOT EXISTS `ContactForm` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `language` ENUM('ENGLISH', 'ARABIC') NOT NULL DEFAULT 'ARABIC',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
);
