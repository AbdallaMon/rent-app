/**
 * 🗓️ سكريبت إنشاء التذكيرات المجدولة
 * ينشئ سجلات التذكيرات في قاعدة البيانات قبل موعد الإرسال
 * ليظهر في صفحة التذكيرات كـ "مجدول"
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

// الإعدادات الافتراضية
const DEFAULT_REMINDER_CONFIG = {
    paymentReminderDays: [14, 7, 3, 1],
    contractReminderDays: [90, 60, 30, 15, 7],
    maxRetries: 3,
    messageDelay: 2000
};

/**
 * إنشاء التذكيرات المجدولة للأقساط
 */
async function createScheduledPaymentReminders(reminderSettings) {
    console.log('📅 إنشاء تذكيرات الأقساط المجدولة...');
    
    const now = new Date();
    const paymentReminderDays = reminderSettings.paymentReminderDays || DEFAULT_REMINDER_CONFIG.paymentReminderDays;
    
    const scheduledReminders = [];
    
    for (const days of paymentReminderDays) {
        const targetDate = new Date();
        targetDate.setDate(now.getDate() + days);
        
        // تحديد نطاق التاريخ
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
        
        // البحث عن الأقساط المستحقة في هذا التاريخ
        const upcomingInstallments = await prisma.installment.findMany({
            where: {
                endDate: {
                    gte: startOfDay,
                    lt: endOfDay
                },
                status: false, // غير مدفوع
                rentAgreement: {
                    status: 'ACTIVE'
                }
            },
            include: {
                rentAgreement: {
                    include: {
                        renter: true
                    }
                },
                invoices: true
            }
        });
        
        console.log(`📊 ${upcomingInstallments.length} قسط سيستحق في ${targetDate.toLocaleDateString('ar-SA')} (خلال ${days} أيام)`);
        
        for (const installment of upcomingInstallments) {
            const renter = installment.rentAgreement.renter;
            
            if (!renter.phone) {
                console.log(`⚠️ تخطي ${renter.firstName} ${renter.lastName} - لا يوجد رقم هاتف`);
                continue;
            }
            
            const formattedPhone = renter.phone.startsWith('971') ? 
                renter.phone : `971${renter.phone.replace(/^0+/, '')}`;
            
            // تحديد موعد الإرسال (يوم الاستحقاق - عدد الأيام المحددة)
            const scheduledFor = new Date(installment.endDate);
            scheduledFor.setDate(scheduledFor.getDate() - days);
            scheduledFor.setHours(9, 0, 0, 0); // 9 صباحاً
            
            // التحقق من عدم وجود تذكير مجدول مسبقاً
            const existingReminder = await prisma.whatsappMessageLog.findFirst({
                where: {
                    recipient: formattedPhone,
                    messageType: 'payment_reminder',
                    status: 'scheduled',
                    metadata: {
                        path: 'installmentId',
                        equals: installment.id.toString()
                    }
                }
            });
            
            if (existingReminder) {
                console.log(`⏭️ تذكير موجود مسبقاً للقسط ${installment.id}`);
                continue;
            }
            
            // إعداد الـ metadata
            const installmentInvoice = installment.invoices.find(invoice => 
                invoice.installmentId === installment.id
            );
            const installmentAmount = installmentInvoice ? installmentInvoice.amount : 0;
            
            const metadata = {
                installmentId: installment.id.toString(),
                renterName: renter.name || `${renter.firstName || ''} ${renter.lastName || ''}`.trim() || 'العميل',
                amount: installmentAmount.toString(),
                dueDate: installment.endDate.toISOString().split('T')[0],
                daysUntilDue: days.toString(),
                contractNumber: installment.rentAgreement?.rentAgreementNumber || 'غير محدد',
                reminderType: 'payment_reminder',
                priority: days <= 3 ? 'high' : days <= 7 ? 'medium' : 'normal',
                scheduledFor: scheduledFor.toISOString()
            };
            
            // إنشاء سجل مجدول
            try {
                const scheduledReminder = await prisma.whatsappMessageLog.create({
                    data: {
                        messageId: `scheduled_payment_${installment.id}_${days}d`,
                        recipient: formattedPhone,
                        messageType: 'payment_reminder',
                        status: 'scheduled',
                        sentAt: scheduledFor, // موعد الإرسال المجدول
                        metadata: metadata,
                        message: `تذكير بقسط مستحق خلال ${days} أيام`
                    }
                });
                
                scheduledReminders.push(scheduledReminder);
                console.log(`✅ تم جدولة تذكير القسط ${installment.id} للإرسال في ${scheduledFor.toLocaleDateString('ar-SA')}`);
                
            } catch (error) {
                console.error(`❌ خطأ في جدولة تذكير القسط ${installment.id}:`, error.message);
            }
        }
    }
    
    return scheduledReminders;
}

