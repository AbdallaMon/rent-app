const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedReminderSettings() {
  try {
    console.log('🌱 إعداد إعدادات التذكيرات الافتراضية...');    // التحقق من وجود الإعدادات
    const existingSettings = await prisma.reminderSettings.findFirst({
      where: { id: 'default_reminder_settings' }
    });

    if (existingSettings) {
      console.log('✅ إعدادات التذكيرات موجودة مسبقاً');
      return;
    }

    // إنشاء إعدادات التذكيرات الافتراضية
    const defaultSettings = await prisma.reminderSettings.create({
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

    console.log('✅ تم إنشاء إعدادات التذكيرات الافتراضية:', defaultSettings.id);    // إضافة سجل في التاريخ
    await prisma.reminderSettingsHistory.create({
      data: {
        settingsId: defaultSettings.id,
        changeType: "CREATE",
        newValues: {
          message: "إنشاء إعدادات التذكيرات الافتراضية",
          settings: defaultSettings
        },
        changedBy: "system_init",
        changeReason: "إعداد أولي للنظام"
      }
    });

    console.log('✅ تم إضافة سجل التاريخ');

  } catch (error) {
    console.error('❌ خطأ في إعداد إعدادات التذكيرات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedReminderSettings();
