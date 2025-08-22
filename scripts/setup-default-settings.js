/**
 * 🔧 سكربت إنشاء الإعدادات الافتراضية
 * ينشئ إعدادات التذكيرات وفريق العمل في قاعدة البيانات
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDefaultSettings() {
    console.log('🔧 إنشاء الإعدادات الافتراضية...');
    
    try {
        // إنشاء إعدادات التذكيرات
        const reminderSettings = await prisma.reminderSettings.upsert({
            where: { id: 'default_reminder_settings' },
            update: {},
            create: {
                id: 'default_reminder_settings',
                paymentReminderDays: [7, 3, 1],
                contractReminderDays: [60, 30, 15, 7],
                maintenanceFollowupDays: [3, 7, 14],
                maxRetries: 3,
                messageDelay: 2000,
                enableAutoReminders: true,
                enabledReminderTypes: ['payment', 'contract', 'maintenance'],
                workingHoursStart: '09:00:00',
                workingHoursEnd: '18:00:00',
                workingDays: [1, 2, 3, 4, 5], // الاثنين إلى الجمعة
                highPriorityThreshold: 3,
                mediumPriorityThreshold: 7,
                defaultLanguage: 'ar_AE',
                includeCompanySignature: true,
                isActive: true
            }
        });
        
        console.log('✅ تم إنشاء إعدادات التذكيرات');
          // إنشاء إعدادات فريق العمل
        const teamSettings = await prisma.whatsAppTeamSettings.upsert({
            where: { id: 'default_team_settings' },
            update: {},
            create: {
                id: 'default_team_settings',
                technicianPhone: '',
                technicianName: 'الفني',
                notifyTechnicianForMaintenance: true,
                technicianWorkingHours: 'من 8:00 صباحاً إلى 5:00 مساءً',
                customerServicePhone: '',
                customerServiceName: 'خدمة العملاء',
                notifyCustomerServiceForComplaints: true,
                notifyCustomerServiceForContacts: true,
                customerServiceWorkingHours: 'من 9:00 صباحاً إلى 6:00 مساءً',
                maxDailyNotifications: 10,
                notificationDelay: 5,
                enableUrgentNotifications: true,
                enableBackupNotifications: false,
                isActive: true
            }
        });
        
        console.log('✅ تم إنشاء إعدادات فريق العمل');
        
        // طباعة النتائج
        console.log('\n📊 إعدادات التذكيرات:');
        console.log(`  - أيام تذكير الأقساط: ${JSON.stringify(reminderSettings.paymentReminderDays)}`);
        console.log(`  - أيام تذكير العقود: ${JSON.stringify(reminderSettings.contractReminderDays)}`);
        console.log(`  - التذكيرات مفعلة: ${reminderSettings.enableAutoReminders}`);
        
        console.log('\n👥 إعدادات فريق العمل:');
        console.log(`  - رقم الفني: ${teamSettings.technicianPhone || 'غير محدد'}`);
        console.log(`  - رقم خدمة العملاء: ${teamSettings.customerServicePhone || 'غير محدد'}`);
        console.log(`  - إشعارات الصيانة: ${teamSettings.notifyTechnicianForMaintenance}`);
        console.log(`  - إشعارات الشكاوى: ${teamSettings.notifyCustomerServiceForComplaints}`);
        console.log(`  - إشعارات الاتصال: ${teamSettings.notifyCustomerServiceForContacts}`);
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء الإعدادات:', error);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    createDefaultSettings()
        .then(() => {
            console.log('\n🎉 تم إنشاء جميع الإعدادات بنجاح!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 خطأ فادح:', error);
            process.exit(1);
        });
}

module.exports = { createDefaultSettings };
