-- إضافة جدول إعدادات التذكيرات
-- This table will store all reminder configuration settings

CREATE TABLE IF NOT EXISTS ReminderSettings (
  id VARCHAR(191) PRIMARY KEY DEFAULT (CONCAT('reminder_settings_', UNIX_TIMESTAMP(), '_', FLOOR(RAND() * 1000))),
  
  -- إعدادات أيام التذكيرات
  paymentReminderDays JSON NOT NULL DEFAULT JSON_ARRAY(7, 3, 1),
  contractReminderDays JSON NOT NULL DEFAULT JSON_ARRAY(60, 30, 15, 7),
  maintenanceFollowupDays JSON NOT NULL DEFAULT JSON_ARRAY(3, 7, 14),
  
  -- إعدادات الإرسال
  maxRetries INT NOT NULL DEFAULT 3,
  messageDelay INT NOT NULL DEFAULT 2000,
  enableAutoReminders BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- أنواع التذكيرات المُفعّلة
  enabledReminderTypes JSON NOT NULL DEFAULT JSON_ARRAY('payment_reminder', 'contract_expiry_reminder'),
  
  -- أوقات العمل (بتوقيت الإمارات)
  workingHoursStart TIME NOT NULL DEFAULT '09:00:00',
  workingHoursEnd TIME NOT NULL DEFAULT '18:00:00',
  workingDays JSON NOT NULL DEFAULT JSON_ARRAY('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
  
  -- إعدادات الأولوية
  highPriorityThreshold INT NOT NULL DEFAULT 3, -- أيام
  mediumPriorityThreshold INT NOT NULL DEFAULT 7, -- أيام
  
  -- إعدادات الرسائل
  defaultLanguage VARCHAR(10) NOT NULL DEFAULT 'ar_AE',
  includeCompanySignature BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- معلومات التحديث
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  updatedBy VARCHAR(191),
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- فهارس للأداء
  INDEX idx_active (isActive),
  INDEX idx_updated_at (updatedAt)
);

-- إدراج الإعدادات الافتراضية
INSERT INTO ReminderSettings (
  id,
  paymentReminderDays,
  contractReminderDays,
  maintenanceFollowupDays,
  maxRetries,
  messageDelay,
  enableAutoReminders,
  enabledReminderTypes,
  workingHoursStart,
  workingHoursEnd,
  workingDays,
  highPriorityThreshold,
  mediumPriorityThreshold,
  defaultLanguage,
  includeCompanySignature,
  isActive,
  updatedBy
) VALUES (
  'default_reminder_settings',
  JSON_ARRAY(7, 3, 1),
  JSON_ARRAY(60, 30, 15, 7),
  JSON_ARRAY(3, 7, 14),
  3,
  2000,
  TRUE,
  JSON_ARRAY('payment_reminder', 'contract_expiry_reminder'),
  '09:00:00',
  '18:00:00',
  JSON_ARRAY('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
  3,
  7,
  'ar_AE',
  TRUE,
  TRUE,
  'system'
) ON DUPLICATE KEY UPDATE
  updatedAt = CURRENT_TIMESTAMP;

-- جدول سجل تغييرات الإعدادات
CREATE TABLE IF NOT EXISTS ReminderSettingsHistory (
  id VARCHAR(191) PRIMARY KEY DEFAULT (CONCAT('settings_history_', UNIX_TIMESTAMP(), '_', FLOOR(RAND() * 1000))),
  settingsId VARCHAR(191) NOT NULL,
  changeType ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
  oldValues JSON,
  newValues JSON,
  changedBy VARCHAR(191),
  changeReason TEXT,
  changedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_settings_id (settingsId),
  INDEX idx_changed_at (changedAt),
  
  FOREIGN KEY (settingsId) REFERENCES ReminderSettings(id) ON DELETE CASCADE
);
