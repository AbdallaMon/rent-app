-- أمر SQL لإنشاء جدول Complaint وإضافة ComplaintCategory
-- إنشاء ComplaintCategory كقيمة enum
CREATE TABLE IF NOT EXISTS `Complaint` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `clientId` INT NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `category` ENUM('PROPERTY_ISSUE', 'RENT_ISSUE', 'NEIGHBOR_ISSUE', 'MAINTENANCE_ISSUE', 'NOISE_ISSUE', 'SECURITY_ISSUE', 'PAYMENT_ISSUE', 'OTHER') NOT NULL,
  `status` ENUM('PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `propertyId` INT NULL,
  `unitId` INT NULL,
  `attachments` TEXT NULL,
  `responseText` TEXT NULL,
  `responseDate` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `Complaint_clientId_idx` (`clientId`),
  INDEX `Complaint_propertyId_idx` (`propertyId`),
  INDEX `Complaint_unitId_idx` (`unitId`),
  CONSTRAINT `Complaint_clientId_fkey` 
    FOREIGN KEY (`clientId`) REFERENCES `Client` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Complaint_propertyId_fkey` 
    FOREIGN KEY (`propertyId`) REFERENCES `Property` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Complaint_unitId_fkey` 
    FOREIGN KEY (`unitId`) REFERENCES `Unit` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);
