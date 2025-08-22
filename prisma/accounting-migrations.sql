SET FOREIGN_KEY_CHECKS = 1;

-- ========== GLAccount ==========
CREATE TABLE IF NOT EXISTS `GLAccount` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(32) NOT NULL UNIQUE,
  `name` VARCHAR(191) NOT NULL,
  `type` ENUM('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE') NOT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== CompanyBankAccount ==========
CREATE TABLE IF NOT EXISTS `CompanyBankAccount` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `accountType` ENUM('CHECKING','SAVINGS','PETTY_CASH') NOT NULL,
  `openingBalance` DOUBLE NOT NULL DEFAULT 0,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `notes` VARCHAR(255) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY `CompanyBankAccount_name_type_uq` (`name`, `accountType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== JournalEntry ==========
CREATE TABLE IF NOT EXISTS `JournalEntry` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `entryDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `description` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY `JournalEntry_entryDate_idx` (`entryDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== JournalLine ==========
CREATE TABLE IF NOT EXISTS `JournalLine` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `entryId` INT NOT NULL,
  `side` ENUM('DEBIT','CREDIT') NOT NULL,
  `amount` DOUBLE NOT NULL,
  `memo` VARCHAR(255) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  `companyBankAccountId` INT NULL,
  `glAccountId` INT NULL,

  `partyType` ENUM('OWNER','RENTER') NULL,
  `partyClientId` INT NULL,

  `counterpartyLabel` VARCHAR(255) NULL,

  `propertyId` INT NULL,
  `unitId` INT NULL,
  `maintenanceId` INT NULL,
  `rentAgreementId` INT NULL,

  `isSettled` TINYINT(1) NULL DEFAULT 0,
  `settledAt` DATETIME(3) NULL,

  KEY `JournalLine_entryId_idx` (`entryId`),
  KEY `JournalLine_companyBankAccountId_idx` (`companyBankAccountId`),
  KEY `JournalLine_glAccountId_idx` (`glAccountId`),
  KEY `JournalLine_party_idx` (`partyClientId`, `partyType`),
  KEY `JournalLine_propertyId_idx` (`propertyId`),
  KEY `JournalLine_unitId_idx` (`unitId`),
  KEY `JournalLine_maintenanceId_idx` (`maintenanceId`),
  KEY `JournalLine_rentAgreementId_idx` (`rentAgreementId`),

  CONSTRAINT `JournalLine_entry_fkey`
    FOREIGN KEY (`entryId`) REFERENCES `JournalEntry`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `JournalLine_cba_fkey`
    FOREIGN KEY (`companyBankAccountId`) REFERENCES `CompanyBankAccount`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT `JournalLine_gl_fkey`
    FOREIGN KEY (`glAccountId`) REFERENCES `GLAccount`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT `JournalLine_client_fkey`
    FOREIGN KEY (`partyClientId`) REFERENCES `Client`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT `JournalLine_property_fkey`
    FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT `JournalLine_unit_fkey`
    FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT `JournalLine_maint_fkey`
    FOREIGN KEY (`maintenanceId`) REFERENCES `Maintenance`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT `JournalLine_ra_fkey`
    FOREIGN KEY (`rentAgreementId`) REFERENCES `RentAgreement`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== JournalSettlement ==========
CREATE TABLE IF NOT EXISTS `JournalSettlement` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `matchedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `note` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== JournalSettlementLine (الجدول الوسيط) ==========
CREATE TABLE IF NOT EXISTS `JournalSettlementLine` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `settlementId` INT NOT NULL,
  `lineId` INT NOT NULL,
  `side` ENUM('DEBIT','CREDIT') NOT NULL,
  `amountMatched` DOUBLE NOT NULL,
  `matchedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `note` VARCHAR(255) NULL,

  UNIQUE KEY `JournalSettlementLine_settlement_line_uq` (`settlementId`, `lineId`),
  KEY `JournalSettlementLine_settlement_idx` (`settlementId`),
  KEY `JournalSettlementLine_line_idx` (`lineId`),

  CONSTRAINT `JournalSettlementLine_settlement_fkey`
    FOREIGN KEY (`settlementId`) REFERENCES `JournalSettlement`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `JournalSettlementLine_line_fkey`
    FOREIGN KEY (`lineId`) REFERENCES `JournalLine`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;