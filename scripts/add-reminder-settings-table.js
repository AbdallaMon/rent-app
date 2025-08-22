const mysql = require('mysql2/promise');
require('dotenv').config();

async function addReminderSettingsTable() {
  let connection;
  
  try {
    console.log('🔧 إضافة جدول إعدادات التذكيرات...');
    
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE
    });

    // إنشاء جدول إعدادات التذكيرات
    const createReminderSettingsSQL = `
    CREATE TABLE IF NOT EXISTS ReminderSettings (
      id VARCHAR(191) PRIMARY KEY DEFAULT (CONCAT('reminder_settings_', UNIX_TIMESTAMP(), '_', FLOOR(RAND() * 1000))),
      
      paymentReminderDays JSON NOT NULL DEFAULT (JSON_ARRAY(7, 3, 1)),
      contractReminderDays JSON NOT NULL DEFAULT (JSON_ARRAY(60, 30, 15, 7)),
      maintenanceFollowupDays JSON NOT NULL DEFAULT (JSON_ARRAY(3, 7, 14)),
      
      maxRetries INT NOT NULL DEFAULT 3,
      messageDelay INT NOT NULL DEFAULT 2000,
      enableAutoReminders BOOLEAN NOT NULL DEFAULT TRUE,
      
      enabledReminderTypes JSON NOT NULL DEFAULT (JSON_ARRAY('payment_reminder', 'contract_expiry_reminder')),
      
      workingHoursStart TIME NOT NULL DEFAULT '09:00:00',
      workingHoursEnd TIME NOT NULL DEFAULT '18:00:00',
      workingDays JSON NOT NULL DEFAULT (JSON_ARRAY('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
      
      highPriorityThreshold INT NOT NULL DEFAULT 3,
      mediumPriorityThreshold INT NOT NULL DEFAULT 7,
      
      defaultLanguage VARCHAR(10) NOT NULL DEFAULT 'ar_AE',
      includeCompanySignature BOOLEAN NOT NULL DEFAULT TRUE,
      
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      updatedBy VARCHAR(191),
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_active (isActive),
      INDEX idx_updated_at (updatedAt)
    )`;

    await connection.execute(createReminderSettingsSQL);
    console.log('✅ تم إنشاء جدول ReminderSettings');

    // إنشاء جدول سجل التغييرات
    const createHistorySQL = `
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
      INDEX idx_changed_at (changedAt)
    )`;

    await connection.execute(createHistorySQL);
    console.log('✅ تم إنشاء جدول ReminderSettingsHistory');

    // إدراج الإعدادات الافتراضية
    const insertDefaultSettings = `
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
      updatedAt = CURRENT_TIMESTAMP`;

    await connection.execute(insertDefaultSettings);
    console.log('✅ تم إدراج الإعدادات الافتراضية');

    // فحص البيانات المُدرجة
    const [settings] = await connection.execute('SELECT * FROM ReminderSettings WHERE id = ?', ['default_reminder_settings']);
    console.log('\n📊 الإعدادات المُحفوظة:');
    console.log('- أيام تذكيرات الدفع:', JSON.parse(settings[0].paymentReminderDays));
    console.log('- أيام تذكيرات العقود:', JSON.parse(settings[0].contractReminderDays));
    console.log('- أيام متابعة الصيانة:', JSON.parse(settings[0].maintenanceFollowupDays));
    console.log('- محاولات إعادة الإرسال:', settings[0].maxRetries);
    console.log('- التأخير بين الرسائل:', settings[0].messageDelay + 'ms');
    console.log('- التذكيرات التلقائية:', settings[0].enableAutoReminders ? 'مُفعّلة' : 'معطلة');

    console.log('\n🎯 تم إعداد جدول إعدادات التذكيرات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في إضافة جدول الإعدادات:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addReminderSettingsTable();