/**
 * إنشاء التذكيرات المجدولة للعقود
 */
async function createScheduledContractReminders(reminderSettings) {
    console.log('📅 إنشاء تذكيرات العقود المجدولة...');
    
    const now = new Date();
    const contractReminderDays = reminderSettings.contractReminderDays || DEFAULT_REMINDER_CONFIG.contractReminderDays;
    
    const scheduledReminders = [];
    
    for (const days of contractReminderDays) {
        const targetDate = new Date();
        targetDate.setDate(now.getDate() + days);
        
        // تحديد نطاق التاريخ
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
        
        // البحث عن العقود التي ستنتهي في هذا التاريخ
        const expiringContracts = await prisma.rentAgreement.findMany({
            where: {
                endDate: {
                    gte: startOfDay,
                    lt: endOfDay
                },
                status: 'ACTIVE'
            },
            include: {
                renter: true,
                unit: {
                    include: {
                        property: true
                    }
                }
            }
        });
        
        console.log(`📊 ${expiringContracts.length} عقد سينتهي في ${targetDate.toLocaleDateString('ar-SA')} (خلال ${days} أيام)`);
        
        for (const contract of expiringContracts) {
            const renter = contract.renter;
            
            if (!renter.phone) {
                console.log(`⚠️ تخطي ${renter.firstName} ${renter.lastName} - لا يوجد رقم هاتف`);
                continue;
            }
            
            const formattedPhone = renter.phone.startsWith('971') ? 
                renter.phone : `971${renter.phone.replace(/^0+/, '')}`;
            
            // تحديد موعد الإرسال
            const scheduledFor = new Date(contract.endDate);
            scheduledFor.setDate(scheduledFor.getDate() - days);
            scheduledFor.setHours(9, 0, 0, 0); // 9 صباحاً
            
            // التحقق من عدم وجود تذكير مجدول مسبقاً
            const existingReminder = await prisma.whatsappMessageLog.findFirst({
                where: {
                    recipient: formattedPhone,
                    messageType: 'contract_expiry_reminder',
                    status: 'scheduled',
                    metadata: {
                        path: 'contractId',
                        equals: contract.id.toString()
                    }
                }
            });
            
            if (existingReminder) {
                console.log(`⏭️ تذكير موجود مسبقاً للعقد ${contract.id}`);
                continue;
            }
            
            // إعداد الـ metadata
            const metadata = {
                contractId: contract.id.toString(),
                renterName: renter.name || `${renter.firstName || ''} ${renter.lastName || ''}`.trim() || 'العميل',
                contractNumber: contract.rentAgreementNumber || 'غير محدد',
                endDate: contract.endDate.toISOString().split('T')[0],
                daysUntilExpiry: days.toString(),
                totalValue: (contract.totalPrice || contract.totalContractPrice || 0).toString(),
                propertyName: contract.unit?.property?.name || contract.unit?.property?.propertyName || 'غير محدد',
                unitName: contract.unit?.number ? `وحدة رقم ${contract.unit.number}` : 'غير محدد',
                reminderType: 'contract_expiry_reminder',
                priority: days <= 7 ? 'high' : days <= 30 ? 'medium' : 'normal',
                scheduledFor: scheduledFor.toISOString()
            };
            
            // إنشاء سجل مجدول
            try {
                const scheduledReminder = await prisma.whatsappMessageLog.create({
                    data: {
                        messageId: `scheduled_contract_${contract.id}_${days}d`,
                        recipient: formattedPhone,
                        messageType: 'contract_expiry_reminder',
                        status: 'scheduled',
                        sentAt: scheduledFor, // موعد الإرسال المجدول
                        metadata: metadata,
                        message: `تذكير بانتهاء عقد خلال ${days} أيام`
                    }
                });
                
                scheduledReminders.push(scheduledReminder);
                console.log(`✅ تم جدولة تذكير العقد ${contract.id} للإرسال في ${scheduledFor.toLocaleDateString('ar-SA')}`);
                
            } catch (error) {
                console.error(`❌ خطأ في جدولة تذكير العقد ${contract.id}:`, error.message);
            }
        }
    }
    
    return scheduledReminders;
}

