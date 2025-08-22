/**
 * 🔧 سكريبت لإعداد وتحديث إعدادات التذكيرات
 * يسمح بتخصيص فترات التذكير وإعدادات النظام
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * إعداد إعدادات التذكيرات الافتراضية
 */
async function setupReminderSettings() {
    console.log('🔧 إعداد إعدادات التذكيرات...\n');
    
    try {
        // فحص الإعدادات الحالية
        let existingSettings = await prisma.reminderSettings.findFirst({ 
            where: { id: 'default_reminder_settings' } 
        });
        
        if (existingSettings) {
            console.log('📋 الإعدادات الحالية:');
            console.log(`   - تذكيرات الأقساط: ${existingSettings.paymentReminderDays} أيام قبل الاستحقاق`);
            console.log(`   - تذكيرات العقود: ${existingSettings.contractReminderDays} أيام قبل الانتهاء`);
            console.log(`   - التذكيرات التلقائية: ${existingSettings.enableAutoReminders ? 'مفعلة' : 'معطلة'}`);
            console.log(`   - عدد المحاولات: ${existingSettings.maxRetries}`);
            console.log(`   - فترة الانتظار: ${existingSettings.messageDelay}ms\n`);
        }
          // الإعدادات المحسنة الموصى بها
        const recommendedSettings = {
            id: 'default_reminder_settings',
            // التذكير بالأقساط قبل 14 و 7 و 3 و 1 أيام من الاستحقاق
            paymentReminderDays: [14, 7, 3, 1],
            // التذكير بانتهاء العقد قبل 90 و 60 و 30 و 15 و 7 أيام
            contractReminderDays: [90, 60, 30, 15, 7],
            // تذكيرات الصيانة بعد 3 و 7 و 14 يوم من تقديم الطلب
            maintenanceFollowupDays: [3, 7, 14],
            // إعدادات الإرسال
            maxRetries: 3,
            messageDelay: 2000, // 2 ثانية بين الرسائل
            // تفعيل التذكيرات
            enableAutoReminders: true,
            isActive: true,
            // أنواع التذكيرات المفعلة
            enabledReminderTypes: [
                "payment_reminder",
                "contract_expiry_reminder",
                "maintenance_followup"
            ],
            // ساعات العمل
            workingHoursStart: "09:00:00",
            workingHoursEnd: "18:00:00",
            // أيام العمل
            workingDays: [
                "Monday", "Tuesday", "Wednesday", 
                "Thursday", "Friday", "Saturday"
            ],
            // عتبة الأولوية العالية (أيام)
            highPriorityThreshold: 3,
            // عتبة الأولوية المتوسطة (أيام)
            mediumPriorityThreshold: 7,
            // اللغة الافتراضية
            defaultLanguage: "ar_AE",
            // تضمين توقيع الشركة
            includeCompanySignature: true
        };
        
        // إنشاء أو تحديث الإعدادات
        const settings = await prisma.reminderSettings.upsert({
            where: { id: 'default_reminder_settings' },
            update: recommendedSettings,
            create: recommendedSettings
        });
        
        console.log('✅ تم تحديث إعدادات التذكيرات بنجاح!\n');
        
        console.log('📋 الإعدادات الجديدة:');
        console.log(`   🔹 تذكيرات الأقساط: ${settings.paymentReminderDays} أيام قبل الاستحقاق`);
        console.log(`   🔹 تذكيرات العقود: ${settings.contractReminderDays} أيام قبل الانتهاء`);
        console.log(`   🔹 تذكيرات الصيانة: ${settings.maintenanceFollowupDays} أيام بعد الطلب`);
        console.log(`   🔹 التذكيرات التلقائية: ${settings.enableAutoReminders ? 'مفعلة ✅' : 'معطلة ❌'}`);
        console.log(`   🔹 ساعات العمل: ${settings.workingHoursStart} - ${settings.workingHoursEnd}`);
        console.log(`   🔹 أيام العمل: ${settings.workingDays.join(', ')}`);
        console.log(`   🔹 عدد المحاولات: ${settings.maxRetries}`);
        console.log(`   🔹 فترة الانتظار: ${settings.messageDelay}ms`);
        
        return settings;
        
    } catch (error) {
        console.error('❌ خطأ في إعداد التذكيرات:', error);
        throw error;
    }
}

/**
 * إعداد إعدادات فريق العمل
 */
async function setupTeamSettings() {
    console.log('\n🔧 إعداد إعدادات فريق العمل...');
    
    try {        const teamSettings = {
            id: 'default_team_settings',
            // إعدادات الفني
            technicianPhone: '971501234567', // رقم الفني (يجب تحديثه)
            technicianName: 'فني الصيانة',
            notifyTechnicianForMaintenance: true,
            technicianWorkingHours: 'من 8:00 صباحاً إلى 5:00 مساءً',
            // إعدادات خدمة العملاء
            customerServicePhone: '971507654321', // رقم خدمة العملاء (يجب تحديثه)
            customerServiceName: 'خدمة العملاء',
            notifyCustomerServiceForComplaints: true,
            notifyCustomerServiceForContacts: true,
            customerServiceWorkingHours: 'من 9:00 صباحاً إلى 6:00 مساءً',
            // إعدادات الإشعارات
            maxDailyNotifications: 20, // زيادة عدد الإشعارات اليومية
            notificationDelay: 5, // ثواني بين الإشعارات
            enableUrgentNotifications: true,
            enableBackupNotifications: false,
            customNotificationMessage: null,
            // الحالة
            isActive: true
        };
        
        const settings = await prisma.whatsAppTeamSettings.upsert({
            where: { id: 'default_team_settings' },
            update: teamSettings,
            create: teamSettings
        });
        
        console.log('✅ تم إعداد إعدادات فريق العمل بنجاح!');
        
        return settings;
        
    } catch (error) {
        console.error('❌ خطأ في إعداد فريق العمل:', error);
        throw error;
    }
}

