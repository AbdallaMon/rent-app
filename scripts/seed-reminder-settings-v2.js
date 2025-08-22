const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedReminderSettings() {
  try {
    console.log('🌱 إعداد إعدادات التذكيرات الافتراضية...');
    console.log('Available models:', Object.keys(prisma));

    // Try different naming conventions
    let reminderSettings;
    try {
      reminderSettings = prisma.reminderSettings;
    } catch (e) {
      try {
        reminderSettings = prisma.ReminderSettings;
      } catch (e2) {
        try {
          reminderSettings = prisma.reminder_settings;
        } catch (e3) {
          console.error('لا يمكن العثور على جدول ReminderSettings');
          return;
        }
      }
    }

    if (!reminderSettings) {
      console.error('❌ جدول ReminderSettings غير موجود');
      return;
    }

    // التحقق من وجود الإعدادات
    const existingSettings = await reminderSettings.findFirst({
      where: { id: 'default_reminder_settings' }
    });

    if (existingSettings) {
      console.log('✅ إعدادات التذكيرات موجودة مسبقاً');
      console.log('الإعدادات الحالية:', existingSettings);
      return;
    }

    // إنشاء إعدادات التذكيرات الافتراضية
    const defaultSettings = await reminderSettings.create({
      data: {
        id: 'default_reminder_settings',
        paymentReminderDays: [7, 3, 1],
        contractReminderDays: [60, 30, 15, 7],
        maintenanceFollowupDays: [3, 7, 14],
        maxRetries: 3,
        messageDelay: 2000,
        enableAutoReminders: true,
        enabledReminderTypes: ["payment_reminder", "contract_expiry_reminder"],
        workingHoursStart: "09:00:00",
        workingHoursEnd: "18:00:00",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        highPriorityThreshold: 3,
        mediumPriorityThreshold: 7,
        defaultLanguage: "ar_AE",
        includeCompanySignature: true,
        isActive: true,
        updatedBy: "system_init"
      }
    });

    console.log('✅ تم إنشاء إعدادات التذكيرات الافتراضية:', defaultSettings.id);

  } catch (error) {
    console.error('❌ خطأ في إعداد إعدادات التذكيرات:', error);
    console.error('تفاصيل الخطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedReminderSettings();
