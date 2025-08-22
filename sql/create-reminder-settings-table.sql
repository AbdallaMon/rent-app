-- إنشاء جدول إعدادات التذكيرات
CREATE TABLE IF NOT EXISTS `ReminderSettings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `value` TEXT NOT NULL,
  `type` ENUM('number', 'boolean', 'string', 'array', 'object') NOT NULL,
  `description` TEXT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'general',
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `ReminderSettings_category_idx` (`category`),
  INDEX `ReminderSettings_isActive_idx` (`isActive`)
);

-- إدراج الإعدادات الافتراضية
INSERT INTO `ReminderSettings` (`name`, `value`, `type`, `description`, `category`) VALUES
('paymentReminderDays', '[7, 3, 1]', 'array', 'أيام التذكير قبل استحقاق الأقساط', 'payment'),
('contractExpiryReminderDays', '[60, 30, 15, 7]', 'array', 'أيام التذكير قبل انتهاء العقود', 'contract'),
('maxRetries', '3', 'number', 'عدد محاولات إعادة الإرسال', 'general'),
('messageDelay', '2000', 'number', 'فترة الانتظار بين الرسائل (milliseconds)', 'general'),
('autoReminderEnabled', 'true', 'boolean', 'تفعيل التذكيرات التلقائية', 'general'),
('businessHoursOnly', 'false', 'boolean', 'إرسال التذكيرات في ساعات العمل فقط', 'general'),
('businessHourStart', '08:00', 'string', 'بداية ساعات العمل', 'general'),
('businessHourEnd', '18:00', 'string', 'نهاية ساعات العمل', 'general'),
('companyName', 'شركة تار العقارية', 'string', 'اسم الشركة في الرسائل', 'message'),
('contactPhone', '+971547333111', 'string', 'رقم التواصل في الرسائل', 'message'),
('urgentDaysThreshold', '3', 'number', 'عدد الأيام لاعتبار التذكير عاجل', 'message');