/**
 * عرض تقرير شامل عن الإعدادات
 */
async function generateSettingsReport() {
    console.log('\n📊 تقرير الإعدادات الشامل:');
    console.log('='.repeat(60));
    
    try {
        // إعدادات التذكيرات
        const reminderSettings = await prisma.reminderSettings.findFirst({ 
            where: { id: 'default_reminder_settings' } 
        });
        
        if (reminderSettings) {
            console.log('\n📋 إعدادات التذكيرات:');
            console.log(`   ✓ الحالة: ${reminderSettings.isActive ? 'نشط' : 'غير نشط'}`);
            console.log(`   ✓ التذكيرات التلقائية: ${reminderSettings.enableAutoReminders ? 'مفعلة' : 'معطلة'}`);
            console.log(`   ✓ فترات تذكير الأقساط: ${reminderSettings.paymentReminderDays} أيام`);
            console.log(`   ✓ فترات تذكير العقود: ${reminderSettings.contractReminderDays} أيام`);
            console.log(`   ✓ ساعات العمل: ${reminderSettings.workingHoursStart} - ${reminderSettings.workingHoursEnd}`);
            console.log(`   ✓ أيام العمل: ${reminderSettings.workingDays?.length || 0} أيام`);
        } else {
            console.log('\n❌ إعدادات التذكيرات غير موجودة!');
        }
        
        // إعدادات فريق العمل
        const teamSettings = await prisma.whatsAppTeamSettings.findFirst({ 
            where: { id: 'default_team_settings' } 
        });
        
        if (teamSettings) {
            console.log('\n👥 إعدادات فريق العمل:');
            console.log(`   ✓ الحالة: ${teamSettings.isActive ? 'نشط' : 'غير نشط'}`);
            console.log(`   ✓ إشعارات الصيانة: ${teamSettings.notifyTechnicianForMaintenance ? 'مفعلة' : 'معطلة'}`);
            console.log(`   ✓ إشعارات الشكاوى: ${teamSettings.notifyCustomerServiceForComplaints ? 'مفعلة' : 'معطلة'}`);
            console.log(`   ✓ رقم الفني: ${teamSettings.technicianPhone || 'غير محدد'}`);
            console.log(`   ✓ رقم خدمة العملاء: ${teamSettings.customerServicePhone || 'غير محدد'}`);
        } else {
            console.log('\n❌ إعدادات فريق العمل غير موجودة!');
        }
        
        // إحصائيات التذكيرات
        console.log('\n📈 إحصائيات التذكيرات (آخر 30 يوم):');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const messageStats = await prisma.whatsappMessageLog.groupBy({
            by: ['messageType', 'status'],
            where: {
                sentAt: {
                    gte: thirtyDaysAgo
                },
                messageType: {
                    in: ['payment_reminder', 'contract_expiry_reminder']
                }
            },
            _count: {
                id: true
            }
        });
        
        const stats = {};
        messageStats.forEach(stat => {
            if (!stats[stat.messageType]) stats[stat.messageType] = {};
            stats[stat.messageType][stat.status] = stat._count.id;
        });
        
        Object.keys(stats).forEach(type => {
            const typeStats = stats[type];
            const total = Object.values(typeStats).reduce((sum, count) => sum + count, 0);
            console.log(`   ✓ ${type}: ${total} إجمالي`);
            Object.keys(typeStats).forEach(status => {
                console.log(`     - ${status}: ${typeStats[status]}`);
            });
        });
        
        console.log('\n='.repeat(60));
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء التقرير:', error);
    }
}

/**
 * دالة رئيسية لإعداد النظام بالكامل
 */
async function setupCompleteSystem() {
    console.log('🚀 إعداد نظام التذكيرات الكامل...\n');
    
    try {
        // إعداد التذكيرات
        await setupReminderSettings();
        
        // إعداد فريق العمل
        await setupTeamSettings();
        
        // عرض التقرير
        await generateSettingsReport();
        
        console.log('\n✅ تم إعداد النظام بالكامل بنجاح!');
        console.log('\n📝 الخطوات التالية:');
        console.log('   1. تحديث أرقام هواتف فريق العمل في إعدادات الفريق');
        console.log('   2. التأكد من إعدادات واتساب (API Token & Phone ID)');
        console.log('   3. تشغيل اختبار النظام: node scripts/test-reminder-system.js');
        console.log('   4. جدولة تشغيل السكريبت التلقائي باستخدام cron job');
        
    } catch (error) {
        console.error('💥 خطأ في إعداد النظام:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// تشغيل الإعداد
if (require.main === module) {
    setupCompleteSystem()
        .then(() => {
            console.log('\n🏁 انتهى الإعداد');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 خطأ فادح:', error);
            process.exit(1);
        });
}

module.exports = {
    setupReminderSettings,
    setupTeamSettings,
    generateSettingsReport,
    setupCompleteSystem
};
