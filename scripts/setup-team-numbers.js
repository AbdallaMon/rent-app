/**
 * 🔧 إعداد وتحديث أرقام فريق العمل
 * هذا السكريبت يقوم بـ:
 * 1. فحص إعدادات فريق العمل الحالية
 * 2. تحديث أرقام الفني وخدمة العملاء
 * 3. تفعيل الإشعارات المطلوبة
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 📋 فحص إعدادات فريق العمل الحالية
async function checkCurrentTeamSettings() {
    console.log('📋 فحص إعدادات فريق العمل الحالية...');
    
    try {
        const teamSettings = await prisma.whatsAppTeamSettings.findFirst();
        
        if (teamSettings) {
            console.log('✅ تم العثور على إعدادات فريق العمل:');
            console.log('='.repeat(50));
            console.log(`📱 رقم الفني: ${teamSettings.technicianPhone || 'غير محدد'}`);
            console.log(`📞 رقم خدمة العملاء: ${teamSettings.customerServicePhone || 'غير محدد'}`);
            console.log(`🔧 إشعارات الصيانة للفني: ${teamSettings.notifyTechnicianForMaintenance ? 'مفعلة' : 'معطلة'}`);
            console.log(`📞 إشعارات الشكاوى لخدمة العملاء: ${teamSettings.notifyCustomerServiceForComplaints ? 'مفعلة' : 'معطلة'}`);
            console.log(`📧 إشعارات طلبات الاتصال لخدمة العملاء: ${teamSettings.notifyCustomerServiceForContacts ? 'مفعلة' : 'معطلة'}`);
            console.log(`⏱️ تأخير الإشعارات: ${teamSettings.notificationDelay || 5} ثواني`);
            console.log(`✅ الحالة النشطة: ${teamSettings.isActive ? 'نشط' : 'غير نشط'}`);
            console.log('='.repeat(50));
            
            return teamSettings;
        } else {
            console.log('⚠️ لم يتم العثور على إعدادات فريق العمل');
            return null;
        }
    } catch (error) {
        console.error('❌ خطأ في فحص إعدادات فريق العمل:', error.message);
        return null;
    }
}

// 🔧 تحديث إعدادات فريق العمل
async function updateTeamSettings(newSettings) {
    console.log('🔧 تحديث إعدادات فريق العمل...');
    
    try {
        const existingSettings = await prisma.whatsAppTeamSettings.findFirst();
        
        let updatedSettings;
        
        if (existingSettings) {
            // تحديث الإعدادات الموجودة
            updatedSettings = await prisma.whatsAppTeamSettings.update({
                where: { id: existingSettings.id },
                data: {
                    ...newSettings,
                    updatedAt: new Date()
                }
            });
            console.log('✅ تم تحديث إعدادات فريق العمل بنجاح');
        } else {
            // إنشاء إعدادات جديدة
            updatedSettings = await prisma.whatsAppTeamSettings.create({
                data: {
                    id: 'default_team_settings',
                    ...newSettings,
                    isActive: true
                }
            });
            console.log('✅ تم إنشاء إعدادات فريق العمل بنجاح');
        }
        
        return updatedSettings;
    } catch (error) {
        console.error('❌ خطأ في تحديث إعدادات فريق العمل:', error.message);
        return null;
    }
}

// 📱 تنسيق رقم الهاتف الإماراتي
function formatPhoneNumber(phone) {
    if (!phone) return null;
    
    // إزالة الرموز والمسافات
    let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // إزالة الصفر من البداية إذا وجد
    cleanPhone = cleanPhone.replace(/^0+/, '');
    
    // إضافة رمز الدولة إذا لم يكن موجوداً
    if (!cleanPhone.startsWith('971')) {
        cleanPhone = '971' + cleanPhone;
    }
    
    return cleanPhone;
}

// 🚀 إعداد أرقام فريق العمل التلقائي
async function setupTeamNumbers() {
    console.log('🚀 إعداد أرقام فريق العمل...');
    console.log('='.repeat(50));
    
    // إعدادات افتراضية موصى بها
    const recommendedSettings = {
        // أرقام تجريبية - يجب تحديثها بالأرقام الحقيقية
        technicianPhone: formatPhoneNumber('971501234567'), // رقم الفني
        customerServicePhone: formatPhoneNumber('971507654321'), // رقم خدمة العملاء
        
        // تفعيل الإشعارات
        notifyTechnicianForMaintenance: true, // إشعار الفني عند طلبات الصيانة
        notifyCustomerServiceForComplaints: true, // إشعار خدمة العملاء للشكاوى
        notifyCustomerServiceForContacts: true, // إشعار خدمة العملاء لطلبات الاتصال
        
        // إعدادات التوقيت
        notificationDelay: 3, // تأخير 3 ثواني بين الإشعارات
        
        // حالة النشاط
        isActive: true
    };
    
    console.log('📋 الإعدادات الموصى بها:');
    console.log(`📱 رقم الفني: ${recommendedSettings.technicianPhone}`);
    console.log(`📞 رقم خدمة العملاء: ${recommendedSettings.customerServicePhone}`);
    console.log(`🔧 إشعارات الصيانة: ${recommendedSettings.notifyTechnicianForMaintenance ? 'مفعلة' : 'معطلة'}`);
    console.log(`📞 إشعارات الشكاوى: ${recommendedSettings.notifyCustomerServiceForComplaints ? 'مفعلة' : 'معطلة'}`);
    console.log(`📧 إشعارات طلبات الاتصال: ${recommendedSettings.notifyCustomerServiceForContacts ? 'مفعلة' : 'معطلة'}`);
    
    // تحديث الإعدادات
    const updatedSettings = await updateTeamSettings(recommendedSettings);
    
    if (updatedSettings) {
        console.log('\n✅ تم إعداد أرقام فريق العمل بنجاح!');
        console.log('\n📋 ملاحظات مهمة:');
        console.log('• تأكد من تحديث الأرقام بالأرقام الحقيقية للفني وخدمة العملاء');
        console.log('• تذكيرات الصيانة ستذهب للفني');
        console.log('• تذكيرات انتهاء العقود ستذهب للعميل + نسخة لخدمة العملاء');
        console.log('• الشكاوى وطلبات الاتصال ستذهب لخدمة العملاء');
    } else {
        console.log('❌ فشل في إعداد أرقام فريق العمل');
    }
    
    return updatedSettings;
}

// 🔍 اختبار صحة الأرقام
async function validateTeamNumbers() {
    console.log('\n🔍 التحقق من صحة أرقام فريق العمل...');
    
    const teamSettings = await checkCurrentTeamSettings();
    
    if (!teamSettings) {
        console.log('❌ لا توجد إعدادات فريق عمل للتحقق منها');
        return false;
    }
    
    let isValid = true;
    
    // التحقق من رقم الفني
    if (!teamSettings.technicianPhone) {
        console.log('⚠️ رقم الفني غير محدد');
        isValid = false;
    } else if (!teamSettings.technicianPhone.startsWith('971')) {
        console.log('⚠️ رقم الفني لا يبدأ برمز الإمارات (971)');
        isValid = false;
    } else {
        console.log('✅ رقم الفني صحيح');
    }
    
    // التحقق من رقم خدمة العملاء
    if (!teamSettings.customerServicePhone) {
        console.log('⚠️ رقم خدمة العملاء غير محدد');
        isValid = false;
    } else if (!teamSettings.customerServicePhone.startsWith('971')) {
        console.log('⚠️ رقم خدمة العملاء لا يبدأ برمز الإمارات (971)');
        isValid = false;
    } else {
        console.log('✅ رقم خدمة العملاء صحيح');
    }
    
    // التحقق من الإشعارات
    if (!teamSettings.notifyTechnicianForMaintenance) {
        console.log('⚠️ إشعارات الصيانة للفني معطلة');
    } else {
        console.log('✅ إشعارات الصيانة للفني مفعلة');
    }
    
    if (!teamSettings.isActive) {
        console.log('⚠️ إعدادات فريق العمل غير نشطة');
        isValid = false;
    } else {
        console.log('✅ إعدادات فريق العمل نشطة');
    }
    
    return isValid;
}

// 📋 عرض ملخص الإعدادات التشغيلية
async function showOperationalSummary() {
    console.log('\n📋 ملخص الإعدادات التشغيلية...');
    console.log('='.repeat(50));
    
    const teamSettings = await checkCurrentTeamSettings();
    
    if (!teamSettings) {
        console.log('❌ لا توجد إعدادات فريق عمل');
        return;
    }
    
    console.log('🔧 تذكيرات الصيانة:');
    if (teamSettings.notifyTechnicianForMaintenance && teamSettings.technicianPhone) {
        console.log(`  ✅ ستذهب للفني: ${teamSettings.technicianPhone}`);
    } else {
        console.log('  ❌ معطلة أو لا يوجد رقم فني');
    }
    
    console.log('\n📋 تذكيرات انتهاء العقود:');
    console.log('  ✅ ستذهب للعميل (رقم العميل من قاعدة البيانات)');
    if (teamSettings.customerServicePhone) {
        console.log(`  ✅ نسخة لخدمة العملاء: ${teamSettings.customerServicePhone}`);
    } else {
        console.log('  ❌ لا يوجد رقم خدمة عملاء لإرسال النسخة');
    }
    
    console.log('\n📞 الشكاوى وطلبات الاتصال:');
    if (teamSettings.notifyCustomerServiceForComplaints && teamSettings.customerServicePhone) {
        console.log(`  ✅ الشكاوى ستذهب لخدمة العملاء: ${teamSettings.customerServicePhone}`);
    } else {
        console.log('  ❌ إشعارات الشكاوى معطلة');
    }
    
    if (teamSettings.notifyCustomerServiceForContacts && teamSettings.customerServicePhone) {
        console.log(`  ✅ طلبات الاتصال ستذهب لخدمة العملاء: ${teamSettings.customerServicePhone}`);
    } else {
        console.log('  ❌ إشعارات طلبات الاتصال معطلة');
    }
    
    console.log('='.repeat(50));
}

// 🚀 تشغيل الإعداد الكامل
async function runSetup() {
    console.log('🚀 بدء إعداد أرقام فريق العمل');
    console.log('='.repeat(60));
    
    try {
        // فحص الإعدادات الحالية
        await checkCurrentTeamSettings();
        
        // إعداد أرقام فريق العمل
        await setupTeamNumbers();
        
        // التحقق من صحة الأرقام
        const isValid = await validateTeamNumbers();
        
        // عرض ملخص الإعدادات التشغيلية
        await showOperationalSummary();
        
        if (isValid) {
            console.log('\n🎉 تم إعداد فريق العمل بنجاح! النظام جاهز للعمل.');
        } else {
            console.log('\n⚠️ يرجى مراجعة الإعدادات المذكورة أعلاه وتصحيحها.');
        }
        
    } catch (error) {
        console.error('💥 خطأ في إعداد فريق العمل:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// تشغيل الإعداد
if (require.main === module) {
    runSetup().then(() => {
        console.log('\n🏁 انتهى إعداد فريق العمل');
        process.exit(0);
    }).catch(error => {
        console.error('💥 خطأ فادح:', error);
        process.exit(1);
    });
}

module.exports = {
    checkCurrentTeamSettings,
    updateTeamSettings,
    setupTeamNumbers,
    validateTeamNumbers,
    showOperationalSummary,
    formatPhoneNumber
};
