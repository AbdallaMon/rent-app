const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addReminderSettingsTable() {
  try {
    console.log('🔧 إضافة جدول إعدادات التذكيرات عبر Prisma...');
    
    // فحص إذا كان الجدول موجود عبر تجربة استعلام
    try {
      await prisma.$queryRaw`SELECT 1 FROM ReminderSettings LIMIT 1`;
      console.log('✅ جدول ReminderSettings موجود بالفعل');
    } catch (error) {
      console.log('ℹ️  جدول ReminderSettings غير موجود، سيتم إنشاؤه');
        // إنشاء الجدول عبر SQL مباشر
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS ReminderSettings (
          id VARCHAR(191) PRIMARY KEY,
          
          paymentReminderDays JSON NOT NULL,
          contractReminderDays JSON NOT NULL,
          maintenanceFollowupDays JSON NOT NULL,
          
          maxRetries INT NOT NULL DEFAULT 3,
          messageDelay INT NOT NULL DEFAULT 2000,
          enableAutoReminders BOOLEAN NOT NULL DEFAULT TRUE,
          
          enabledReminderTypes JSON NOT NULL,
          
          workingHoursStart TIME NOT NULL DEFAULT '09:00:00',
          workingHoursEnd TIME NOT NULL DEFAULT '18:00:00',
          workingDays JSON NOT NULL,
          
          highPriorityThreshold INT NOT NULL DEFAULT 3,
          mediumPriorityThreshold INT NOT NULL DEFAULT 7,
          
          defaultLanguage VARCHAR(10) NOT NULL DEFAULT 'ar_AE',
          includeCompanySignature BOOLEAN NOT NULL DEFAULT TRUE,
          
          isActive BOOLEAN NOT NULL DEFAULT TRUE,
          updatedBy VARCHAR(191),
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log('✅ تم إنشاء جدول ReminderSettings');
    }

    // فحص جدول التاريخ
    try {
      await prisma.$queryRaw`SELECT 1 FROM ReminderSettingsHistory LIMIT 1`;
      console.log('✅ جدول ReminderSettingsHistory موجود بالفعل');
    } catch (error) {      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS ReminderSettingsHistory (
          id VARCHAR(191) PRIMARY KEY,
          settingsId VARCHAR(191) NOT NULL,
          changeType ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
          oldValues JSON,
          newValues JSON,
          changedBy VARCHAR(191),
          changeReason TEXT,
          changedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log('✅ تم إنشاء جدول ReminderSettingsHistory');
    }

    // إدراج أو تحديث الإعدادات الافتراضية
    await prisma.$executeRaw`
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
        updatedAt = CURRENT_TIMESTAMP
    `;
    console.log('✅ تم إدراج/تحديث الإعدادات الافتراضية');

    // فحص البيانات المُدرجة
    const settings = await prisma.$queryRaw`
      SELECT * FROM ReminderSettings WHERE id = 'default_reminder_settings'
    `;
    
    if (settings.length > 0) {
      const setting = settings[0];
      console.log('\n📊 الإعدادات المُحفوظة:');
      console.log('- أيام تذكيرات الدفع:', setting.paymentReminderDays);
      console.log('- أيام تذكيرات العقود:', setting.contractReminderDays);
      console.log('- أيام متابعة الصيانة:', setting.maintenanceFollowupDays);
      console.log('- محاولات إعادة الإرسال:', setting.maxRetries);
      console.log('- التأخير بين الرسائل:', setting.messageDelay + 'ms');
      console.log('- التذكيرات التلقائية:', setting.enableAutoReminders ? 'مُفعّلة' : 'معطلة');
      console.log('- الأنواع المُفعّلة:', setting.enabledReminderTypes);
    }

    console.log('\n🎯 تم إعداد جدول إعدادات التذكيرات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في إضافة جدول الإعدادات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addReminderSettingsTable();
