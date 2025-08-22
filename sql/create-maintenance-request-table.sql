-- أمر SQL لإنشاء جدول MaintenanceRequest
CREATE TABLE IF NOT EXISTS `MaintenanceRequest` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `clientId` INT NOT NULL,
  `propertyId` INT NULL,
  `unitId` INT NULL,
  `description` TEXT NOT NULL,
  `isExpired` BOOLEAN NOT NULL DEFAULT false,
  `lastRequestTime` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
  `technicianNotified` BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (`id`),
  INDEX `MaintenanceRequest_clientId_idx` (`clientId`),
  INDEX `MaintenanceRequest_propertyId_idx` (`propertyId`),
  INDEX `MaintenanceRequest_unitId_idx` (`unitId`),
  CONSTRAINT `MaintenanceRequest_clientId_fkey` 
    FOREIGN KEY (`clientId`) REFERENCES `Client` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `MaintenanceRequest_propertyId_fkey` 
    FOREIGN KEY (`propertyId`) REFERENCES `Property` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `MaintenanceRequest_unitId_fkey` 
    FOREIGN KEY (`unitId`) REFERENCES `Unit` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);
