-- إنشاء جدول إعدادات التذكيرات
CREATE TABLE IF NOT EXISTS `ReminderSettings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `settingKey` VARCHAR(191) NOT NULL UNIQUE,
  `settingValue` JSON NOT NULL,
  `description` TEXT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ReminderSettings_settingKey_key`(`settingKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- إنشاء جدول تفاصيل التذكيرات المرسلة
CREATE TABLE IF NOT EXISTS `ReminderLog` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `reminderType` ENUM('PAYMENT', 'CONTRACT_EXPIRY', 'MAINTENANCE', 'CUSTOM') NOT NULL,
  `clientId` INT NOT NULL,
  `contractId` INT NULL,
  `installmentId` INT NULL,
  `maintenanceRequestId` INT NULL,
  `phoneNumber` VARCHAR(191) NOT NULL,
  `messageContent` TEXT NOT NULL,
  `whatsappMessageId` VARCHAR(191) NULL,
  `status` ENUM('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED') NOT NULL DEFAULT 'PENDING',
  `sentAt` DATETIME(3) NULL,
  `deliveredAt` DATETIME(3) NULL,
  `readAt` DATETIME(3) NULL,
  `failureReason` TEXT NULL,
  `retryCount` INT NOT NULL DEFAULT 0,
  `scheduledFor` DATETIME(3) NULL,
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
  `daysBeforeDue` INT NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  INDEX `ReminderLog_clientId_idx` (`clientId`),
  INDEX `ReminderLog_contractId_idx` (`contractId`),
  INDEX `ReminderLog_installmentId_idx` (`installmentId`),
  INDEX `ReminderLog_maintenanceRequestId_idx` (`maintenanceRequestId`),
  INDEX `ReminderLog_reminderType_idx` (`reminderType`),
  INDEX `ReminderLog_status_idx` (`status`),
  INDEX `ReminderLog_sentAt_idx` (`sentAt`),
  INDEX `ReminderLog_scheduledFor_idx` (`scheduledFor`),
  
  CONSTRAINT `ReminderLog_clientId_fkey` 
    FOREIGN KEY (`clientId`) REFERENCES `Client` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ReminderLog_contractId_fkey` 
    FOREIGN KEY (`contractId`) REFERENCES `RentAgreement` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ReminderLog_installmentId_fkey` 
    FOREIGN KEY (`installmentId`) REFERENCES `Installment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ReminderLog_maintenanceRequestId_fkey` 
    FOREIGN KEY (`maintenanceRequestId`) REFERENCES `MaintenanceRequest` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- إدراج الإعدادات الافتراضية
INSERT INTO `ReminderSettings` (`settingKey`, `settingValue`, `description`, `isActive`) VALUES
('payment_reminder_days', '[7, 3, 1]', 'أيام التذكير بالأقساط قبل الاستحقاق', true),
('contract_expiry_reminder_days', '[60, 30, 15, 7]', 'أيام التذكير بانتهاء العقد', true),
('max_retries', '3', 'الحد الأقصى لإعادة المحاولة', true),
('message_delay', '2000', 'فترة الانتظار بين الرسائل (ميلي ثانية)', true),
('business_hours_start', '"08:00"', 'بداية ساعات العمل', true),
('business_hours_end', '"18:00"', 'نهاية ساعات العمل', true),
('weekend_sending_enabled', 'false', 'إرسال التذكيرات في نهاية الأسبوع', true),
('emergency_contact_phone', '"+971547333111"', 'رقم الاتصال للطوارئ', true),
('company_name', '"شركة تار العقارية"', 'اسم الشركة في الرسائل', true),
('auto_reminder_enabled', 'true', 'تفعيل التذكيرات التلقائية', true)
ON DUPLICATE KEY UPDATE 
  `settingValue` = VALUES(`settingValue`),
  `updatedAt` = CURRENT_TIMESTAMP(3);

-- إنشاء جدول قوالب الرسائل القابلة للتخصيص
CREATE TABLE IF NOT EXISTS `ReminderTemplate` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `templateType` ENUM('PAYMENT_7_DAYS', 'PAYMENT_3_DAYS', 'PAYMENT_1_DAY', 'CONTRACT_60_DAYS', 'CONTRACT_30_DAYS', 'CONTRACT_15_DAYS', 'CONTRACT_7_DAYS', 'MAINTENANCE_FOLLOW_UP', 'CUSTOM') NOT NULL,
  `templateName` VARCHAR(191) NOT NULL,
  `messageTemplate` TEXT NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `language` VARCHAR(10) NOT NULL DEFAULT 'ar',
  `variables` JSON NULL COMMENT 'متغيرات القالب مثل {clientName}, {dueDate}, {contractNumber}',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ReminderTemplate_templateType_language_key`(`templateType`, `language`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- إدراج قوالب الرسائل الافتراضية
INSERT INTO `ReminderTemplate` (`templateType`, `templateName`, `messageTemplate`, `variables`) VALUES
('PAYMENT_7_DAYS', 'تذكير دفع - 7 أيام', '🏢 *{companyName}*\n\n📅 *تذكير مسبق*\n\nعزيزي {clientName}،\n\n💰 *تذكير بقسط مستحق*\n📅 تاريخ الاستحقاق: {dueDate} (خلال 7 أيام)\n🏠 رقم العقد: {contractNumber}\n\n📞 يُرجى التواصل معنا لترتيب عملية الدفع.\n\n📱 للتواصل: {contactPhone}\n🌐 {companyName}\n\n_رسالة تلقائية من نظام إدارة العقارات_', '["clientName", "dueDate", "contractNumber", "companyName", "contactPhone"]'),
('PAYMENT_3_DAYS', 'تذكير دفع - 3 أيام', '🏢 *{companyName}*\n\n⚠️ *تذكير هام*\n\nعزيزي {clientName}،\n\n💰 *تذكير بقسط مستحق*\n📅 تاريخ الاستحقاق: {dueDate} (خلال 3 أيام)\n🏠 رقم العقد: {contractNumber}\n\n📞 يُرجى التواصل معنا قريباً لترتيب عملية الدفع.\n\n📱 للتواصل: {contactPhone}\n🌐 {companyName}\n\n_رسالة تلقائية من نظام إدارة العقارات_', '["clientName", "dueDate", "contractNumber", "companyName", "contactPhone"]'),
('PAYMENT_1_DAY', 'تذكير دفع - يوم واحد', '🏢 *{companyName}*\n\n🚨 *عاجل - مستحق اليوم!*\n\nعزيزي {clientName}،\n\n💰 *تذكير بقسط مستحق*\n📅 تاريخ الاستحقاق: {dueDate} (خلال يوم واحد)\n🏠 رقم العقد: {contractNumber}\n\n⏰ يُرجى التواصل معنا فوراً لتجنب أي رسوم إضافية.\n\n📱 للتواصل: {contactPhone}\n🌐 {companyName}\n\n_رسالة تلقائية من نظام إدارة العقارات_', '["clientName", "dueDate", "contractNumber", "companyName", "contactPhone"]'),
('CONTRACT_30_DAYS', 'تذكير انتهاء عقد - 30 يوم', '🏢 *{companyName}*\n\n📋 *تذكير بانتهاء العقد*\n\nعزيزي {clientName}،\n\n⏰ عقدك سينتهي خلال 30 يوماً\n📅 تاريخ الانتهاء: {expiryDate}\n🏠 رقم العقد: {contractNumber}\n\n📞 *يُرجى التفكير في تجديد العقد*\n\n📱 للتجديد والاستفسار: {contactPhone}\n🌐 {companyName}\n\n_رسالة تلقائية من نظام إدارة العقارات_', '["clientName", "expiryDate", "contractNumber", "companyName", "contactPhone"]')
ON DUPLICATE KEY UPDATE 
  `messageTemplate` = VALUES(`messageTemplate`),
  `variables` = VALUES(`variables`),
  `updatedAt` = CURRENT_TIMESTAMP(3);