/**
 * الدالة الرئيسية لإنشاء جميع التذكيرات المجدولة
 */
async function generateScheduledReminders() {
    console.log('🗓️ بدء إنشاء التذكيرات المجدولة...\n');
    
    try {
        // جلب إعدادات التذكيرات
        let reminderSettings = await prisma.reminderSettings.findFirst({ 
            where: { id: 'default_reminder_settings' } 
        });
        
        if (!reminderSettings) {
            console.log('⚠️ إعدادات التذكيرات غير موجودة، سيتم استخدام الإعدادات الافتراضية...');
            reminderSettings = {
                paymentReminderDays: DEFAULT_REMINDER_CONFIG.paymentReminderDays,
                contractReminderDays: DEFAULT_REMINDER_CONFIG.contractReminderDays,
                enableAutoReminders: true
            };
        }
        
        if (!reminderSettings.enableAutoReminders) {
            console.log('⚠️ التذكيرات التلقائية معطلة في الإعدادات');
            return { success: false, message: 'التذكيرات التلقائية معطلة' };
        }
        
        console.log('📋 الإعدادات المستخدمة:');
        console.log(`   - تذكيرات الأقساط: ${reminderSettings.paymentReminderDays} أيام قبل الاستحقاق`);
        console.log(`   - تذكيرات العقود: ${reminderSettings.contractReminderDays} أيام قبل الانتهاء\n`);
        
        // إنشاء تذكيرات الأقساط المجدولة
        const paymentReminders = await createScheduledPaymentReminders(reminderSettings);
        
        // إنشاء تذكيرات العقود المجدولة
        const contractReminders = await createScheduledContractReminders(reminderSettings);
        
        const totalScheduled = paymentReminders.length + contractReminders.length;
        
        console.log('\n📊 ملخص النتائج:');
        console.log(`   📅 تذكيرات أقساط مجدولة: ${paymentReminders.length}`);
        console.log(`   📋 تذكيرات عقود مجدولة: ${contractReminders.length}`);
        console.log(`   📈 إجمالي التذكيرات المجدولة: ${totalScheduled}`);
        
        // إحصائيات إضافية
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
        
        const tomorrowCount = await prisma.whatsappMessageLog.count({
            where: {
                status: 'scheduled',
                sentAt: {
                    gte: tomorrowStart,
                    lt: tomorrowEnd
                }
            }
        });
        
        console.log(`   🌅 تذكيرات مجدولة للغد: ${tomorrowCount}`);
        
        return {
            success: true,
            data: {
                paymentReminders: paymentReminders.length,
                contractReminders: contractReminders.length,
                total: totalScheduled,
                tomorrow: tomorrowCount
            }
        };
        
    } catch (error) {
        console.error('💥 خطأ في إنشاء التذكيرات المجدولة:', error);
        return { success: false, error: error.message };
        
    } finally {
        await prisma.$disconnect();
    }
}

// تشغيل السكريبت
if (require.main === module) {
    generateScheduledReminders()
        .then(result => {
            if (result.success) {
                console.log('\n✅ تم إنشاء التذكيرات المجدولة بنجاح!');
                console.log('💡 الآن ستظهر التذكيرات في صفحة التذكيرات كـ "مجدولة"');
            } else {
                console.log('\n❌ فشل في إنشاء التذكيرات المجدولة:', result.message || result.error);
            }
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 خطأ فادح:', error);
            process.exit(1);
        });
}

module.exports = { generateScheduledReminders };
