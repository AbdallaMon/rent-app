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

ALTER TABLE `JournalLine`
  ADD COLUMN `paymentId` INT NULL AFTER `rentAgreementId`;

CREATE INDEX `JournalLine_paymentId_idx`
  ON `JournalLine` (`paymentId`);

ALTER TABLE `JournalLine`
  ADD CONSTRAINT `JournalLine_payment_fkey`
  FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

  -- 2) إنشاء جدول SecurityDeposit
CREATE TABLE `SecurityDeposit` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `amount`           DOUBLE NOT NULL,
  `deductedAmount`   DOUBLE DEFAULT 0,
  `deductionReason`  TEXT NULL,
  `status`           ENUM('HELD','PARTIALLY_REFUNDED','REFUNDED','FORFEITED') NOT NULL DEFAULT 'HELD',
  `receivedAt`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `refundedAt`       DATETIME NULL,

  `renterId`         INT NOT NULL,
  `unitId`           INT NOT NULL,
  `rentAgreementId`  INT NOT NULL,

  `paymentId`        INT NULL UNIQUE,

  `createdAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_sd_renter` (`renterId`),
  INDEX `idx_sd_unit` (`unitId`),
  INDEX `idx_sd_agreement` (`rentAgreementId`),
  INDEX `idx_sd_payment` (`paymentId`),

  CONSTRAINT `fk_sd_renter`       FOREIGN KEY (`renterId`)        REFERENCES `Client`(`id`)         ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_sd_unit`         FOREIGN KEY (`unitId`)          REFERENCES `Unit`(`id`)           ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_sd_agreement`    FOREIGN KEY (`rentAgreementId`) REFERENCES `RentAgreement`(`id`)  ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_sd_payment`      FOREIGN KEY (`paymentId`)       REFERENCES `Payment`(`id`)        ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) إضافة عمود الربط في JournalLine
ALTER TABLE `JournalLine`
  ADD COLUMN `securityDepositId` INT NULL,
  ADD INDEX `idx_jl_securityDepositId` (`securityDepositId`),
  ADD CONSTRAINT `fk_jl_securityDeposit` FOREIGN KEY (`securityDepositId`)
    REFERENCES `SecurityDeposit`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

ALTER TABLE `UserPrivilege`
MODIFY `area` ENUM(
  'HOME','FOLLOW_UP','PROPERTY','UNIT','RENT','INVOICE',
  'MAINTENANCE','REQUEST','REPORT','OWNER','RENTER','SETTING','WHATSAPP',
  'ACCOUNTING','SECURITY_DEPOSIT'
) NOT NULL;

ALTER TABLE `GLAccount`
ADD COLUMN `isSystem` BOOLEAN NOT NULL DEFAULT FALSE AFTER `isActive`;

ALTER TABLE `JournalEntry`
ADD COLUMN `manull` BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE `WhatsappMessageLog`
  ADD COLUMN `sendSchema` VARCHAR(191) NULL,
  ADD COLUMN `relationKey` VARCHAR(191) NULL,
  ADD COLUMN `relationId` INT NULL;

CREATE INDEX `WhatsappMessageLog_relation_idx`
  ON `WhatsappMessageLog` (`relationKey`, `relationId`);

CREATE INDEX `WhatsappMessageLog_status_sentAt_idx`
  ON `WhatsappMessageLog` (`status`, `sentAt`);

CREATE INDEX `WhatsappMessageLog_recipient_sentAt_idx`
  ON `WhatsappMessageLog` (`recipient`, `sentAt`);

ALTER TABLE "WhatsappMessageLog" 
MODIFY COLUMN relationId VARCHAR(191) NULL;

ALTER TABLE `WhatsappIncomingMessage`
ADD COLUMN `status` VARCHAR(191) NULL;


RENAME TABLE state TO State;
RENAME TABLE city TO City;
RENAME TABLE district TO District;
RENAME TABLE neighbour TO Neighbour;
RENAME TABLE propertytype TO PropertyType;
RENAME TABLE unittype TO UnitType;
RENAME TABLE property TO Property;
RENAME TABLE electricitymeter TO ElectricityMeter;
RENAME TABLE attachment TO Attachment;
RENAME TABLE unit TO Unit;
RENAME TABLE contractexpense TO ContractExpense;
RENAME TABLE rentagreement TO RentAgreement;
RENAME TABLE contractexpensetorentagreement TO ContractExpenseToRentAgreement;
RENAME TABLE rentagreementtype TO RentAgreementType;
RENAME TABLE installment TO Installment;
RENAME TABLE maintenanceinstallment TO MaintenanceInstallment;
RENAME TABLE maintenance TO Maintenance;
RENAME TABLE propertyexpensetype TO PropertyExpenseType;
RENAME TABLE bank TO Bank;
RENAME TABLE user TO User;
RENAME TABLE userproperty TO UserProperty;
RENAME TABLE privilege TO Privilege;
RENAME TABLE userprivilege TO UserPrivilege;
RENAME TABLE client TO Client;
RENAME TABLE bankaccount TO BankAccount;
RENAME TABLE contact TO Contact;
RENAME TABLE income TO Income;
RENAME TABLE expense TO Expense;
RENAME TABLE collector TO Collector;
RENAME TABLE payment TO Payment;
RENAME TABLE invoice TO Invoice;
RENAME TABLE maintenancerequest TO MaintenanceRequest;
RENAME TABLE complaint TO Complaint;
RENAME TABLE whatsappmessagelog TO WhatsappMessageLog;
RENAME TABLE whatsappincomingmessage TO WhatsappIncomingMessage;
RENAME TABLE whatsappconversation TO WhatsappConversation;
RENAME TABLE whatsapptemplate TO WhatsappTemplate;
RENAME TABLE remindersettings TO ReminderSettings;
RENAME TABLE whatsappteamsettings TO WhatsAppTeamSettings;
RENAME TABLE glaccount TO GLAccount;
RENAME TABLE companybankaccount TO CompanyBankAccount;
RENAME TABLE journalentry TO JournalEntry;
RENAME TABLE journalline TO JournalLine;
RENAME TABLE journalsettlement TO JournalSettlement;
RENAME TABLE journalsettlementline TO JournalSettlementLine;
RENAME TABLE securitydeposit TO SecurityDeposit;
