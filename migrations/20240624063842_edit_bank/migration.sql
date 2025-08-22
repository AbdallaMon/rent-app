/*
  Warnings:

  - You are about to drop the column `propertyId` on the `BankAccount` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `BankAccount` DROP FOREIGN KEY `BankAccount_propertyId_fkey`;

-- AlterTable
ALTER TABLE `BankAccount` DROP COLUMN `propertyId`;

-- AlterTable
ALTER TABLE `Property` ADD COLUMN `bankAccountId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_bankAccountId_fkey` FOREIGN KEY (`bankAccountId`) REFERENCES `BankAccount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
